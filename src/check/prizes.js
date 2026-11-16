// node src/check/prizes.js index.html [390]
// Coins, crates and the looks inside them (prizes.js, fx.js, crates.js): earning from the question of the day, opening a crate
// (skip, the prize, wearing it), the sure Epic every 10 crates, duplicates paying coins, study luck in the odds, free crates for
// a long streak and the test-day week, a streak freeze covering a missed day, two devices' backups joining without losing a coin,
// the effect on a right answer, a timed module staying plain, reduced motion, owned themes in Appearance, an aura on Home, the
// coin count (top bar only where it fits on one line, always on Home), the note when coins come in, the owner's link that
// unlocks everything (tested on a copy of the page holding the hash of a throwaway code, never the real one), the Radiant tier
// (every one of its nine arrivals, the 100-day crate, and the promised Epic never bringing one), and the page at phone widths.
// Each part starts from its own saved progress in a fresh browser.
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const file = 'file://' + path.resolve(process.argv[2] || 'index.html');
const width = Number(process.argv[3]) || 390;
const KEY = 'sat-grammar-sprint.v1';
let fails = 0, passes = 0;
/* the catalog, read from the source (PZ_ITEMS in site/prizes.js): { id: kind:key, tier, series } */
const CATALOG = (() => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'site', 'prizes.js'), 'utf8'), a = src.indexOf('var PZ_ITEMS = [');
  return [...src.slice(a, src.indexOf('].map(function (r)', a)).matchAll(/\['([^']+)', '(?:[^'\\]|\\.)*', '([crelmz])', '(theme|paper|fx|streak|aura)', '([a-z]+)'/g)].map(m => ({ id: m[3] + ':' + m[1], tier: m[2], series: m[4] }));
})();
const TOTAL = CATALOG.length;
/* the sticker pages (PZ_STK): one per series, eight stickers each */
const STICKERS = (() => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'site', 'prizes.js'), 'utf8'), a = src.indexOf('var PZ_STK = {'), body = src.slice(a, src.indexOf('};', a));
  return { pages: (body.match(/^\s+[a-z]+: \[/gm) || []).length, all: (body.match(/'[^']+'/g) || []).length };
})();
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
  if (opt && opt.clock) { await p.clock.setFixedTime(new Date(opt.clock)); }
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_FILE_NOT_FOUND/.test(m.text())) { errs.push('console: ' + m.text()); } });
  /* a real reload in the same page: a hop through another page can read localStorage before the last save reaches it */
  const go = async (hash, wait) => { await p.goto(file + '#' + hash); await p.reload(); await p.waitForTimeout(wait || 700); };
  const saved = () => p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  const done = async name => { ok(!errs.length, name + ': no script errors' + (errs.length ? ' (' + errs.join(' | ') + ')' : '')); await ctx.close(); };
  return { ctx, p, go, saved, done };
}
/* in the page: is the coin count in the top bar, and is the bar as tall as without it */
const barFits = () => {
  const a = document.getElementById('pz-chip'), top = document.getElementById('top');
  if (!a || !top) { return { fits: !!top, shown: false }; }
  const shown = !a.hidden, h1 = top.offsetHeight; a.hidden = true; const h0 = top.offsetHeight; a.hidden = !shown;
  return { fits: h1 <= h0 + 2, shown, n: a.textContent.trim() };
};
const bal = st => { const pz = (st.s && st.s.pz) || {}; let n = 0; Object.values(pz.e || {}).forEach(v => { n += v; }); Object.values(pz.x || {}).forEach(v => { n -= v; }); return n; };

