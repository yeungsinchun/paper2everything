/* Run on the served /paper2notes/notes/qb/ page, with the repository root served.
   chrome-devtools-axi eval 'async () => (await import("/paper2notes/scripts/question-notes.browser.mjs")).run()'
   Uses real published records. Only negative tests replace fetch responses in this page.
   No test reference enters the authored store. */
export async function run() {
  const notes = await import('../notes/js/question-notes.mjs');
  const passed = [];
  function check(condition, message) { if (!condition) throw new Error(message); passed.push(message); }
  async function until(predicate) {
    for (let i = 0; i < 200; i++) {
      if (predicate()) return;
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    throw new Error('Timed out waiting for panel');
  }
  async function settled(panel) { await until(() => panel.dataset.state && panel.dataset.state !== 'loading'); }
  const root = new URL('../notes/', import.meta.url);
  const nativeFetch = window.fetch;
  const index = await (await nativeFetch(new URL('question-notes/passages.json', root))).json();
  const currentUrl = location.href;
  const testHost = document.createElement('article');
  document.querySelector('main').append(testHost);
  const referenceText = 'A 😀 sentence. Next sentence.';
  const html = '<title>T &amp; T</title><main><section id="a"><p>A&nbsp;😀 sentence.</p><span class="tag">ignore</span><p>Next sentence.</p><script>ignore</script><div hidden>ignore</div><div class="section-dse">ignore</div></section></main>';
  check(notes.extractPassage(new DOMParser().parseFromString(html, 'text/html'), 'a') === referenceText, 'Browser entity, block, hidden and Unicode extraction');
  check(await notes.sha256(referenceText) === '35822ba7db18831af932f292a90e5392f2e14529281f0b07d3239766a5fe7840', 'Browser hash matches producer fixture');
  for (const html of ['<main><p id="a">A.</p><p id="a">B.</p></main>', '<p id="a">Outside.</p>', '<main hidden><p id="a">Hidden.</p></main>', '<main><p id="b">Missing.</p></main>']) {
    let rejected = false;
    try { notes.extractPassage(new DOMParser().parseFromString(html, 'text/html'), 'a'); } catch { rejected = true; }
    check(rejected, 'Browser rejects invalid anchor');
  }
  try {
    check(document.querySelectorAll('.qb-card').length === document.querySelectorAll('.qb-card .question-notes-toggle').length, 'Every rendered QB and DSE card has one explanation button');
    notes.attachQuestionNotes(testHost, { corpus: 'dse', itemId: 'dse-mc-2018-31' });
    notes.attachQuestionNotes(testHost, { corpus: 'dse', itemId: 'dse-mc-2018-31' });
    check(testHost.querySelectorAll('.question-notes-toggle').length === 1, 'Attach is idempotent');
    const button = testHost.querySelector('.question-notes-toggle');
    const panel = testHost.querySelector('.question-notes');
    button.click();
    await settled(panel);
    check(panel.dataset.state === 'available', 'Real DSE mapping resolves');
    check(panel.querySelectorAll('.question-notes-passage').length === 2, 'Multiple real sections render');
    check(panel.querySelectorAll('mark').length === 2, 'Only reviewed sentence ranges highlight');
    check(button.getAttribute('aria-expanded') === 'true' && button.getAttribute('aria-controls') === panel.id && panel.getAttribute('role') === 'region', 'Accessible state and region relationship');
    for (const link of panel.querySelectorAll('a')) {
      const target = new URL(link.href);
      const doc = new DOMParser().parseFromString(await (await nativeFetch(target)).text(), 'text/html');
      check(doc.querySelectorAll(`[id="${target.hash.slice(1)}"]`).length === 1 && link.target === '_blank', 'Original notes link targets a real unique anchor');
    }
    panel.querySelector('.question-notes-close').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    check(panel.hidden && document.activeElement === button && button.getAttribute('aria-expanded') === 'false', 'Escape closes and returns focus');
    button.click(); await settled(panel); panel.querySelector('.question-notes-close').click();
    check(panel.hidden && document.activeElement === button, 'Close returns focus');

    // Negative index and source mutations exercise the real consumer on this served page.
    const original = structuredClone(index);
    const mapped = d => d.items.find(i => i.item_id === 'dse-mc-2018-31');
    const mutations = [
      ['missing', d => { d.items = []; }],
      ['stale', d => { mapped(d).passages.forEach(p => { p.text_sha256 = '0'.repeat(64); }); }],
      ['unsafe', d => { mapped(d).passages.forEach(p => { p.page = 'javascript:alert(1)'; }); }],
      ['unsafe', d => { mapped(d).passages.forEach(p => { p.highlights[0].end = 999999; }); }],
      ['unverified', d => { mapped(d).passages.forEach(p => { p.tier = 'inferred'; }); }],
      ['unavailable', d => { d.items.push(structuredClone(mapped(d))); }]
    ];
    for (const [expected, mutate] of mutations) {
      const data = structuredClone(original); mutate(data);
      window.fetch = (url, options) => String(url).endsWith('/question-notes/passages.json') ? Promise.resolve(new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })) : nativeFetch(url, options);
      button.click(); await settled(panel);
      check(panel.dataset.state === expected && !panel.querySelector('mark') && !panel.querySelector('.question-notes-text'), `Reject ${expected} mapping without excerpt`);
      button.click();
    }
    const mixed = structuredClone(original);
    mapped(mixed).passages[1].tier = 'inferred';
    window.fetch = (url, options) => String(url).endsWith('/question-notes/passages.json') ? Promise.resolve(new Response(JSON.stringify(mixed), { headers: { 'Content-Type': 'application/json' } })) : nativeFetch(url, options);
    button.click(); await settled(panel);
    check(panel.dataset.state === 'available' && panel.querySelectorAll('mark').length === 1 && panel.querySelectorAll('.question-notes-warning').length === 1, 'Mixed references show only valid passages alongside explicit warnings');
    button.click();
    for (const source of ['<main><p>No anchor.</p></main>', '<main><p id="fission-def-1">Changed.</p><p id="chain-def-1">Changed.</p></main>']) {
      window.fetch = (url, options) => String(url).endsWith('/27-1.html') ? Promise.resolve(new Response(source, { headers: { 'Content-Type': 'text/html' } })) : nativeFetch(url, options);
      button.click(); await settled(panel);
      check(!panel.querySelector('mark'), 'Current source cannot silently show missing or stale anchors');
      button.click();
    }
    // HTMLParser and browser repair malformed paragraphs differently. Never show saved text on disagreement.
    const malformed = structuredClone(original);
    mapped(malformed).passages.forEach(p => {
      p.text = 'First. Second. Tail.';
      p.highlights = [{ start: 0, end: 6, quote: 'First.' }];
    });
    const malformedHash = await notes.sha256('First. Second. Tail.');
    mapped(malformed).passages.forEach(p => { p.text_sha256 = malformedHash; });
    window.fetch = (url, options) => String(url).endsWith('/question-notes/passages.json')
      ? Promise.resolve(new Response(JSON.stringify(malformed), { headers: { 'Content-Type': 'application/json' } }))
      : String(url).endsWith('/27-1.html')
        ? Promise.resolve(new Response('<main><p id="fission-def-1">First.<div>Second.</div>Tail.</p><p id="chain-def-1">First.<div>Second.</div>Tail.</p></main>', { headers: { 'Content-Type': 'text/html' } }))
        : nativeFetch(url, options);
    button.click(); await settled(panel);
    check(panel.dataset.state === 'stale' && !panel.querySelector('mark'), 'Malformed source repair differences fail closed');
    button.click();

    const literal = 'A note says <img src=x onerror=window.__questionNotesInjected=1> is text.';
    const escaped = literal.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const literalData = structuredClone(original);
    const literalHash = await notes.sha256(literal);
    mapped(literalData).passages.forEach(p => {
      p.text = literal; p.text_sha256 = literalHash;
      p.highlights = [{ start: 0, end: literal.length, quote: literal }];
    });
    window.fetch = (url, options) => String(url).endsWith('/question-notes/passages.json')
      ? Promise.resolve(new Response(JSON.stringify(literalData), { headers: { 'Content-Type': 'application/json' } }))
      : String(url).endsWith('/27-1.html')
        ? Promise.resolve(new Response(`<main><p id="fission-def-1">${escaped}</p><p id="chain-def-1">${escaped}</p></main>`, { headers: { 'Content-Type': 'text/html' } }))
        : nativeFetch(url, options);
    button.click(); await settled(panel);
    check(panel.dataset.state === 'available' && panel.querySelector('mark').textContent === literal && !panel.querySelector('img') && !window.__questionNotesInjected, 'Excerpt renders as text, never injected HTML');
    button.click();
    for (const response of [() => Promise.reject(new TypeError('Network unavailable')), () => Promise.resolve(new Response('<html>wrong format</html>', { headers: { 'Content-Type': 'text/html' } }))]) {
      window.fetch = response;
      button.click(); await settled(panel);
      check(panel.dataset.state === 'unavailable' && !panel.querySelector('mark'), 'Unavailable service has explicit state');
      button.click();
    }
    let release;
    window.fetch = () => new Promise(resolve => { release = resolve; });
    button.click(); button.click();
    release(new Response(JSON.stringify(original), { headers: { 'Content-Type': 'application/json' } }));
    await new Promise(resolve => setTimeout(resolve, 50));
    check(panel.hidden && !panel.textContent, 'Late response cannot reopen a closed panel');
    window.fetch = nativeFetch;

    for (const [searchId, value, expectedMarks] of [['qb-search', 'PHY15033101', 1], ['dse-search', '2018 31', 2], ['dse-search', '2012-q11', 0]]) {
      const search = document.getElementById(searchId);
      search.value = value; search.dispatchEvent(new Event('input', { bubbles: true }));
      const grid = document.getElementById(searchId.replace('search', 'grid'));
      const button = grid.querySelector('.question-notes-toggle');
      button.click(); const panel = grid.querySelector('.question-notes'); await settled(panel);
      check(panel.dataset.state === (expectedMarks ? 'available' : 'missing') && panel.querySelectorAll('mark').length === expectedMarks, `Actual ${searchId} ${value} interface shows real notes or honest missing state`);
      const checkbox = grid.querySelector('input[type="checkbox"]'); checkbox.click();
      check(checkbox.checked && document.querySelector('#sel-count').textContent === '1 selected', 'Question selection remains operable');
      checkbox.click(); button.click();
    }
    check(location.href === currentUrl, 'Reader remains on the same question screen');
    return { passed: passed.length, checks: passed };
  } finally {
    window.fetch = nativeFetch;
    testHost.remove();
  }
}
