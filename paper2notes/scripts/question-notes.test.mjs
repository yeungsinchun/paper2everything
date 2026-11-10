import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalId, normalizeText, safeReference, validateRanges, findRecord } from '../notes/js/question-notes.mjs';

test('canonical identities retain corpus and normalize chapter LQ forms', () => {
  assert.equal(canonicalId('qb', 'PHY15033101'), 'PHY15033101');
  for (const id of ['dse-lq-2012-11', 'dse-lq-2012-q11']) assert.equal(canonicalId('dse', id), 'dse-lq-2012-q11');
  assert.equal(canonicalId('dse', '2018-31', 'mc'), 'dse-mc-2018-31');
  assert.equal(canonicalId('dse', '2012-q11', 'lq'), 'dse-lq-2012-q11');
  assert.equal(canonicalId('dse', 'dse-mc-sap-34'), 'dse-mc-sap-34');
  for (const id of ['sample', 'dse-lq-20-sample', null, '../x']) assert.equal(canonicalId('dse', id), null);
  assert.equal(canonicalId('qb', 'dse-mc-2018-31'), null);
  assert.equal(canonicalId('qb', 'PHY1\n'), null);
});

test('ECMAScript whitespace and UTF-16 sentence ranges', () => {
  assert.equal(normalizeText(' \ufeffA\u00a0 \n sentence.\t'), 'A sentence.');
  const text = 'First 😀 sentence. Second sentence.';
  const first = { start: 0, end: 18, quote: 'First 😀 sentence.' };
  assert.equal(validateRanges(text, [first, { start: 19, end: text.length, quote: 'Second sentence.' }]), true);
  for (const ranges of [[], [first, first], [{ ...first, start: -1 }], [{ ...first, start: 1 }],
    [{ ...first, quote: 'Different.' }], [{ ...first, end: 7 }], [{ ...first, end: 999 }], [{ ...first, start: true }]]) {
    assert.equal(validateRanges(text, ranges), false);
  }
});

test('unsafe source paths, protocols, anchors and absent provenance fail closed', () => {
  const reference = { page: 'book5/ch03-nuclear-energy/27-1.html', anchor: 'fission-def-1', text_sha256: 'a'.repeat(64), source: 'test fixture' };
  assert.equal(safeReference(reference), true);
  for (const page of ['../private.html', '/book5/test.html', 'https://evil.test/a.html', 'javascript:alert(1)', 'book5/%2e%2e/a.html', 'book5/a.html?x', 'book5/a.html\n']) {
    assert.equal(safeReference({ ...reference, page }), false);
  }
  assert.equal(safeReference({ ...reference, anchor: 'x" onclick="x' }), false);
  assert.equal(safeReference({ ...reference, source: '' }), false);
  assert.equal(safeReference({ ...reference, text_sha256: 'wrong' }), false);
});

test('index resolves exactly one matching corpus identity and rejects conflicts', () => {
  const item = { corpus: 'qb', item_id: 'PHY1', passages: [{}] };
  const data = { schema: 'paper2notes.question-notes.v1', items: [item] };
  assert.equal(findRecord(data, 'qb', 'PHY1'), item);
  assert.equal(findRecord(data, 'dse', 'PHY1'), null);
  assert.equal(findRecord(data, 'qb', 'PHY2'), null);
  assert.throws(() => findRecord({ ...data, items: [item, item] }, 'qb', 'PHY1'));
  assert.throws(() => findRecord({ ...data, schema: 'unknown' }, 'qb', 'PHY1'));
  assert.throws(() => findRecord({ ...data, items: [{ ...item, passages: [] }] }, 'qb', 'PHY1'));
});