(async () => {
  browser = await chromium.launch();

  /* ---------- earning: the question of the day ---------- */
  {
    const t = await fresh();
    await t.go('crates');
    ok((await t.p.textContent('.pz-bal b')).trim() === '0', 'a new student has 0 coins');
    ok(await t.p.$eval('[data-pz-open="pencil"]', b => b.disabled), 'a crate cannot be opened without 50 coins');
    ok(TOTAL >= 59 && (await t.p.$$('#v-crates .pz-item')).length === TOTAL, TOTAL + ' prizes in the collection, ' + (await t.p.$$('#v-crates .pz-item.locked')).length + ' still to find');
    ok(!(await t.p.$('[data-pz-open="test"]')), 'the Test Day crate is closed without a test date this week');
    ok(!(await t.p.$('.pz-free')), 'no free crate before the first answer');
    /* Home shows the question of the day once a student has practiced; the Crates page always links to it */
    const href = await t.p.$eval('.pz-earn li:nth-child(2) a', a => a.getAttribute('href'));
    await t.p.click('.pz-earn li:nth-child(2) a'); await t.p.waitForTimeout(700);
    const opt = await t.p.$('.view:not([hidden]) .opt[data-k="A"]');
    ok(!!opt, 'the Reading and Writing question of the day opens (' + href + ')');
    if (opt) { await opt.click(); await t.p.waitForTimeout(400); }
    const st = await t.saved();
    const key = Object.keys(((st.s.pz || {}).e) || {}).find(k => k.indexOf('qotd.rw.') === 0);
    ok(!!key && st.s.pz.e[key] === 10, 'answering it earns 10 coins (' + key + ')');
    const note = await t.p.evaluate(() => { const el = document.querySelector('#pz-toast.show'); return el ? el.textContent : ''; });
    ok(/\+10 coins/.test(note) && /Question of the day/.test(note) && /free crate/.test(note), 'a note says what was earned: ' + note);
    ok(await t.p.$eval('#pz-toast', el => getComputedStyle(el).pointerEvents === 'none' && getComputedStyle(el.firstChild).pointerEvents === 'none'), 'the note never takes a tap from the page under it');
    const chip = await t.p.evaluate(barFits);
    ok(chip.fits && (!chip.shown || chip.n === '10'), 'the coin count does not make the top bar taller at ' + width + ' px (' + (chip.shown ? 'shown: ' + chip.n : 'left to Home') + ')');
    await t.go('home');
    ok(/^10 coins · 1 free crate · Open crates$/.test((await t.p.textContent('.pz-homecoins')).trim()), 'Home shows the coins and the free crate: ' + (await t.p.textContent('.pz-homecoins')).trim());
    await t.go('crates');
    ok(await t.p.$eval('.pz-earn li:nth-child(2)', li => li.classList.contains('done')), 'Crates marks today\'s Reading and Writing question as earned');
    ok(/Welcome: your first crate is free/.test(await t.p.textContent('#v-crates')), 'the first answer brings the free welcome crate');
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
    ok((await t.p.textContent('#pz-collection h3')).includes('Your collection · 1 of ' + TOTAL), 'the collection counts 1 of ' + TOTAL);
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
    const t2 = await fresh((st, ids) => {
      st.s.pz = { e: { seed: 500 }, o: {} };
      ids.forEach((id, i) => { st.s.pz.o['own' + i] = [Date.now() - 1e6 + i, 'pencil', id, 'c', 0, '']; });
    }, CATALOG.map(it => it.id));
    await t2.go('crates');
    ok((await t2.p.textContent('#pz-collection h3')).includes('Your collection · ' + TOTAL + ' of ' + TOTAL), 'with every prize owned the collection is full');
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
    ok(/4\.8%/.test(odds) && /0\.97%/.test(odds) && /0\.19%/.test(odds), 'Legendary, Mythic and Radiant odds doubled: ' + odds.replace(/\s+/g, ' '));
    const free = await t.p.$$eval('.pz-free h4', hs => hs.map(h => h.textContent));
    ok(free.length === 3 && free.some(h => /^Free crate$/.test(h)) && free.some(h => /Rare or better/.test(h)) && free.some(h => /Epic or better/.test(h)), 'the welcome crate and two streak crates: ' + free.join(' · '));
    const epic = await t.p.$('.pz-free:has(h4:text("Epic or better")) [data-pz-series="night"]');
    await epic.click(); await t.p.waitForSelector('.pz-modal'); await t.p.click('#pz-skip');
    const st = await t.saved(), g = Object.entries(st.s.pz.o).find(([id]) => /^g\.ms30\./.test(id));
    ok(!!g && ['e', 'l', 'm', 'z'].indexOf(g[1][3]) >= 0, 'the 30-day crate is Epic or better (' + (g && g[1][3]) + ') and cost nothing');
    ok(bal(st) === 200, 'balance unchanged at 200');
    await t.done('luck');
  }

  /* ---------- Radiant: 0.1% of every crate, its own arrival for each of the nine, the 100-day crate, and the promise never brings one ---------- */
  {
    const RAD = CATALOG.filter(it => it.tier === 'z');
    ok(RAD.length === 9 && new Set(RAD.map(it => it.id.split(':')[0])).size === 5, RAD.length + ' Radiant prizes, covering all five kinds');
    const t = await fresh((st, a, dk) => { st.s.pz = { e: { seed: 1000 } }; st.s.days = {}; for (let i = 0; i < 120; i++) { st.s.days[dk(Date.now() - i * 864e5)] = [1, 0]; } });
    await t.go('crates');
    const odds = (await t.p.textContent('.pz-ser-pencil .pz-odds')).replace(/\s+/g, ' ');
    ok(/Radiant\s*0\.19%/.test(odds) && /Mythic\s*0\.97%/.test(odds), 'every crate can give a Radiant, and study luck doubles it: ' + odds);
    const locked = await t.p.$$eval('#pz-collection .pz-item.locked', els => els.filter(e => e.querySelector('.pz-t-z')).map(e => e.textContent.replace(/\s+/g, ' ')));
    ok(locked.length === 9 && locked.every(x => /1 in 9,000/.test(x) && /In any crate/.test(x)), 'each Radiant still to find says 1 in 9,000, in any crate: ' + (locked[0] || 'none'));
    /* the 100-day crate is Mythic or better */
    const free = await t.p.$$eval('.pz-free h4', hs => hs.map(h => h.textContent));
    ok(free.some(h => /Mythic or better/.test(h)), 'the 100-day streak crate is Mythic or better: ' + free.join(' · '));
    const top = await t.p.$('.pz-free:has(h4:text("Mythic or better")) [data-pz-series="night"]');
    await top.click(); await t.p.waitForSelector('.pz-modal'); await t.p.click('#pz-skip');
    const g = Object.entries((await t.saved()).s.pz.o).find(([id]) => /^g\.ms100\./.test(id));
    ok(!!g && ['m', 'z'].indexOf(g[1][3]) >= 0, 'and opening it gives a Mythic or a Radiant (' + (g && g[1][3]) + ')');
    await t.p.click('#pz-close'); await t.p.waitForTimeout(200);
    /* the draw takes four random numbers in turn: the crate's id, the tier, the prize and the sticker. These make the next crate a
       Radiant, and pick the prize: in the Pencil Case crate each Radiant is as likely as the next, so (j + 0.5) / 9 picks the j-th. */
    const force = q => t.p.evaluate(q => {
      const real = Math.random;
      document.addEventListener('click', function once(e) {
        if (!e.target.closest('[data-pz-open]')) { return; }
        document.removeEventListener('click', once, true);
        const seq = [0.5, 0.9995, q, 0.25]; let i = 0;
        Math.random = () => (i < seq.length ? seq[i++] : real());
        setTimeout(() => { Math.random = real; }, 0);
      }, true);
    }, q);
    /* how many sampled points of the arrival are lit: more than the dark it opens with */
    const lit = () => t.p.evaluate(() => { const cv = document.querySelector('canvas.pz-rv'); if (!cv || !cv.width) { return 0; } const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 64) { if (d[i + 3] > 0 && d[i] + d[i + 1] + d[i + 2] > 150) { n++; } } return n; });
    const got = [], wrong = [], slow = [], dark = [];
    for (let j = 0; j < RAD.length; j++) {
      await force((j + 0.5) / RAD.length);
      const t0 = Date.now();
      await t.p.click('[data-pz-open="pencil"]'); await t.p.waitForSelector('.pz-modal');
      const rec = Object.values((await t.saved()).s.pz.o).sort((a, b) => b[0] - a[0])[0];
      if (rec[2] !== RAD[j].id || rec[3] !== 'z') { wrong.push(RAD[j].id + ' gave ' + rec[2]); }
      /* two seconds into the arrival: the scene is drawing and the card is still hidden */
      await t.p.waitForTimeout(Math.max(0, 4600 - (Date.now() - t0)));
      if ((await lit()) < 20 || (await t.p.isVisible('#pz-prize.show'))) { dark.push(RAD[j].id); }
      await t.p.waitForSelector('#pz-prize.show', { timeout: 12000 });
      const ms = Date.now() - t0, card = (await t.p.textContent('#pz-prize')).replace(/\s+/g, ' ');
      if (ms < 7400 || ms > 9800) { slow.push(RAD[j].id + ' ' + ms + ' ms'); }
      got.push(RAD[j].id.split(':')[1] + ' ' + (ms / 1000).toFixed(1) + ' s');
      if (!/Radiant/.test(card) || !/1 in 9,000/.test(card)) { wrong.push(RAD[j].id + ' card: ' + card); }
      await t.p.waitForTimeout(1300);
      await t.p.click('#pz-close'); await t.p.waitForTimeout(250);
    }
    ok(!wrong.length, 'all nine can be won, and each card names its tier and odds' + (wrong.length ? ': ' + wrong.join('; ') : ''));
    ok(!dark.length, 'each plays its own arrival, with the card hidden until it ends' + (dark.length ? '; not drawing: ' + dark.join(', ') : ''));
    ok(!slow.length, 'and the card shows once the arrival ends, about 8 seconds after opening: ' + got.join(', ') + (slow.length ? '; off: ' + slow.join(', ') : ''));
    ok(!(await t.p.$('canvas.pz-rv')), 'nothing is left on screen after the last one');
    ok((await t.p.$$eval('.pz-titles li.have', li => li.map(x => x.textContent))).some(x => /Mythic Finder/.test(x)), 'a Radiant earns the Mythic Finder title');
    /* the Learning tree beside the streak on Home: at 120 days, the great tree with lanterns */
    await t.p.click('[data-pz-wear="streak"][data-pz-id="streak:tree"]'); await t.p.waitForTimeout(300);
    await t.go('home', 900);
    ok(!!(await t.p.$('.hstreak-n.pz-styled svg.zt.zt-great')), 'the Learning tree shows beside a 120-day streak, with lanterns');
    await t.done('radiant');
  }

  /* ---------- the promised Epic never brings a Radiant ---------- */
  {
    const t = await fresh(st => { st.s.pz = { e: { seed: 500 }, o: {} }; for (let i = 0; i < 9; i++) { st.s.pz.o['old' + i] = [Date.now() - 1e6 + i, 'pencil', 'theme:prize-graphite', 'c', i ? 1 : 0, '']; } });
    await t.go('crates');
    await t.p.evaluate(() => {
      const real = Math.random;
      document.addEventListener('click', function once(e) {
        if (!e.target.closest('[data-pz-open]')) { return; }
        document.removeEventListener('click', once, true);
        const seq = [0.5, 0.9995]; let i = 0;
        Math.random = () => (i < seq.length ? seq[i++] : real());
        setTimeout(() => { Math.random = real; }, 0);
      }, true);
    });
    await t.p.click('[data-pz-open="pencil"]'); await t.p.waitForSelector('.pz-modal'); await t.p.click('#pz-skip');
    const last = Object.entries((await t.saved()).s.pz.o).filter(([id]) => id.indexOf('old') !== 0)[0][1];
    ok(last[3] === 'm', 'a draw at the very top of the odds gives the 10th crate a Mythic, not a Radiant (' + last[3] + ')');
    await t.done('promise');
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
    await t.p.waitForTimeout(800);   /* let the save land before the reload */
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
    /* "10 questions of every level" starts a set straight from its link */
    const startSet = async () => { await t.go('rw-mixed', 900); };
    await startSet();
    ok(await answerRight(), 'a right answer in a practice set');
    ok(!!(await t.p.$('#tcard .opt.right .pz-check')), 'the pencil check draws on it');
    ok(!(await t.p.$('#tcard .opt.wrong .pz-d')), 'nothing on a wrong answer');
    await t.go('crates'); await t.p.click('[data-pz-wear="fx"][data-pz-id="fx:confetti"]'); await t.p.waitForTimeout(150);
    ok((await t.saved()).s.pz.eq.fx === 'fx:confetti', 'Wear puts confetti on');
    /* the next set starts from inside the page, the way a student starts one: in this test browser a reload straight after a
       save can read the saved progress from before it */
    await t.p.evaluate(() => { location.hash = 'rw-mixed'; }); await t.p.waitForTimeout(900);
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
    await t.go('rw-mixed', 900);
    let right = false;
    const restart = async () => { await t.go('rw-mixed', 900); };
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

  /* ---------- the Seasons crate follows the school year (on a fixed clock) ---------- */
  {
    const tiles = p => p.$$eval('#pz-collection .pz-item.locked', els => els.map(e => ({ tier: (e.querySelector('.pz-tier') || {}).className || '', n: Number(((e.querySelector('.pz-one') || {}).textContent || '').replace(/^1 in /, '').replace(/[^0-9]/g, '')), seasons: /In Seasons/.test(e.textContent), inSeason: !!e.querySelector('.pz-inseason') })));
    for (const [when, season, want, count] of [['2026-10-15T12:00:00', 'Fall', ['Falling leaves', 'Ember crown'], 2], ['2027-01-20T12:00:00', 'Winter', ['Snowfall', 'Aurora sky', 'Aurora'], 3], ['2027-04-10T12:00:00', 'Spring', ['Blossoms', 'Sunrise'], 2], ['2027-07-04T12:00:00', 'Summer', ['Ocean', 'Inferno'], 2]]) {
      const t = await fresh(null, null, { clock: when });
      await t.go('crates');
      const line = await t.p.textContent('.pz-ser-seasons .pz-season');
      const all = await tiles(t.p), marked = all.filter(x => x.inSeason);
      ok(line.includes('In season now · ' + season + ':') && want.every(w => line.includes(w)) && marked.length === count && marked.every(x => x.seasons), season + ': the Seasons crate names ' + want.join(', ') + ', and their tiles say In season');
      if (season === 'Fall') {
        /* in the same tier and crate, a prize in season is twice as likely as one out of season: Falling leaves and Snowfall */
        const rare = all.filter(x => x.seasons && /pz-t-r\b/.test(x.tier)), inR = rare.find(x => x.inSeason), outR = rare.find(x => !x.inSeason);
        ok(!!inR && !!outR && Math.abs(outR.n - 2 * inR.n) <= 1, 'in season the odds double: 1 in ' + (inR && inR.n) + ' against 1 in ' + (outR && outR.n) + ' out of season');
      }
      await t.done('season ' + season);
    }
    /* the three new backgrounds draw behind the page */
    const t = await fresh(st => { st.s.pz = { o: { a: [1, 'seasons', 'paper:leaves', 'r', 0, ''], b: [2, 'seasons', 'paper:snow', 'r', 0, ''], c: [3, 'seasons', 'paper:blossoms', 'e', 0, ''] }, eq: { paper: 'paper:leaves' } }; });
    const drawn = () => t.p.evaluate(() => { const cv = document.querySelector('canvas.pz-bg'); if (!cv || !cv.width) { return 0; } const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) { if (d[i] > 0) { n++; } } return n; });
    for (const key of ['leaves', 'snow', 'blossoms']) {
      if (key !== 'leaves') { await t.go('crates'); await t.p.click('[data-pz-wear="paper"][data-pz-id="paper:' + key + '"]'); await t.p.waitForTimeout(800); }
      await t.go('home', 1200);
      ok((await drawn()) > 20, key + ' draws behind Home');
    }
    await t.done('seasonal backgrounds');
  }

  /* ---------- the coin count in the top bar: shown where it fits, never making the bar taller ---------- */
  for (const w of [320, width, 1280]) {
    const t = await fresh((st, a, dk) => { st.s.pz = { e: { seed: 120 } }; st.s.days = {}; st.s.days[dk(Date.now())] = [1, 0]; }, null, { width: w });
    await t.go('home');
    const rows = [];
    for (const z of ['', 'l', '']) {
      await t.p.evaluate(z => { if (z) { document.documentElement.setAttribute('data-size', z); } else { document.documentElement.removeAttribute('data-size'); } }, z);
      await t.p.waitForTimeout(120);
      const r = await t.p.evaluate(barFits); rows.push((z || 'normal') + ':' + (r.shown ? r.n : 'off') + (r.fits ? '' : ' (wraps)'));
      if (!r.fits) { break; }
    }
    ok(rows.every(r => !/wraps/.test(r)), 'at ' + w + ' px the coin count never makes the top bar taller, at either text size: ' + rows.join(', '));
    if (w >= 1024) { ok(rows[0] === 'normal:120' && rows[2] === 'normal:120', 'on a computer the top bar shows the 120 coins'); }
    ok((await t.p.textContent('.pz-homecoins b')).trim() === '120', 'Home shows the 120 coins at ' + w + ' px');
    await t.done('top bar ' + w);
  }

  /* ---------- the owner's link: the page holds only the hash of its code; a copy made for this check holds a test code's ---------- */
  {
    const crypto = require('crypto');
    const src = fs.readFileSync(path.resolve(process.argv[2] || 'index.html'), 'utf8');
    const m = src.match(/PZ_GIFT = '([0-9a-f]{64})'/);
    ok(!!m, 'the page holds the owner\'s link only as a SHA-256 hash');
    const code = 'check' + crypto.randomBytes(12).toString('hex');
    const tmp = path.join(os.tmpdir(), 'pz-gift-check-' + process.pid + '.html');
    fs.writeFileSync(tmp, src.replace(m[0], "PZ_GIFT = '" + crypto.createHash('sha256').update(code).digest('hex') + "'"));
    const page = 'file://' + tmp;
    const t = await fresh((st, a, dk) => { st.s.pz = { e: { seed: 40 } }; st.s.days = {}; st.s.days[dk(Date.now())] = [1, 0]; });
    const hash = () => t.p.evaluate(() => location.hash);
    await t.p.goto(page + '#home'); await t.p.reload(); await t.p.waitForTimeout(700);
    await t.p.evaluate(() => { location.hash = 'gift-wrongwrongwrongwrong'; }); await t.p.waitForTimeout(600);
    ok((await hash()) === '#crates' && /does not unlock/.test(await t.p.textContent('#pz-toast')), 'a wrong code unlocks nothing, and leaves the address bar for Crates');
    ok((await t.p.textContent('#pz-collection h3')).includes('Your collection · 0 of ' + TOTAL), 'the collection is still empty');
    await t.p.evaluate(c => { location.hash = 'gift-' + c; }, code); await t.p.waitForTimeout(800);
    const st = await t.saved();
    ok((await hash()) === '#crates', 'the right code leaves the address bar at once');
    ok((await t.p.textContent('#pz-collection h3')).includes('Your collection · ' + TOTAL + ' of ' + TOTAL), 'it unlocks all ' + TOTAL + ' prizes');
    ok(STICKERS.pages >= 9 && Object.keys(st.s.pz.st).length === STICKERS.all && Object.keys(st.s.pz.g).filter(k => /^page\./.test(k)).length === STICKERS.pages, 'every sticker (' + STICKERS.all + '), with the free crate for each of the ' + STICKERS.pages + ' full sticker pages');
    ok((await t.p.$$('[data-pz-title]')).length === 7, 'every title can be shown');
    ok((await t.p.textContent('.pz-bal b')).trim() === '10,040' && bal(st) === 10040, 'and 10,000 coins on top of the 40 there were, shown as 10,040');
    ok(/Everything is unlocked/.test(await t.p.textContent('#pz-toast')), 'a note says so');
    const back = [];
    for (let i = 0; i < 3; i++) { await t.p.goBack(); await t.p.waitForTimeout(250); back.push(await hash()); }
    ok(back.every(h => h.indexOf('#gift') !== 0), 'Back never returns to a link with a code in it: ' + back.join(', '));
    /* the link as the first page opened: lands on Crates, and a second time adds nothing */
    await t.p.goto(page + '?again#gift-' + code); await t.p.waitForTimeout(900);
    const st2 = await t.saved();
    ok((await hash()) === '#crates' && (await t.p.textContent('#pz-collection h3')).includes('Your collection · ' + TOTAL + ' of ' + TOTAL), 'opened as a new page, it lands on Crates');
    ok(bal(st2) === 10040, 'opening it again adds no more coins');
    fs.unlinkSync(tmp);
    await t.done('owner link');
  }

  /* ---------- every look draws: each effect from Try, each aura on its tile, the newer moving backgrounds and living themes ---------- */
  {
    const t = await fresh((st, ids) => { st.s.pz = { o: {} }; ids.forEach((id, i) => { st.s.pz.o['all' + i] = [i + 1, 'pencil', id, 'c', 0, '']; }); }, CATALOG.map(it => it.id));
    await t.go('crates', 1500);
    const inked = sel => t.p.evaluate(q => { const cv = document.querySelector(q); if (!cv || !cv.width) { return 0; } const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) { if (d[i] > 0) { n++; } } return n; }, sel);
    const fx = CATALOG.filter(it => it.id.indexOf('fx:') === 0).map(it => it.id.slice(3)), silent = [];
    for (const k of fx) {
      const b = await t.p.$('[data-pz-try="' + k + '"]'); if (!b) { silent.push(k + ' (no Try)'); continue; }
      await b.evaluate(el => el.closest('.pz-item').scrollIntoView({ block: 'center' })); await t.p.waitForTimeout(120);
      await t.p.evaluate(() => document.querySelectorAll('canvas.pz-over, .pz-shards').forEach(n => { n.dataset.seen = '1'; }));
      await b.click(); await t.p.waitForTimeout(350);
      const on = await b.evaluate(el => !!document.querySelector('canvas.pz-over:not([data-seen]), .pz-shards:not([data-seen])') || !!el.closest('.pz-item').querySelector('.pz-d, .pz-neon-run'));
      if (!on) { silent.push(k); }
    }
    ok(!silent.length, 'all ' + fx.length + ' right-answer effects play from Try' + (silent.length ? '; silent: ' + silent.join(', ') : ''));
    await t.p.waitForTimeout(3600);
    const auras = await t.p.$$eval('#pz-collection canvas[data-pz-aura]', cs => cs.map(c => c.getAttribute('data-pz-aura'))), dark = [];
    for (const a of auras) {
      const sel = '#pz-collection canvas[data-pz-aura="' + a + '"]';
      await t.p.$eval(sel, c => c.scrollIntoView({ block: 'center' })); await t.p.waitForTimeout(450);
      if ((await inked(sel)) < 20) { dark.push(a); }
    }
    ok(auras.length === CATALOG.filter(it => it.id.indexOf('aura:') === 0).length && !dark.length, 'all ' + auras.length + ' auras draw on their tiles' + (dark.length ? '; blank: ' + dark.join(', ') : ''));
    const bare = [];
    for (const id of ['paper:bubbles', 'paper:kelp', 'paper:fireflies', 'paper:circuit', 'paper:warp', 'paper:cobweb', 'paper:meteors', 'paper:ufo', 'paper:lava', 'paper:kaleido', 'paper:whale', 'paper:planes', 'paper:rain', 'paper:gears', 'paper:orbit-view', 'paper:gyre', 'theme:prize-beacon', 'theme:prize-metropolis', 'theme:prize-summit', 'theme:prize-haunted', 'theme:prize-eldritch', 'theme:prize-lanterns', 'theme:prize-abyss', 'theme:prize-enchanted', 'theme:prize-terminal']) {
      const slot = id.split(':')[0], b = await t.p.$('[data-pz-wear="' + slot + '"][data-pz-id="' + id + '"]');
      if (!b) { bare.push(id + ' (no Wear)'); continue; }
      await b.evaluate(el => el.scrollIntoView({ block: 'center' })); await b.click(); await t.p.waitForTimeout(900);
      if ((await inked('canvas.pz-bg')) < 20) { bare.push(id); }
    }
    ok(!bare.length, 'the newer moving backgrounds and living themes draw behind the page' + (bare.length ? '; blank: ' + bare.join(', ') : ''));
    await t.done('every look');
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
