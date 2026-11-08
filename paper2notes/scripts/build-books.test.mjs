import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { project, layoutDir, notesDir, loadPages, loadLayout, renderPage, publishedRoutes, checkBooks, footerFrom, normalizeSlot, generatedNotice, componentNames, sourceMarker } from './build-books.mjs';

function withLayoutCopy(run) {
  const source = mkdtempSync(join(tmpdir(), 'book-layout-source-'));
  try {
    cpSync(layoutDir, source, { recursive: true });
    return run(source);
  } finally { rmSync(source, { recursive: true, force: true }); }
}

const pages = loadPages(), layout = loadLayout();
const contract = JSON.parse(readFileSync(join(layoutDir, 'migration-contract.json'), 'utf8'));
const hash = s => createHash('sha256').update(s).digest('hex');
const ids = s => [...s.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const links = s => [...s.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(m => m[1]);
const displayedSection = html => {
  const kicker = html.match(/<p class="kicker">([\s\S]*?)<\/p>/)[1].replace(/<[^>]+>/g, ' ');
  return /Section\s+(\d+\.\d+)/.exec(kicker)[1];
};

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
    const brandPath = join(source, 'components/brand.html');
    const changed = readFileSync(brandPath, 'utf8').replace('paper<i>2</i>notes', 'paper<i>2</i>notes<span data-layout-edit-proof="edit-once"></span>');
    assert.notEqual(changed, readFileSync(brandPath, 'utf8'));
    writeFileSync(brandPath, changed);
    assert.equal(checkBooks({ source, output }).errors.length, pages.length);
    assert.deepEqual(checkBooks({ source, output, write: true }).errors, []);
    assert.deepEqual(checkBooks({ source, output }).errors, []);
    for (const p of pages) {
      assert.match(readFileSync(join(output, p.route), 'utf8'), /data-layout-edit-proof="edit-once"/);
      assert.equal(readFileSync(join(source, 'pages', p.route), 'utf8'), readFileSync(join(layoutDir, 'pages', p.route), 'utf8'));
    }
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('all routes use one primary navigation and no secondary header chapter row', () => {
  const routes = new Set(['index.html', 'qb/index.html', ...publishedRoutes()]);
  for (const p of pages) {
    const html = renderPage(p, layout);
    const header = html.match(/<header class="p2n-top"[\s\S]*?<\/header>/)[0];
    assert.equal((header.match(/<nav\b/g) ?? []).length, 1, p.route);
    assert.doesNotMatch(html, /p2n-context-nav/, p.route);
    assert.equal((header.match(/aria-current="page"/g) ?? []).length, 1, p.route);
    assert.match(header, /<(?:strong|summary) aria-current="page">[^<]+<\/(?:strong|summary)>/, p.route);
    assert.doesNotMatch(header, /<a[^>]*aria-current="page"/, p.route);
    assert.match(header, /aria-label="Site navigation"/);
    assert.match(header, /aria-hidden="true"/);
    assert.equal((html.match(/<main\b/g) ?? []).length, 1);
    assert.equal((html.match(/deploy-commit-footer/g) ?? []).length, 1);
    const root = new URL(p.route, 'https://notes.test/');
    for (const [, href] of header.matchAll(/href="([^"]+)"/g)) {
      const dest = new URL(href, root).pathname.slice(1);
      assert.ok(routes.has(dest), `${p.route}: unknown ancestor ${dest}`);
      assert.equal(dest.endsWith('qb/index.html'), false, `${p.route}: question bank stayed in the top bar`);
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

test('Book 6 and Book 9 lesson pages rebuild with their own design sheets', () => {
  const temp = mkdtempSync(join(tmpdir(), 'book-layout-sheets-'));
  const output = join(temp, 'notes');
  try {
    mkdirSync(output);
    assert.deepEqual(checkBooks({ output, write: true }).errors, []);
    for (const p of pages.filter(p => /^book[69]\//.test(p.route) && !['overview', 'map'].includes(p.type))) {
      const book = p.route.split('/')[0];
      const html = readFileSync(join(output, p.route), 'utf8');
      const sheets = [...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map(([, href]) => href)
        .filter(href => !/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith('//'))
        .map(href => resolve(notesDir, dirname(p.route), href));
      assert.ok(sheets.includes(join(notesDir, book, 'css/notes.css')), `${p.route}: book notes sheet missing`);
      assert.ok(sheets.includes(join(notesDir, book, 'css/p2n.css')), `${p.route}: book design sheet missing`);
      for (const sheet of sheets) assert.ok(existsSync(sheet), `${p.route}: ${sheet} does not exist`);
    }
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('generated trails expose real ancestors and every book index, never sibling sections', () => {
  const bookRoutes = Object.keys(layout.books).map(b => `${b}/index.html`).sort();
  for (const p of pages) {
    const html = renderPage(p, layout);
    const trail = html.match(/<ol class="p2n-breadcrumb"[^>]*>([\s\S]*?)<\/ol>/)[1];
    const base = new URL(p.route, 'https://notes.test/');
    const toRoute = href => new URL(href, base).pathname.slice(1);
    const [book, chapter] = p.route.split('/');
    const expected = ['index.html'];
    if (p.type === 'section' || p.type === 'summary') expected.push(`${book}/${chapter}/index.html`);
    const ancestors = [...trail.replace(/<details[\s\S]*?<\/details>/g, '').matchAll(/href="([^"]+)"/g)].map(m => toRoute(m[1]));
    assert.deepEqual(ancestors.sort(), expected.sort(), p.route);

    const menu = trail.match(/<details class="p2n-nav-menu p2n-book-menu">[\s\S]*?<\/details>/)[0];
    const currentBook = p.type === 'overview' ? ' aria-current="page"' : '';
    assert.match(menu, new RegExp(`<summary${currentBook}>Book ${book.slice(4)}</summary>`), p.route);
    assert.deepEqual([...menu.matchAll(/href="([^"]+)"/g)].map(m => toRoute(m[1])).sort(), bookRoutes, p.route);

    const collapsed = trail.match(/<details class="p2n-nav-menu p2n-crumb-menu">[\s\S]*?<\/details>/)?.[0];
    if (p.type === 'overview') assert.equal(collapsed, undefined, p.route);
    else {
      assert.ok(collapsed, `${p.route}: no ellipsis disclosure`);
      const leaves = p.type === 'section' || p.type === 'summary' ? [`${book}/${chapter}/index.html`] : [];
      assert.deepEqual([...collapsed.matchAll(/href="([^"]+)"/g)].map(m => toRoute(m[1])).sort(), [...bookRoutes, ...leaves].sort(), p.route);
    }

    const current = p.type === 'overview' ? null :
      p.type === 'summary' ? 'Summary' :
      p.type === 'section' ? displayedSection(html) :
      `Ch.${Number(chapter.match(/^ch(\d+)/)[1])}`;
    if (current) assert.ok(trail.includes(`<strong aria-current="page">${current}</strong>`), p.route);
  }
});

test('every section trail leaf repeats the number its kicker and chapter-map card display', () => {
  const byRoute = new Map(pages.map(p => [p.route, p]));
  for (const p of pages.filter(p => p.type === 'section')) {
    const html = renderPage(p, layout);
    const trail = html.match(/<ol class="p2n-breadcrumb"[^>]*>([\s\S]*?)<\/ol>/)[1];
    const leaf = trail.match(/<strong aria-current="page">([^<]+)<\/strong>/)[1];
    assert.equal(leaf, displayedSection(html), `${p.route}: trail leaf disagrees with its kicker`);
    const file = p.route.split('/').at(-1);
    const map = byRoute.get(`${p.route.split('/').slice(0, -1).join('/')}/index.html`);
    const cards = renderPage(map, layout).split(`<a href="${file}">`).slice(1)
      .map(rest => rest.match(/^\s*<span class="num">([^<]+)<\/span>/)?.[1]?.trim())
      .filter(Boolean);
    assert.ok(cards.length, `${p.route}: chapter map has no card for this section`);
    for (const card of cards) assert.equal(leaf, card, `${p.route}: trail leaf disagrees with the chapter-map card`);
  }
});

test('the compiler inserts the generated notice into emitted pages and rejects it in editable sources', () => {
  const output = mkdtempSync(join(tmpdir(), 'book-layout-notice-'));
  try {
    withLayoutCopy(source => {
      for (const file of [join(source, 'book.html'), ...componentNames.map(name => join(source, 'components', `${name}.html`))]) {
        assert.equal(readFileSync(file, 'utf8').includes('Generated by scripts/build-books.mjs'), false, file);
        assert.match(readFileSync(file, 'utf8'), /^<!-- source: /);
      }
      assert.deepEqual(checkBooks({ source, output, write: true }).errors, []);
      const emitted = readFileSync(join(output, 'book2/index.html'), 'utf8');
      assert.equal(emitted.startsWith(`<!DOCTYPE html>\n${generatedNotice}\n<html lang="en">\n`), true);
      assert.equal(emitted.split(generatedNotice).length, 2);
    });
    withLayoutCopy(source => {
      const brand = join(source, 'components/brand.html');
      writeFileSync(brand, `${generatedNotice}\n${readFileSync(brand, 'utf8')}`);
      assert.throws(() => checkBooks({ source, output: join(output, 'rejected'), write: true }), /generated-file notice/);
    });
    withLayoutCopy(source => {
      const page = join(source, 'pages/book2/index.html');
      writeFileSync(page, `${generatedNotice}\n${readFileSync(page, 'utf8')}`);
      assert.throws(() => checkBooks({ source, output: join(output, 'page-rejected'), write: true }), /generated-file notice/);
    });
  } finally { rmSync(output, { recursive: true, force: true }); }
});

test('arrangement and component edits change emitted pages without changing page sources', () => {
  const output = mkdtempSync(join(tmpdir(), 'book-layout-arrange-'));
  try {
    withLayoutCopy(source => {
      const book = join(source, 'book.html');
      writeFileSync(book, readFileSync(book, 'utf8').replace('{{component:main}}\n{{scripts}}\n{{component:footer}}', '{{component:main}}\n{{component:footer}}\n{{scripts}}'));
      assert.deepEqual(checkBooks({ source, output, write: true }).errors, []);
      const section = readFileSync(join(output, 'book5/ch01-radiation-and-radioactivity/25-1.html'), 'utf8');
      assert.ok(section.indexOf('</footer>') < section.indexOf('<script'), 'scripts follow the arranged footer');
      assert.equal(readFileSync(join(source, 'pages/book5/ch01-radiation-and-radioactivity/25-1.html'), 'utf8'), readFileSync(join(layoutDir, 'pages/book5/ch01-radiation-and-radioactivity/25-1.html'), 'utf8'));
    });
  } finally { rmSync(output, { recursive: true, force: true }); }
});

test('the compiler resolves placeholders into emitted overview, section, and trailing pages', () => {
  const output = mkdtempSync(join(tmpdir(), 'book-layout-values-'));
  try {
    assert.deepEqual(checkBooks({ output, write: true }).errors, []);
    const overview = readFileSync(join(output, 'book2/index.html'), 'utf8');
    const section = readFileSync(join(output, 'book5/ch01-radiation-and-radioactivity/25-1.html'), 'utf8');
    const trailing = readFileSync(join(output, 'book4/index.html'), 'utf8');
    assert.match(overview, /<title>Active Physics Book 2 · Force and Motion<\/title>/);
    assert.match(overview, /<header class="p2n-top" data-book="book2">/);
    assert.match(overview, /href="index.html" aria-label="Book 2 home"/);
    assert.match(overview, /data-ic="rocket"/);
    assert.match(overview, /<small>Book 2<\/small>/);
    assert.match(overview, /<summary aria-current="page">Book 2<\/summary>/);
    assert.match(overview, /<main class="p2n-page p2n-book-index">/);
    const main = overview.match(/<main class="p2n-page p2n-book-index">[\s\S]*?<\/main>/)[0];
    assert.match(main, /Force &amp; Motion/);
    assert.equal(main.includes('<header'), false);
    assert.match(overview, /<link rel="preconnect" href="https:\/\/fonts.googleapis.com">/);
    assert.equal(overview.includes('{{'), false);
    assert.match(section, /<title>25.1 Ionizing radiation<\/title>/);
    assert.match(section, /<main class="p2n-page-frame p2n-page-frame--section">/);
    assert.match(section, /href="\.\.\/index.html" aria-label="Book 5 home"/);
    assert.match(section, /data-ic="radiation"/);
    assert.match(section, /<a href="\.\.\/\.\.\/index.html">All books<\/a>/);
    assert.match(section, /<summary>Book 5<\/summary>/);
    assert.ok(section.indexOf('</main>') < section.indexOf('<script src="../../vendor/katex/katex.min.js">'));
    assert.ok(section.indexOf('<script src="../../vendor/katex/katex.min.js">') < section.indexOf('deploy-commit-footer'));
    assert.match(trailing, /<\/html>\n<!-- Book4 Round1 validated 2026-09-28T18:09:11Z -->\n$/);
    assert.match(trailing, /data-commit="local"/);
  } finally { rmSync(output, { recursive: true, force: true }); }
});

test('braces inside a lesson stay literal in emitted output', () => {
  const output = mkdtempSync(join(tmpdir(), 'book-layout-braces-'));
  try {
    withLayoutCopy(source => {
      const file = join(source, 'pages/book2/index.html');
      writeFileSync(file, readFileSync(file, 'utf8').replace('<!-- slot:content -->\n', '<!-- slot:content -->\n<p>{{title}} {{component:brand}} {{navigation}}</p>\n'));
      assert.deepEqual(checkBooks({ source, output, write: true }).errors, []);
      const html = readFileSync(join(output, 'book2/index.html'), 'utf8');
      assert.match(html, /<main class="p2n-page p2n-book-index">\n<p>\{\{title\}\} \{\{component:brand\}\} \{\{navigation\}\}<\/p>/);
      assert.match(html, /<title>Active Physics Book 2 · Force and Motion<\/title>/);
      assert.match(html, /<a class="p2n-top-brand p2n-book-brand"/);
    });
  } finally { rmSync(output, { recursive: true, force: true }); }
});

test('the compiler rejects broken component arrangement before writing pages', () => {
  withLayoutCopy(source => {
    const header = join(source, 'components/header.html');
    writeFileSync(header, readFileSync(header, 'utf8').replace('{{component:brand}}', '{{component:header}}'));
    assert.throws(() => loadLayout(source), /Component cycle: header -> header/);
  });
  withLayoutCopy(source => {
    const book = join(source, 'book.html');
    writeFileSync(book, readFileSync(book, 'utf8').replace('{{component:footer}}', '{{component:sidebar}}'));
    assert.throws(() => loadLayout(source), /Unknown component: sidebar/);
  });
  withLayoutCopy(source => {
    const book = join(source, 'book.html');
    writeFileSync(book, readFileSync(book, 'utf8').replace('{{component:footer}}', '{{component:Footer}}'));
    assert.throws(() => loadLayout(source), /Unresolved component placeholder/);
  });
  withLayoutCopy(source => {
    writeFileSync(join(source, 'components/sidebar.html'), `${sourceMarker('sidebar')}<aside></aside>\n`);
    assert.throws(() => loadLayout(source), /expected exactly/);
  });
  withLayoutCopy(source => {
    writeFileSync(join(source, 'components/footer.html'), '<footer></footer>\n');
    assert.throws(() => loadLayout(source), /identify itself as footer/);
  });
  withLayoutCopy(source => {
    const book = join(source, 'book.html');
    writeFileSync(book, readFileSync(book, 'utf8').replace('<!DOCTYPE html>\n', ''));
    assert.throws(() => loadLayout(source), /must start with <!DOCTYPE html>/);
  });
});
