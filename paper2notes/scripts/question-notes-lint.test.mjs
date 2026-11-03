import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { lintAnchors } from './anchor-lint.mjs';

test('existing anchor validator consumes teaching references through the shared producer', () => {
  const root = mkdtempSync(join(tmpdir(), 'question-notes-lint-'));
  try {
    const repoRoot = join(root, 'paper2notes');
    const notesRoot = join(repoRoot, 'notes');
    const pointers = join(root, 'paper2db/metadata/pointers');
    mkdirSync(join(notesRoot, 'book5'), { recursive: true });
    mkdirSync(pointers, { recursive: true });
    writeFileSync(join(notesRoot, 'book5/test.html'), '<main><p id="concept">A sentence.</p></main>');
    const doc = { schema: 'paper2db.notes-pointer.v1', items: [{ corpus: 'qb', item_id: 'PHY1', passages: [{
      page: 'book5/test.html', anchor: 'concept', source: 'Test fixture', tier: 'verified',
      text_sha256: createHash('sha256').update('A sentence.').digest('hex'),
      highlights: [{ start: 0, end: 11, quote: 'A sentence.' }]
    }] }] };
    const save = () => writeFileSync(join(pointers, 'notes.json'), JSON.stringify(doc));
    save();
    assert.deepEqual(lintAnchors({ repoRoot }).errors, []);
    assert.equal(existsSync(join(notesRoot, 'question-notes/passages.json')), false, 'lint never publishes data');
    doc.items[0].passages[0].text_sha256 = '0'.repeat(64); save();
    assert.match(lintAnchors({ repoRoot }).errors.join('\n'), /notes\.json:.*stale/);
    doc.schema = 'unknown'; save();
    assert.match(lintAnchors({ repoRoot }).errors.join('\n'), /invalid notes-reference schema/);
    writeFileSync(join(pointers, 'qb.json'), JSON.stringify({ schema: 'unknown', corpus: 'qb', pointers: [] }));
    assert.match(lintAnchors({ repoRoot }).errors.join('\n'), /answer-pointer\.v1/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
