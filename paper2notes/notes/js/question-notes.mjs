/* Inline teaching passages. Authored references live only in paper2db/metadata/pointers/notes.json. */
const ROOT = new URL('../', import.meta.url);
const PAGE = /^book[1-9][0-9]*\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.html$/;
const ANCHOR = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const BLOCKS = new Set('address article aside blockquote br dd div dl dt figcaption figure footer h1 h2 h3 h4 h5 h6 header hr li main ol p section table tbody td th thead tr ul'.split(' '));
const SKIP = 'script,style,template,noscript,button,input,select,textarea,canvas,svg,nav,summary,[hidden],[aria-hidden="true"],[data-quiz],[data-check],.check,.section-dse,.lo-quiz,.quiz-slide,.tf-item,.tag,.hud-label,.visual,.question-notes';
let sequence = 0;

export const normalizeText = text => text.replace(/\s+/g, ' ').trim();
export function canonicalId(corpus, id, kind) {
  if (typeof id !== 'string' || id !== id.trim()) return null;
  if (corpus === 'qb') return /^PHY[0-9]+$/.test(id) ? id : null;
  if (corpus !== 'dse') return null;
  if (/^dse-mc-(?:[0-9]{4}|pp|sap)-[0-9]+$/.test(id)) return id;
  const lq = id.match(/^dse-lq-((?:[0-9]{4}|pp|sap))-q?([0-9]+)$/);
  if (lq) return `dse-lq-${lq[1]}-q${lq[2]}`;
  if (kind === 'mc' && /^(?:[0-9]{4}|pp|sap)-[0-9]+$/.test(id)) return `dse-mc-${id}`;
  if (kind === 'lq' && /^(?:[0-9]{4}|pp|sap)-q[0-9]+$/.test(id)) return `dse-lq-${id}`;
  return null;
}

export function safeReference(p) {
  return p && typeof p.page === 'string' && p.page === p.page.trim() && PAGE.test(p.page) &&
    typeof p.anchor === 'string' && p.anchor === p.anchor.trim() && ANCHOR.test(p.anchor) &&
    typeof p.text_sha256 === 'string' && p.text_sha256.length === 64 && /^[0-9a-f]{64}$/.test(p.text_sha256) &&
    typeof p.source === 'string' && p.source.trim().length > 0 && p.source.length <= 2000;
}

export function validateRanges(text, highlights) {
  if (typeof text !== 'string' || !text || text.length > 12000 ||
      !Array.isArray(highlights) || !highlights.length || highlights.length > 32) return false;
  let previous = 0;
  return highlights.every(h => {
    if (!h || !Number.isSafeInteger(h.start) || !Number.isSafeInteger(h.end) || h.start < previous ||
        h.start < 0 || h.start >= h.end || h.end > text.length || typeof h.quote !== 'string') return false;
    const quote = text.slice(h.start, h.end);
    const before = text.slice(0, h.start).trimEnd();
    const after = text.slice(h.end);
    // Whole sentences only. These deliberately conservative boundaries reject ambiguous ranges.
    if (!quote || quote !== h.quote || quote !== quote.trim() ||
        (before && !/[.!?]$/.test(before)) || !/[.!?]$/.test(quote) || (after && !after.startsWith(' '))) return false;
    previous = h.end;
    return true;
  });
}

export function extractPassage(doc, anchor) {
  const matches = [...doc.querySelectorAll('[id]')].filter(el => el.id === anchor);
  if (matches.length !== 1) throw new Error('The original notes anchor is missing or duplicated.');
  const block = matches[0];
  if (!block.closest('main') || block.closest(SKIP)) throw new Error('The reference does not point to visible teaching notes.');
  function collect(node) {
    if (node.nodeType === 3) return node.nodeValue;
    if (node.nodeType !== 1 || node.matches(SKIP)) return '';
    const space = BLOCKS.has(node.localName) ? ' ' : '';
    return space + [...node.childNodes].map(collect).join('') + space;
  }
  const text = normalizeText(collect(block));
  if (!text || text.length > 12000) throw new Error('The notes passage is empty or too long.');
  return text;
}

export async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(n => n.toString(16).padStart(2, '0')).join('');
}

async function readResource(url, type, limit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { cache: 'no-store', redirect: 'error', signal: controller.signal });
    if (!response.ok) throw new Error('The notes service could not load this reference.');
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes(type)) throw new Error('The notes service returned an unexpected format.');
    if (Number(response.headers.get('content-length')) > limit) throw new Error('The notes response is too large.');
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error('The notes response is too large.'); }
      chunks.push(value);
    }
    const buffer = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } finally {
    clearTimeout(timer);
  }
}

export function findRecord(data, corpus, itemId) {
  if (!data || data.schema !== 'paper2notes.question-notes.v1' || !Array.isArray(data.items)) {
    throw new Error('The notes-reference index has an unsupported format.');
  }
  const matches = data.items.filter(i => i && i.corpus === corpus && i.item_id === itemId);
  if (!matches.length) return null;
  if (matches.length !== 1 || !Array.isArray(matches[0].passages) ||
      !matches[0].passages.length || matches[0].passages.length > 8) {
    throw new Error('This question has malformed or conflicting notes references.');
  }
  return matches[0];
}

