import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { project, notesDir, loadPages, loadLayout, buildNavigationManifest, publishedRoutes } from './build-books.mjs';

const require = createRequire(import.meta.url);
const picker = require('../notes/js/path-picker.js');

const pages = loadPages();
const layout = loadLayout();
const manifest = buildNavigationManifest(pages, layout.books);
const index = picker.buildIndex(manifest);
const published = publishedRoutes().sort();
const byId = new Map(manifest.map(n => [n.id, n]));
const ch1 = 'book5/ch01-radiation-and-radioactivity';

test('manifest covers exactly the real published inventory, never more', () => {
  const routes = manifest.filter(n => n.id !== 'root').map(n => n.route).sort();
  assert.deepEqual(routes, published);
  assert.deepEqual(manifest[0], { id: 'root', kind: 'library', label: 'All books', title: 'All books', route: 'index.html', parent: null });
  assert.deepEqual(new Set(manifest.map(n => n.id)).size, manifest.length, 'ids are unique');
  assert.deepEqual(new Set(manifest.map(n => n.route)).size, manifest.length, 'routes are unique');
});

test('every node reports a parent that exists, and only real kinds are used', () => {
  const kinds = new Set(['library', 'book', 'chapter', 'section', 'summary']);
  for (const n of manifest) {
    assert.ok(kinds.has(n.kind), `${n.id}: unknown kind ${n.kind}`);
    if (n.id === 'root') assert.equal(n.parent, null);
    else assert.ok(byId.has(n.parent), `${n.id}: missing parent ${n.parent}`);
    assert.ok(n.label && n.title, `${n.id}: missing label or title`);
  }
});

test('hierarchy matches routes: book -> chapter -> section/summary', () => {
  for (const n of manifest) {
    if (n.kind === 'book') {
      assert.equal(n.parent, 'root', n.id);
      assert.equal(n.route, `${n.id}/index.html`, n.id);
    } else if (n.kind === 'chapter') {
      assert.equal(n.parent, n.id.split('/')[0], n.id);
      assert.equal(n.route, `${n.id}/index.html`, n.id);
    } else if (n.kind === 'section' || n.kind === 'summary') {
      assert.equal(n.parent, n.id.split('/').slice(0, 2).join('/'), n.id);
      assert.equal(n.route, `${n.id}.html`, n.id);
    }
  }
});

test('book and chapter titles are stripped of their route prefixes', () => {
  const book5 = byId.get('book5');
  assert.equal(book5.label, 'Book 5');
  assert.equal(book5.title, 'Radioactivity and Nuclear Energy');
  const chapter = byId.get(ch1);
  assert.equal(chapter.label, 'Ch.1');
  assert.equal(chapter.title, 'Radiation and Radioactivity');
  const complete = byId.get('book2/ch06-work-energy-power');
  assert.equal(complete.label, 'Ch.6');
  assert.equal(complete.title, 'Work, energy and power');
  const section = byId.get(`${ch1}/25-3`);
  assert.equal(section.label, '1.3');
  assert.equal(section.title, 'Properties and detection of nuclear radiation');
});

test('Book 2 complete chapters are leaves; other chapters have child pages', () => {
  for (const n of manifest.filter(n => n.kind === 'chapter' && n.id.startsWith('book2/'))) {
    assert.equal(index.childrenOf(n.id).length, 0, n.id);
  }
  for (const n of manifest.filter(n => n.kind === 'chapter' && !n.id.startsWith('book2/'))) {
    assert.ok(index.childrenOf(n.id).length > 0, `${n.id}: expected child pages`);
  }
});

test('computeInitialScope starts inside the current chapter', () => {
  assert.equal(picker.computeInitialScope(`${ch1}/25-3.html`, index), ch1);
  assert.equal(picker.computeInitialScope(`${ch1}/summary.html`, index), ch1);
  assert.equal(picker.computeInitialScope(`${ch1}/index.html`, index), ch1);
  assert.equal(picker.computeInitialScope('book5/index.html', index), 'book5');
  assert.equal(picker.computeInitialScope('not-a-route', index), 'root');
});

test('empty query lists the scope plus its direct children, never the root', () => {
  assert.deepEqual(picker.resultsFor(ch1, '', index).map(n => n.id), [
    ch1,
    `${ch1}/25-1`,
    `${ch1}/25-2`,
    `${ch1}/25-3`,
    `${ch1}/summary`,
  ]);
  assert.deepEqual(picker.resultsFor('book5', '', index).map(n => n.id), [
    'book5',
    'book5/ch01-radiation-and-radioactivity',
    'book5/ch02-rate-of-decay-and-uses-of-radionuclides',
    'book5/ch03-nuclear-energy',
  ]);
  assert.deepEqual(picker.resultsFor('root', '', index).map(n => n.id), ['book1', 'book2', 'book3', 'book4', 'book5', 'book6', 'book7', 'book8', 'book9']);
});

