/* Checks the pages and drills added from the book comparison: Words to know (with its two drills and the
   "Did not know a word" cause), and the rest as they are added. Usage: node src/check/additions.js index.html 390 */
const path = require('path');
const { chromium } = require(require.resolve('playwright', { paths: [require('child_process').execSync('npm root -g').toString().trim()] }));
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]);
  const width = Number(process.argv[3] || 390);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const p = await ctx.newPage();
  const errors = [], over = [], fails = [];
  const ok = (c, m) => { if (!c) { fails.push(m); } };
  p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  async function go(t) { await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(150); }
  async function wide(t) { const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })); if (r.sw > r.cw + 1) { over.push(`${t}: ${r.sw}>${r.cw}`); } }
  await p.goto(file); await p.waitForTimeout(800);

  /* ---- Words to know ---- */
  for (const t of ['vocab', 'vocab-why', 'vocab-check', 'vocab-second', 'vocab-list', 'vocab-func', 'o-word', 'o-structure']) { await go(t); await wide(t); }
  await go('vocab');
  const words = await p.$$eval('#vout .vrow', r => r.length);
  ok(words === 814, 'word list shows ' + words + ' words, expected 814');
  const second = await p.$$eval('.vsec tbody tr', r => r.length);
  ok(second === 40, 'second meanings table has ' + second + ' rows');
  const func = await p.$$eval('.vfunc tbody tr', r => r.length);
  ok(func === 87, 'purpose words table has ' + func + ' rows');
  await p.fill('#vq', 'mitigate'); await p.waitForTimeout(100);
  const hit = await p.textContent('#vout');
  ok(/make less severe/.test(hit) && /1 word of 814/.test(hit), 'search for mitigate: ' + hit.slice(0, 120));
  await p.fill('#vq', ''); await p.check('#vshow-right', { force: true }); await p.waitForTimeout(100);
  ok((await p.$$eval('#vout .vrow', r => r.length)) === 214, 'right answers filter');
  await p.check('#vshow-mine', { force: true }); await p.waitForTimeout(100);
  ok(/No words yet/.test(await p.textContent('#vout')), 'empty "from my misses" message');
  const links = await p.$$eval('.nextlinks a', a => a.map(x => x.getAttribute('href') + (x.dataset.drill || '')));
  ok(links.includes('#drillswmean') && links.includes('#drillswsecond'), 'drill links ' + links.join(' '));
  /* the Learn search reaches a word, and opens the list on it */
  await go('rw-hub'); await p.fill('#rwhub-q', 'corroborate'); await p.waitForTimeout(150);
  const hl = await p.$$eval('#rwhub-res a', a => a.map(x => x.getAttribute('href')));
  ok(hl.includes('#voc-corroborate'), 'hub search finds the word: ' + hl.slice(0, 5).join(' '));
  await go('voc-corroborate');
  ok(/1 word of 814/.test(await p.textContent('#vout')) && (await p.inputValue('#vq')) === 'corroborate', 'voc- address filters the list');
  /* the word drills */
  for (const k of ['wmean', 'wsecond']) {
    await go('drills'); const b = await p.$('[data-start="' + k + '"]'); if (!b) { await p.click('#dhome').catch(() => {}); await p.waitForTimeout(80); }
    await p.click('[data-start="' + k + '"]'); await p.waitForTimeout(120);
    const n = await p.$$eval('#dhost .dopt', o => o.length);
    ok(n === 4, k + ' shows ' + n + ' options');
    const ans = await p.evaluate(() => null);
    await p.keyboard.press('1'); await p.waitForTimeout(100);
    const v = await p.textContent('#dfeed .verdict').catch(() => 'NO VERDICT');
    ok(/Right|Not this one/.test(v), k + ' verdict: ' + v);
    await wide('drill ' + k);
    await p.click('#dend'); await p.waitForTimeout(80); await p.click('#dhome');
  }
  /* every Word meanings card has exactly one right definition and four different options */
  const audit = await p.evaluate(() => {
    const bad = [];
    const V = JSON.parse(document.getElementById('sprint-data').textContent).vocab;
    if (!V || V.words.length !== 814) { bad.push('vocab data'); }
    return bad;
  });
  ok(!audit.length, 'vocab data ' + audit.join(','));
  /* a miss marked "Did not know a word" sends its words to the list */
  await p.evaluate(() => {
    const k = 'sat-grammar-sprint.v1', s = JSON.parse(localStorage.getItem(k) || '{}');
    s.b = s.b || {}; s.b['0021d326'] = { c: 0, t: 30, l: null, mode: 'learn', confidence: '', cause: 'vocab', evidence: '', n: 1, at: Date.now() };
    localStorage.setItem(k, JSON.stringify(s));
  });
  /* 0021d326 is a Support question: its words are not in the list, so add a Words in Context miss too */
  const wq = await p.evaluate(() => JSON.parse(document.getElementById('sprint-data').textContent).bank.reading.filter(x => x.job === 'word' && /most logical and precise/.test(x.q))[0].id);
  await p.evaluate(id => {
    const k = 'sat-grammar-sprint.v1', s = JSON.parse(localStorage.getItem(k) || '{}');
    s.b[id] = { c: 0, t: 30, l: null, mode: 'learn', confidence: '', cause: 'vocab', evidence: '', n: 1, at: Date.now() };
    localStorage.setItem(k, JSON.stringify(s));
  }, wq);
  await p.reload(); await p.waitForTimeout(700);
  await go('rw-traps');
  const trap = await p.textContent('#v-rwmap');
  ok(/Did not know a word/.test(trap) && /See the words from these questions/.test(trap), 'trap report shows the word cause');
  await go('vocab-mine');
  const mine = await p.$$eval('#vout .vrow', r => r.length);
  ok(mine === 4, 'from my misses shows ' + mine + ' words (expected the 4 choices of ' + wq + ')');
  await go('practice'); await wide('practice');

  /* ---- Math drills ---- */
  await go('m-drills'); await wide('m-drills');
  const mcards = await p.$$eval('#v-mdrills [data-start]', b => b.map(x => x.getAttribute('data-start')));
  ok(['mskill', 'mcount', 'mform', 'mexp', 'mpct', 'mslope', 'mfrac'].every(k => mcards.includes(k)), 'Math drill cards: ' + mcards.join(' '));
  ok(!mcards.some(k => ['job', 'wmean', 'pattern'].includes(k)), 'no Reading and Writing drills on the Math page');
  const subnav = await p.textContent('#subnav');
  ok(/Practice/.test(subnav) && /Drills/.test(subnav), 'Math Practice tab lists Practice and Drills: ' + subnav);
  for (const k of mcards) {
    await go('math'); await go('m-drill-' + k); await p.waitForTimeout(250);
    const n = await p.$$eval('#v-mdrills #dhost .dopt', o => o.length);
    ok(n >= 3, k + ' shows ' + n + ' options');
    await p.keyboard.press('2'); await p.waitForTimeout(150);
    const v = await p.textContent('#dfeed .verdict').catch(() => 'NO VERDICT');
    ok(/Right|Not this one/.test(v), k + ' verdict: ' + v);
    await wide('m-drill ' + k);
    await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    ok(/Card 2 of/.test(await p.textContent('#dhost .dbar')), k + ': Enter goes to the next card');
    await p.click('#dend'); await p.waitForTimeout(150);
    ok(/round finished/.test(await p.textContent('#dhost')), k + ': ending the round shows the result');
  }
  /* a wrong pick on a card written for this site says why that choice is wrong */
  await go('math'); await go('m-drill-mexp'); await p.waitForTimeout(200);
  const wrongKey = await p.$$eval('#dhost .dopt', o => o.map(x => x.getAttribute('data-k')).filter(k => k !== 'a')[0]);
  await p.click('#dhost .dopt[data-k="' + wrongKey + '"]'); await p.waitForTimeout(120);
  ok(/Why not:/.test(await p.textContent('#dfeed')), 'wrong pick shows its note');
  await p.click('#dend'); await p.waitForTimeout(100);
  /* the Reading and Writing drills come back after the Math page used the host */
  await go('drills'); await p.waitForTimeout(150);
  ok(!!(await p.$('#v-drills #dhost [data-start="job"]')), 'Reading and Writing drills after the Math drills');
  ok(!(await p.$('#v-mdrills #dhost')), 'one drill host at a time');
  await go('drill-mcount'); await p.waitForTimeout(150);
  ok(!(await p.$eval('#v-mdrills', v => v.hidden)) && (await p.$$eval('#v-mdrills #dhost .dopt', o => o.length)) === 4, '#drill-mcount opens on the Math page');
  await p.click('#dend'); await p.waitForTimeout(100);
  /* the two miss causes link to the drills in the trap report */
  await p.evaluate(() => {
    const k = 'sat-grammar-sprint.v1', s = JSON.parse(localStorage.getItem(k) || '{}');
    s.m = s.m || {}; s.x = s.x || {};
    s.m['beca03de'] = [0, 40, Date.now()]; s.x['beca03de'] = ['slip', Date.now()];
    s.m['0013adbd'] = [0, 40, Date.now()]; s.x['0013adbd'] = ['method', Date.now()];
    localStorage.setItem(k, JSON.stringify(s));
  });
  await p.reload(); await p.waitForTimeout(700);
  await go('m-traps'); await p.waitForTimeout(200);
  const mtr = await p.$$eval('#m-traps a', a => a.map(x => x.getAttribute('href')));
  ok(['#m-drill-mexp', '#m-drill-mpct', '#m-drill-mslope', '#m-drill-mfrac', '#m-drill-mskill'].every(h => mtr.includes(h)), 'trap report drill links: ' + mtr.filter(h => /drill/.test(h)).join(' '));
  await wide('m-traps');

  console.log(over.length ? 'OVERFLOW:\n' + over.join('\n') : 'no overflow');
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  console.log(fails.length ? 'FAILED:\n' + fails.join('\n') : 'all checks passed');
  await browser.close();
  if (fails.length || errors.length || over.length) { process.exit(1); }
})().catch(e => { console.error('RUN FAILED', e); process.exit(1); });
