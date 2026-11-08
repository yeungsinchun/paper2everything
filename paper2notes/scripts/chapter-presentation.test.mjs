import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPages, validateChapterPresentation } from './build-books.mjs';

const pages = loadPages();
const electives = pages.filter(p => /^book[6-9]\//.test(p.route));
const maps = electives.filter(p => p.type === 'map');

test('all 14 elective maps follow the core chapter map structure and stylesheet', () => {
  assert.equal(maps.length, 14);
  for (const p of maps) {
    assert.doesNotThrow(() => validateChapterPresentation(p), p.route);
    assert.match(p.head, /href="\.\.\/\.\.\/css\/notes\.css"/, p.route);
    assert.doesNotMatch(p.content, /chapter-cards|quick-digest|section-dse|class="next"|class="tip"/, p.route);
    assert.deepEqual([...p.content.matchAll(/<h[1-6]\b/g)].map(m => m[0]), ['<h1'], p.route);
    assert.match(p.content, /<strong>Summary<\/strong>/, p.route);
    const cards = [...p.content.matchAll(/<a href="([^"]+)">\s*<span class="num">([^<]+)<\/span>\s*<strong>([^<]+)<\/strong>/g)];
    assert.equal(cards.filter(([, href]) => href === 'summary.html').length, 1, p.route);
    for (const [, href, number, title] of cards) {
      if (href === 'summary.html') continue;
      assert.equal(number, href.replace('.html', '').replace('-', '.'), p.route);
      assert.notEqual(title, 'Summary', p.route);
    }
  }
});

test('shared source validation rejects returning elective-only presentation', () => {
  const page = maps[0];
  for (const block of [
    '<section><h2>Practice coverage</h2><p>No questions.</p></section>',
    '<aside><h2>Exam practice</h2><p>Practice follows.</p></aside>',
    '<aside><h2>DSE coverage</h2><p>No questions.</p></aside>',
    '<aside class="quick-digest"><h2>Chapter route</h2></aside>',
    '<aside class="tip"><span>Practice</span><p>No deck.</p></aside>',
    '<nav class="next"><a href="1-1.html">Next</a></nav>',
  ]) {
    assert.throws(() => validateChapterPresentation({ ...page, content: page.content + block }), /practice status block|bespoke sections/);
  }
  assert.throws(() => validateChapterPresentation({ ...page, content: page.content.replace('class="toc"', 'class="chapter-cards"') }), /toc cards/);
});

test('real shared quiz sections and the lesson tool row remain valid and unchanged', () => {
  const section = electives.find(p => p.type === 'section');
  const decks = '<section class="section-dse lo-quiz" data-quiz="mc"><h2>Multiple Choice</h2></section>' +
    '<section class="section-dse lo-quiz" data-quiz="lq"><h2>Long questions</h2></section>';
  assert.doesNotThrow(() => validateChapterPresentation({ ...section, content: section.content + decks }));
  for (const p of electives.filter(p => p.type === 'section')) {
    assert.match(p.content, /class="page-tools"/, p.route);
    assert.match(p.content, /data-notes-export>Export notes as PDF<\/button>/, p.route);
  }
});

test('the same source validation accepts every core chapter map', () => {
  const core = pages.filter(p => /^book[1-5]\//.test(p.route) && p.type === 'map');
  assert.equal(core.length, 22);
  for (const p of core) assert.doesNotThrow(() => validateChapterPresentation(p), p.route);
});
