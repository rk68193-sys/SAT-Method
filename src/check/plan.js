/* The starting check in both subjects, spaced repeats, and the study plan.
   node src/check/plan.js index.html [width] [shots-folder]
   The page's date is fixed (a Tuesday), then moved on a day to check that misses come back. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const T0 = new Date('2026-11-10T09:00:00');
const at = mins => new Date(T0.getTime() + mins * 60000);
// the same rule as diagEstimate in src/site/plan.js, written again so the page's number is checked, not copied
function estimate(rows) {
  const by = { E: [0, 0], M: [0, 0], H: [0, 0] };
  rows.forEach(r => { by[r.d][1] += 1; if (r.ok) { by[r.d][0] += 1; } });
  let k = 0, share = 0, v = 0;
  for (const d of 'EMH') { const n = by[d][1]; if (!n) { continue; } const soft = (by[d][0] + 1) / (n + 2); k += 1; share += by[d][0] / n; v += soft * (1 - soft) / n; }
  share /= k;
  const mid = 200 + 600 * share, half = Math.max(60, 600 * Math.sqrt(v) / k), r10 = x => Math.round(x / 10) * 10;
  return Math.max(200, r10(mid - half)) + '–' + Math.min(800, r10(mid + half));
}
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
  p.on('dialog', d => d.accept());
  const shot = async (n, full) => { if (dir) { await p.screenshot({ path: path.join(dir, 'plan-' + width + '-' + n + '.png'), fullPage: !!full }); } };
  const wide = async t => { const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (r[0] > r[1] + 1) { over.push(t + ': ' + r[0] + '>' + r[1]); } };
  const go = async t => { await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(250); };
  const saved = () => p.evaluate(() => JSON.parse(localStorage.getItem('sat-grammar-sprint.v1')));
  const text = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const setPlan = async (date, mins, subj) => {
    await p.fill('#plan-date', date);
    await p.click('label:has(#plan-mins-' + mins + ')'); await p.click('label:has(#plan-subj-' + subj + ')');
    await p.click('#plan-form button[type="submit"]'); await p.waitForTimeout(250);
  };
  await p.clock.setFixedTime(T0);
  await p.goto(file); await p.waitForTimeout(700);

  // Home for someone new
  ok((await text('#v-home .hcheck')).startsWith('New here?'), 'Home offers the starting check to someone new');
  ok((await text('#v-home .hplan')).includes('Have a test date?'), 'Home offers a study plan');
  await wide('home new'); await shot('home-new');

  // the plan page before there is a plan
  await go('plan');
  ok(await p.isVisible('#plan-form') && !(await p.$('#plan-today')), 'plan page starts with the form');
  await p.click('#plan-form button[type="submit"]'); await p.waitForTimeout(100);
  ok((await text('#plan-msg')).includes('Choose your test date'), 'a missing date is asked for');
  await p.fill('#plan-date', '2026-11-01'); await p.click('#plan-form button[type="submit"]'); await p.waitForTimeout(100);
  ok((await text('#plan-msg')).includes('has passed'), 'a past date is refused');
  await wide('plan form'); await shot('form', true);
  await setPlan('2026-12-05', 15, 'both');
  ok((await text('#v-plan h2')) === '25 days to your test', 'title counts the days: ' + (await text('#v-plan h2')));
  ok((await text('#v-plan .lede')).includes('Saturday, December 5') && (await text('#v-plan .lede')).includes('Fix and pace'), 'date and phase shown');
  let tasks = await p.$$eval('#plan-today .plan-task-h b', b => b.map(x => x.textContent));
  ok(tasks.length === 1 && tasks[0] === 'Take the 10-question starting check', 'day one for a new student is the starting check: ' + tasks.join(' | '));
  ok((await p.$$('#plan-week .plan-day')).length === 7 && (await text('#plan-week')).includes('+ timed module'), 'the week ahead has seven days and a Saturday module');
  await wide('plan day 1'); await shot('day1', true);
  await p.click('[data-plan-go="0"]'); await p.waitForTimeout(300);
  const first = await p.evaluate(() => location.hash);
  ok(/^#(m|rw)-check$/.test(first) && await p.isVisible('#diag-go-' + (first === '#m-check' ? 'm' : 'rw')), 'the task opens the check: ' + first);

  // the Math check
  await go('m-check');
  ok((await text('#v-mprac h2')).includes('10 questions'), 'Math check intro');
  await shot('m-check-intro');
  await p.click('#diag-go-m'); await p.waitForTimeout(400);
  ok((await text('#mm-pos')) === 'Question 1 of 10' && /^1[56]:\d\d$/.test(await text('#mm-clock')), 'ten questions, about sixteen minutes: ' + (await text('#mm-clock')));
  for (let i = 0; i < 10; i++) {
    if (i !== 4) { if (await p.$('#mm-card .mpch')) { await p.keyboard.press(String(1 + (i % 4))); } else { await p.fill('#mm-gin', '3'); } }
    await p.click('#mm-next'); await p.waitForTimeout(100);
  }
  await p.click('#mm-nav [data-mm-do="finish"]'); await p.waitForTimeout(400);
  let rows = await p.$$eval('#v-mprac .mmsum li', L => L.map(li => ({ ok: li.classList.contains('ok'), blank: li.classList.contains('mm-blank'), d: (/· (Easy|Medium|Hard) ·/.exec(li.textContent) || [])[1][0] })));
  ok(rows.length === 10 && rows.map(r => r.d).join('') === 'EEEMMMMHHH', 'three Easy, four Medium, three Hard, easier first: ' + rows.map(r => r.d).join(''));
  ok((await text('#v-mprac .diag-n')) === estimate(rows), 'rough range matches the rule: ' + (await text('#v-mprac .diag-n')) + ' for ' + rows.filter(r => r.ok).length + ' right');
  ok((await text('#v-mprac .diag-range')).includes('not a prediction') && (await text('#v-mprac .diag-range details')).includes('Bluebook'), 'the range says what it is not');
  ok(await p.isVisible('#v-mprac a[href="#plan"]'), 'results lead to the plan');
  let s = await saved();
  ok(s.s.diag.m && s.s.diag.m.n === 10 && !(s.s.modules || []).length, 'the check is saved as a check, not as a module');
  const mWrong = rows.filter(r => !r.ok && !r.blank).length;
  ok(Object.keys(s.s.sr.m).length === mWrong && Object.values(s.s.sr.m).every(x => x[0] === 0 && x[1] === new Date('2026-11-11T00:00:00').getTime()), 'each miss is due again tomorrow (' + mWrong + ')');
  await wide('m check results'); await shot('m-check-results', true);

  // the Reading and Writing check
  await p.clock.setFixedTime(at(20));
  await go('rw-check');
  ok(await p.isVisible('#thost #diag-go-rw'), 'Reading and Writing check intro');
  await p.click('#diag-go-rw'); await p.waitForTimeout(400);
  ok((await text('#rm-pos')) === 'Question 1 of 10' && /^1[12]:\d\d$/.test(await text('#rm-clock')), 'ten questions, about twelve minutes: ' + (await text('#rm-clock')));
  const kinds = [];
  for (let i = 0; i < 10; i++) {
    kinds.push(await text('#rm-card .mpcard-h .muted'));
    await p.keyboard.press(String(1 + (i % 4)));
    await p.click('#rm-next'); await p.waitForTimeout(100);
  }
  await p.click('#rm-nav [data-mm-do="finish"]'); await p.waitForTimeout(400);
  const order = kinds.map(k => k === 'Grammar' ? 'G' : k === 'Transition' || k === 'Notes' ? 'E' : 'R').join('');
  ok(order === 'RRRRRRGGEE', 'six reading, two grammar, two transitions or notes, in the test order: ' + order);
  rows = await p.$$eval('#thost .mmsum li', L => L.map(li => ({ ok: li.classList.contains('ok'), d: (/· (Easy|Medium|Hard) ·/.exec(li.textContent) || [])[1][0] })));
  ok(rows.map(r => r.d).sort().join('') === 'EEEHHHMMMM', 'three Easy, four Medium, three Hard');
  ok((await text('#thost .diag-n')) === estimate(rows), 'rough range matches the rule: ' + (await text('#thost .diag-n')) + ' for ' + rows.filter(r => r.ok).length + ' right');
  s = await saved();
  ok(s.s.diag.rw && s.s.diag.rw.n === 10 && !(s.s.rwmodules || []).length, 'the check is saved as a check, not as a module');
  await wide('rw check results'); await shot('rw-check-results', true);
  await go('practice');
  ok(await p.isVisible('#thost .mmsum'), 'the results stay when Practice is opened again');
  await go('m-map'); ok((await text('#v-mmap .diag-line')).includes('rough range'), 'the Math map shows the check');
  await go('rw-map'); ok((await text('#v-rwmap .diag-line')).includes('rough range'), 'the Reading and Writing map shows the check');
  await go('home'); ok(!(await p.$('#v-home .hcheck')), 'Home stops offering the check once it is taken');
  ok(/25 days to your test · today \d of \d done/.test(await text('#v-home .hplan')), 'Home shows the plan: ' + (await text('#v-home .hplan')));
  await shot('home-plan');

  // back to the plan: the check is done, and one more set can be added
  await p.clock.setFixedTime(at(40));
  await go('plan');
  ok((await p.$$('#plan-today .plan-task.done')).length === 1 && (await text('#plan-today .lede')).includes('All done for today'), 'the check task is ticked');
  ok((await p.$$('#plan-stand .mm-next-c')).length === 2 && (await text('#plan-stand')).includes('rough range'), 'where you stand shows both sections');
  await p.click('#plan-more'); await p.waitForTimeout(250);
  ok((await p.$$('#plan-today .plan-task')).length === 2, 'one more set is added');
  await shot('day1-more', true);
  const subLabel = await text('#plan-today .plan-task:last-child .plan-sub');
  await p.click('#plan-today .plan-task:last-child [data-plan-go]'); await p.waitForTimeout(400);
  const inMath = await p.isVisible('#v-mprac .mpcard'), inRw = await p.isVisible('#v-practice #tcard .opt');
  ok(subLabel.startsWith('Math') ? inMath : inRw, 'the set opens in its own section (' + subLabel + ')');

  // the next day: misses are due, and the day is rebuilt
  await p.clock.setFixedTime(at(24 * 60 + 30));
  await p.reload(); await p.waitForTimeout(600);
  await go('plan');
  ok((await text('#v-plan h2')) === '24 days to your test', 'a day later: ' + (await text('#v-plan h2')));
  tasks = await p.$$eval('#plan-today .plan-task-h b', b => b.map(x => x.textContent));
  ok(tasks.length >= 2 && /^Redo \d+ questions? you missed$/.test(tasks[0]), 'yesterday’s misses come back first: ' + tasks.join(' | '));
  ok((await p.$$('#plan-today .plan-task.done')).length === 0, 'the new day starts unticked');
  await wide('plan day 2'); await shot('day2', true);
  const revSub = await text('#plan-today .plan-task .plan-sub');
  await p.click('[data-plan-go="0"]'); await p.waitForTimeout(400);
  if (revSub.startsWith('Math')) {
    ok(await p.isVisible('#v-mprac .mpcard'), 'the repeat set opens in Math');
    if (await p.$('#v-mprac .mpch')) { await p.keyboard.press('1'); } else { await p.fill('#mp-gin', '3'); await p.click('#mp-gform button'); }
  } else {
    ok(await p.isVisible('#v-practice #tcard .opt'), 'the repeat set opens in Reading and Writing');
    await p.keyboard.press('1');
  }
  await p.waitForTimeout(300);
  await go('plan');
  ok(/^Continue · 1 of \d+$/.test(await text('#plan-today .plan-task [data-plan-go]')), 'progress is kept: ' + (await text('#plan-today .plan-task [data-plan-go]')));

  // thirty minutes, both sections: each section gets a set
  await setPlan('2026-12-05', 30, 'both');
  const subs = await p.$$eval('#plan-today .plan-sub', L => L.map(x => x.textContent.split(' · ')[0].trim()));
  ok(subs.includes('Math') && subs.includes('Reading & Writing'), 'thirty minutes covers both sections: ' + subs.join(' | '));
  await setPlan('2026-12-05', 15, 'm');
  ok((await p.$$eval('#plan-today .plan-sub', L => L.every(x => x.textContent.startsWith('Math')))) && (await p.$$('#plan-stand .mm-next-c')).length === 1, 'a Math-only plan has only Math');

  // the last days
  await setPlan('2026-11-14', 15, 'both');
  ok((await text('#v-plan h2')) === '3 days to your test' && (await text('#v-plan .lede')).includes('Final week'), 'final week wording');
  ok((await p.$$('#plan-week .plan-day')).length === 4 && (await text('#plan-week .plan-day:last-child')).includes('Test day'), 'the week stops at test day');
  await shot('final-week', true);
  await p.click('#plan-del'); await p.waitForTimeout(250);
  ok(await p.isVisible('#plan-form') && !(await p.$('#plan-today')) && !(await saved()).s.plan, 'deleting the plan keeps the results');
  ok(Object.keys((await saved()).m).length >= 9, 'practice results are still there');
  console.log(over.length ? 'OVERFLOW ' + over.join(' ; ') : 'no overflow');
  console.log(errors.length ? 'ERRORS ' + errors.join(' ; ') : 'no errors');
  console.log(fail.length ? fail.length + ' FAILED: ' + fail.join(' ; ') : 'all checks passed');
  await browser.close();
  process.exit(fail.length || errors.length || over.length ? 1 : 0);
})();
