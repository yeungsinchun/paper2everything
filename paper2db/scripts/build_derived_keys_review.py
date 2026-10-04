#!/usr/bin/env python3
"""Build the derived-keys Lavish review board from metadata/derived_keys.json.

Reads the tracked derived keys plus classifications, copies question crops
into `.lavish/derived-keys-review/img/`, and writes `index.html` with one card
per target question: scope, section, key-maker input text, the three runs and
the unanimity verdict. Non-unanimous cards (no derived key) are flagged for
human adjudication.
"""

from __future__ import annotations

import html
import json
import re
import shutil
import time
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DERIVED_KEYS = ROOT / "metadata" / "derived_keys.json"
OUT = ROOT / ".lavish" / "derived-keys-review"
IMG = OUT / "img"

SECTION_NAMES = {
    1: "Temperature and Heat Transfer",
    2: "Heat Capacity",
    3: "Change of State",
    4: "Gas Law and Kinetic Theory",
    5: "Motion",
    6: "Force",
    7: "More about Forces",
    8: "Work, Energy and Power",
    9: "Momentum",
    10: "Projectile Motion",
    11: "Uniform Circular Motion",
    12: "Gravitation",
    13: "Wave Motion",
    14: "Reflection, Refraction and Diffraction",
    15: "Interference and Stationary Wave",
    16: "Light and Sound",
    17: "Reflection of Light",
    18: "Refraction of Light",
    19: "Lenses",
    20: "Electrostatics",
    21: "Circuit and Power",
    22: "AC and Domestic Electricity",
    23: "Electromagnetism",
    24: "Electromagnetic Induction",
    25: "Radiation and Radioactivity",
    26: "Rate of Decay and Uses of Radionuclides",
    27: "Nuclear Energy",
}

IN_SCOPE = {5, 6, 7, 8, 9, 10, 11, 12, 20, 21, 22, 23, 24, 25, 26, 27}


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


SUPER_SCRIPT = {
    "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5",
    "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+",
}


def _caret(text: str) -> str:
    """Turn superscript exponent runs (10⁵, 10⁻⁸, s⁻¹, m s⁻²) into caret
    form (10^5, 10^-8, s^-1, m s^-2) so number and unit parsers see one form."""
    def repl(m: re.Match) -> str:
        plain = "".join(SUPER_SCRIPT.get(c, c) for c in m.group(0))
        return "^" + plain

    return re.sub(r"[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+", repl, text)

_NUMBER = r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?"

UNIT_ROOTS = {
    "m", "cm", "mm", "km", "kg", "g", "s", "ms", "min", "h", "j", "kj",
    "w", "kw", "a", "ma", "v", "pa", "kpa", "bq", "t", "mt", "n", "ohm",
    "deg", "%", "λ", "wb", "mev", "gev", "hz", "khz", "mhz", "k", "u",
    "c", "f", "lm", "mol",
}

UNIT_TOKENS = UNIT_ROOTS | {
    root + "-" + str(n) for root in UNIT_ROOTS for n in range(1, 4)
} | {
    root + str(n) for root in UNIT_ROOTS for n in range(1, 4)
}


def normalize_unit(unit: str) -> str:
    """Collapse notation-only unit variants: ° vs degrees, Ω·m vs ohm m,
    m/s vs m s^-1 (superscripts/carets stripped), spacing and trailing
    zeros. The result is a compact token list; units that differ only in
    notation compare equal."""
    u = (unit or "").lower()
    for sup, plain in (("⁻", "-"), ("⁺", "+"), ("⁰", "0"), ("¹", "1"),
                       ("²", "2"), ("³", "3"), ("⁴", "4"), ("⁵", "5"),
                       ("⁶", "6"), ("⁷", "7"), ("⁸", "8"), ("⁹", "9")):
        u = u.replace(sup, plain)
    u = u.replace("degrees", "deg").replace("degree", "deg")
    u = u.replace("°", "deg").replace("º", "deg").replace("○", "deg")
    u = u.replace("λ", "λ").replace("lambda", "λ")
    u = u.replace("ω", "ohm").replace("Ω", "ohm")
    u = u.replace("·", " ")
    u = u.replace("^", "")
    u = re.sub(r"([a-zλ]+)/([a-zλ]+)", r"\1 \2-1", u)
    return " ".join(t for t in u.split() if t)


