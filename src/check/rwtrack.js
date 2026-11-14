/* Reading and Writing: the timed module, the one-tap causes, the mastery map and the trap report.
   node src/check/rwtrack.js index.html [width] [shots-folder]
   Answers a whole module, reviews a miss and records a cause, then checks the map, the trap report and the retry sets. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]);
  const width = Number(process.argv[3] || 390), dir = process.argv[4] || '';
  if (dir) { fs.mkdirSync(dir, { recursive: true }); }
  const browser = await chromium.launch();
  const p = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
  const errors = [], over = [], fail = [];
  const ok = (cond, what) => { if (!cond) { fail.push(what); } console.log((cond ? 'ok   ' : 'FAIL ') + what); };
  p.on('console', m => { if (m.type() === 'error' && !/ERR_/i.test(m.text())) { errors.push('console: ' + m.text()); } });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const shot = async (n, full) => { if (dir) { await p.screenshot({ path: path.join(dir, 'rw-' + width + '-' + n + '.png'), fullPage: !!full }); } };
  const wide = async t => { const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (r[0] > r[1] + 1) { over.push(t + ': ' + r[0] + '>' + r[1]); } };
  const go = async t => { await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(250); };
  const saved = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('sat-grammar-sprint.v1')); return { n: Object.keys(s.t).length + Object.keys(s.r).length + Object.keys(s.b).length, all: Object.assign({}, s.t, s.r, s.b), mods: s.s.rwmodules }; });
  await p.goto(file); await p.waitForTimeout(700);

  // the map before any practice
  await go('rw-map');
  ok(await p.isVisible('#v-rwmap'), 'map view opens');
  ok((await p.$$('#rwm-map .mm-t')).length === 126, '126 type squares (20 reading types, 106 rules)');
  ok((await p.$$('#rwm-map .mm-t.mm-tw')).length === 20, '20 reading types carry their names');
  ok((await p.textContent('#v-rwmap .mnote')).includes('No practice questions answered yet'), 'empty state');
  ok((await p.textContent('#tabs a[aria-current] .secw')) === 'My progress', 'step 4 is marked');
  await wide('map empty'); await shot('map-empty', true);
  await p.click('#rwm-map .mm-t.mm-tw'); await p.waitForTimeout(100);
  ok((await p.textContent('#rwm-detail')).includes('What to look at first'), 'a reading type opens what to look at first');
  await p.click('#rwm-map .mm-t:not(.mm-tw)'); await p.waitForTimeout(100);
  ok((await p.textContent('#rwm-detail')).includes('Rule 1.1'), 'a rule square opens its rule');
  await wide('map detail'); await shot('map-detail');

  // module setup
  await go('rw-module');
  ok(await p.isChecked('#tmode-module'), 'module mode preselected from #rw-module');
  ok((await p.textContent('#tcount')).includes('27 questions in 32:00'), 'count line: ' + (await p.textContent('#tcount')));
  ok(!(await p.isVisible('#ttier-std')), 'set-only options hidden');
  await shot('module-setup', true);
  await p.click('#tstart'); await p.waitForTimeout(500);
  ok((await p.textContent('#rm-pos')).replace(/\s+/g, ' ') === 'Question 1 of 27', 'module starts on question 1');
  ok(/^3[12]:\d\d$/.test(await p.textContent('#rm-clock')), 'clock shows ' + (await p.textContent('#rm-clock')));
  ok(!(await p.$('#rm-body .verdict')) && !(await p.$('#rm-body .qmeta')), 'no answer or question id shown');
  await wide('module q1'); await shot('module-q1');

  // answer every question; cross out, flag and leave one blank along the way
  const kinds = [];
  for (let i = 0; i < 27; i++) {
    kinds.push((await p.textContent('#rm-card .mpcard-h .muted')).trim());
    if (i === 0) {
      await p.click('#rm-body .rmx[data-x="B"]');
      ok(await p.$eval('#rm-body .opt[data-k="B"]', b => b.classList.contains('crossed')), 'cross-out strikes the choice');
      await p.click('#rm-body .opt[data-k="C"]'); await p.waitForTimeout(60);
      ok(await p.$eval('#rm-body .opt[data-k="C"]', b => b.classList.contains('sel')) && !(await p.$('#rm-body .verdict')), 'a click selects without showing the answer');
      await shot('module-q1-picked');
    }
    if (i === 1) { await p.check('#rm-flag'); }
    if (i !== 2 && i !== 0) { await p.keyboard.press(String(1 + (i % 4))); }
    if (i === 3) { ok(!!(await p.$('#rm-body .opt.sel')), 'a number key selects a choice'); }
    await p.click('#rm-next'); await p.waitForTimeout(120);
  }
  const order = kinds.map(k => k === 'Grammar' ? 'G' : k === 'Transition' ? 'T' : k === 'Notes' ? 'N' : 'R').join('');
  ok(/^R{15}G{7}T*N*$/.test(order) && order.length === 27, 'test order: 15 reading, 7 grammar, then transitions and notes (' + order + ')');
  ok(await p.isVisible('#rm-nav .mm-confirm'), 'last “Next” opens the finish check');
  const conf = (await p.textContent('#rm-nav .mm-confirm')).replace(/\s+/g, ' ');
  ok(/1 question has no answer, and 1 is marked for review/.test(conf), 'finish check counts: ' + conf.slice(0, 110));
  ok((await p.$$('#rm-nav .mm-nav-grid .mm-n.ans')).length === 26 && (await p.$$('#rm-nav .mm-nav-grid .mm-n.flag')).length === 1, 'question list shows 26 answered, 1 flagged');
  await wide('module nav'); await shot('module-finish', true);
  await p.click('#rm-nav .mm-n[data-go="0"]'); await p.waitForTimeout(150);
  ok(await p.$eval('#rm-body .opt[data-k="C"]', b => b.classList.contains('sel')) && await p.$eval('#rm-body .opt[data-k="B"]', b => b.classList.contains('crossed')), 'going back keeps the answer and the cross-out');
  ok((await saved()).n === 0, 'nothing is saved before finishing');

  // finish
  await p.click('#rm-finish'); await p.waitForTimeout(150);
  await p.click('#rm-nav [data-mm-do="finish"]'); await p.waitForTimeout(500);
  const head = (await p.textContent('#thost h2')).trim();
  ok(/^You got \d+ of 27 right$/.test(head), 'results: ' + head);
  const stats = await p.$$eval('#thost .mm-stats b', b => b.map(x => x.textContent));
  ok(Number(stats[0]) + Number(stats[1]) + Number(stats[2]) === 27 && stats[2] === '1', 'right + wrong + blank = 27, 1 blank: ' + stats.join(' / '));
  ok((await p.$$('#thost .mmsum li')).length === 27, '27 answers listed');
  ok((await p.$$('#thost .mprog-row')).length === 4, 'four content areas');
  await wide('module results'); await shot('module-results', true);
  const s1 = await saved();
  ok(s1.n === 26, 'blank question not saved as a miss (' + s1.n + ' saved)');
  ok(Object.values(s1.all).filter(r => r.confidence === 'unsure').length === 1 && Object.values(s1.all).every(r => r.mode === 'module'), 'the flagged question is saved as unsure');
  ok(s1.mods.length === 1 && s1.mods[0].n === 27, 'module score saved');

  // review a miss and say what caused it
  const missAt = await p.$$eval('#thost .mmsum li', L => L.findIndex(li => li.classList.contains('no')));
  ok(missAt >= 0, 'there is a miss to review (question ' + (missAt + 1) + ')');
  await p.click('#thost .mmsum li:nth-child(' + (missAt + 1) + ') [data-rm-rev]'); await p.waitForTimeout(400);
  ok((await p.textContent('#rm-revcard .verdict')).includes('Not this one'), 'review shows the verdict and the answer');
  ok((await p.textContent('#rm-revcause')).includes('What went wrong?'), 'review asks what went wrong');
  await p.click('label:has(#tcause-evidence)'); await p.waitForTimeout(100);
  ok((await p.textContent('#treviewstatus')).includes('saved'), 'cause saved');
  ok((await saved()).n === 26, 'reviewing does not add or change attempts');
  await wide('module review'); await shot('module-review', true);
  // the blank one can be tried, unsaved
  await p.click('#rm-rev-back'); await p.waitForTimeout(200);
  await p.click('#thost .mmsum li.mm-blank [data-rm-rev]'); await p.waitForTimeout(300);
  ok((await p.textContent('#thost .mm-yours')).includes('left this one blank'), 'a blank question says so');
  await p.click('#rm-revcard .opt[data-k="A"]'); await p.waitForTimeout(200);
  ok(!!(await p.$('#rm-revcard .verdict')) && (await saved()).n === 26, 'trying a blank question in review is not saved');
  await p.click('#rm-rev-back'); await p.waitForTimeout(200);
  ok((await p.textContent('#thost')).includes('1 × Used unsupported evidence or prior knowledge'), 'results tally the cause');

  // an ordinary set: the cause is one tap, and the keyboard still moves on
  await p.click('#rm-retry'); await p.waitForTimeout(400);
  ok(await p.isVisible('#tcard .opt'), 'retry starts an ordinary set');
  await p.keyboard.press('1'); await p.waitForTimeout(300);
  ok(await p.isVisible('#treview .seg'), 'after an answer the causes are buttons');
  await p.click('label:has(#tcause-pace)'); await p.waitForTimeout(100);
  await wide('set review'); await shot('set-cause', true);
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  ok((await p.textContent('#tpos')).includes('Question 2'), 'Enter moves on after tapping a cause');

  // the map and the trap report now have data
  await go('rw-map');
  const st = await p.$$eval('#v-rwmap .mm-stats b', b => b.map(x => Number(x.textContent)));
  ok(st[0] > 0 && st[0] === st[1] + st[2] + st[3], 'map counts add up: ' + st.join(' / '));
  ok((await p.$$('#rwm-map .mm-t.lvl-weak, #rwm-map .mm-t.lvl-mid, #rwm-map .mm-t.lvl-strong')).length === st[0], 'colored squares match types tried');
  ok(await p.isVisible('#rwm-next .mm-next-c'), '“Work on these next” lists types');
  ok((await p.$$('#rw-traps .mtr')).length >= 1, 'trap report has a cause');
  ok((await p.textContent('#rwm-mods')).includes('of 27'), 'module history shown');
  await wide('map filled'); await shot('map-filled', true);
  await p.click('label:has(#rwm-show-weak)'); await p.waitForTimeout(100);
  ok((await p.getAttribute('#rwm-map', 'data-show')) === 'weak', 'filter applies');
  await p.click('#rwm-map .mm-t.lvl-weak'); await p.waitForTimeout(100);
  if (!(await p.$('#rwm-detail'))) { await p.click('#rwm-map .mm-t.lvl-weak'); await p.waitForTimeout(100); }
  ok(await p.isVisible('#rwm-detail [data-rw-miss]'), 'a weak type offers a retry of its misses');
  await p.click('#rwm-detail [data-rw-go]'); await p.waitForTimeout(400);
  ok(await p.isVisible('#v-practice #tcard .opt') && (await p.textContent('#tpos')).includes('Question 1'), 'practice this type starts a set');
  await go('rw-traps'); await shot('traps');
  await p.click('#rw-traps [data-rw-cause="all"]'); await p.waitForTimeout(400);
  ok(await p.isVisible('#v-practice #tcard .opt'), 'retry starts a set of missed questions');

  // seven tabs fit; a running module survives a visit to another page
  const tabs = await p.evaluate(() => { const l = document.querySelector('.secnav-l'); return [l.scrollWidth, l.clientWidth]; });
  ok(tabs[0] <= tabs[1] + 1, 'all seven tabs visible without scrolling (' + tabs.join(' / ') + ')');
  await go('rw-module'); await p.click('#tstart'); await p.waitForTimeout(400);
  await go('rw-map'); await go('practice');
  ok(await p.isVisible('#rm-card'), 'a running module is still there after visiting another page');
  await go('rw-module');
  ok(await p.isVisible('#rm-card'), '#rw-module returns to the running module');
  console.log(over.length ? 'OVERFLOW ' + over.join(' ; ') : 'no overflow');
  console.log(errors.length ? 'ERRORS ' + errors.join(' ; ') : 'no errors');
  console.log(fail.length ? fail.length + ' FAILED: ' + fail.join(' ; ') : 'all checks passed');
  await browser.close();
  process.exit(fail.length || errors.length || over.length ? 1 : 0);
})();
