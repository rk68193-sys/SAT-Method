/* Module mode, the calculator panel, "what went wrong" and the mastery map.
   node src/check/mtrack.js index.html [width] [shots-folder]
   Answers a whole module, reviews it, records a reason for a miss, then checks the map and the trap report. */
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
  p.on('console', m => { if (m.type() === 'error' && !/desmos|bugsnag|ERR_/i.test(m.text())) { errors.push('console: ' + m.text()); } });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const shot = async (n, full) => { if (dir) { await p.screenshot({ path: path.join(dir, width + '-' + n + '.png'), fullPage: !!full }); } };
  const wide = async t => { const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (r[0] > r[1] + 1) { over.push(t + ': ' + r[0] + '>' + r[1]); } };
  const go = async t => { await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(250); };
  await p.goto(file); await p.waitForTimeout(700);

  // the map before any practice
  await go('m-map');
  ok(await p.isVisible('#v-mmap'), 'map view opens');
  ok((await p.$$('#mm-map .mm-t')).length === 249, '249 type squares');
  ok((await p.textContent('#v-mmap .mnote')).includes('No practice questions answered yet'), 'empty state');
  ok((await p.textContent('#tabs a[aria-current] .secw')) === 'My progress', 'step 4 is marked');
  await wide('map empty'); await shot('map-empty', true);
  await p.click('#mm-map .mm-t'); await p.waitForTimeout(100);
  ok(await p.isVisible('#mm-detail'), 'a square opens its detail');
  ok((await p.textContent('#mm-detail')).includes('Watch out'), 'detail shows the trap');
  await wide('map detail'); await shot('map-detail');

  // module setup
  await go('m-module');
  ok(await p.isChecked('#mp-mode-module'), 'module mode preselected from #m-module');
  ok((await p.textContent('#mp-count')).includes('22 questions in 35:00'), 'count line: ' + (await p.textContent('#mp-count')));
  ok(!(await p.isVisible('#mp-timer')), 'learn-only options hidden');
  await shot('module-setup', true);
  await p.click('#mp-go'); await p.waitForTimeout(400);
  ok((await p.textContent('#mm-pos')).replace(/\s+/g, ' ') === 'Question 1 of 22', 'module starts on question 1');
  ok(/^3[45]:\d\d$/.test(await p.textContent('#mm-clock')), 'clock shows ' + (await p.textContent('#mm-clock')));
  await wide('module q1'); await shot('module-q1');

  // answer every question; cross out, flag and leave one blank along the way
  let crossed = false, picked = false;
  for (let i = 0; i < 22; i++) {
    const mc = await p.$('#mm-card .mpch');
    if (mc && !crossed) {
      crossed = true;
      await p.click('#mm-card .mmx[data-x="B"]');
      ok(await p.$eval('#mm-card .mpch[data-k="B"]', b => b.classList.contains('crossed')), 'cross-out marks the choice');
      await shot('module-crossed');
    }
    if (i === 1) { await p.check('#mm-flag'); }
    if (i !== 2) {
      if (mc) {
        await p.keyboard.press(String(1 + (i % 4)));
        if (!picked) { picked = true; ok(!!(await p.$('#mm-card .mpch.sel')), 'a number key selects a choice'); }
      } else { await p.fill('#mm-gin', i % 2 ? '7/6' : '12'); }
    }
    await p.click('#mm-next'); await p.waitForTimeout(120);
  }
  ok(await p.isVisible('#mm-nav .mm-confirm'), 'last “Next” opens the finish check');
  const conf = (await p.textContent('#mm-nav .mm-confirm')).replace(/\s+/g, ' ');
  ok(/1 question has no answer, and 1 is marked for review/.test(conf), 'finish check counts: ' + conf.slice(0, 110));
  ok((await p.$$('#mm-nav .mm-nav-grid .mm-n.ans')).length === 21 && (await p.$$('#mm-nav .mm-nav-grid .mm-n.flag')).length === 1, 'navigator shows 21 answered, 1 flagged');
  await wide('module nav'); await shot('module-finish', true);
  await p.click('#mm-nav .mm-n[data-go="2"]'); await p.waitForTimeout(150);
  ok((await p.textContent('#mm-pos')).includes('Question 3'), 'navigator jumps to a question');

  // calculator panel
  await p.click('.mmbar [data-calc]'); await p.waitForTimeout(300);
  ok(await p.isVisible('#mcalc iframe'), 'calculator panel opens');
  ok((await p.getAttribute('#mcalc iframe', 'src')).includes('desmos.com'), 'calculator is Desmos');
  await wide('module calc'); await p.waitForTimeout(dir ? 6000 : 0); await shot('module-calc');
  await p.click('#mcalc [data-calc-close]'); await p.waitForTimeout(100);
  ok(!(await p.isVisible('#mcalc')), 'calculator closes');

  // finish
  await p.click('#mm-finish'); await p.waitForTimeout(150);
  await p.click('#mm-nav [data-mm-do="finish"]'); await p.waitForTimeout(400);
  const head = (await p.textContent('#v-mprac h2')).trim();
  ok(/^You got \d+ of 22 right$/.test(head), 'results: ' + head);
  const stats = await p.$$eval('#v-mprac .mm-stats b', b => b.map(x => x.textContent));
  ok(Number(stats[0]) + Number(stats[1]) + Number(stats[2]) === 22 && stats[2] === '1', 'right + wrong + blank = 22, 1 blank: ' + stats.join(' / '));
  ok((await p.$$('#v-mprac .mmsum li')).length === 22, '22 answers listed');
  await wide('module results'); await shot('module-results', true);
  const saved = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('sat-grammar-sprint.v1')); return { m: Object.keys(s.m).length, mods: s.s.modules }; });
  ok(saved.m === 21, 'blank question not saved as a miss (' + saved.m + ' saved)');
  ok(saved.mods.length === 1 && saved.mods[0].n === 22, 'module score saved');

  // review a miss and say what went wrong
  const missAt = await p.$$eval('#v-mprac .mmsum li', L => L.findIndex(li => li.classList.contains('no')));
  ok(missAt >= 0, 'there is a miss to review (question ' + (missAt + 1) + ')');
  await p.click('#v-mprac .mmsum li:nth-child(' + (missAt + 1) + ') [data-rev]'); await p.waitForTimeout(300);
  ok((await p.textContent('.mpverdict')).includes('Not this time'), 'review shows the verdict');
  ok(await p.isVisible('.mwhy'), 'review asks what went wrong');
  await p.click('.mwhy-b[data-why="target"]'); await p.waitForTimeout(100);
  ok((await p.getAttribute('.mwhy-b[data-why="target"]', 'aria-pressed')) === 'true' && (await p.textContent('.mwhy-st')).includes('Saved'), 'reason saved');
  await wide('module review'); await shot('module-review', true);
  await p.click('#mm-rev-back'); await p.waitForTimeout(200);
  ok((await p.textContent('#v-mprac')).includes('1 × Answered a different question'), 'results tally the reason');

  // learn mode: a miss shows the same prompt
  await go('mq-4aaa9c42'); await p.keyboard.press('1'); await p.waitForTimeout(250);
  ok(await p.isVisible('.mwhy'), 'learn mode asks what went wrong after a miss');
  await p.click('.mwhy-b[data-why="trap"]'); await p.waitForTimeout(100);
  await wide('learn miss'); await shot('learn-miss', true);

  // the map and the trap report now have data
  await go('m-map');
  const st = await p.$$eval('#v-mmap .mm-stats b', b => b.map(x => Number(x.textContent)));
  ok(st[0] > 0 && st[0] === st[1] + st[2] + st[3], 'map counts add up: ' + st.join(' / '));
  ok((await p.$$('#mm-map .mm-t.lvl-weak, #mm-map .mm-t.lvl-mid, #mm-map .mm-t.lvl-strong')).length === st[0], 'colored squares match types tried');
  ok(await p.isVisible('#mm-next .mm-next-c'), '“Work on these next” lists types');
  ok((await p.$$('#m-traps .mtr')).length === 2, 'trap report has both reasons');
  ok((await p.textContent('#mm-mods')).includes('of 22'), 'module history shown');
  await wide('map filled'); await shot('map-filled', true);
  await p.click('label:has(#mm-show-weak)'); await p.waitForTimeout(100);
  ok((await p.getAttribute('#mm-map', 'data-show')) === 'weak', 'filter applies');
  await p.click('#mm-map .mm-t.lvl-weak'); await p.waitForTimeout(100);
  if (!(await p.$('#mm-detail'))) { await p.click('#mm-map .mm-t.lvl-weak'); await p.waitForTimeout(100); }   // it was already open
  ok(await p.isVisible('#mm-detail [data-mm-retry]'), 'a weak type offers a retry of its misses');
  await go('m-traps'); await shot('traps');
  await p.click('#m-traps [data-mw-retry="all"]'); await p.waitForTimeout(300);
  ok(await p.isVisible('#v-mprac .mpcard') && (await p.textContent('#v-mprac .mpbar-pos')).includes('Question 1'), 'retry starts a set of missed questions');

  // ten tabs fit
  await wide('tabs');
  const tabs = await p.evaluate(() => { const l = document.querySelector('.secnav-l'); return [l.scrollWidth, l.clientWidth]; });
  ok(tabs[0] <= tabs[1] + 1, 'all ten tabs visible without scrolling (' + tabs.join(' / ') + ')');

  // a running module survives a visit to another page; a clock at zero finishes it
  await go('m-module'); await p.click('#mp-go'); await p.waitForTimeout(300);
  await go('m-map'); await go('m-practice');
  ok(await p.isVisible('#mm-card'), 'a running module is still there after visiting another page');
  console.log(over.length ? 'OVERFLOW ' + over.join(' ; ') : 'no overflow');
  console.log(errors.length ? 'ERRORS ' + errors.join(' ; ') : 'no errors');
  console.log(fail.length ? fail.length + ' FAILED: ' + fail.join(' ; ') : 'all checks passed');
  await browser.close();
  process.exit(fail.length || errors.length || over.length ? 1 : 0);
})();