def matches_unit(unit: str) -> bool:
    if not unit:
        return False
    tokens = [t for t in unit.split() if t]
    return bool(tokens) and all(t in UNIT_TOKENS for t in tokens)


def _unit_tokens(tail: str) -> list[str]:
    """Take the leading run of unit tokens out of the text after a number.
    Non-unit words such as 'towards', 'peak' or 'beneath' end the run, so the
    trailing wording of a final answer does not leak into the unit."""
    out: list[str] = []
    for raw in tail.strip().split():
        token = raw.strip("=,;()[]")
        norm = normalize_unit(token)
        if not norm and token:
            break
        if matches_unit(norm) or not token:
            if token:
                out.append(norm)
            continue
        break
    return out


def parse_quantity(value: str) -> tuple | None:
    """Parse the leading numeric value + unit of one run's final answer.

    Returns a sorted tuple of (number, unit) quantities or None when the value
    is explanation prose rather than a numeric answer. Only notation
    differences (caret vs superscript exponent, x vs *, spacing, trailing
    zeros, unicode minus, leading ~/≈/约/about/approx words, a label like KE= or
    u≈) are ignored; the parsed number and unit must be identical for the
    three runs to count as the same value. A run value of the form
    "1.0 cm = 0.5λ" folds the right-hand quantity of "=" into the same set, so
    writing the answer as an equality does not split it.
    """
    text = (value or "").replace("×", "x").replace("−", "-").replace("−", "-")
    text = _caret(text).strip()
    for marker in ("约", "~", "≈"):
        text = text.lstrip(marker).lstrip()
    for word in ("approx", "about", "approximately"):
        if text.lower().startswith(word) and (
            len(text) == len(word) or not text[len(word)].isalpha()
        ):
            text = text[len(word):].lstrip()
    label = re.match(r"^([A-Za-z]{1,4})\s*(?:≈|~|=)\s*", text)
    if label:
        text = text[label.end():]

    def quantity(num: Decimal, tail: str):
        tokens = _unit_tokens(tail)
        if tokens:
            return (num, " ".join(tokens))
        if not tail.strip():
            return (num, "")
        return None

    def consume(value_text: str):
        m = re.match("^(" + _NUMBER + r")", value_text)
        if not m:
            return None, value_text
        num = Decimal(m.group(1))
        tail = value_text[m.end():]
        exp = re.match(r"^\s*(?:[eE]([+-]?\d+)|x?\s*10\s*\^?\s*([+-]?\d+))", tail)
        if exp:
            power = exp.group(1) or exp.group(2)
            if power is not None:
                num = num * (Decimal(10) ** int(power))
            tail = tail[exp.end():]
        return num, tail

    number, rest = consume(text)
    if number is None:
        return None
    q = quantity(number, rest)
    if q is None:
        return None
    quantities = {q}
    tail = rest.lstrip()
    unit_len = 0
    pieces = tail.split()
    for piece in pieces:
        token = piece.strip("=,;()[]")
        if matches_unit(normalize_unit(token)):
            unit_len += 1
        else:
            break
    if unit_len:
        tail = " ".join(pieces[unit_len:])
    def fold(text_after_eq: str):
        stripped = text_after_eq.lstrip("= ")
        if not re.match("^(" + _NUMBER + r")", stripped):
            return
        num2, tail2 = consume(stripped)
        q2 = quantity(num2, tail2)
        if q2 is not None:
            quantities.add(q2)

    eq = re.match(r"^=\s*(" + _NUMBER + r")", tail)
    if eq:
        fold(tail[eq.start():])
    for pm in re.finditer(r"\(([^()]*=\s*" + _NUMBER + r"[^()]*)\)", tail):
        inner = pm.group(1)
        fold(inner[inner.index("=") + 1:])
    return tuple(sorted(quantities))


