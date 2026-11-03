/* Execute on the served 27-1.html chapter page through chrome-devtools-axi. */
export async function run() {
  const passed = [];
  const check = (condition, name) => { if (!condition) throw new Error(name); passed.push(name); };
  const slide = document.getElementById('dse-mc-2018-31');
  const deck = slide.closest('[data-quiz]');
  for (let i = 0; i < 30 && slide.hidden; i++) deck.querySelector('[data-quiz-next]').click();
  check(!slide.hidden, 'Existing deck navigation selects the real DSE question');
  check(document.querySelectorAll('.quiz-slide').length === document.querySelectorAll('.quiz-slide .question-notes-toggle').length, 'Every chapter DSE slide has a button');
  const button = slide.querySelector('.question-notes-toggle');
  button.click();
  const panel = slide.querySelector('.question-notes');
  for (let i = 0; i < 200 && panel.dataset.state === 'loading'; i++) await new Promise(r => setTimeout(r, 25));
  check(panel.dataset.state === 'available' && panel.querySelectorAll('mark').length === 2, 'Real chapter panel shows two reviewed passages');
  slide.querySelector('[data-quiz-choice="D"]').click();
  check(slide.dataset.quizResult === 'right' && slide.querySelector('.quiz-pct').textContent.includes('Right.'), 'Explanation preserves answer grading');
  check([...slide.querySelectorAll('[data-quiz-choice]')].every(b => b.disabled), 'Existing answer lock still applies');
  check(!window.NotesQuiz.sectionPapersHtml().includes('Notes explanation'), 'Question export excludes the notes panel');
  const stylesheet = document.querySelector('link[data-question-notes-style]').sheet;
  const print = [...stylesheet.cssRules].find(r => r.media?.mediaText === 'print');
  check([...print.cssRules].some(r => r.selectorText === '.question-notes-control' && r.style.display === 'none'), 'Browser parses print exclusion for notes controls');
  panel.querySelector('.question-notes-close').click();
  check(panel.hidden && document.activeElement === button, 'Chapter Close restores focus');
  const indexBefore = deck.querySelector('.quiz-status').textContent;
  deck.querySelector('[data-quiz-next]').click();
  check(deck.querySelector('.quiz-status').textContent !== indexBefore, 'Next question still works');
  check(document.documentElement.scrollWidth <= innerWidth, 'Chapter has no horizontal overflow');
  return { passed: passed.length, checks: passed };
}
