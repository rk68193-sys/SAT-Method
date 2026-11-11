/* Questions as text: Math questions rebuilt from the export (text with drawn expressions), with the picture as the
   fallback, and the Reading and Writing table, graph and grammar questions as text cards.
   node src/check/qtext.js index.html [width] [shots-folder] */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const root = path.dirname(path.resolve(process.argv[2]));
  const file = 'file://' + path.resolve(process.argv[2]);
  const width = Number(process.argv[3] || 390), dir = process.argv[4] || '';
  if (dir) { fs.mkdirSync(dir, { recursive: true }); }
  const held = JSON.parse(fs.readFileSync(path.join(root, 'src/build/mtext.json'))).held;
  const browser = await chromium.launch();
  const p = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
  const errors = [], over = [], fail = [], bad = [];
  const ok = (cond, what) => { if (!cond) { fail.push(what); } console.log((cond ? 'ok   ' : 'FAIL ') + what); };
  p.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts\.g/i.test(m.text())) { errors.push('console: ' + m.text()); } });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  p.on('requestfailed', r => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) { bad.push(r.url()); } });
  const shot = async (n, full) => { if (dir) { await p.screenshot({ path: path.join(dir, 'qtext-' + width + '-' + n + '.png'), fullPage: !!full }); } };
  const wide = async t => { const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (r[0] > r[1] + 1) { over.push(t + ': ' + r[0] + '>' + r[1]); } };
  const go = async t => { await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(250); };
  const text = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  await p.goto(file); await p.waitForTimeout(700);

  // Math, a typed-answer question: prose is text, expressions are drawn, and they sit on the baseline
  await go('mq-ac472881');
  await p.waitForSelector('#v-mprac .mpq .mtx[data-mtx-s="d"]', { timeout: 15000 });
  ok((await text('#v-mprac .mpq .mtx')).includes('In the given equation,') && (await text('#v-mprac .mpq .mtx')).includes('are constants, and'), 'the question is text: ' + (await text('#v-mprac .mpq .mtx')).slice(0, 60));
  ok((await p.$$('#v-mprac .mpq .mtx svg.mx')).length === 5, 'its five expressions are drawn');
  ok((await p.$$('svg.mxdefs path')).length > 300, 'the symbol library is loaded once');
  const drawn = await p.evaluate(() => { const u = document.querySelector('#v-mprac .mpq .mtx svg.mx use'); const r = u.getBoundingClientRect(); return [r.width > 2, r.height > 2, !!document.querySelector(u.getAttribute('href'))]; });
  ok(drawn.every(Boolean), 'a symbol is really drawn (' + drawn.join(',') + ')');
  ok(!(await p.$('#v-mprac .mpq img.mimg')), 'no picture is loaded for it');
  ok((await text('#v-mprac .mpzoom')) === 'See the question as printed', 'the printed page is one tap away');
  await wide('math typed'); await shot('m-typed');
  await p.fill('#mp-gin', '403'); await p.click('#mp-gform button'); await p.waitForTimeout(300);
  ok((await text('.mpverdict')).startsWith('Correct'), 'grading is unchanged');
  await p.evaluate(() => { const d = document.querySelector('#v-mprac .mprat'); d.open = true; d.scrollIntoView(); });
  await p.waitForSelector('#v-mprac .mprat .mtx[data-mtx-s="d"]', { timeout: 15000 });
  ok((await text('#v-mprac .mprat .mtx')).startsWith('The correct answer is'), 'the explanation is text');
  await wide('math typed answered'); await shot('m-typed-answered', true);
  await p.click('#v-mprac .mpq + .mpzoom [data-zoom]'); await p.waitForTimeout(300);
  ok(await p.isVisible('#mzoom img.mimg'), 'the viewer shows the printed question');
  await p.click('#mzoom [data-close]');

  // Math, multiple choice: the choices are in the buttons
  await go('mq-3f5a3602');
  await p.waitForSelector('#v-mprac .mpq .mtx[data-mtx-s="d"]', { timeout: 15000 });
  ok((await p.$$('#v-mprac .mpchoices.txt .mpch .mpch-c svg.mx')).length >= 8, 'each button holds its choice');
  ok(await p.$eval('#v-mprac .mpq .mtx img.mfig', im => im.complete && im.naturalWidth > 100), 'the graph is a picture inside the text');
  ok((await text('#v-mprac .mpch-note')) === 'Choose your answer.', 'the note no longer points at a picture');
  await wide('math mc'); await shot('m-mc', true);
  await p.keyboard.press('4'); await p.waitForTimeout(300);
  ok((await text('.mpverdict')).startsWith('Correct') && await p.$eval('#v-mprac .mpch[data-k="D"]', b => b.classList.contains('right')), 'the key still answers, and D is right');

  // a question whose rebuild was held back keeps its picture
  await go('mq-' + held[0]);
  await p.waitForSelector('#v-mprac .mpq img.mimg', { timeout: 15000 });
  ok(!(await p.$('#v-mprac .mpq .mtx')) && (await text('#v-mprac .mpzoom')) === 'See the question larger', 'a held-back question (' + held[0] + ') shows its picture');
  ok(!(await p.$('#v-mprac .mpchoices.txt')), 'and keeps the letter buttons');

  // a lesson page: examples are filled only when opened
  await go('m-le1');
  const before = await p.$$eval('#v-mlearn .mtx[data-mtx-s="d"]', L => L.length);
  await p.evaluate(() => { const d = document.querySelector('#v-mlearn details.mstrategy:has(.mtx)'); d.open = true; d.scrollIntoView(); });
  await p.waitForSelector('#v-mlearn details[open] .mtx[data-mtx-s="d"]', { timeout: 15000 });
  const opened = await p.$eval('#v-mlearn details[open] .mtx[data-mtx-s="d"]', e => [e.textContent.trim().length, e.querySelectorAll('svg.mx, img').length]);
  ok(before === 0 && opened[0] + opened[1] > 10, 'a lesson example fills in only when it is opened (' + opened.join(' characters, ') + ' drawings)');
  await wide('lesson');

  // Reading and Writing: a grammar question that used to be a picture
  await go('rq-003f22c8');
  ok((await text('#tcard .passage')).startsWith('Every last second of space shuttle mission STS-79') && !!(await p.$('#tcard .passage .blank')), 'grammar passage is text with its blank');
  ok((await p.$$eval('#tcard .opt .otext', L => L.map(x => x.textContent))).join('|') === 'have been|are|was|were', 'the choices are text');
  ok((await text('#tcard .stem')).startsWith('Which choice completes the text'), 'the real question line is shown');
  await wide('rw grammar'); await shot('rw-grammar');
  await p.keyboard.press('1'); await p.waitForTimeout(300);
  ok((await text('#tcard .qfeed')).includes('Choice C is the best answer') && (await text('#tcard .qfeed')).includes('Choice A is incorrect'), 'the explanation for the answer and for the choice picked');
  ok((await p.$$('#tcard .asprinted a')).length === 2 && (await p.getAttribute('#tcard .asprinted a', 'href')) === 'rw/q/003f22c8.webp', 'links to the page as printed');
  await shot('rw-grammar-answered', true);

  // a table question: text, with the table as a picture
  await go('rq-0014477f');
  await p.waitForSelector('#tcard img.rwfig');
  ok(await p.$eval('#tcard img.rwfig', im => im.decode().then(() => im.naturalWidth > 100)), 'the table is a picture');
  ok((await text('#tcard .rwcap')).startsWith('Total Areas of Five Pueblo Nations in New Mexico'), 'its title is text, on one line of thought');
  ok((await text('#tcard .passage')).includes('There are nineteen Pueblo tribal nations'), 'the passage is text');
  ok((await p.$$eval('#tcard .opt .otext', L => L.every(x => x.textContent.includes('square miles')))), 'the choices are text');
  await wide('rw table'); await shot('rw-table', true);
  await p.keyboard.press('3'); await p.waitForTimeout(300);
  ok((await text('#tcard .verdict')).startsWith('Correct'), 'grading is unchanged');

  // every converted question has what a card needs
  const counts = await p.evaluate(() => {
    const D = JSON.parse(document.getElementById('sprint-data').textContent), all = D.bank.figures.concat(D.bank.grammarSources);
    const txt = all.filter(x => x.txt);
    return { all: all.length, txt: txt.length, full: txt.filter(x => 'ABCD'.split('').every(k => x.ch[k] && x.why[k]) && x.s.length && x.q.length > 20).length, held: D.mathText.held.length };
  });
  ok(counts.all === 466 && counts.txt >= 460 && counts.full === counts.txt, counts.txt + ' of 466 Reading and Writing picture questions are text, each with four choices and four explanations');
  const files = fs.readdirSync(path.join(root, 'm/t')).filter(f => /^[0-9a-f]{8}\.js$/.test(f)).length;
  ok(files + counts.held === 1925 && counts.held === held.length, files + ' Math questions are text and ' + counts.held + ' keep their picture');
  console.log(over.length ? 'OVERFLOW ' + over.join(' ; ') : 'no overflow');
  console.log(errors.length ? 'ERRORS ' + errors.join(' ; ') : 'no errors');
  console.log(bad.length ? 'FAILED REQUESTS ' + bad.slice(0, 5).join(' ; ') : 'no failed requests');
  console.log(fail.length ? fail.length + ' FAILED: ' + fail.join(' ; ') : 'all checks passed');
  await browser.close();
  process.exit(fail.length || errors.length || over.length || bad.length ? 1 : 0);
})();
