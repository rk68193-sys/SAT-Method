/* The question of the day, the streak and the weeks of practice; the backup file (save, erase, restore, add); and the
   site with no connection. The page is served from this folder over http://localhost, because a service worker needs that.
   node src/check/habit.js index.html [width] [shots-folder] */
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { chromium } = require('playwright');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
(async () => {
  const root = path.dirname(path.resolve(process.argv[2])), index = path.basename(process.argv[2]);
  const width = Number(process.argv[3] || 390), dir = process.argv[4] || '';
  if (dir) { fs.mkdirSync(dir, { recursive: true }); }
  let serving = true;
  const server = http.createServer((req, res) => {
    if (!serving) { req.socket.destroy(); return; }
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.endsWith('/')) { rel += index; }
    const f = path.join(root, rel);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'Last-Modified': fs.statSync(f).mtime.toUTCString() });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://localhost:' + server.address().port + '/';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errors = [], over = [], fail = [];
  let quiet = false;
  const ok = (cond, what) => { if (!cond) { fail.push(what); } console.log((cond ? 'ok   ' : 'FAIL ') + what); };
  p.on('console', m => { if (!quiet && m.type() === 'error' && !/ERR_|fonts\.g|Failed to load resource/i.test(m.text())) { errors.push('console: ' + m.text()); } });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  let say = true;
  p.on('dialog', d => (say ? d.accept() : d.dismiss()));
  const shot = async (n, full) => { if (dir) { await p.screenshot({ path: path.join(dir, 'habit-' + width + '-' + n + '.png'), fullPage: !!full }); } };
  const wide = async t => { const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (r[0] > r[1] + 1) { over.push(t + ': ' + r[0] + '>' + r[1]); } };
  const go = async t => { await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(300); };
  const text = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const store = () => p.evaluate(() => JSON.parse(localStorage.getItem('sat-grammar-sprint.v1')));
  const KEY = 'sat-grammar-sprint.v1';
  const T0 = new Date(2026, 10, 12, 10, 0, 0).getTime(), DAY = 86400000, key = t => { const d = new Date(t); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  const answerMath = async () => {
    await p.waitForSelector('#v-mprac .mpcard', { timeout: 15000 });
    if (await p.$('#v-mprac .mpcard .mpch[data-k="A"]')) { await p.click('#v-mprac .mpcard .mpch[data-k="A"]'); }
    else { await p.fill('#mp-gin', '7'); await p.press('#mp-gin', 'Enter'); }
    await p.waitForTimeout(300);
  };
  const answerRW = async () => { await p.waitForSelector('#tcard .opt[data-k="A"]', { timeout: 15000 }); await p.click('#tcard .opt[data-k="A"]'); await p.waitForTimeout(300); };
  const today = () => p.evaluate(() => ({
    line: document.querySelector('#htoday .hsec-h .muted').textContent,
    m: document.querySelector('#htoday .hqotd-math').getAttribute('href'), mDone: document.querySelector('#htoday .hqotd-math').classList.contains('done'),
    rw: document.querySelector('#htoday .hqotd-rw').getAttribute('href'), rwDone: document.querySelector('#htoday .hqotd-rw').classList.contains('done'),
    n: document.querySelector('#htoday .hstreak-n b').textContent, now: (document.querySelector('#htoday .hcal-c.now') || { title: '' }).title
  }));

  await p.clock.setFixedTime(T0);
  await p.goto(base); await p.waitForTimeout(800);

  /* ---------- the question of the day, the streak, the weeks ---------- */
  let t = await today();
  ok(/^#mq-[0-9a-f]{8}$/.test(t.m) && /^#rq-[0-9a-f]{8}$/.test(t.rw), 'Home has a question of the day for Math and for Reading and Writing: ' + t.m + ' ' + t.rw);
  ok(t.n === '0' && t.line.includes('Answer one question to start a streak') && !t.mDone && !t.rwDone, 'a new visitor has no streak yet');
  ok((await p.$$('#htoday .hcal-w')).length === (width > 760 ? 26 : 13) && /no practice$/.test(t.now), 'the last weeks are shown (13 on a phone, 26 on a wide screen), today marked and empty');
  await wide('home new'); await shot('today-new');
  const day1 = t;
  await p.click('#htoday .hqotd-math'); await answerMath();
  let s = await store();
  ok(Array.isArray(s.m[day1.m.slice(4)]) && s.s.days[key(T0)].join() === '1,0', 'answering the Math one is saved as practice, and the day is counted: ' + JSON.stringify(s.s.days));
  await go('home'); t = await today();
  ok(t.mDone && !t.rwDone && t.n === '1' && t.line.includes('1 day in a row, today included'), 'Home marks it answered and the streak starts: ' + t.line);
  await p.click('#htoday .hqotd-rw'); await answerRW();
  s = await store();
  ok(s.s.days[key(T0)].join() === '1,1', 'the Reading and Writing one counts for its own section: ' + s.s.days[key(T0)]);
  await go('home'); t = await today();
  ok(t.mDone && t.rwDone && /2 questions \(Math 1, Reading & Writing 1\)$/.test(t.now), 'both are marked, and today shows both sections: ' + t.now);
  await wide('home day 1'); await shot('today-done', true);

  await p.clock.setFixedTime(T0 + DAY); await p.reload(); await p.waitForTimeout(700);
  t = await today();
  ok(t.m !== day1.m && t.rw !== day1.rw && !t.mDone && !t.rwDone, 'the next day brings two new questions: ' + t.m + ' ' + t.rw);
  ok(t.n === '1' && t.line.includes('Your streak is 1 day. Answer one question today to keep it'), 'yesterday’s streak is still alive: ' + t.line);
  await p.click('#htoday .hqotd-rw'); await answerRW(); await go('home'); t = await today();
  ok(t.n === '2' && t.line.includes('2 days in a row'), 'one answer today makes it two days');
  await p.clock.setFixedTime(T0 + 4 * DAY); await p.reload(); await p.waitForTimeout(700);
  t = await today();
  ok(t.n === '0' && t.line.includes('No streak right now. Your longest so far is 2 days'), 'two missed days end it, and the longest is remembered: ' + t.line);
  await shot('today-broken');

  // progress saved before any of this existed still counts
  await p.evaluate(a => {
    const st = JSON.parse(localStorage.getItem(a.KEY)); delete st.s.days;
    st.m = {}; a.ids.forEach((id, i) => { st.m[id] = [1, 30, a.now - i * 86400000]; });
    localStorage.setItem(a.KEY, JSON.stringify(st));
  }, { KEY, now: T0 + 4 * DAY, ids: [day1.m.slice(4), t.m.slice(4)] });
  await p.reload(); await p.waitForTimeout(700); t = await today();
  s = await p.evaluate(() => document.querySelectorAll('#htoday .hcal-c.l1, #htoday .hcal-c.l2').length);
  ok(t.n === '2' && s >= 4, 'older saved answers are turned into days the first time (streak ' + t.n + ', ' + s + ' days shown)');
  await go('plan');
  ok(await p.isVisible('#plan-form') && await p.isVisible('#v-plan .data-line a[href="#my-data"]'), 'before there is a plan, the plan page already links to the backup page');
  await p.fill('#plan-date', key(T0 + 40 * DAY)); await p.click('#plan-form button[type="submit"]'); await p.waitForTimeout(300);
  ok((await p.$$('#plan-days .hcal-w')).length === 13 && (await text('#plan-days .lede')).includes('2 days in a row'), 'the plan page shows the streak and the weeks');
  ok(await p.isVisible('#v-plan .data-line a[href="#my-data"]'), 'and a link to back the progress up');
  for (const m of ['m-map', 'rw-map']) { await go(m); ok(await p.isVisible('#v-' + (m === 'm-map' ? 'mmap' : 'rwmap') + ' .data-line a[href="#my-data"]'), m + ' links to the backup page'); }

  /* ---------- the backup file ---------- */
  // richer progress first: a miss with its reason in each section and a note, beside the plan
  await go('mq-' + day1.m.slice(4)); await answerMath();
  const why = await p.$('.mwhy-b[data-why="trap"]'); if (why) { await why.click(); }
  await go(day1.rw.slice(1)); await answerRW();
  if (await p.$('label:has(#tcause-evidence)')) { await p.click('label:has(#tcause-evidence)'); }
  if (await p.$('#tevidence')) { await p.fill('#tevidence', 'The word "however" <b>flips</b> it & more'); await p.dispatchEvent('#tevidence', 'change'); await p.waitForTimeout(100); }
  await go('suggest-notes'); await p.fill('#sg-notes', 'x < 5 means "less than"'); await p.waitForTimeout(600);
  await go('my-data');
  ok((await text('#data-here')).includes('Math questions answered') && (await text('#data-here')).includes('Reading & Writing questions answered'), 'the page lists what is saved for both sections');
  ok((await p.$$('#data-days .hcal-w')).length === 26, 'and half a year of practice days');
  ok((await text('#bk-ago')).includes('not made a backup'), 'it says no backup has been made yet');
  await wide('my data'); await shot('data', true);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#bk-save')]);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sat-bk-')), bkPath = path.join(tmp, dl.suggestedFilename());
  await dl.saveAs(bkPath);
  const bk = JSON.parse(fs.readFileSync(bkPath, 'utf8')), before = await store();
  ok(/^sat-sprint-backup-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()) && bk.app === 'sat-sprint' && bk.version === 1, 'the backup is one dated file: ' + dl.suggestedFilename());
  ok(JSON.stringify(bk.data) === JSON.stringify(before) && Object.keys(bk.data.m).length >= 2 && typeof bk.data.s.bk === 'number', 'it holds everything saved here, both sections');
  ok((await text('#bk-ago')).includes('Downloaded sat-sprint-backup'), 'the page confirms the download');

  say = false; await p.click('#bk-erase'); await p.waitForTimeout(200);
  ok(Object.keys((await store()).m).length >= 2, 'erasing asks first: saying no keeps everything');
  say = true; await p.click('#bk-erase'); await p.waitForTimeout(300);
  s = await store();
  ok(!Object.keys(s.m).length && !Object.keys(s.t).length && !Object.keys(s.r).length && !Object.keys(s.b).length && !s.s.plan, 'saying yes clears every answer and the plan');
  ok((await text('#data-msg')).includes('Erased') && await p.isDisabled('#bk-save'), 'the page says so, and there is nothing left to back up');

  await p.setInputFiles('#bk-file', bkPath); await p.waitForSelector('#bk-add');
  ok((await text('#bk-found')).includes('In the file:') && (await text('#bk-found')).includes(Object.keys(bk.data.m).length + ' Math answers'), 'choosing the file shows what is in it: ' + (await text('#bk-found .plainlist')));
  await wide('restore found'); await shot('restore-found', true);
  await p.click('#bk-replace'); await p.waitForTimeout(300);
  ok(JSON.stringify(await store()) === JSON.stringify(bk.data), 'Replace brings back exactly what the file holds (nothing lost in checking it)');
  ok((await text('#data-msg')).includes('Restored'), 'and says so');
  await go('practice'); await go('my-data');
  ok(!(await p.evaluate(() => window.__bad)), 'saved free text is shown as text, never run');

  // adding a second device's backup: the newer attempt at each question stays
  const idA = Object.keys(bk.data.m)[0], idB = Object.keys(bk.data.m)[1];
  const other = JSON.parse(JSON.stringify(bk));
  other.data.m = {};
  other.data.m[idA] = [bk.data.m[idA][0] ? 0 : 1, 11, bk.data.m[idA][2] + 5000];       // newer on the other device
  other.data.m[idB] = [bk.data.m[idB][0] ? 0 : 1, 12, bk.data.m[idB][2] - 5000];       // older on the other device
  other.data.m['00000000'] = [1, 5, T0];                                                // not a question: ignored in counts
  other.data.s.days = {}; other.data.s.days[key(T0 - 10 * DAY)] = [3, 4]; other.data.s.days[key(T0)] = [9, 0];
  other.data.s.notes = 'from the other device';
  other.data.s.plan = { date: key(T0 + 99 * DAY), mins: 15, subj: 'm' };
  other.data.s.evil = '<img src=x onerror="window.__bad=1">';
  other.data.g = { '1"><img src=x onerror=window.__bad=1>': { k: 'x', w: 'y', t: 'z' } };
  other.data.t['zz<b>'] = { c: 1, at: T0 };
  const otherPath = path.join(tmp, 'sat-sprint-backup-other.json'); fs.writeFileSync(otherPath, JSON.stringify(other));
  const here = await store();
  await p.setInputFiles('#bk-file', otherPath); await p.waitForSelector('#bk-add'); await p.click('#bk-add'); await p.waitForTimeout(300);
  s = await store();
  ok(s.m[idA][1] === 11 && s.m[idB][1] === here.m[idB][1], 'Add keeps the newer attempt from either side');
  ok(s.s.days[key(T0 - 10 * DAY)].join() === '3,4' && s.s.days[key(T0)][0] === 9 && s.s.days[key(T0)][1] === (here.s.days[key(T0)] || [0, 0])[1], 'days are joined, the larger count for a day on both: ' + JSON.stringify(s.s.days[key(T0)]));
  ok(s.s.notes.includes('x < 5') && s.s.notes.includes('from the other device'), 'notes from both are kept');
  ok(JSON.stringify(s.s.plan) === JSON.stringify(here.s.plan), 'the plan on this device stays');
  ok(s.s.evil === '' && !Object.keys(s.g).length && !s.t['zz<b>'], 'anything in a file that is not plain data is dropped');
  const twice = JSON.stringify(s);
  await p.setInputFiles('#bk-file', otherPath); await p.waitForSelector('#bk-add'); await p.click('#bk-add'); await p.waitForTimeout(300);
  ok(JSON.stringify(await store()) === twice, 'adding the same file twice changes nothing');
  await go('suggest'); await go('home');
  ok(!(await p.evaluate(() => window.__bad)), 'nothing from a hostile file runs');
  for (const bad of [['not-json.json', 'hello'], ['other-app.json', JSON.stringify({ app: 'something-else', data: {} })], ['newer.json', JSON.stringify({ app: 'sat-sprint', version: 99, data: {} })]]) {
    const f = path.join(tmp, bad[0]); fs.writeFileSync(f, bad[1]);
    await go('my-data'); await p.setInputFiles('#bk-file', f); await p.waitForSelector('#bk-found .note.warn');
    ok(!(await p.$('#bk-add')), bad[0] + ' is refused: ' + (await text('#bk-found .note.warn')));
  }

  /* ---------- with no connection ---------- */
  const head = await p.evaluate(() => ({ man: (document.querySelector('link[rel="manifest"]') || {}).href, touch: (document.querySelector('link[rel="apple-touch-icon"]') || {}).href, bar: (document.querySelector('meta[name="theme-color"]') || {}).content }));
  const man = await p.evaluate(async u => { const m = await (await fetch(u)).json(); const icons = await Promise.all(m.icons.map(i => fetch(new URL(i.src, u)).then(r => r.ok))); return { name: m.name, start: m.start_url, display: m.display, icons }; }, head.man);
  ok(man.name === 'SAT Sprint' && man.display === 'standalone' && man.icons.length === 3 && man.icons.every(Boolean) && !!head.touch, 'the page names an app manifest whose icons exist');
  ok(/^#[0-9A-F]{6}$/i.test(head.bar), 'the browser bar takes the page color: ' + head.bar);
  await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await p.waitForTimeout(900);
  ok(await p.evaluate(() => !!navigator.serviceWorker.controller), 'the service worker is in charge of the page after one visit');
  await go('my-data-offline'); await p.waitForFunction(() => /saved on this device/.test(document.getElementById('off-st').textContent), null, { timeout: 15000 });
  ok(/^(No question files|\d[\d,]* of [\d,]+ question files)/.test(await text('#off-st')), 'the page says how many question files are on the device: ' + (await text('#off-st')));
  await wide('offline section'); await shot('offline', true);
  await p.click('#off-save');
  await p.waitForFunction(() => { const e = document.getElementById('off-st'); return e && /^All [\d,]+ question files are saved/.test(e.textContent); }, null, { timeout: 180000 });
  const all = await text('#off-st');
  ok(/^All 2,\d\d\d question files/.test(all) && !(await p.isVisible('#off-save')) && await p.isVisible('#off-clear'), 'one button saves every question: ' + all);
  await shot('offline-saved', true);

  quiet = true; serving = false; await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(1200);
  ok((await text('#v-data .vtitle')).length > 10, 'with the server gone and the network off, the site still opens');
  ok(await p.isVisible('#offnote'), 'it says it is offline');
  await go(day1.m.slice(1)); await p.waitForSelector('#v-mprac .mtx[data-mtx-s="d"]', { timeout: 15000 });
  ok((await text('#v-mprac .mtx')).length > 20, 'a Math question opens offline, as text');
  await go('mq-' + (await p.evaluate(() => JSON.parse(document.getElementById('sprint-data').textContent).mathText.held[0])));
  await p.waitForSelector('#v-mprac .mpcard img.mimg'); await p.waitForTimeout(400);
  ok(await p.$eval('#v-mprac .mpcard img.mimg', i => i.complete && i.naturalWidth > 0), 'a held-back Math question shows its saved picture');
  const fig = await p.evaluate(() => { const m = document.getElementById('sprint-data').textContent.match(/rw\/f\/([0-9a-f]{8})\.webp/); return m && m[1]; });
  await go('rq-' + fig); await p.waitForSelector('#tcard img'); await p.waitForTimeout(500);
  ok(await p.$eval('#tcard img', i => i.complete && i.naturalWidth > 0), 'a Reading and Writing question shows its table or graph offline');
  await wide('offline question'); await shot('offline-question');
  await go('my-data-offline'); await p.waitForSelector('#off-clear:not([hidden])'); await p.click('#off-clear');
  await p.waitForFunction(() => /^No question files/.test(document.getElementById('off-st').textContent), null, { timeout: 15000 });
  await p.reload(); await p.waitForTimeout(900);
  await go(t.m.slice(1)); await p.waitForSelector('#v-mprac .offq', { timeout: 15000 });
  ok((await text('#v-mprac .offq')).includes('not saved on this device yet'), 'a question that was never saved says so, with the way to fix it');
  ok(Object.keys((await store()).m).length >= 2, 'removing the saved files leaves the progress alone');
  serving = true; await ctx.setOffline(false); await p.waitForTimeout(300);
  ok(!(await p.isVisible('#offnote')), 'back online, the offline line goes away');
  await go('home'); await go(t.m.slice(1)); await p.waitForSelector('#v-mprac .mtx[data-mtx-s="d"]', { timeout: 15000 });
  ok(true, 'and the question that could not load gets another try');
  quiet = false;

  console.log('errors: ' + (errors.length ? errors.join(' | ') : 'none'));
  console.log('overflow: ' + (over.length ? over.join(' | ') : 'none'));
  await browser.close(); server.close();
  if (fail.length || errors.length || over.length) { console.log('FAILED: ' + fail.length); process.exit(1); }
  console.log('ALL OK at ' + width);
})().catch(e => { console.error(e); process.exit(1); });
