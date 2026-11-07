import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { layoutDir, notesDir, loadPages, loadLayout, renderPage, publishedRoutes, checkBooks, footerFrom, normalizeSlot } from './build-books.mjs';

const pages = loadPages(), layout = loadLayout();
const contract = JSON.parse(readFileSync(join(layoutDir, 'migration-contract.json'), 'utf8'));
const hash = s => createHash('sha256').update(s).digest('hex');
const ids = s => [...s.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const links = s => [...s.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(m => m[1]);

test('every published route has exactly one source, including all nine books', () => {
  assert.equal(pages.length, 195);
  assert.deepEqual(pages.map(p => p.route).sort(), publishedRoutes());
  assert.deepEqual(pages.map(p => p.route).sort(), Object.keys(contract.pages).sort());
  assert.deepEqual([...new Set(pages.map(p => p.route.split('/')[0]))].sort(), Object.keys(layout.books));
  assert.deepEqual(checkBooks().errors, []);
});

test('one real layout edit rebuilds every route and every book without editing page sources', () => {
  const temp = mkdtempSync(join(tmpdir(), 'book-layout-propagation-'));
  const source = join(temp, 'layout'), output = join(temp, 'notes');
  try {
    cpSync(layoutDir, source, { recursive: true });
    mkdirSync(output);
    checkBooks({ source, output, write: true });
    const changed = layout.template.replace('<header class="p2n-top"', '<header data-layout-edit-proof="edit-once" class="p2n-top"');
    assert.notEqual(changed, layout.template);
    writeFileSync(join(source, 'book.html'), changed);
    assert.equal(checkBooks({ source, output }).errors.length, pages.length);
    assert.deepEqual(checkBooks({ source, output, write: true }).errors, []);
    assert.deepEqual(checkBooks({ source, output }).errors, []);
    for (const p of pages) {
      assert.match(readFileSync(join(output, p.route), 'utf8'), /<header data-layout-edit-proof="edit-once"/);
      assert.equal(readFileSync(join(source, 'pages', p.route), 'utf8'), readFileSync(join(layoutDir, 'pages', p.route), 'utf8'));
    }
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('all routes use one primary navigation and no secondary header chapter row', () => {
  for (const p of pages) {
    const html = renderPage(p, layout);
    const header = html.match(/<header class="p2n-top"[\s\S]*?<\/header>/)[0];
    assert.equal((header.match(/<nav\b/g) ?? []).length, 1, p.route);
    assert.doesNotMatch(html, /p2n-context-nav/, p.route);
    assert.equal((header.match(/aria-current="page"/g) ?? []).length, 1, p.route);
    assert.equal((header.match(/<a\b/g) ?? []).length, 12, p.route);
    assert.match(header, /aria-label="Site navigation"/);
    assert.match(header, /aria-hidden="true"/);
    assert.equal((html.match(/<main\b/g) ?? []).length, 1);
    assert.equal((html.match(/deploy-commit-footer/g) ?? []).length, 1);
    const root = new URL(p.route, 'https://notes.test/');
    for (const [, href] of header.matchAll(/href="([^"]+)"/g)) {
      assert.ok(['index.html', 'qb/index.html', ...Object.keys(layout.books).map(b => `${b}/index.html`)].includes(new URL(href, root).pathname.slice(1)));
    }
  }
});

test('migration preserves notes, local idea links, questions, interactions, anchors and scripts', () => {
  for (const p of pages) {
    const c = contract.pages[p.route];
    assert.equal(p.type, c.type, p.route);
    assert.equal(hash(normalizeSlot(p.content)), c.normalizedContentSha256, `${p.route}: lesson changed beyond empty-line whitespace`);
    assert.equal(hash(normalizeSlot(p.scripts)), c.normalizedScriptsSha256, `${p.route}: scripts changed beyond empty-line whitespace`);
    assert.deepEqual(links(p.content + p.scripts), c.links, p.route);
    const rendered = renderPage(p, layout);
    assert.deepEqual(ids(rendered), c.ids, p.route);
    const base = new URL(p.route, 'https://notes.test/');
    const stylesheets = [...rendered.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map(m => new URL(m[1], base).href);
    assert.deepEqual(stylesheets, c.stylesheets.map(href => new URL(href, base).href), `${p.route}: stylesheet order changed`);
    assert.equal(readFileSync(join(notesDir, p.route), 'utf8'), renderPage(p, layout, footerFrom(readFileSync(join(notesDir, p.route), 'utf8'))));
  }
  const book2 = pages.filter(p => p.route.startsWith('book2/'));
  assert.equal(book2.length, 11);
  assert.equal(book2.filter(p => p.type === 'chapter').length, 10);
  assert.equal(book2.filter(p => p.type === 'section').length, 0);
});

test('builder detects direct output edits and untemplated routes; write mode preserves deployment footer', () => {
  const output = mkdtempSync(join(tmpdir(), 'book-layout-test-'));
  try {
    const route = pages[0].route, dest = join(output, route);
    mkdirSync(join(output, route.split('/')[0]), { recursive: true });
    assert.deepEqual(checkBooks({ output, write: true }).errors, []);
    writeFileSync(dest, readFileSync(dest, 'utf8').replace('data-commit="local"', 'data-commit="abc123"')
      .replace('</footer>', ' <span class="deploy-commit-subject">A &amp; B</span></footer>') + '<!-- direct edit -->');
    assert.ok(checkBooks({ output }).errors.some(e => e.startsWith(route)));
    checkBooks({ output, write: true });
    assert.match(readFileSync(dest, 'utf8'), /data-commit="abc123"/);
    assert.match(readFileSync(dest, 'utf8'), /<span class="deploy-commit-subject">A &amp; B<\/span>/);
    assert.deepEqual(checkBooks({ output }).errors, []);
    writeFileSync(join(output, 'book1/untemplated.html'), '<main>Unmanaged</main>');
    assert.ok(checkBooks({ output }).errors.some(e => e.includes('no layout source')));
    mkdirSync(join(output, 'book10'));
    writeFileSync(join(output, 'book10/index.html'), '<main>Future book</main>');
    assert.ok(checkBooks({ output }).errors.some(e => e.startsWith('book10/index.html:')));
  } finally { rmSync(output, { recursive: true, force: true }); }
});

test('page sources cannot restore the header or add a navigation switch', () => {
  const source = mkdtempSync(join(tmpdir(), 'book-layout-source-'));
  try {
    const dest = join(source, 'pages/book1/index.html');
    mkdirSync(join(source, 'pages/book1'), { recursive: true });
    const original = readFileSync(join(layoutDir, 'pages/book1/index.html'), 'utf8');
    writeFileSync(dest, original.replace('<!-- slot:content -->', '<!-- slot:content -->\n<nav class="p2n-context-nav">Bad</nav>'));
    assert.throws(() => loadPages(source), /layout markup/);
    writeFileSync(dest, original.replace('<!-- slot:content -->', "<!-- slot:content -->\n<header class='p2n-top'>Bad</header>"));
    assert.throws(() => loadPages(source), /layout markup/);
    writeFileSync(dest, original.replace('"type":', '"secondaryNavigation": true, "type":'));
    assert.throws(() => loadPages(source), /unknown page metadata/);
    writeFileSync(dest, original.replace('"type": "overview"', '"type": "toString"'));
    assert.throws(() => loadPages(source), /invalid title or page type/);
    assert.match(renderPage({ ...pages[0], title: '<notes & answers>' }, layout), /<title>&lt;notes &amp; answers&gt;<\/title>/);
  } finally { rmSync(source, { recursive: true, force: true }); }
});

test('every generated page loads assets that resolve, and export pages load the shared checks script', () => {
  const sharedChecks = join(notesDir, 'js/checks.js');
  const assetRefs = html => [...html.matchAll(/<(?:link|script)\b[^>]*\b(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  const resolveRef = (route, ref) => resolve(notesDir, dirname(route), decodeURIComponent(ref.split('#')[0].split('?')[0]));
  let exports = 0;
  for (const p of pages) {
    const html = readFileSync(join(notesDir, p.route), 'utf8');
    for (const ref of assetRefs(html)) {
      const clean = ref.split('#')[0].split('?')[0];
      if (!clean || /^[a-z][a-z0-9+.-]*:/i.test(clean) || clean.startsWith('//') || clean.split('/').includes('_local')) continue;
      assert.ok(existsSync(resolveRef(p.route, ref)), `${p.route}: ${ref} does not resolve`);
    }
    if (!/data-notes-export/.test(p.content)) continue;
    exports += 1;
    assert.ok(assetRefs(p.scripts).some(ref => resolveRef(p.route, ref) === sharedChecks), `${p.route}: export button is not wired to the shared checks script`);
  }
  assert.ok(exports > 0);
});
