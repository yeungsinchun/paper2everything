#!/usr/bin/env python3
"""Generate salted leak fingerprints for the protected question/answer corpus.

Reads the committed QB/DSE item JSON under ``paper2notes/notes/qb/data/`` and
writes ``paper2notes/scripts/leak/fingerprints.v1.json.gz``. The file holds only
salted hashes, so it can be checked in and read by ``leak-check.mjs`` without
carrying the protected text itself.

Per item it stores:
  g     salted hashes of every word 8-gram of the stem + options + subparts
  w     salted hashes of every word 8-gram of the worked solution / marking
  nums  salted hashes of the item's "significant numbers" (numset)

8-grams that occur in 3 or more different items are boilerplate ("which of the
following statements is correct about ...") and are dropped so they cannot
cause false positives.

The text normalisation below MUST stay byte-for-byte equivalent to
``normalize``/``tokens``/``numset`` in ``paper2notes/scripts/leak-check.mjs``.

Usage:
  python3 paper2db/scripts/leak_fingerprints.py            # (re)write
  python3 paper2db/scripts/leak_fingerprints.py --check    # fail if stale
"""
import argparse
import gzip
import hashlib
import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
DATA_DIR = REPO / "paper2notes" / "notes" / "qb" / "data"
OUT = REPO / "paper2notes" / "scripts" / "leak" / "fingerprints.v1.json.gz"

SCHEMA = "paper2everything.leak-fingerprints.v1"
# Public, fixed salt: it namespaces the hashes (and lets a rotation invalidate
# old files); it is not a secret.
SALT = "paper2everything/leak/v1"
NGRAM = 8
GRAM_HEX = 12  # 48 bits per 8-gram
NUM_HEX = 8  # 32 bits per number
BOILERPLATE_MIN_ITEMS = 3
MIN_NUMSET = 4  # items with fewer significant numbers get no numset

TOKEN_RE = re.compile(r"[0-9a-z]+(?:\.[0-9]+)?", re.ASCII)
PLACEHOLDER_RE = re.compile(r"\[(?:fig|eq|tbl):\d+\]")
THOUSANDS_RE = re.compile(r"(?<=[0-9]),(?=[0-9]{3})")
NUMBER_RE = re.compile(r"[0-9]+(?:\.[0-9]+)?", re.ASCII)


def normalize(text):
    text = unicodedata.normalize("NFKC", text).lower()
    text = PLACEHOLDER_RE.sub(" ", text)
    return THOUSANDS_RE.sub("", text)


def tokens(text):
    return TOKEN_RE.findall(normalize(text))


def numset(text):
    """Distinct numbers with 2+ characters (drops lone digits, labels like (1))."""
    found = set()
    for tok in tokens(text):
        if NUMBER_RE.fullmatch(tok) and len(tok) >= 2:
            found.add(canonical_number(tok))
    return found


def canonical_number(tok):
    """'4200.0' -> '4200', '007' -> '7'; must match leak-check.mjs."""
    if "." in tok:
        return tok.rstrip("0").rstrip(".")
    return tok.lstrip("0") or "0"


def digest(value, hex_len):
    data = (SALT + "\x00" + value).encode("utf-8")
    return hashlib.sha256(data).hexdigest()[:hex_len]


def ngram_hashes(toks):
    return {
        digest(" ".join(toks[i : i + NGRAM]), GRAM_HEX)
        for i in range(len(toks) - NGRAM + 1)
    }


def question_text(item):
    """Protected question text: stem, options, subparts (or DSE preview)."""
    parts = []
    stem = item.get("stem")
    if isinstance(stem, dict):
        parts.append(stem.get("text") or "")
    elif isinstance(stem, str):
        parts.append(stem)
    if item.get("statementPreview"):
        parts.append(item["statementPreview"])
    for opt in item.get("options") or []:
        parts.append(opt.get("text") or "" if isinstance(opt, dict) else str(opt))
    for sub in item.get("subparts") or []:
        parts.append(sub.get("text") or "" if isinstance(sub, dict) else str(sub))
    return "\n".join(p for p in parts if p)


def answer_text(item):
    ans = item.get("answer")
    if not isinstance(ans, dict):
        return ""
    parts = [ans.get("worked") or ""]
    for mark in ans.get("marking") or []:
        parts.append(mark.get("text") or "" if isinstance(mark, dict) else str(mark))
    return "\n".join(p for p in parts if p)


def load_items():
    """Items that carry protected text, deduped by id (first file wins)."""
    items = {}
    for path in sorted(DATA_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        rows = data.get("items") if isinstance(data, dict) else None
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict) or not row.get("id"):
                continue
            if not question_text(row) and not answer_text(row):
                continue
            items.setdefault(str(row["id"]), row)
    return items


def corpus_digest(items):
    h = hashlib.sha256()
    for item_id in sorted(items):
        h.update(item_id.encode())
        h.update(b"\x00")
        h.update(question_text(items[item_id]).encode())
        h.update(b"\x00")
        h.update(answer_text(items[item_id]).encode())
        h.update(b"\x01")
    return h.hexdigest()


def build():
    items = load_items()
    per_item = {}
    gram_items = defaultdict(set)
    for item_id, item in items.items():
        q = ngram_hashes(tokens(question_text(item)))
        a = ngram_hashes(tokens(answer_text(item)))
        for g in q | a:
            gram_items[g].add(item_id)
        per_item[item_id] = (q, a)

    boilerplate = {g for g, ids in gram_items.items() if len(ids) >= BOILERPLATE_MIN_ITEMS}
    rows = []
    for item_id in sorted(per_item):
        q, a = per_item[item_id]
        item = items[item_id]
        nums = numset(question_text(item))
        rows.append(
            {
                "id": item_id,
                "bank": item.get("bank") or item.get("paper") or "",
                "g": sorted(q - boilerplate),
                "w": sorted(a - boilerplate),
                "nums": sorted(digest(n, NUM_HEX) for n in nums) if len(nums) >= MIN_NUMSET else [],
            }
        )
    return {
        "schema": SCHEMA,
        "salt": SALT,
        "ngram": NGRAM,
        "gram_hex": GRAM_HEX,
        "num_hex": NUM_HEX,
        "min_numset": MIN_NUMSET,
        "boilerplate_min_items": BOILERPLATE_MIN_ITEMS,
        "boilerplate_dropped": len(boilerplate),
        "corpus_sha256": corpus_digest(items),
        "items": rows,
    }


def encode(doc):
    raw = json.dumps(doc, sort_keys=True, separators=(",", ":")).encode("utf-8")
    # mtime=0 keeps the gzip bytes reproducible.
    return gzip.compress(raw, compresslevel=9, mtime=0)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="exit 1 if the committed file is stale")
    args = ap.parse_args()

    blob = encode(build())
    if args.check:
        if not OUT.exists() or OUT.read_bytes() != blob:
            print(f"{OUT.relative_to(REPO)} is stale; run {Path(__file__).relative_to(REPO)}", file=sys.stderr)
            return 1
        print("leak fingerprints up to date")
        return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(blob)
    doc = json.loads(gzip.decompress(blob))
    print(f"wrote {OUT.relative_to(REPO)}: {len(doc['items'])} items, {len(blob)} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
