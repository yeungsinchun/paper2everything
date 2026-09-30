#!/usr/bin/env python3
"""qb-pdf: convert every QB DOCX to PDF via LibreOffice.

Inputs:  qb/**/*.docx  (canonical: paper2db/qb or $P2DB_QB_ROOT — see find_qb_root)
         plus 6 PDF-only sources that have no DOCX twin.
Outputs: qb-pdf/<bank>/<stem>.pdf
         qb-pdf/convert-log.json  (sha256, page count, timing, converter)

Converter: LibreOffice soffice --headless with a per-task -env:UserInstallation
profile.  Before conversion, Symbol-font glyphs (<w:sym w:font="Symbol">, and
PUA U+F0xx characters in runs whose Latin font is Symbol) are rewritten to their
Unicode equivalents in a temporary copy of the DOCX, because LibreOffice
otherwise renders them as PUA bullets instead of alpha/beta/gamma.

The --qb-root flag or $P2DB_QB_ROOT env var lets the caller point at the canonical QB tree outside the worktree.
By default it probes $P2DB_QB_ROOT, then qb/ in-tree.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from qb_items import CANDIDATE_QB_ROOTS, find_qb_root, normalize_symbol_xml  # noqa: E402

DEFAULT_OUT = ROOT / "qb-pdf"

# 6 PDFs that have no DOCX twin -- ingested as-is.
PDF_ONLY_STEMS = {
    "QB_201/2_ch01_MC_e",
    "QB_202/2_ch02_MC_e",
    "QB_203/2_ch03_MC_e",
    "QB_206/2_ch06_MC_e",
    "QB_208/2_ch08_MC_e",
    "QB_208/2_ch08_MC_e_blank",
}
# F01 corpus-agnostic: load expected DOCX count from banks.json if present
BANKS_JSON = ROOT / "metadata" / "qb" / "banks.json"


def _expected_real_docx() -> int:
    if BANKS_JSON.is_file():
        try:
            data = json.loads(BANKS_JSON.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            raise SystemExit(f"{BANKS_JSON} invalid JSON: {e}") from e
        if not isinstance(data, dict):
            raise SystemExit(f"{BANKS_JSON} invalid: expected object")
        detail = data.get("banks_detail")
        if not isinstance(detail, list) or not detail:
            raise SystemExit(f"{BANKS_JSON} missing or invalid banks_detail")
        seen: set[str] = set()
        sum_docx = 0
        sum_items = 0
        sum_in_scope_items = 0
        has_in_scope = False
        for idx, entry in enumerate(detail):
            if not isinstance(entry, dict):
                raise SystemExit(f"{BANKS_JSON} banks_detail[{idx}] not an object")
            bid = entry.get("id")
            if not isinstance(bid, str) or not bid.startswith("QB_"):
                raise SystemExit(f"{BANKS_JSON} banks_detail[{idx}] invalid id: {bid!r}")
            if bid in seen:
                raise SystemExit(f"{BANKS_JSON} banks_detail[{idx}] duplicate id: {bid!r}")
            seen.add(bid)
            expected_docx = entry.get("expected_docx")
            if not isinstance(expected_docx, int) or expected_docx <= 0:
                raise SystemExit(f"{BANKS_JSON} banks_detail[{idx}] {bid} invalid expected_docx: {expected_docx!r}")
            expected_items = entry.get("expected_items")
            if not isinstance(expected_items, int) or expected_items <= 0:
                raise SystemExit(f"{BANKS_JSON} banks_detail[{idx}] {bid} invalid expected_items: {expected_items!r}")
            in_scope_flag = entry.get("in_scope")
            if not isinstance(in_scope_flag, bool):
                raise SystemExit(f"{BANKS_JSON} banks_detail[{idx}] {bid} invalid in_scope: {in_scope_flag!r}")
            sum_docx += expected_docx
            sum_items += expected_items
            if in_scope_flag:
                has_in_scope = True
                sum_in_scope_items += expected_items
        if not has_in_scope:
            raise SystemExit(f"{BANKS_JSON} no in_scope banks")
        v = data.get("total_docx")
        if not isinstance(v, int) or v <= 0:
            raise SystemExit(f"{BANKS_JSON} missing or invalid total_docx")
        if v != sum_docx:
            raise SystemExit(f"{BANKS_JSON} total_docx {v} != sum expected_docx {sum_docx}")
        total_items = data.get("total_items")
        if not isinstance(total_items, int) or total_items <= 0:
            raise SystemExit(f"{BANKS_JSON} missing or invalid total_items")
        if total_items != sum_items:
            raise SystemExit(f"{BANKS_JSON} total_items {total_items} != sum expected_items {sum_items}")
        in_scope_items = data.get("in_scope_items")
        if not isinstance(in_scope_items, int) or in_scope_items <= 0:
            raise SystemExit(f"{BANKS_JSON} missing or invalid in_scope_items")
        if in_scope_items != sum_in_scope_items:
            raise SystemExit(f"{BANKS_JSON} in_scope_items {in_scope_items} != sum in_scope expected_items {sum_in_scope_items}")
        banks_count = data.get("banks")
        if not isinstance(banks_count, int) or banks_count <= 0:
            raise SystemExit(f"{BANKS_JSON} missing or invalid banks")
        if banks_count != len(detail):
            raise SystemExit(f"{BANKS_JSON} banks {banks_count} != len(banks_detail) {len(detail)}")
        return v
    return 169


EXPECTED_REAL_DOCX = _expected_real_docx()

def docx_symbol_glyphs(docx: Path) -> list[str]:
    with zipfile.ZipFile(str(docx)) as z:
        return [glyph for name in z.namelist() if name.startswith("word/") and name.endswith(".xml")
                for glyph in normalize_symbol_xml(z.read(name).decode())[1]]


def write_normalized_docx(src: Path, dest: Path) -> int:
    """Copy src to dest with Symbol glyphs mapped to Unicode; return glyph count."""
    count = 0
    with zipfile.ZipFile(str(src)) as zin, zipfile.ZipFile(str(dest), "w", zipfile.ZIP_DEFLATED) as zout:
        for info in zin.infolist():
            data = zin.read(info.filename)
            # Normalize every XML part that may contain w:sym or Symbol-font runs
            # (headers, footers, footnotes, etc. all can contain Symbol glyphs)
            if info.filename.endswith(".xml") and (b"w:sym" in data or b"w:t" in data):
                try:
                    xml, glyphs = normalize_symbol_xml(data.decode())
                    if glyphs:
                        data = xml.encode()
                        count += len(glyphs)
                except Exception:
                    pass
            zout.writestr(info, data)
    return count


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def pdf_page_count(pdf: Path) -> int:
    try:
        import pymupdf  # type: ignore

        doc = pymupdf.open(str(pdf))
        n = len(doc)
        doc.close()
        return n
    except Exception:
        return -1


def soffice_version() -> str:
    try:
        r = subprocess.run(["soffice", "--version"], capture_output=True, text=True, timeout=10)
    except Exception:
        return ""
    return r.stdout.strip() if r.returncode == 0 else ""


def convert_with_libreoffice(docx: Path, pdf: Path, tmp_profile: Path) -> tuple[bool, str]:
    cmd = [
        "soffice",
        "--headless",
        "--nologo",
        "--nolockcheck",
        f"-env:UserInstallation=file://{tmp_profile}",
        "--convert-to",
        "pdf",
        "--outdir",
        str(pdf.parent),
        str(docx),
    ]
    try:
        pdf.unlink(missing_ok=True)
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        # soffice names output <stem>.pdf in outdir
        expected = pdf.parent / (docx.stem + ".pdf")
        if expected.exists() and expected != pdf:
            expected.rename(pdf)
        ok = r.returncode == 0 and pdf.exists() and pdf.stat().st_size > 1000
        log = r.stdout[-500:] + r.stderr[-500:]
        if ok:
            return True, f"libreoffice: converted ({r.returncode})"
        pdf.unlink(missing_ok=True)
        return False, f"libreoffice: rc={r.returncode} log={log[:400]}"
    except subprocess.TimeoutExpired:
        pdf.unlink(missing_ok=True)
        return False, "libreoffice: timeout"
    except FileNotFoundError:
        pdf.unlink(missing_ok=True)
        return False, "libreoffice: soffice not found"
    except Exception as e:
        pdf.unlink(missing_ok=True)
        return False, f"libreoffice: {e}"


def convert_one(docx: Path, out_pdf: Path, qb_root: Path, tmp_base: Path) -> dict:
    start = time.time()
    rel = str(docx.relative_to(qb_root))
    out_pdf.parent.mkdir(parents=True, exist_ok=True)

    work = Path(tempfile.mkdtemp(prefix="lo-", dir=tmp_base))
    src = work / docx.name
    glyphs = write_normalized_docx(docx, src)
    ok, log_msg = convert_with_libreoffice(src, out_pdf, work / "profile")
    shutil.rmtree(work, ignore_errors=True)

    return {
        "file": rel,
        "sha256": sha256_file(docx),
        "pdf": str(out_pdf.relative_to(ROOT)) if out_pdf.is_relative_to(ROOT) else str(out_pdf),
        "pages": pdf_page_count(out_pdf) if ok else -1,
        "symbol_glyphs_mapped": glyphs,
        "elapsed_s": round(time.time() - start, 2),
        "converter": "libreoffice",
        "ok": ok,
        "log": log_msg[:800],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--qb-root", default=None, help="Path to qb/ folder (default: auto-detect)")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Output qb-pdf dir")
    parser.add_argument("--workers", type=int, default=1, help="Parallel soffice workers (each gets its own profile)")
    parser.add_argument("--force", action="store_true", help="Reconvert even if PDF exists")
    parser.add_argument("--only-bank", default=None, help="Only convert this bank, e.g. QB_501")
    args = parser.parse_args()

    qb_root = find_qb_root(args.qb_root)
    if qb_root is None:
        raise SystemExit(
            "No qb/ found. Pass --qb-root /path/to/qb or set $P2DB_QB_ROOT  (tried: $P2DB_QB_ROOT, "
            + ", ".join(str(c) for c in CANDIDATE_QB_ROOTS) + ")"
        )
    out_root = Path(args.out)
    if not out_root.is_absolute():
        out_root = ROOT / out_root
    out_root.mkdir(parents=True, exist_ok=True)

    ver = soffice_version()
    if not ver:
        raise SystemExit("soffice not found. Install LibreOffice: brew install --cask libreoffice")
    print(f"Converter: libreoffice {ver}")

    all_docx = sorted(qb_root.rglob("*.docx"))
    real_docx = [p for p in all_docx if not p.name.startswith("~$")]
    if not args.only_bank and len(real_docx) != EXPECTED_REAL_DOCX:
        raise SystemExit(f"expected {EXPECTED_REAL_DOCX} real docx, found {len(real_docx)} in {qb_root}")
    if args.only_bank:
        real_docx = [p for p in real_docx if p.parent.name == args.only_bank]

    print(f"QB root: {qb_root}")
    print(f"Found {len(all_docx)} .docx ({len(real_docx)} real, {len(all_docx)-len(real_docx)} lock stubs)")

    # PDF-only sources: copy them through
    for stem in PDF_ONLY_STEMS:
        pdf_src = qb_root / (stem + ".pdf")
        if pdf_src.is_file():
            bank = pdf_src.parent.name
            dest = out_root / bank / (pdf_src.stem + ".pdf")
            if args.only_bank and bank != args.only_bank:
                continue
            if not dest.exists() or args.force:
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(pdf_src, dest)
                print(f"  copy PDF-only: {stem}.pdf -> {dest}")

    to_convert: list[tuple[Path, Path]] = []
    for docx in real_docx:
        dest = out_root / docx.parent.name / (docx.stem + ".pdf")
        if dest.exists() and not args.force and docx.stat().st_mtime <= dest.stat().st_mtime:
            continue
        to_convert.append((docx, dest))

    print(f"To convert: {len(to_convert)} (skipping {len(real_docx)-len(to_convert)} up-to-date)")
    if not to_convert:
        return

    tmp_base = Path(tempfile.mkdtemp(prefix="qb-convert-"))
    results: list[dict] = []
    failed: list[dict] = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futs = {pool.submit(convert_one, docx, dest, qb_root, tmp_base): docx for docx, dest in to_convert}
        for fut in as_completed(futs):
            r = fut.result()
            results.append(r)
            docx = futs[fut]
            print(f"  {'OK' if r['ok'] else 'FAIL'} {docx.parent.name}/{docx.name} {r['pages']}p {r['elapsed_s']}s")
            if not r["ok"]:
                failed.append(r)
    shutil.rmtree(tmp_base, ignore_errors=True)

    log_path = out_root / "convert-log.json"
    if log_path.is_file() and not args.force:
        try:
            prev = json.loads(log_path.read_text())
            prev_by_file = {r["file"]: r for r in prev.get("results", []) if "file" in r}
            for r in results:
                prev_by_file[r["file"]] = r
            results = list(prev_by_file.values())
        except Exception:
            pass

    payload = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "qb_root": str(qb_root),
        "out": str(out_root),
        "converter": "libreoffice",
        "soffice_version": ver,
        "total_docx": len(all_docx),
        "real_docx": len(real_docx),
        "converted": len([r for r in results if r.get("ok")]),
        "failed": len(failed),
        "results": sorted(results, key=lambda r: r.get("file", "")),
    }
    log_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    print(f"\nWrote {log_path}")
    print(f"  converted: {payload['converted']}/{len(real_docx)} real docx, {len(failed)} failed")

    if failed:
        for r in failed:
            print(f"  FAIL {r['file']}: {r['log'][:200]}")
        raise SystemExit(f"{len(failed)} conversions failed - see {log_path}")


if __name__ == "__main__":
    main()