test('filtering searches label, title, ancestor trail, and route within scope only', () => {
  // Title substring.
  assert.deepEqual(picker.resultsFor(ch1, 'radiation', index).map(n => n.id), [
    ch1, `${ch1}/25-1`, `${ch1}/25-2`, `${ch1}/25-3`, `${ch1}/summary`,
  ]);
  assert.deepEqual(picker.resultsFor(ch1, 'ionizing', index).map(n => n.id), [`${ch1}/25-1`]);
  // Filename (route) substring.
  assert.deepEqual(picker.resultsFor(ch1, '25-2', index).map(n => n.id), [`${ch1}/25-2`]);
  // A route outside the selected scope is hidden.
  assert.deepEqual(picker.resultsFor(ch1, '26-2', index), []);
  // Ancestor trail substring: "Book 5" appears in every descendant's trail.
  assert.deepEqual(picker.resultsFor(ch1, 'book 5', index).map(n => n.id).sort(), picker.resultsFor(ch1, '', index).map(n => n.id).sort());
  // Multi-word AND.
  assert.deepEqual(picker.resultsFor('root', 'nuclear energy', index).map(n => n.id), [
    'book5',
    'book5/ch03-nuclear-energy',
    'book5/ch03-nuclear-energy/27-1',
    'book5/ch03-nuclear-energy/27-2',
    'book5/ch03-nuclear-energy/summary',
  ]);
});

test('no matches produce an empty list, ready for scope widening', () => {
  assert.deepEqual(picker.resultsFor(ch1, 'no-such-page-xyz', index), []);
  assert.deepEqual(picker.resultsFor('root', 'no-such-page-xyz', index), []);
  // Widening to root reveals a match that the chapter scope hid.
  assert.deepEqual(picker.resultsFor(ch1, '26-2', index), []);
  assert.deepEqual(picker.resultsFor('root', '26-2', index).map(n => n.id), ['book5/ch02-rate-of-decay-and-uses-of-radionuclides/26-2']);
});

test('relativeHref resolves to real files on disk from any page', () => {
  const from = `${ch1}/25-3.html`;
  assert.equal(picker.relativeHref(from, 'index.html'), '../../index.html');
  assert.equal(picker.relativeHref(from, 'book1/index.html'), '../../book1/index.html');
  assert.equal(picker.relativeHref(from, 'book5/index.html'), '../index.html');
  assert.equal(picker.relativeHref(from, `${ch1}/index.html`), 'index.html');
  assert.equal(picker.relativeHref(from, `${ch1}/25-1.html`), '25-1.html');
  assert.equal(picker.relativeHref(from, 'book5/ch02-rate-of-decay-and-uses-of-radionuclides/26-2.html'), '../ch02-rate-of-decay-and-uses-of-radionuclides/26-2.html');
  for (const n of manifest) {
    const dest = resolve(notesDir, dirname(from), picker.relativeHref(from, n.route));
    assert.ok(existsSync(dest), `${n.route}: ${dest} should exist`);
  }
});

test('keyboard highlight moves wrap for arrows and exit at boundaries for Tab', () => {
  const count = 5;
  assert.deepEqual(picker.moveHighlight(0, count, -1, true), { active: 4 });
  assert.deepEqual(picker.moveHighlight(4, count, 1, true), { active: 0 });
  assert.deepEqual(picker.moveHighlight(2, count, 1, true), { active: 3 });
  assert.deepEqual(picker.moveHighlight(4, count, 1, false), { exit: 'forward' });
  assert.deepEqual(picker.moveHighlight(0, count, -1, false), { exit: 'backward' });
  assert.deepEqual(picker.moveHighlight(1, count, -1, false), { active: 0 });
  assert.deepEqual(picker.moveHighlight(0, 0, 1, true), { exit: 'forward' });
  assert.deepEqual(picker.moveHighlight(0, 0, -1, true), { exit: 'backward' });
});

test('long names and deep paths stay intact for display and search', () => {
  const long = byId.get('book5/ch02-rate-of-decay-and-uses-of-radionuclides/26-2');
  assert.equal(long.title, 'Uses of radionuclides');
  assert.deepEqual(index.trailOf(long.id), ['Book 5', 'Ch.2']);
  assert.ok(index.searchText(long).includes('book5'));
  assert.ok(index.searchText(long).includes('rate-of-decay'));
  assert.ok(picker.matchesQuery(long, 'uses radionuclides', index));
  assert.ok(picker.matchesQuery(byId.get(`${ch1}/25-3`), 'properties detection nuclear', index));
});

test('selection resolves to a real route: every result has a navigable destination', () => {
  for (const scope of ['root', 'book5', ch1]) {
    for (const q of ['', 'radiation', 'no-match-xyz']) {
      for (const n of picker.resultsFor(scope, q, index)) {
        assert.ok(n.route.endsWith('.html'), n.id);
        assert.ok(n.route === 'index.html' || existsSync(join(notesDir, n.route)), `${n.route} should exist`);
      }
    }
  }
});

test('the picker module loads as CommonJS for node tests and exposes the API', () => {
  assert.equal(typeof picker.buildIndex, 'function');
  assert.equal(typeof picker.resultsFor, 'function');
  assert.equal(typeof picker.relativeHref, 'function');
  assert.equal(typeof picker.moveHighlight, 'function');
  assert.equal(typeof picker.initPathPicker, 'function');
  assert.equal(project.endsWith('paper2notes'), true);
});
