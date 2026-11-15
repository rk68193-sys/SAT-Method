// node src/check/prizes.js index.html [390]
// Coins, crates and the looks inside them (prizes.js, fx.js, crates.js): earning from the question of the day, opening a crate
// (skip, the prize, wearing it), the sure Epic every 10 crates, duplicates paying coins, study luck in the odds, free crates for
// a long streak and the test-day week, a streak freeze covering a missed day, two devices' backups joining without losing a coin,
// the effect on a right answer, a timed module staying plain, reduced motion, owned themes in Appearance, an aura on Home, and
// the page at phone widths. Each part starts from its own saved progress in a fresh browser.
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const file = 'file://' + path.resolve(process.argv[2] || 'index.html');
const width = Number(process.argv[3]) || 390;
const KEY = 'sat-grammar-sprint.v1';
let fails = 0, passes = 0;
function ok(c, msg) { if (c) { passes++; console.log('ok   ' + msg); } else { fails++; console.log('FAIL ' + msg); } }

/* saved progress written before the page's own scripts run, once per browser (the mark is kept in localStorage) */
function seeder(fn, arg) {
  return ([src, a, key]) => {
    try { if (localStorage.getItem('pz-check-seeded')) { return; } localStorage.setItem('pz-check-seeded', '1'); } catch (e) { return; }
    let st = {}; try { st = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { st = {}; }
    ['t', 'l', 'd', 's', 'r', 'rl', 'b', 'm', 'g', 'x'].forEach(k => { if (!st[k] || typeof st[k] !== 'object') { st[k] = {}; } });
    const dk = d => { const x = new Date(d); return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); };
    (new Function('st', 'a', 'dk', 'return (' + src + ')(st, a, dk);'))(st, a, dk);
    localStorage.setItem(key, JSON.stringify(st));
  };
}
let browser;
async function fresh(fn, arg, opt) {
  const ctx = await browser.newContext({ viewport: { width: (opt && opt.width) || width, height: 844 }, reducedMotion: opt && opt.reduce ? 'reduce' : 'no-preference' });
  if (fn) { await ctx.addInitScript(seeder(), [fn.toString(), arg === undefined ? null : arg, KEY]); }
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_FILE_NOT_FOUND/.test(m.text())) { errs.push('console: ' + m.text()); } });
  /* a real reload in the same page: a hop through another page can read localStorage before the last save reaches it */
  const go = async (hash, wait) => { await p.goto(file + '#' + hash); await p.reload(); await p.waitForTimeout(wait || 700); };
  const saved = () => p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  const done = async name => { ok(!errs.length, name + ': no script errors' + (errs.length ? ' (' + errs.join(' | ') + ')' : '')); await ctx.close(); };
  return { ctx, p, go, saved, done };
}
const bal = st => { const pz = (st.s && st.s.pz) || {}; let n = 0; Object.values(pz.e || {}).forEach(v => { n += v; }); Object.values(pz.x || {}).forEach(v => { n -= v; }); return n; };