async function resolvePassage(p, documents) {
  if (!safeReference(p)) return { status: 'unsafe', reason: 'This notes reference is unsafe or malformed.' };
  if (p.status !== 'available' || p.tier !== 'verified') {
    const reasons = {
      missing: 'The original notes passage is unavailable.',
      stale: 'The notes changed after this reference was checked.',
      unsafe: 'This notes reference failed its safety checks.',
      unverified: 'This teaching reference has not been verified.'
    };
    return { status: reasons[p.status] ? p.status : 'unverified', reason: reasons[p.status] || reasons.unverified };
  }
  if (!validateRanges(p.text, p.highlights) || normalizeText(p.text) !== p.text) {
    return { status: 'unsafe', reason: 'The saved sentence highlights are invalid.' };
  }
  try {
    const url = new URL(p.page, ROOT);
    if (!documents.has(url.href)) {
      documents.set(url.href, readResource(url, 'text/html', 2000000)
        .then(html => new DOMParser().parseFromString(html, 'text/html')));
    }
    const doc = await documents.get(url.href);
    const current = extractPassage(doc, p.anchor);
    if (current !== p.text || await sha256(current) !== p.text_sha256) {
      return { status: 'stale', reason: 'The notes changed after this reference was checked. No old excerpt is shown.' };
    }
    url.hash = p.anchor;
    return { ...p, title: doc.title || 'Notes', href: url.href, status: 'available' };
  } catch (error) {
    return { status: 'unavailable', reason: error.name === 'AbortError' ? 'The notes request timed out. Close this panel and try again.' : error.message };
  }
}

const KATEX = {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false }
  ],
  throwOnError: false,
  ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
};

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function renderPassage(p, number) {
  const section = element('section', 'question-notes-passage');
  section.append(element('h4', '', `${number}. ${p.title}`));
  const paragraph = element('p', 'question-notes-text');
  let cursor = 0;
  for (const range of p.highlights) {
    paragraph.append(document.createTextNode(p.text.slice(cursor, range.start)));
    paragraph.append(element('mark', '', p.text.slice(range.start, range.end)));
    cursor = range.end;
  }
  paragraph.append(document.createTextNode(p.text.slice(cursor)));
  if (window.renderMathInElement) window.renderMathInElement(paragraph, KATEX);
  const link = element('a', 'question-notes-original', 'Open original notes (new tab)');
  link.href = p.href;
  link.target = '_blank';
  link.rel = 'noopener';
  section.append(paragraph, link);
  return section;
}

export function attachQuestionNotes(container, { corpus, itemId, kind } = {}) {
  if (!container || container.querySelector(':scope > .question-notes-control')) return;
  if (!document.querySelector('link[data-question-notes-style]')) {
    const css = element('link');
    css.rel = 'stylesheet';
    css.href = new URL('css/question-notes.css', ROOT).href;
    css.dataset.questionNotesStyle = '';
    document.head.append(css);
  }
  const canonical = canonicalId(corpus, itemId, kind);
  const identity = canonical || itemId || 'unknown question';
  const control = element('div', 'question-notes-control');
  const button = element('button', 'question-notes-toggle', 'Explain with notes');
  button.type = 'button';
  button.setAttribute('aria-label', `Explain ${identity} with notes`);
  button.setAttribute('aria-expanded', 'false');
  const panel = element('div', 'question-notes');
  panel.hidden = true;
  panel.id = `question-notes-${++sequence}`;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', `Notes explanation for ${identity}`);
  button.setAttribute('aria-controls', panel.id);
  control.append(button, panel);
  container.append(control);
  let revision = 0;

  function close() {
    revision += 1;
    panel.hidden = true;
    panel.replaceChildren();
    button.setAttribute('aria-expanded', 'false');
    button.textContent = 'Explain with notes';
  }
  button.addEventListener('click', async () => {
    if (!panel.hidden) { close(); return; }
    panel.hidden = false;
    panel.dataset.state = 'loading';
    button.setAttribute('aria-expanded', 'true');
    button.textContent = 'Hide notes explanation';
    const current = ++revision;
    const status = element('p', 'question-notes-status', 'Loading checked notes passages…');
    status.setAttribute('role', 'status');
    const content = element('div', 'question-notes-content');
    const dismiss = element('button', 'question-notes-close', 'Close notes');
    dismiss.type = 'button';
    dismiss.addEventListener('click', () => { close(); button.focus(); });
    panel.replaceChildren(element('h3', '', 'Notes explanation'), status, content, dismiss);
    // Move keyboard focus into the open region; Escape and Close restore it.
    dismiss.focus({ preventScroll: true });
    try {
      if (!canonical) throw new Error('This question has no supported source identity.');
      const data = JSON.parse(await readResource(new URL('question-notes/passages.json', ROOT), 'application/json', 5000000));
      if (current !== revision || !container.isConnected) return;
      const record = findRecord(data, corpus, canonical);
      if (!record) {
        status.textContent = 'No verified notes passage is mapped to this question yet.';
        panel.dataset.state = 'missing';
        return;
      }
      const documents = new Map();
      const passages = await Promise.all(record.passages.map(p => resolvePassage(p, documents)));
      if (current !== revision || !container.isConnected) return;
      const available = passages.filter(p => p.status === 'available');
      status.textContent = available.length ? `${available.length} checked notes passage${available.length === 1 ? '' : 's'}. Highlighted sentences explain the relevant concept; they may not cover every part of the question.` : 'No verified explanation is available for this question.';
      panel.dataset.state = available.length ? 'available' : passages[0].status;
      let number = 0;
      for (const passage of passages) {
        if (passage.status === 'available') content.append(renderPassage(passage, ++number));
        else content.append(element('p', 'question-notes-warning', passage.reason));
      }
    } catch (error) {
      if (current !== revision || !container.isConnected) return;
      panel.dataset.state = 'unavailable';
      status.textContent = 'Explanation unavailable. ' + (error.name === 'AbortError' ? 'The request timed out. Close this panel and try again.' : error.message);
    }
  });
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); button.focus(); }
  });
}