def same_value_of(values: list) -> bool | None:
    """Tri-state machine fact per subpart: True when all three recorded run
    values parse to the same (number, unit) ignoring notation-only
    differences; False when all three parse and differ. None ("not
    comparable") when any run fails to parse - an empty (illegible) run has no
    value to compare and explanation prose cannot be parsed, so the parser
    reports no agreement on evidence it did not compare."""
    parsed = [parse_quantity(str(v)) for v in values]
    if any(p is None for p in parsed):
        return None
    return len(set(parsed)) == 1


def primary_section(paper: str, year: str, q: int) -> int | None:
    try:
        if paper == "mc":
            entries = json.loads(
                (ROOT / "metadata" / "mc" / "llm_classifications.json").read_text(
                    encoding="utf-8"
                )
            )
            for e in entries:
                if str(e["Year"]) == year and int(e["Question"]) == q:
                    return int(e["sections"][0])
        else:
            data = json.loads(
                (ROOT / "metadata" / "lq" / "llm_classifications.json").read_text(
                    encoding="utf-8"
                )
            )
            entry = data.get(f"{year}-q{q}")
            if entry:
                return int(entry["sections"][0])
    except (FileNotFoundError, KeyError, ValueError):
        pass
    return None


def crop_source(paper: str, year: str, q: int) -> Path | None:
    if paper == "mc":
        path = ROOT / "tests" / "reconstructed" / "mc" / year / f"q{q}.png"
    else:
        path = ROOT / "tests" / "reconstructed" / "lq" / year / f"q{q}.png"
    return path if path.is_file() else None


def build_cards() -> tuple[list[dict], dict]:
    store = json.loads(DERIVED_KEYS.read_text(encoding="utf-8"))
    maker = store.get("key_maker", {})
    cards: list[dict] = []
    bust = str(int(time.time()))
    for paper in ("mc", "lq"):
        for year in sorted(store.get(paper, {})):
            for q in sorted(store[paper][year], key=int):
                entry = store[paper][year][q]
                section = primary_section(paper, year, int(q))
                src = crop_source(paper, year, int(q))
                img = ""
                if src is not None:
                    dest = IMG / f"{paper}-{year}-q{q}.png"
                    shutil.copy2(src, dest)
                    img = f"img/{dest.name}?v={bust}"
                if paper == "mc":
                    verdict = entry.get("option") if entry.get("unanimous") else None
                    runs = [
                        {
                            "option": r.get("option"),
                            "reasoning": r.get("reasoning", "") or r.get("error", ""),
                        }
                        for r in entry.get("runs", [])
                    ]
                    detail = {
                        "runs": runs,
                        "final_answers": None,
                        "worked": "",
                        "adjudication": entry.get("adjudication"),
                    }
                else:
                    verdict = None
                    runs = [
                        {
                            "subparts": r.get("subparts", {}),
                            "worked": (r.get("worked", "") or "")[:1200],
                            "error": r.get("error", ""),
                        }
                        for r in entry.get("runs", [])
                    ]
                    detail = {
                        "runs": runs,
                        "final_answers": entry.get("final_answers"),
                        "worked": (entry.get("worked", "") or "")[:4000],
                        "adjudication": entry.get("adjudication"),
                    }
                cards.append(
                    {
                        "id": f"dse-{paper}-{year}-{'q' + q if paper == 'lq' else q}",
                        "paper": paper,
                        "year": year,
                        "q": q,
                        "scope": (
                            "in-scope"
                            if section in IN_SCOPE
                            else ("out-of-scope" if section else "unknown")
                        ),
                        "section": section,
                        "section_name": SECTION_NAMES.get(section, "?"),
                        "unanimous": bool(entry.get("unanimous")),
                        "verdict": verdict,
                        "input_kind": (entry.get("input") or {}).get("kind", "?"),
                        "input_text": (entry.get("input") or {}).get("text", ""),
                        "img": img,
                        **detail,
                    }
                )
    summary = {
        "total": len(cards),
        "unanimous": sum(1 for c in cards if c["unanimous"]),
        "provider": maker.get("provider", "?"),
        "model": maker.get("model", "?"),
    }
    return cards, summary


