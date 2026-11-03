/** Read-only inventory of canonical IDs and published inputs. Never loads fixtures. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { dseItemsForPage } from "./dse.mjs";

export const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
export const jsonSha = value => sha256(JSON.stringify(value));
export const inside = (root, rel) => {
  if (typeof rel !== "string" || !rel || path.isAbsolute(rel)) return null;
  const abs = path.resolve(root, rel);
  return abs.startsWith(path.resolve(root) + path.sep) ? abs : null;
};
export function htmlFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(e => {
    if (e.name.startsWith("_") || e.isSymbolicLink()) return [];
    const file = path.join(root, e.name);
    return e.isDirectory() ? htmlFiles(file) : e.name.endsWith(".html") ? [file] : [];
  });
}

export function enumerateCorpus({ root }) {
  const notesRoot = path.join(root, "paper2notes");
  const inputs = new Map(), questions = new Map(), issues = [], origins = [];
  const issue = (state, file, code) => issues.push({ state, file, code });
  function read(rel, required = true) {
    if (inputs.has(rel)) return inputs.get(rel).data;
    let bytes;
    try { bytes = fs.readFileSync(path.join(root, rel)); }
    catch (e) {
      const state = e.code === "ENOENT" ? "missing-source" : "malformed";
      inputs.set(rel, { path: rel, state });
      if (required) issue(state, rel, "unreadable-input");
      return null;
    }
    try {
      const data = JSON.parse(bytes);
      inputs.set(rel, { path: rel, state: "available", sha256: sha256(bytes), data });
      return data;
    } catch {
      inputs.set(rel, { path: rel, state: "malformed", sha256: sha256(bytes) });
      issue("malformed", rel, "invalid-json");
      return null;
    }
  }
  function rows(rel, field = "items", required = true) {
    const data = read(rel, required);
    if (data === null) return [];
    const list = field === null ? data : data[field];
    if (!Array.isArray(list)) { issue("malformed", rel, "expected-array"); return []; }
    return list.filter(row => {
      if (row && typeof row === "object" && !Array.isArray(row)) return true;
      issue("malformed", rel, "invalid-record"); return false;
    });
  }
  function add(corpus, id, row, file, { bank = null, type = null, raw = false, evidence = [], audit = null } = {}) {
    if (typeof id !== "string" || !id || !row || typeof row !== "object") { issue("malformed", file, "invalid-item-id"); return; }
    const key = `${corpus}:${id}`;
    if (!questions.has(key)) questions.set(key, { corpus, id, bank, type, aliases: [], occurrences: [], evidence: [], audit_inputs: [], contexts: [] });
    const q = questions.get(key);
    if (bank && q.bank && bank !== q.bank) issue("malformed", file, `bank-conflict:${id}`);
    if (type && q.type && type !== q.type) issue("malformed", file, `type-conflict:${id}`);
    q.bank ||= bank; q.type ||= type;
    q.aliases.push(row.id ?? id);
    q.occurrences.push({ file, source_id: row.id ?? id, sha256: jsonSha(row) });
    q.evidence.push(...evidence);
    if (raw) q.audit_inputs.push(row);
    if (audit) q.contexts.push(audit);
  }
  const banksFile = "paper2db/metadata/qb/banks.json";
  const banks = rows(banksFile, "banks_detail");
  const manifestFile = "paper2db/metadata/qb/source-manifest.json";
  const manifest = rows(manifestFile, "files");
  const sourceByPath = new Map(manifest.map(s => [s.path, s]));
  for (const source of manifest) {
    const rel = `paper2db/qb/${source.path}`;
    const abs = inside(root, rel);
    if (!abs || !/^[a-f0-9]{64}$/.test(source.sha256 || "")) { issue("malformed", manifestFile, "invalid-source-record"); continue; }
    const available = fs.existsSync(abs);
    const state = !available ? "missing-source" : sha256(fs.readFileSync(abs)) === source.sha256 ? "checked" : "stale";
    origins.push({ path: rel, bank: source.bank, sha256: source.sha256, state });
  }
  const index = "paper2db/qb-web-ui-staging/qb/items/index.json";
  const qbIndexes = [index, "paper2notes/notes/qb/data/qb_full_index.json"];
  for (const file of qbIndexes) {
    const seen = new Set();
    for (const row of rows(file)) {
      if (seen.has(row.id)) issue("malformed", file, `duplicate-id:${row.id}`);
      seen.add(row.id);
      add("qb", row.id, row, file, { bank: row.bank, type: row.type });
    }
  }
  for (const bank of banks) {
    if (typeof bank.id !== "string" || !/^QB_[A-Za-z0-9]+$/.test(bank.id)) { issue("malformed", banksFile, "invalid-bank"); continue; }
    const bankFile = `paper2db/qb-web-ui-staging/qb/items/${bank.id}.json`;
    const records = rows(bankFile);
    const seen = new Set();
    for (const row of records) {
      if (seen.has(row.id)) issue("malformed", bankFile, `duplicate-id:${row.id}`);
      seen.add(row.id);
      if (row.bank !== bank.id) issue("malformed", bankFile, `bank-mismatch:${row.id}`);
      if (!Array.isArray(row.sources) || !row.sources.length) issue("missing-source", bankFile, `source-provenance-missing:${row.id}`);
      for (const source of Array.isArray(row.sources) ? row.sources : []) {
        if (!sourceByPath.has(source.file)) issue("missing-source", bankFile, `source-not-in-manifest:${row.id}`);
        else if (source.sha256 !== sourceByPath.get(source.file).sha256) issue("stale", bankFile, `source-version:${row.id}`);
      }
      add("qb", row.id, row, bankFile, { bank: bank.id, type: row.type, raw: true,
        evidence: (row.images?.stem || []).map(image => ({ path: `paper2db/qb-web-ui-staging/qb/${image}`, role: "question" })) });
    }
    if (records.length !== bank.expected_items) issue("unverified", bankFile, `expected-${bank.expected_items}-found-${records.length}`);
    const generatedFile = `paper2db/qb-pdf/items/${bank.id}.json`;
    if (fs.existsSync(path.join(root, generatedFile))) {
      for (const row of rows(generatedFile)) add("qb", row.id, row, generatedFile, { bank: bank.id, type: row.type, raw: true });
    }
  }
  // Published data contains SAP MC IDs absent from the staged MC inventory.
  for (const type of ["mc", "lq"]) {
    const pub = `paper2notes/notes/qb/data/dse_${type}.json`;
    for (const row of rows(pub)) add("dse", `${type}:${row.id}`, row, pub, { type,
      evidence: row.image ? [{ path: `paper2notes/notes/qb/${row.image}`, role: "question" }] : [] });
    const staged = `paper2db/qb-web-ui-staging/dse-${type}/index.json`;
    for (const row of rows(staged, type === "mc" ? null : "items")) {
      const sourceId = String(row.id || "").replace(/^dse-mc-/, "");
      add("dse", `${type}:${sourceId}`, row, staged, { type,
        evidence: (type === "mc" ? row.image?.png : row.crop) ? [{ path: `paper2db/qb-web-ui-staging/dse-${type}/${type === "mc" ? row.image.png : row.crop}`, role: "question" }] : [] });
    }
    const canonical = `paper2db/metadata/${type}/llm_classifications.json`;
    const data = read(canonical);
    let list = [];
    if (type === "mc" && Array.isArray(data)) list = data.map(r => ({ ...r, id: `${r.Year}-${r.Question}` }));
    else if (type === "lq" && data && typeof data === "object" && !Array.isArray(data)) list = Object.entries(data).flatMap(([id, r]) => {
      if (!r || typeof r !== "object" || Array.isArray(r)) { issue("malformed", canonical, `invalid-classification:${id}`); return []; }
      return [{ ...r, id }];
    });
    else if (data !== null) issue("malformed", canonical, "invalid-classifications");
    for (const row of list) add("dse", `${type}:${row.id}`, row, canonical, { type });
  }
  const pages = htmlFiles(path.join(notesRoot, "notes")).filter(p => /\/book\d+\//.test(p));
  for (const page of pages) {
    const rel = path.relative(root, page);
    const bytes = fs.readFileSync(page);
    inputs.set(rel, { path: rel, state: "available", sha256: sha256(bytes) });
    const deck = dseItemsForPage(notesRoot, null, page);
    for (const item of deck.items) {
      const match = item.dse.slide.match(/^dse-(mc|lq)-(.+)$/);
      if (!match) { issue("malformed", rel, `unknown-deck-id:${item.id}`); continue; }
      const id = match[1] === "lq" ? match[2].replace(/-(\d+)$/, "-q$1") : match[2];
      add("dse", `${match[1]}:${id}`, { id: item.id }, rel, { type: match[1], raw: false,
        evidence: item.images.stem.map(image => ({ path: path.relative(root, image), role: "question" })),
        audit: { bank: item.bank, id: item.id, section: item.dse.section, page: item.dse.page, item } });
      questions.get(`dse:${match[1]}:${id}`).audit_inputs.push(item);
    }
  }
  const bankIds = new Set(banks.map(b => b.id));
  for (const q of questions.values()) {
    if (q.corpus === "qb" && !bankIds.has(q.bank)) issue("malformed", index, `unknown-bank:${q.id}`);
    q.aliases = [...new Set(q.aliases)].sort();
    q.evidence = [...new Map(q.evidence.map(e => [e.path, e])).values()];
    if (q.corpus === "qb") q.contexts.push({ bank: q.bank, id: q.id });
    else {
      const year = q.id.slice(q.id.indexOf(":") + 1).replace(/-(?:q)?\d+$/, "");
      if (/^(?:\d{4}|pp|sap)$/.test(year)) {
        const rel = `paper2db/paper/${q.type}/${year}${q.type === "mc" ? "p1a" : "p1b"}.pdf`;
        if (!origins.some(o => o.path === rel)) {
          const abs = inside(root, rel);
          origins.push({ path: rel, state: abs && fs.existsSync(abs) ? "available-unverified-version" : "missing-source" });
        }
      }
    }
    q.contexts = [...new Map(q.contexts.map(c => [`${c.bank}:${c.id}`, c])).values()];
  }
  // Inventory differences remain visible, even when a second input supplies the ID.
  for (const q of questions.values()) {
    if (q.corpus === "qb") {
      for (const file of qbIndexes) if (!q.occurrences.some(o => o.file === file)) issue("unverified", file, `absent-id:${q.id}`);
    }
  }
  return { questions: [...questions.values()].sort((a, b) => `${a.corpus}:${a.id}`.localeCompare(`${b.corpus}:${b.id}`)),
    inputs: [...inputs.values()].map(({ data, ...rest }) => rest).sort((a, b) => a.path.localeCompare(b.path)),
    origins, issues, banks, pages };
}
