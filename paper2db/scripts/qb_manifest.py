#!/usr/bin/env python3
"""qb-manifest: build and verify QB source manifest and banks.

Manifests:
  paper2db/qb/source-manifest.json  (gitignored working copy, sha256 per DOCX)
  paper2db/metadata/qb/source-manifest.json  (tracked canonical copy)
  paper2db/metadata/qb/banks.json  (tracked per-bank expected counts + scope)

Usage:
  python scripts/qb_manifest.py verify [--qb-root PATH] [--manifest PATH] [--banks PATH]
  python scripts/qb_manifest.py build  [--qb-root PATH] [--out PATH]

`verify` checks that the manifest hashes match the QB DOCX tree (via $P2DB_QB_ROOT
or --qb-root or paper2db/qb) and that banks.json agrees with the manifest.
`build` regenerates the manifest from the QB tree (needs $P2DB_QB_ROOT or --qb-root
pointing at the new_qb corpus).

The manifest is built from the new_qb tree via $P2DB_QB_ROOT: set
P2DB_QB_ROOT=/path/to/new_qb and run `build` to write paper2db/qb/source-manifest.json.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
METADATA_MANIFEST = ROOT / "metadata" / "qb" / "source-manifest.json"
QB_MANIFEST = ROOT / "qb" / "source-manifest.json"
BANKS_PATH = ROOT / "metadata" / "qb" / "banks.json"

# Reuse qb_items find_qb_root logic but avoid circular import at top-level for build
P2DB_QB_ROOT_ENV = "P2DB_QB_ROOT"
CANDIDATE_QB_ROOTS_FALLBACK = [ROOT / "qb"]


def find_qb_root(explicit: str | None) -> Path | None:
    if explicit:
        p = Path(explicit)
        if not p.is_dir():
            raise SystemExit(f"--qb-root {p} not a directory")
        if not any(p.rglob("*.docx")):
            raise SystemExit(f"--qb-root {p} contains no .docx")
        return p
    env_val = os.environ.get(P2DB_QB_ROOT_ENV)
    if env_val:
        p = Path(env_val)
        if not p.is_dir():
            raise SystemExit(f"{P2DB_QB_ROOT_ENV}={p} not a directory")
        if not any(p.rglob("*.docx")):
            raise SystemExit(f"{P2DB_QB_ROOT_ENV}={p} contains no .docx")
        return p
    for cand in CANDIDATE_QB_ROOTS_FALLBACK:
        if cand.is_dir() and any(cand.rglob("*.docx")):
            return cand
    # Fall back to legacy metadata location search? No — corpus-agnostic only allows P2DB_QB_ROOT and ROOT/qb
    return None


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_json(path: Path) -> dict:
    if not path.is_file():
        raise SystemExit(f"Missing {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def build_manifest(qb_root: Path) -> dict:
    all_docx = sorted(qb_root.rglob("*.docx"))
    real_docx = [p for p in all_docx if not p.name.startswith("~$")]
    files = []
    for docx in sorted(real_docx):
        rel = docx.relative_to(qb_root).as_posix()
        bank = docx.parent.name
        files.append(
            {
                "path": rel,
                "bank": bank,
                "sha256": sha256_file(docx),
                "size": docx.stat().st_size,
            }
        )
    bank_list = sorted({f["bank"] for f in files})
    # Derive source label: if qb_root is outside repo, use its basename, else "new_qb" fallback
    source = qb_root.name if qb_root.name else "new_qb"
    # Keep legacy source as new_qb for compatibility when built from new_qb tree
    if "new_qb" in qb_root.as_posix():
        source = "new_qb"
    source_original = str(qb_root)
    manifest = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": source,
        "source_original": source_original,
        "qb_root": "paper2db/qb",
        "banks": len(bank_list),
        "bank_list": bank_list,
        "total_files": len(files),
        "total_docx": len(files),
        "files": files,
    }
    return manifest


def verify_manifest(qb_root: Path | None, manifest_path: Path | None, banks_path: Path | None) -> dict:
    errors: list[str] = []
    warnings: list[str] = []

    # Resolve manifest
    if manifest_path and manifest_path.is_file():
        manifest_p = manifest_path
    elif QB_MANIFEST.is_file():
        manifest_p = QB_MANIFEST
    elif METADATA_MANIFEST.is_file():
        manifest_p = METADATA_MANIFEST
    else:
        raise SystemExit(f"No manifest found (tried {QB_MANIFEST} and {METADATA_MANIFEST}); pass --manifest")

    manifest = load_json(manifest_p)
    banks = None
    if banks_path and banks_path.is_file():
        banks = load_json(banks_path)
    elif BANKS_PATH.is_file():
        banks = load_json(BANKS_PATH)

    # Cross-check manifest vs banks.json
    if banks:
        b_total_docx = banks.get("total_docx")
        b_banks = banks.get("banks")
        # banks may be int or list; handle both
        if isinstance(banks.get("banks"), int):
            b_banks_count = banks.get("banks")
        elif isinstance(banks.get("banks_detail"), list):
            b_banks_count = len(banks.get("banks_detail"))
        else:
            b_banks_count = None
        # Check total docx
        if b_total_docx is not None and manifest.get("total_docx") != b_total_docx:
            errors.append(f"manifest total_docx {manifest.get('total_docx')} != banks.json total_docx {b_total_docx}")
        if b_banks_count is not None and manifest.get("banks") != b_banks_count:
            errors.append(f"manifest banks {manifest.get('banks')} != banks.json banks {b_banks_count}")
        # Per-bank docx counts
        if isinstance(banks.get("banks_detail"), list):
            expected_docx_by_bank = {b["id"]: b["expected_docx"] for b in banks["banks_detail"]}
            actual_by_bank = {}
            for f in manifest.get("files", []):
                actual_by_bank[f["bank"]] = actual_by_bank.get(f["bank"], 0) + 1
            for bank, expected in expected_docx_by_bank.items():
                actual = actual_by_bank.get(bank, 0)
                if actual != expected:
                    errors.append(f"bank {bank} docx: manifest {actual} != banks.json {expected}")
            # Check all manifest banks are in banks.json
            for bank in manifest.get("bank_list", []):
                if bank not in expected_docx_by_bank:
                    errors.append(f"manifest bank {bank} not in banks.json")
            # Check banks.json banks all appear
            for bank in expected_docx_by_bank:
                if bank not in manifest.get("bank_list", []):
                    errors.append(f"banks.json bank {bank} missing from manifest")
        # Check total_items vs expected?
        # manifest doesn't contain items, so skip

    # Verify each file's hash if qb_root available
    if qb_root is None:
        warnings.append(f"No QB root found; skipping per-file hash check (manifest {manifest_p})")
    else:
        for entry in manifest.get("files", []):
            fpath = qb_root / entry["path"]
            if not fpath.is_file():
                errors.append(f"Missing DOCX: {entry['path']} (expected at {fpath})")
                continue
            actual_sha = sha256_file(fpath)
            if actual_sha != entry["sha256"]:
                errors.append(f"SHA mismatch: {entry['path']} manifest {entry['sha256'][:12]}... != actual {actual_sha[:12]}...")
            actual_size = fpath.stat().st_size
            if actual_size != entry["size"]:
                errors.append(f"Size mismatch: {entry['path']} manifest {entry['size']} != actual {actual_size}")

    # Summary
    ok = not errors
    summary = {
        "ok": ok,
        "manifest": str(manifest_p),
        "qb_root": str(qb_root) if qb_root else None,
        "banks": str(banks_path or BANKS_PATH) if banks else None,
        "manifest_total_docx": manifest.get("total_docx"),
        "manifest_banks": manifest.get("banks"),
        "errors": errors,
        "warnings": warnings,
    }
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)
    p_verify = sub.add_parser("verify", help="Verify manifest hashes and banks.json agreement")
    p_verify.add_argument("--qb-root", default=None, help="Path to qb/ corpus (default: $P2DB_QB_ROOT or paper2db/qb)")
    p_verify.add_argument("--manifest", default=None, help="Path to source-manifest.json (default: qb/source-manifest.json or metadata/qb/source-manifest.json)")
    p_verify.add_argument("--banks", default=None, help="Path to banks.json (default: metadata/qb/banks.json)")
    p_verify.add_argument("--strict", action="store_true", help="Exit 1 on warnings too")

    p_build = sub.add_parser("build", help="Build manifest from QB DOCX tree")
    p_build.add_argument("--qb-root", default=None, help="Path to qb/ corpus (default: $P2DB_QB_ROOT or paper2db/qb)")
    p_build.add_argument("--out", default=None, help="Output manifest path (default: qb/source-manifest.json)")
    p_build.add_argument("--also-metadata", action="store_true", help="Also write to metadata/qb/source-manifest.json")

    args = parser.parse_args()

    if args.cmd == "verify":
        qb_root = find_qb_root(args.qb_root)  # may be None
        manifest_path = Path(args.manifest) if args.manifest else None
        banks_path = Path(args.banks) if args.banks else None
        result = verify_manifest(qb_root, manifest_path, banks_path)
        print(f"QB manifest verify")
        print(f"  manifest: {result['manifest']}")
        print(f"  qb_root:  {result['qb_root']}")
        print(f"  banks:    {result['banks']}")
        print(f"  total_docx: {result['manifest_total_docx']}  banks: {result['manifest_banks']}")
        if result["warnings"]:
            print("Warnings:")
            for w in result["warnings"]:
                print(f"  - {w}")
        if result["errors"]:
            print("Errors:")
            for e in result["errors"]:
                print(f"  ✗ {e}")
        else:
            print("  ✓ manifest hashes ok" if result["qb_root"] else "  ✓ manifest structure ok (no qb_root to check hashes)")
            if banks_path or BANKS_PATH.is_file():
                print("  ✓ banks.json agrees with manifest")

        # Also check overall gate totals for human readability
        banks_data = None
        try:
            bp = banks_path or BANKS_PATH
            if bp and bp.is_file():
                banks_data = json.loads(bp.read_text(encoding="utf-8"))
        except Exception:
            pass
        if banks_data:
            print(f"  banks.json total_items: {banks_data.get('total_items')}  in_scope: {banks_data.get('in_scope_items')}")

        ok = result["ok"] and not (args.strict and result["warnings"])
        if not ok:
            raise SystemExit(1)
        print("GATE PASS: manifest verified")

    elif args.cmd == "build":
        qb_root = find_qb_root(args.qb_root)
        if qb_root is None:
            raise SystemExit("No qb/ found. Set $P2DB_QB_ROOT=/path/to/new_qb or pass --qb-root")
        manifest = build_manifest(qb_root)
        out_path = Path(args.out) if args.out else QB_MANIFEST
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Built manifest: {out_path}")
        print(f"  source: {manifest['source']}  total_docx: {manifest['total_docx']}  banks: {manifest['banks']}")
        # Also keep metadata copy if requested or if qb_manifest is gitignored and metadata is tracked canonical
        if args.also_metadata:
            METADATA_MANIFEST.parent.mkdir(parents=True, exist_ok=True)
            METADATA_MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            print(f"Also wrote {METADATA_MANIFEST}")


if __name__ == "__main__":
    main()