HTML_HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Derived keys review - DSE answers complete</title>
<style>
:root { --paper: #f7f3eb; --panel: #fffdf8; --ink: #1b2129; --muted: #5d6673;
  --rule: #d9d2c4; --accent: #0f5c54; --ok: #1f7a45; --ok-soft: #e6f5ea;
  --bad: #a32626; --bad-soft: #fbeaea; --mark-soft: #fbf1dc; }
* { box-sizing: border-box; }
body { font-family: Georgia, 'Times New Roman', serif; background: var(--paper);
  color: var(--ink); margin: 0; }
main { max-width: 1060px; margin: 0 auto; padding: 1.6rem 1.2rem 4rem; }
h1 { font-size: 1.5rem; margin: 0 0 0.3rem; }
.sub { color: var(--muted); margin: 0 0 1rem; }
.filters { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0 0 1.2rem; }
.filters button { font: inherit; font-size: 0.85rem; padding: 0.35rem 0.7rem;
  border: 1px solid var(--rule); border-radius: 999px; background: var(--panel);
  cursor: pointer; min-height: 40px; }
.filters button[aria-pressed="true"] { background: var(--accent); color: #fff;
  border-color: var(--accent); }
.card { background: var(--panel); border: 1px solid var(--rule);
  border-radius: 10px; padding: 1rem 1.1rem; margin: 0 0 1rem; }
.card h2 { font-size: 1.05rem; margin: 0 0 0.4rem; }
.badges { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.6rem; }
.badge { font-family: ui-monospace, monospace; font-size: 0.75rem;
  padding: 0.15rem 0.55rem; border-radius: 999px; border: 1px solid var(--rule); }
.badge.ok { background: var(--ok-soft); color: var(--ok); border-color: var(--ok); }
.badge.bad { background: var(--bad-soft); color: var(--bad); border-color: var(--bad); }
.badge.scope { background: var(--mark-soft); }
.cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem; }
@media (max-width: 760px) { .cols { grid-template-columns: minmax(0, 1fr); } }
.shot img { width: 100%; height: auto; border: 1px solid var(--rule);
  border-radius: 6px; background: #fff; }
pre.input { white-space: pre-wrap; font-size: 0.8rem; background: var(--paper);
  border: 1px solid var(--rule); border-radius: 6px; padding: 0.6rem;
  max-height: 260px; overflow: auto; }
table.runs { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
table.runs th, table.runs td { border: 1px solid var(--rule); padding: 0.35rem 0.5rem;
  text-align: left; vertical-align: top; }
table.runs th { background: var(--paper); }
.verdict { font-size: 1.1rem; font-weight: bold; }
.verdict.ok { color: var(--ok); } .verdict.bad { color: var(--bad); }
.adjudication { margin-top: 0.7rem; border: 1px solid var(--accent);
  border-radius: 8px; padding: 0.6rem 0.8rem; background: #eef5f2; }
.adjudication h3 { font-size: 0.9rem; margin: 0 0 0.25rem; }
.adj-note { font-size: 0.85rem; margin: 0.25rem 0 0.4rem; color: var(--ink); }
details { margin-top: 0.5rem; } summary { cursor: pointer; min-height: 40px; }
</style>
</head>
<body>
<main>
"""


def status_badge(c: dict) -> str:
    adj = c.get("adjudication")
    if adj and adj.get("settled") is not False and c["unanimous"]:
        return "adjudicated 3/3"
    return "unanimous 3/3" if c["unanimous"] else "NON-UNANIMOUS"


def adjudication_html(c: dict) -> str:
    """Render the human adjudication record (settled basis + accepted final, or
    the unsettled reason) for a card that carries one."""
    adj = c.get("adjudication")
    if not adj:
        return ""
    settled = adj.get("settled") is not False
    finals = c.get("final_answers") or {}
    if settled and c.get("paper") == "mc":
        finals = {"option": c.get("verdict")}
    compared = adj.get("runs_compared") or {}
    same = adj.get("same_value") or {}
    rows = []
    for label, values in compared.items():
        cells = "".join(f"<td>{esc(v)}</td>" for v in values)
        fact = same.get(label)
        if fact is True:
            mark = "✓ same value"
        elif fact is False:
            mark = "✗ values differ"
        else:
            mark = "not comparable"
        if settled:
            accepted = esc(finals.get(label, ""))
            rows.append(
                f"<tr><td>{esc(label)}</td>{cells}"
                f"<td>{mark}</td><td><b>{accepted}</b></td></tr>"
            )
        else:
            rows.append(
                f"<tr><td>{esc(label)}</td>{cells}<td>{mark}</td></tr>"
            )
    header = (
        "<tr><th>subpart</th><th>run 1</th><th>run 2</th><th>run 3</th>"
        "<th>same value</th>"
        + ("<th>accepted final</th>" if settled else "")
        + "</tr>"
    )
    note = adj.get("basis", "") if settled else adj.get("reason", "")
    return (
        f"<div class=adjudication><h3>Adjudication</h3>"
        f"<p class=sub>by {esc(adj.get('adjudicator', '?'))} on "
        f"{esc(adj.get('at', '?'))} &middot; board "
        f"{esc(adj.get('board', '?'))}</p>"
        f"<p class=adj-note>{esc(note)}</p>"
        f"<table class=runs>{header}{''.join(rows)}</table></div>"
    )


def write_html(cards: list[dict], summary: dict) -> None:
    parts = [HTML_HEAD]
    parts.append(
        f"<h1>Derived keys review</h1>"
        f"<p class=sub>{summary['total']} target questions &middot; "
        f"{summary['unanimous']} unanimous 3/3 &middot; "
        f"{summary['total'] - summary['unanimous']} need adjudication<br>"
        f"Key-maker: {esc(summary['provider'])}/{esc(summary['model'])} "
        f"&middot; rule: 3/3 unanimous or no key</p>"
        f"<div class=filters>"
        f"<button data-f=paper:mc aria-pressed=false>MC</button>"
        f"<button data-f=paper:lq aria-pressed=false>LQ</button>"
        f"<button data-f=scope:in-scope aria-pressed=false>in-scope</button>"
        f"<button data-f=unanimous:yes aria-pressed=false>unanimous</button>"
        f"<button data-f=unanimous:no aria-pressed=false>needs review</button>"
        f"<button data-f=reset aria-pressed=false>clear</button>"
        f"</div><div id=cards>"
    )
    for c in cards:
        verdict_cls = "ok" if c["unanimous"] else "bad"
        if c["paper"] == "mc":
            verdict_html = (
                f"<span class='verdict ok'>Key: {esc(c['verdict'])}</span>"
                if c["unanimous"]
                else "<span class='verdict bad'>No key - dissent or error</span>"
            )
            rows = "".join(
                f"<tr><td>run {i + 1}</td><td>{esc(r.get('option'))}</td>"
                f"<td>{esc(r.get('reasoning', ''))}</td></tr>"
                for i, r in enumerate(c["runs"])
            )
            runs_html = (
                f"<table class=runs><tr><th>run</th><th>option</th>"
                f"<th>reasoning</th></tr>{rows}</table>"
            )
        else:
            if c["unanimous"]:
                finals = "<br>".join(
                    f"{esc(k)}: {esc(v)}"
                    for k, v in (c["final_answers"] or {}).items()
                )
                verdict_html = f"<span class='verdict ok'>Finals:</span><br>{finals}"
            else:
                reason = (c.get("adjudication") or {}).get("reason", "")
                verdict_html = (
                    f"<span class='verdict bad'>No key</span> "
                    f"<span class=sub>{esc(reason)}</span>"
                )
            rows = "".join(
                f"<tr><td>run {i + 1}</td>"
                f"<td>{esc(json.dumps(r.get('subparts', {}), ensure_ascii=False))}</td>"
                f"<td>{esc((r.get('worked', '') or r.get('error', ''))[:600])}</td></tr>"
                for i, r in enumerate(c["runs"])
            )
            runs_html = (
                f"<table class=runs><tr><th>run</th><th>finals</th>"
                f"<th>worked / error</th></tr>{rows}</table>"
                + (
                    f"<details><summary>Accepted worked solution</summary>"
                    f"<pre class=input>{esc(c['worked'])}</pre></details>"
                    if c["unanimous"]
                    else ""
                )
            )
        img_html = (
            f"<div class=shot><img src='{esc(c['img'])}' alt='question crop' "
            f"loading=lazy></div>"
            if c["img"]
            else "<p class=sub>No crop on disk.</p>"
        )
        parts.append(
            f"<article class=card data-paper='{c['paper']}' "
            f"data-scope='{c['scope']}' data-unanimous='{'yes' if c['unanimous'] else 'no'}' "
            f"data-year='{esc(c['year'])}'>"
            f"<h2>{esc(c['id'])} &sect;{esc(c['section'])} "
            f"{esc(c['section_name'])}</h2>"
            f"<div class=badges>"
            f"<span class='badge {verdict_cls}'>"
            f"{status_badge(c)}</span>"
            f"<span class='badge scope'>{esc(c['scope'])}</span>"
            f"<span class=badge>{esc(c['input_kind'])}</span>"
            f"</div>{verdict_html}{adjudication_html(c)}"
            f"<div class=cols><div>{img_html}</div>"
            f"<div>{runs_html}"
            f"<details><summary>Key-maker input text</summary>"
            f"<pre class=input>{esc(c['input_text'])}</pre></details>"
            f"</div></div></article>"
        )
    parts.append(
        """</div>
<script>
const btns = document.querySelectorAll('.filters button');
const active = new Set();
btns.forEach(b => b.addEventListener('click', () => {
  const f = b.dataset.f;
  if (f === 'reset') { active.clear(); }
  else if (active.has(f)) { active.delete(f); }
  else { active.add(f); }
  btns.forEach(x => x.setAttribute('aria-pressed',
    active.has(x.dataset.f) ? 'true' : 'false'));
  document.querySelectorAll('#cards .card').forEach(card => {
    let show = true;
    for (const f of active) {
      const [k, v] = f.split(':');
      if (card.dataset[k] !== v) { show = false; break; }
    }
    card.style.display = show ? '' : 'none';
  });
}));
</script>
</main>
</body>
</html>
"""
    )
    (OUT / "index.html").write_text("".join(parts), encoding="utf-8")


def main() -> None:
    if not DERIVED_KEYS.is_file():
        raise SystemExit(f"Missing {DERIVED_KEYS}; run derive_keys.py derive first.")
    OUT.mkdir(parents=True, exist_ok=True)
    if IMG.exists():
        shutil.rmtree(IMG)
    IMG.mkdir(parents=True)
    cards, summary = build_cards()
    write_html(cards, summary)
    (OUT / "summary.json").write_text(
        json.dumps(summary, indent=2) + "\n", encoding="utf-8"
    )
    print(
        f"Wrote {OUT}/index.html ({len(cards)} cards, "
        f"{summary['unanimous']} unanimous)"
    )


if __name__ == "__main__":
    main()
