// Recursive CSS walker: yields every style rule with its enclosing at-rule
// context and its exact source span, so rules nested in @media / @keyframes can
// be found, attributed and cut.
//
// The walker is scope-explicit: each nested scan is given the offset of its
// block's closing brace and stops there, so no rule can inherit a context it
// does not belong to. Statement at-rules (@import, @charset) and semicolons
// inside url(...) are handled, because both occur in these stylesheets.

/**
 * @param {string} css
 * @returns {{kind: "style"|"at", context: string[], selector: string, body: string,
 *            start: number, end: number}[]}
 */
export function walkRules(css) {
  const rules = [];
  const n = css.length;
  let i = 0;

  const lineAt = (offset) => css.slice(0, Math.max(0, offset)).split("\n").length;
  rules.lineAt = lineAt;

  // advance past whitespace, comments and stray closing braces
  const skipTrivia = () => {
    for (;;) {
      while (i < n && (/\s/.test(css[i]) || css[i] === "}")) i++;
      if (css[i] === "/" && css[i + 1] === "*") {
        const end = css.indexOf("*/", i + 2);
        i = end === -1 ? n : end + 2;
      } else return;
    }
  };

  // offset of the ';' that closes a statement at-rule, or -1. Ignores anything
  // inside parentheses or quotes so an @import url(...) cannot end the scan.
  const statementEnd = (from, before) => {
    let paren = 0;
    let quote = "";
    for (let k = from; k < before; k++) {
      const ch = css[k];
      if (quote) { if (ch === quote) quote = ""; continue; }
      if (ch === "'" || ch === '"') { quote = ch; continue; }
      if (ch === "(") paren++;
      else if (ch === ")") paren--;
      else if (ch === ";" && paren === 0) return k;
    }
    return -1;
  };

  // index of the '}' matching the '{' at open
  const blockEnd = (open) => {
    let depth = 1;
    let k = open + 1;
    while (k < n) {
      const ch = css[k];
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) return k; }
      k++;
    }
    return -1;
  };

  const scan = (context, limit) => {
    for (;;) {
      skipTrivia();
      if (i >= limit) return;
      const braceStart = css.indexOf("{", i);
      if (braceStart === -1 || braceStart >= limit) return;
      const semi = statementEnd(i, braceStart);
      if (semi !== -1) { i = semi + 1; continue; }        // statement at-rule
      const prelude = css.slice(i, braceStart).trim();
      const preludeStart = i;
      const close = blockEnd(braceStart);
      if (close === -1) return;
      const after = close + 1;
      if (prelude.startsWith("@")) {
        rules.push({ kind: "at", context, selector: prelude, body: "", start: preludeStart, end: after });
        i = braceStart + 1;
        scan([...context, prelude], close);
      } else {
        rules.push({
          kind: "style",
          context,
          selector: prelude,
          body: css.slice(braceStart + 1, close),
          start: preludeStart,
          end: after,
        });
      }
      i = after;
    }
  };

  scan([], n);
  return rules;
}

export const normSel = (s) => s.replace(/\s+/g, " ").replace(/\s*([>,+~])\s*/g, " $1 ").trim();

// The four shared components the consolidation was scoped to, as selector roots.
export const COMPONENT_ROOTS = [
  ".topbar", ".brand", "nav a", ".toc", ".choices", ".quiz-letter", ".quiz-choices",
];

export function isInScope(part) {
  const p = normSel(part);
  return COMPONENT_ROOTS.some((r) => p === r || p.startsWith(r + " ") || p.startsWith(r + ":"));
}
