"""Behavioral tests for the shared canonical teaching-reference producer."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("passages", Path(__file__).with_name("publish-notes-passages.py"))
p = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(p)
HTML = '<title>Test &amp; notes</title><main><section id="one"><p>First 😀 sentence.</p><p>Second sentence.</p></section></main>'
TEXT = 'First 😀 sentence. Second sentence.'


def store():
    return {'schema': 'paper2db.notes-pointer.v1', 'items': [{
        'corpus': 'qb', 'item_id': 'PHY123', 'passages': [{
            'page': 'book5/test.html', 'anchor': 'one', 'text_sha256': p.text_hash(TEXT),
            'source': 'Test fixture, not a reviewed question', 'tier': 'verified',
            'highlights': [{'start': 0, 'end': 18, 'quote': 'First 😀 sentence.'}]
        }]
    }]}


class ProducerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'book5').mkdir()
        self.page = self.root / 'book5/test.html'
        self.page.write_text(HTML)

    def result(self, data=None):
        return p.publish(data or store(), self.root)['items'][0]['passages'][0]

    def test_extract_entities_blocks_and_utf16(self):
        self.assertEqual(p.extract(HTML, 'one'), (TEXT, 'Test & notes'))
        self.assertEqual(p.utf16_slice(TEXT, 0, 18), 'First 😀 sentence.')
        p.check_ranges(TEXT, store()['items'][0]['passages'][0]['highlights'])

    def test_browser_parity_fixture(self):
        html = '<title>T &amp; T</title><main><section id="a"><p>A&nbsp;😀 sentence.</p><span class="tag">ignore</span><p>Next sentence.</p><script>ignore</script><div hidden>ignore</div><div class="section-dse">ignore</div></section></main>'
        text, title = p.extract(html, 'a')
        self.assertEqual(text, 'A 😀 sentence. Next sentence.')
        self.assertEqual(title, 'T & T')
        self.assertEqual(p.text_hash(text), '35822ba7db18831af932f292a90e5392f2e14529281f0b07d3239766a5fe7840')

    def test_excludes_non_teaching_content(self):
        html = '''<main><section id="a"><p>A&nbsp;sentence.</p><script>bad</script>
        <div hidden>bad</div><div aria-hidden="true">bad</div><span class="tag">bad</span>
        <div class="section-dse">bad</div><button>bad</button><svg>bad</svg>
        <div data-quiz>bad</div><nav>bad</nav><template>bad</template><p>B\ufeffsentence.</p></section></main>'''
        self.assertEqual(p.extract(html, 'a')[0], 'A sentence. B sentence.')

    def test_anchor_must_be_unique_visible_and_in_main(self):
        for html in ['<main><p>Missing.</p></main>', '<main><p id="a">A.</p><p id="a">B.</p></main>',
                     '<p id="a">Outside.</p>', '<main hidden><p id="a">Hidden.</p></main>',
                     '<main><div class="quiz-slide"><p id="a">Question.</p></div></main>']:
            with self.subTest(html=html), self.assertRaises(ValueError):
                p.extract(html, 'a')

    def test_malformed_paragraph_repair_fixture(self):
        # Browser test proves the repaired DOM differs and therefore rejects this saved passage.
        text, _ = p.extract('<main><p id="a">First.<div>Second.</div>Tail.</p></main>', 'a')
        self.assertEqual(text, 'First. Second. Tail.')

    def test_empty_and_large_passages_rejected(self):
        for text in ['', '😀' * 6001]:
            with self.assertRaises(ValueError):
                p.extract(f'<main><p id="a">{text}</p></main>', 'a')

    def test_exact_verified_output_and_multiple_passages(self):
        data = store()
        data['items'][0]['passages'] *= 2
        out = p.publish(data, self.root)
        self.assertEqual(out['schema'], 'paper2notes.question-notes.v1')
        self.assertEqual(len(out['items'][0]['passages']), 2)
        for row in out['items'][0]['passages']:
            self.assertEqual(row['status'], 'available')
            self.assertEqual(row['text'], TEXT)
            self.assertEqual(row['title'], 'Test & notes')

    def test_rejection_statuses_never_publish_quotes(self):
        for changes, status in [({'page': 'book5/missing.html'}, 'missing'),
                                ({'page': '../secrets.html'}, 'unsafe'),
                                ({'anchor': 'absent'}, 'unsafe'),
                                ({'text_sha256': '0' * 64}, 'stale'),
                                ({'tier': 'derived'}, 'unverified'),
                                ({'tier': 'inferred'}, 'unverified')]:
            data = store()
            data['items'][0]['passages'][0].update(changes)
            row = self.result(data)
            self.assertEqual(row['status'], status)
            self.assertNotIn('text', row)
            self.assertNotIn('highlights', row)
            self.assertIn('source', row)

    def test_symlink_escape_rejected(self):
        with tempfile.TemporaryDirectory() as outside:
            target = Path(outside) / 'secret.html'
            target.write_text(HTML)
            self.page.unlink()
            self.page.symlink_to(target)
            self.assertEqual(self.result()['status'], 'unsafe')

    def test_stale_changed_html(self):
        self.page.write_text(HTML.replace('First', 'Changed'))
        self.assertEqual(self.result()['status'], 'stale')

    def test_malformed_ranges(self):
        cases = [[], [{'start': 0, 'end': 8, 'quote': 'First 😀'}],
                 [{'start': 1, 'end': 18, 'quote': 'irst 😀 sentence.'}],
                 [{'start': 0, 'end': 18, 'quote': 'Wrong.'}],
                 [{'start': True, 'end': 18, 'quote': 'First 😀 sentence.'}],
                 [{'start': 0, 'end': 999, 'quote': TEXT}],
                 [{'start': 0, 'end': 7, 'quote': 'First'}]]
        for ranges in cases:
            with self.subTest(ranges=ranges), self.assertRaises(ValueError):
                p.check_ranges(TEXT, ranges)
        hs = store()['items'][0]['passages'][0]['highlights']
        with self.assertRaises(ValueError):
            p.check_ranges(TEXT, hs + hs)

    def test_duplicate_and_malformed_store_are_errors(self):
        for mutate in [lambda d: d['items'].append(copy.deepcopy(d['items'][0])),
                       lambda d: d.update(schema='unknown'),
                       lambda d: d['items'][0].update(item_id='2018-31'),
                       lambda d: d['items'][0].update(extra=True),
                       lambda d: d['items'][0]['passages'][0].update(highlights=[]),
                       lambda d: d['items'][0].update(passages=[]),
                       lambda d: d['items'][0]['passages'][0].update(tier='made-up')]:
            data = store()
            mutate(data)
            with self.assertRaises(ValueError):
                p.publish(data, self.root)

    def test_empty_store_is_valid_missing_coverage(self):
        self.assertEqual(p.publish({'schema': 'paper2db.notes-pointer.v1', 'items': []}, self.root)['items'], [])

    def test_cli_and_missing_input(self):
        authored = self.root / 'store.json'
        authored.write_text(json.dumps(store()))
        out = self.root / 'generated/passages.json'
        cmd = [sys.executable, str(Path(p.__file__)), '--store', str(authored), '--notes-root', str(self.root), '--out', str(out)]
        result = subprocess.run(cmd, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(out.read_text())['items'][0]['passages'][0]['text'], TEXT)
        authored.unlink()
        result = subprocess.run(cmd, text=True, capture_output=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn('notes-passages:', result.stderr)

    def test_reviewed_references_resolve_against_real_notes(self):
        root = Path(__file__).resolve().parents[2]
        data = json.loads((root / 'paper2db/metadata/pointers/notes.json').read_text())
        rows = p.publish(data, root / 'paper2notes/notes')['items']
        self.assertTrue({'PHY15033101', 'dse-mc-2018-31'} <= {r['item_id'] for r in rows})
        self.assertTrue(all(passage['status'] == 'available' for row in rows for passage in row['passages']))


if __name__ == '__main__':
    unittest.main()
