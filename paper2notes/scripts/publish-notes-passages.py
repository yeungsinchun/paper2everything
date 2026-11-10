#!/usr/bin/env python3
"""Publish the canonical teaching references, without copying source HTML.

Local preview:
  python3 paper2notes/scripts/publish-notes-passages.py
Docker uses --notes-root and --out to publish into the static image.
Invalid passage targets become explicit unavailable records, never excerpts.
Malformed store structure is a publication error. No model calls occur.
"""
from __future__ import annotations

import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
PAGE = re.compile(r"book[1-9][0-9]*/(?:[a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+\.html\Z")
ANCHOR = re.compile(r"[a-zA-Z][a-zA-Z0-9_-]*\Z")
BLOCKS = set("address article aside blockquote br dd div dl dt figcaption figure footer h1 h2 h3 h4 h5 h6 header hr li main ol p section table tbody td th thead tr ul".split())
VOID = set("area base br col embed hr img input link meta param source track wbr".split())
SKIP_TAGS = set("script style template noscript button input select textarea canvas svg nav summary".split())
SKIP_CLASSES = set("check section-dse lo-quiz quiz-slide tf-item tag hud-label visual question-notes".split())


class Element:
    def __init__(self, tag="", attrs=(), parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs), parent, []


class NotesParser(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Element()
        self.stack = [self.root]
        self.feed(html)
        self.close()

    def handle_starttag(self, tag, attrs):
        node = Element(tag, attrs, self.stack[-1])
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def elements(node):
    yield node
    for child in node.children:
        if isinstance(child, Element):
            yield from elements(child)


def excluded(node):
    return (node.tag in SKIP_TAGS or "hidden" in node.attrs
            or node.attrs.get("aria-hidden") == "true"
            or "data-quiz" in node.attrs or "data-check" in node.attrs
            or bool(set(node.attrs.get("class", "").split()) & SKIP_CLASSES))


def normalize(text):
    # ECMAScript whitespace, including BOM; excludes Python-only control whitespace.
    return re.sub(r"[\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+", " ", text).strip(" ")


def plain_text(node):
    if excluded(node):
        return ""
    parts = [" "] if node.tag in BLOCKS else []
    for child in node.children:
        parts.append(child if isinstance(child, str) else plain_text(child))
    if node.tag in BLOCKS:
        parts.append(" ")
    return "".join(parts)


def extract(html, anchor):
    nodes = list(elements(NotesParser(html).root))
    matches = [node for node in nodes if node.attrs.get("id") == anchor]
    if len(matches) != 1:
        raise ValueError("missing or duplicate notes anchor")
    node = matches[0]
    parent, in_main = node, False
    while parent:
        if excluded(parent):
            raise ValueError("anchor points to a control, hidden content, or question")
        in_main = in_main or parent.tag == "main"
        parent = parent.parent
    if not in_main:
        raise ValueError("anchor is outside the notes")
    text = normalize(plain_text(node))
    if not text or len(text.encode("utf-16-le")) // 2 > 12000:
        raise ValueError("notes passage is empty or too long")
    titles = [normalize(plain_text(n)) for n in nodes if n.tag == "title"]
    return text, titles[0] if titles else "Notes"


def text_hash(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def utf16_slice(text, start, end):
    return text.encode("utf-16-le")[start * 2:end * 2].decode("utf-16-le", errors="strict")


def check_ranges(text, highlights):
    if (not isinstance(text, str) or not text or normalize(text) != text
            or not isinstance(highlights, list) or not 1 <= len(highlights) <= 32):
        raise ValueError("invalid passage text or highlights")
    previous = 0
    length = len(text.encode("utf-16-le")) // 2
    if length > 12000:
        raise ValueError("notes passage is too long")
    for h in highlights:
        keys(h, "start end quote", "highlight")
        if (type(h["start"]) is not int or type(h["end"]) is not int
                or not isinstance(h["quote"], str) or not h["quote"]):
            raise ValueError("invalid sentence range")
        start, end = h["start"], h["end"]
        if start < previous or start >= end or end > length:
            raise ValueError("invalid or overlapping sentence ranges")
        try:
            quote = utf16_slice(text, start, end)
            before = utf16_slice(text, 0, start).rstrip()
            after = utf16_slice(text, end, length)
        except UnicodeDecodeError as exc:
            raise ValueError("sentence range splits a UTF-16 character") from exc
        if quote != h["quote"]:
            raise ValueError("sentence quote does not match the notes")
        if quote != quote.strip() or (before and before[-1] not in ".!?"):
            raise ValueError("highlight does not start at a sentence boundary")
        if quote[-1] not in ".!?" or (after and not after.startswith(" ")):
            raise ValueError("highlight does not end at a sentence boundary")
        previous = end


def keys(value, required, label):
    if not isinstance(value, dict) or set(value) != set(required.split()):
        raise ValueError(f"{label}: invalid fields")


def valid_identity(corpus, item_id):
    if not isinstance(item_id, str):
        return False
    return bool(re.fullmatch(r"PHY[0-9]+", item_id) if corpus == "qb" else
                re.fullmatch(r"dse-(?:mc-(?:[0-9]{4}|pp|sap)-[0-9]+|lq-(?:[0-9]{4}|pp|sap)-q[0-9]+)", item_id))


def validate_store(store):
    keys(store, "schema items", "store")
    if store["schema"] != "paper2db.notes-pointer.v1" or not isinstance(store["items"], list):
        raise ValueError("invalid notes-reference schema")
    seen = set()
    for item in store["items"]:
        keys(item, "corpus item_id passages", "item")
        corpus, item_id = item["corpus"], item["item_id"]
        if corpus not in ("qb", "dse") or not valid_identity(corpus, item_id):
            raise ValueError("invalid canonical question identity")
        identity = (corpus, item_id)
        if identity in seen:
            raise ValueError("duplicate question identity")
        seen.add(identity)
        if not isinstance(item["passages"], list) or not 1 <= len(item["passages"]) <= 8:
            raise ValueError("expected one to eight passages")
        for p in item["passages"]:
            keys(p, "page anchor text_sha256 highlights source tier", "passage")
            if not all(isinstance(p[k], str) for k in ("page", "anchor", "text_sha256", "source", "tier")):
                raise ValueError("invalid passage fields")
            if p["tier"] not in ("verified", "derived", "inferred") or not p["source"].strip() or len(p["source"]) > 2000:
                raise ValueError("missing passage provenance or tier")
            if not re.fullmatch("[0-9a-f]{64}", p["text_sha256"]):
                raise ValueError("invalid text hash")
            hs = p["highlights"]
            if not isinstance(hs, list) or not 1 <= len(hs) <= 32:
                raise ValueError("expected sentence highlights")
            for h in hs:
                keys(h, "start end quote", "highlight")
                if (type(h["start"]) is not int or type(h["end"]) is not int or h["start"] < 0 or h["end"] < 1
                        or not isinstance(h["quote"], str) or not h["quote"]):
                    raise ValueError("invalid sentence range")


def publish(store, notes_root):
    validate_store(store)
    rows = []
    root = notes_root.resolve()
    for item in store["items"]:
        passages = []
        for p in item["passages"]:
            result = {**p}
            try:
                if not PAGE.fullmatch(p["page"]) or not ANCHOR.fullmatch(p["anchor"]):
                    raise ValueError("unsafe notes reference")
                target = (root / p["page"]).resolve()
                if not target.is_relative_to(root):
                    raise ValueError("unsafe notes path")
                if not target.is_file():
                    result.update(status="missing", reason="Notes page is unavailable.")
                else:
                    text, title = extract(target.read_text(encoding="utf-8"), p["anchor"])
                    if text_hash(text) != p["text_sha256"]:
                        result.update(status="stale", reason="Notes changed after this reference was checked.")
                    else:
                        check_ranges(text, p["highlights"])
                        if p["tier"] != "verified":
                            result.update(status="unverified", reason="This teaching reference has not been verified.")
                        else:
                            result.update(status="available", text=text, title=title)
            except (ValueError, OSError) as exc:
                result.update(status="unsafe", reason=str(exc))
            if result["status"] != "available":
                # Rejected references retain identity/provenance, never saved excerpt quotes.
                result.pop("highlights", None)
            passages.append(result)
        rows.append({**item, "passages": passages})
    return {"schema": "paper2notes.question-notes.v1", "items": rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--store", type=Path, default=ROOT / "paper2db/metadata/pointers/notes.json")
    parser.add_argument("--notes-root", type=Path, default=ROOT / "paper2notes/notes")
    parser.add_argument("--out", type=Path)
    parser.add_argument("--check", action="store_true", help="validate references without writing a projection")
    args = parser.parse_args()
    try:
        data = publish(json.loads(args.store.read_text(encoding="utf-8")), args.notes_root)
        if args.check:
            rejected = [f"{i['corpus']}:{i['item_id']} {p['page']}#{p['anchor']}: {p['status']}"
                        for i in data["items"] for p in i["passages"]
                        if p["status"] not in ("available", "unverified")]
            if rejected:
                parser.exit(1, "notes-passages: " + "; ".join(rejected) + "\n")
            print(f"notes-passages: checked {len(data['items'])} mapped questions")
            return
        out = args.out or args.notes_root / "question-notes/passages.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        count = sum(p["status"] == "available" for i in data["items"] for p in i["passages"])
        print(f"notes-passages: {len(data['items'])} mapped questions; {count} verified passages; wrote {out}")
    except (ValueError, OSError) as exc:
        parser.exit(1, f"notes-passages: {exc}\n")


if __name__ == "__main__":
    main()