(async () => {
  browser = await chromium.launch();

  /* ---------- earning: the question of the day ---------- */
  {
    const t = await fresh();
    await t.go('crates');
    ok((await t.p.textContent('.pz-bal b')).trim() === '0', 'a new student has 0 coins');
    ok(await t.p.$eval('[data-pz-open="pencil"]', b => b.disabled), 'a crate cannot be opened without 50 coins');
    ok((await t.p.$$('#v-crates .pz-item')).length === 56, '56 prizes in the collection, ' + (await t.p.$$('#v-crates .pz-item.locked')).length + ' still to find');
    ok(!(await t.p.$('[data-pz-open="test"]')), 'the Test Day crate is closed without a test date this week');
    ok(/Welcome: your first crate is free/.test(await t.p.textContent('#v-crates')), 'a new student gets one free welcome crate');
    await t.go('home');
    const href = await t.p.$eval('a.hqotd-rw', a => a.getAttribute('href'));
    await t.p.click('a.hqotd-rw'); await t.p.waitForTimeout(700);
    const opt = await t.p.$('.view:not([hidden]) .opt[data-k="A"]');
    ok(!!opt, 'the Reading and Writing question of the day opens (' + href + ')');
    if (opt) { await opt.click(); await t.p.waitForTimeout(400); }
    const st = await t.saved();
    const key = Object.keys(((st.s.pz || {}).e) || {}).find(k => k.indexOf('qotd.rw.') === 0);
    ok(!!key && st.s.pz.e[key] === 10, 'answering it earns 10 coins (' + key + ')');
    ok((await t.p.textContent('#pz-chip')).trim() === '10', 'the coin count in the top bar shows 10');
    await t.go('crates');
    ok(await t.p.$eval('.pz-earn li:nth-child(2)', li => li.classList.contains('done')), 'Crates marks today\'s Reading and Writing question as earned');
    await t.done('earning');
  }

  /* ---------- opening a crate: skip, the prize, wearing it ---------- */
  {
    const t = await fresh(st => { st.s.pz = { e: { seed: 500 } }; });
    await t.go('crates');
    ok((await t.p.textContent('.pz-bal b')).trim() === '500', 'seeded with 500 coins');
    await t.p.click('[data-pz-open="pencil"]'); await t.p.waitForSelector('.pz-modal');
    ok(await t.p.isVisible('#pz-skip'), 'the opening plays with a Skip button');
    await t.p.click('#pz-skip'); await t.p.waitForSelector('#pz-prize.show');
    const st = await t.saved(), rec = Object.values(st.s.pz.o)[0];
    ok(Object.keys(st.s.pz.o).length === 1 && Object.values(st.s.pz.x)[0] === 50, 'one crate opened for 50 coins');
    ok(bal(st) === 450, 'balance is 450 after the crate');
    const shown = (await t.p.textContent('#pz-prize .pz-prize-name')).trim();
    ok(!!rec && !!rec[2] && shown.length > 0, 'the prize card names the prize won: ' + shown + ' (' + rec[2] + ', ' + rec[3] + ')');
    ok(!!rec[5], 'the crate also held a sticker (' + rec[5] + ')');
    const kind = rec[2].split(':')[0];
    await t.p.click('#pz-wear-now'); await t.p.waitForTimeout(150);
    const st2 = await t.saved();
    if (kind === 'theme') { ok((await t.p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === rec[2].split(':')[1], 'Wear it puts the theme on'); }
    else { ok(st2.s.pz.eq[kind] === rec[2], 'Wear it puts the ' + kind + ' on'); }
    await t.p.click('#pz-close'); await t.p.waitForTimeout(200);
    ok(!(await t.p.$('.pz-modal')), 'Close returns to the page');
    ok(/Your collection · 1 of 56/.test(await t.p.textContent('#pz-collection h3')), 'the collection counts 1 of 56');
    await t.done('opening');
  }

  /* ---------- an Epic or better within every 10 crates ---------- */
  {
    const t = await fresh(st => { st.s.pz = { e: { seed: 500 }, o: {} }; for (let i = 0; i < 9; i++) { st.s.pz.o['old' + i] = [Date.now() - 1e6 + i, 'pencil', 'theme:prize-graphite', 'c', i ? 1 : 0, '']; } });
    await t.go('crates');
    ok(/within 1 more crate/.test(await t.p.textContent('.pz-wallet')), 'after 9 crates without an Epic, the next is promised');
    await t.p.click('[data-pz-open="pencil"]'); await t.p.waitForSelector('.pz-modal'); await t.p.click('#pz-skip');
    const st = await t.saved(), last = Object.entries(st.s.pz.o).filter(([id]) => id.indexOf('old') !== 0)[0][1];
    ok(['e', 'l', 'm'].indexOf(last[3]) >= 0, 'the 10th crate is Epic or better (' + last[3] + ')');
    await t.done('pity');
  }

  /* ---------- duplicates pay back ---------- */
  {
    const t2 = await fresh(st => {
      st.s.pz = { e: { seed: 500 }, o: {} };
      const ids = ['theme:prize-graphite', 'theme:prize-highlighter', 'theme:prize-sunrise', 'theme:prize-ocean', 'theme:prize-library', 'theme:prize-varsity', 'theme:prize-chalkboard', 'theme:prize-blueprint', 'theme:prize-lamplight', 'theme:prize-arcade', 'theme:prize-aurora', 'theme:prize-synthwave', 'theme:prize-inferno', 'theme:prize-gold', 'theme:prize-nebula', 'theme:prize-holo',
        'paper:lined', 'paper:dots', 'paper:graph', 'paper:plot', 'paper:bpgrid', 'paper:stars', 'paper:eqrain', 'paper:const', 'paper:sky',
        'fx:check', 'fx:swipe', 'fx:star', 'fx:stamp', 'fx:sparkle', 'fx:confetti', 'fx:neon', 'fx:lightning', 'fx:storm', 'fx:fireworks', 'fx:golden', 'fx:comet', 'fx:supernova', 'fx:shatter',
        'streak:candle', 'streak:coffee', 'streak:books', 'streak:rocket', 'streak:plant',
        'aura:glow', 'aura:twinkle', 'aura:orbit', 'aura:sine', 'aura:static', 'aura:ember', 'aura:spiral', 'aura:equation', 'aura:unit', 'aura:prism', 'aura:infinity', 'aura:horizon'];
      ids.forEach((id, i) => { st.s.pz.o['own' + i] = [Date.now() - 1e6 + i, 'pencil', id, 'c', 0, '']; });
    });
    await t2.go('crates');
    ok(/Your collection · 56 of 56/.test(await t2.p.textContent('#pz-collection h3')), 'with every prize owned the collection is full');
    await t2.p.click('[data-pz-open="night"]'); await t2.p.waitForSelector('.pz-modal'); await t2.p.click('#pz-skip');
    const st = await t2.saved(), id = Object.keys(st.s.pz.o).find(k => k.indexOf('own') !== 0);
    ok(st.s.pz.o[id][4] === 1 && st.s.pz.e['dupe.' + id] === 20, 'a prize already owned is a duplicate worth 20 coins');
    ok(await t2.p.isVisible('.pz-dupe') && !(await t2.p.$('#pz-wear-now')), 'the card says so and offers no Wear button');
    ok(bal(st) === 470, 'balance 500 − 50 + 20 = 470');
    await t2.done('duplicates');
  }

  /* ---------- study luck and free crates for a long streak ---------- */
  {
    const t = await fresh((st, a, dk) => { st.s.pz = { e: { seed: 200 } }; st.s.days = {}; for (let i = 0; i < 31; i++) { st.s.days[dk(Date.now() - i * 864e5)] = [1, 0]; } });
    await t.go('crates');
    const w = await t.p.textContent('.pz-wallet');
    ok(/Study luck ×2/.test(w) && /31 days in a row/.test(w), 'a 31-day streak gives study luck ×2');
    const odds = await t.p.textContent('.pz-ser-pencil .pz-odds');
    ok(/4\.9%/.test(odds) && /0\.97%/.test(odds), 'Legendary and Mythic odds doubled: ' + odds.replace(/\s+/g, ' '));
    const free = await t.p.$$eval('.pz-free h4', hs => hs.map(h => h.textContent));
    ok(free.length === 3 && free.some(h => /^Free crate$/.test(h)) && free.some(h => /Rare or better/.test(h)) && free.some(h => /Epic or better/.test(h)), 'the welcome crate and two streak crates: ' + free.join(' · '));
    const epic = await t.p.$('.pz-free:has(h4:text("Epic or better")) [data-pz-series="night"]');
    await epic.click(); await t.p.waitForSelector('.pz-modal'); await t.p.click('#pz-skip');
    const st = await t.saved(), g = Object.entries(st.s.pz.o).find(([id]) => /^g\.ms30\./.test(id));
    ok(!!g && ['e', 'l', 'm'].indexOf(g[1][3]) >= 0, 'the 30-day crate is Epic or better (' + (g && g[1][3]) + ') and cost nothing');
    ok(bal(st) === 200, 'balance unchanged at 200');
    await t.done('luck');
  }

  /* ---------- a streak freeze covers a missed day ---------- */
  {
    const t = await fresh((st, a, dk) => { st.s.pz = { e: { seed: 100 } }; st.s.days = {}; for (let i = 2; i <= 10; i++) { st.s.days[dk(Date.now() - i * 864e5)] = [1, 0]; } });
    await t.go('home');
    ok((await t.p.textContent('.hstreak-n b')).trim() === '0', 'missing yesterday ends a 9-day streak');
    await t.go('crates');
    await t.p.click('#pz-buy-freeze'); await t.p.waitForTimeout(400);
    const st = await t.saved(), y = await t.p.evaluate(() => { const x = new Date(Date.now() - 864e5); return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); });
    ok(Object.keys(st.s.pz.x).some(k => k.indexOf('freeze.') === 0) && bal(st) === 70, 'a freeze costs 30 coins');
    ok(st.s.pz.fz && st.s.pz.fz[y] === 1, 'it covers yesterday on its own (' + y + ')');
    await t.go('home');
    ok((await t.p.textContent('.hstreak-n b')).trim() === '10', 'the streak carries on: ' + (await t.p.textContent('.hstreak-n b')).trim() + ' days');
    await t.go('crates');
    ok(/Streak freezes: 0 of 2/.test(await t.p.textContent('.pz-freeze')), 'the freeze is used up');
    await t.done('freeze');
  }

  /* ---------- two devices: a backup from the other joins without losing a coin ---------- */
  {
    const t = await fresh(st => { st.s.pz = { e: { 'qotd.m.2026-11-01': 10, a: 100 }, x: { 'crate.aaa': 50 }, o: { aaa: [1, 'pencil', 'aura:glow', 'c', 0, 'pencil-0'] }, st: { 'pencil-0': 1 }, eq: { aura: 'aura:glow' } }; });
    const other = { app: 'sat-sprint', version: 1, saved: new Date().toISOString(), theme: 'auto', data: { t: {}, l: {}, d: {}, r: {}, rl: {}, b: {}, m: {}, g: {}, x: {}, s: { pz: { e: { 'qotd.m.2026-11-01': 10, b: 200 }, x: { 'crate.bbb': 50 }, o: { bbb: [2, 'night', 'fx:comet', 'l', 0, 'night-3'] }, st: { 'night-3': 1 }, g: { 'ms7.2026-10-01': [3, '', 'r', 'A 7-day streak.'] }, fz: { '2026-10-20': 1 }, eq: { fx: 'fx:comet' } } } } };
    const f = path.join(os.tmpdir(), 'pz-other-device.json'); fs.writeFileSync(f, JSON.stringify(other));
    await t.go('my-data');
    await t.p.setInputFiles('#bk-file', f); await t.p.waitForSelector('#bk-add'); await t.p.click('#bk-add'); await t.p.waitForTimeout(400);
    const pz = (await t.saved()).s.pz;
    ok(pz.e.a === 100 && pz.e.b === 200 && pz.e['qotd.m.2026-11-01'] === 10, 'coins from both devices, the shared day counted once');
    ok(pz.o.aaa && pz.o.bbb && pz.st['pencil-0'] && pz.st['night-3'], 'crates and stickers from both');
    ok(pz.g['ms7.2026-10-01'] && pz.fz['2026-10-20'] === 1, 'free crates and freezes from the other device');
    ok(pz.eq.aura === 'aura:glow' && !pz.eq.fx, 'what this device wears stays as it was');
    ok(bal({ s: { pz } }) === 210, 'balance 10 + 100 + 200 − 50 − 50 = 210');
    await t.done('two devices');
  }

  /* ---------- the effect plays on a right answer ---------- */
  {
    const t = await fresh(st => { st.s.pz = { o: { c1: [1, 'pencil', 'fx:check', 'c', 0, ''], c2: [2, 'arcade', 'fx:confetti', 'e', 0, ''] }, eq: { fx: 'fx:check' } }; });
    const answerRight = async () => {
      for (let i = 0; i < 48; i++) {
        const a = await t.p.waitForSelector('#tcard .opt[data-k="A"]:not([disabled])', { timeout: 3000 }).catch(() => null);
        if (!a) { await startSet(); continue; }
        await a.click(); await t.p.waitForTimeout(60);
        if (await t.p.$('#tcard .opt[data-k="A"].right')) { return i + 1; }
        await t.p.keyboard.press('Enter'); await t.p.waitForTimeout(160);
      }
      return 0;
    };
    const startSet = async () => { await t.go('practice'); await t.p.check('#tmode-set', { force: true }); await t.p.check('#tsrc-both', { force: true }); await t.p.click('#tstart'); await t.p.waitForTimeout(500); };
    await startSet();
    ok(await answerRight(), 'a right answer in a practice set');
    ok(!!(await t.p.$('#tcard .opt.right .pz-check')), 'the pencil check draws on it');
    ok(!(await t.p.$('#tcard .opt.wrong .pz-d')), 'nothing on a wrong answer');
    await t.go('crates'); await t.p.click('[data-pz-wear="fx"][data-pz-id="fx:confetti"]'); await t.p.waitForTimeout(150);
    ok((await t.saved()).s.pz.eq.fx === 'fx:confetti', 'Wear puts confetti on');
    await startSet();
    ok((await t.saved()).s.pz.eq.fx === 'fx:confetti', 'and it is still on in a new set');
    const got = await answerRight();
    ok(got > 0, 'a right answer in the second set (try ' + got + ')');
    ok(!!(await t.p.$('canvas.pz-over')), 'with confetti on, the right answer bursts over the page');
    await t.p.waitForTimeout(1900);
    ok(!(await t.p.$('canvas.pz-over')), 'and is gone in under 2 seconds');
    await t.done('effects');
  }

  /* ---------- a timed module stays plain ---------- */
  {
    const t = await fresh(st => { st.s.pz = { o: { p1: [1, 'night', 'paper:stars', 'e', 0, ''], c1: [2, 'pencil', 'fx:check', 'c', 0, ''] }, eq: { paper: 'paper:stars', fx: 'fx:check' } }; });
    await t.go('home', 900);
    ok(await t.p.evaluate(() => document.documentElement.classList.contains('pz-bg-on') && !!document.querySelector('canvas.pz-bg')), 'the starfield runs behind Home');
    await t.go('rw-module'); await t.p.click('#tstart'); await t.p.waitForTimeout(1000);
    ok(await t.p.evaluate(() => document.documentElement.classList.contains('pz-plain')), 'it stops during a timed module');
    await t.p.click('#rm-body .opt[data-k="C"]'); await t.p.waitForTimeout(200);
    ok(!(await t.p.$('#rm-body .pz-d')) && !(await t.p.$('canvas.pz-over')), 'no effect on a module answer');
    await t.done('timed module');
  }

  /* ---------- reduced motion ---------- */
  {
    const t = await fresh(st => { st.s.pz = { e: { seed: 500 }, o: { c2: [2, 'arcade', 'fx:confetti', 'e', 0, ''] }, eq: { fx: 'fx:confetti' } }; }, null, { reduce: true });
    await t.go('crates');
    await t.p.click('[data-pz-open="pencil"]'); await t.p.waitForTimeout(150);
    ok(await t.p.isVisible('#pz-prize.show') && !(await t.p.$('canvas.pz-rv')), 'with reduced motion the prize shows at once, with no animation');
    await t.p.click('#pz-close');
    await t.go('practice'); await t.p.check('#tmode-set', { force: true }); await t.p.check('#tsrc-both', { force: true }); await t.p.click('#tstart'); await t.p.waitForTimeout(400);
    let right = false;
    const restart = async () => { await t.go('practice'); await t.p.check('#tmode-set', { force: true }); await t.p.check('#tsrc-both', { force: true }); await t.p.click('#tstart'); await t.p.waitForTimeout(400); };
    for (let i = 0; i < 48 && !right; i++) { if (!(await t.p.waitForSelector('#tcard .opt[data-k="B"]:not([disabled])', { timeout: 3000 }).catch(() => null))) { await restart(); continue; } await t.p.click('#tcard .opt[data-k="B"]'); await t.p.waitForTimeout(60); right = !!(await t.p.$('#tcard .opt[data-k="B"].right')); if (!right) { await t.p.keyboard.press('Enter'); await t.p.waitForTimeout(150); } }
    ok(right, 'a right answer with reduced motion');
    ok(!(await t.p.$('canvas.pz-over')), 'and it plays no effect');
    await t.done('reduced motion');
  }

  /* ---------- owned themes join Appearance; an aura on Home; the Test Day week ---------- */
  {
    const t = await fresh((st, a, dk) => { st.s.pz = { e: { seed: 60 }, o: { t1: [1, 'seasons', 'theme:prize-ocean', 'c', 0, ''], a1: [2, 'test', 'aura:infinity', 'm', 0, ''], s1: [3, 'test', 'streak:plant', 'e', 0, ''] }, eq: { aura: 'aura:infinity', streak: 'streak:plant', title: 'week' } }; st.s.days = {}; for (let i = 0; i < 8; i++) { st.s.days[dk(Date.now() - i * 864e5)] = [1, 1]; } st.s.plan = { date: dk(Date.now() + 3 * 864e5), mins: 15, subj: 'both' }; });
    await t.go('home', 1000);
    ok(!!(await t.p.$('.pz-plate canvas[data-pz-aura="infinity"][data-fx-on]')), 'the Infinity aura runs around the streak on Home');
    ok(!!(await t.p.$('.hstreak-n.pz-styled .pz-si')), 'the growing plant sits beside the number');
    ok((await t.p.textContent('.pz-title')).trim() === 'Week Strong', 'the earned title shows under the streak');
    await t.p.click('#theme-btn'); await t.p.waitForTimeout(150);
    ok(!!(await t.p.$('.theme-list input[value="prize-ocean"]')) && !(await t.p.$('.theme-list input[value="prize-holo"]')), 'Appearance lists the Ocean theme won, not ones not won');
    await t.p.click('.theme-list input[value="prize-ocean"]', { force: true }); await t.p.waitForTimeout(150);
    ok((await t.p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'prize-ocean', 'choosing it puts it on');
    await t.go('crates');
    ok(!!(await t.p.$('[data-pz-open="test"]')), 'the Test Day crate opens 3 days before the test');
    ok(await t.p.$$eval('.pz-free h4', hs => hs.some(h => /Epic or better/.test(h.textContent))) && /test is this week/.test(await t.p.textContent('#v-crates')), 'with a free Test Day crate');
    await t.done('looks');
  }

  /* ---------- the page fits a phone ---------- */
  for (const w of [320, width]) {
    const t = await fresh(st => { st.s.pz = { e: { seed: 120 }, o: { a1: [2, 'test', 'aura:horizon', 'm', 0, 'test-1'], f1: [3, 'night', 'fx:comet', 'l', 0, 'night-2'] } }; }, null, { width: w });
    await t.go('crates', 900);
    const sw = await t.p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    ok(sw[0] <= sw[1] + 1, 'Crates at ' + w + ' px does not scroll sideways (' + sw.join(' ≤ ') + ')');
    await t.p.click('[data-pz-try="comet"]'); await t.p.waitForTimeout(300);
    ok(!!(await t.p.$('canvas.pz-over')), 'Try plays an owned effect at ' + w + ' px');
    await t.done('layout ' + w);
  }

  await browser.close();
  console.log(fails ? fails + ' FAILED, ' + passes + ' passed' : 'all prize checks passed (' + passes + ')');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('RUN FAILED', e); process.exit(1); });
