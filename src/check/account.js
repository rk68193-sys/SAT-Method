/* Accounts: creating one, signing in on a second device, the streak and the answers following along, two devices changing
   things at once, deleting a plan, a renewed and an ended session, a new password from an emailed link, signing out, erasing
   and deleting the account. The account service here is a small stand-in for Supabase's auth and table addresses, served
   from the same localhost port as the page; it cannot check the table's row rules (src/account/setup.sql).
   node src/check/account.js index.html [width] [shots-folder] */
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const APIKEY = 'test-public-key-0123456789';
(async () => {
  const root = path.dirname(path.resolve(process.argv[2])), index = path.basename(process.argv[2]);
  const width = Number(process.argv[3] || 390), dir = process.argv[4] || '';
  if (dir) { fs.mkdirSync(dir, { recursive: true }); }
  const html = fs.readFileSync(path.join(root, index), 'utf8'), OFF = '"account":{"url":"","key":""}';
  if (!html.includes(OFF)) { console.log('FAIL the page is not built with accounts switched off (src/build/account.json should be empty in the repository)'); process.exit(1); }
  let accounts = true, down = false, base = '';
  /* ---------- the stand-in service ---------- */
  const users = {}, rows = {}, access = {}, refresh = {}, log = [];
  let seq = 0;
  const session = u => { const a = 'at-' + (++seq), r = 'rt-' + seq; access[a] = u.id; refresh[r] = u.id; return { access_token: a, refresh_token: r, token_type: 'bearer', expires_in: 3600, user: { id: u.id, email: u.email } }; };
  const send = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(body === undefined ? '' : JSON.stringify(body)); };
  const api = (req, res, url, body) => {
    const p = url.pathname, q = url.searchParams, m = req.method;
    log.push(m + ' ' + p);
    if (req.headers.apikey !== APIKEY) { return send(res, 401, { message: 'No API key found in request' }); }
    const bearer = (req.headers.authorization || '').replace(/^Bearer /, ''), uid = access[bearer], me = Object.values(users).find(u => u.id === uid);
    if (p === '/auth/v1/signup' && m === 'POST') {
      if (users[body.email]) { return send(res, 422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' }); }
      if (String(body.password).length < 6) { return send(res, 422, { code: 422, error_code: 'weak_password', msg: 'Password should be at least 6 characters.' }); }
      const u = users[body.email] = { id: '00000000-0000-4000-8000-' + ('000000000000' + Object.keys(users).length).slice(-12), email: body.email, password: body.password };
      return send(res, 200, /confirm/.test(body.email) ? { id: u.id, email: u.email } : session(u));
    }
    if (p === '/auth/v1/token' && m === 'POST') {
      if (q.get('grant_type') === 'password') {
        const u = users[body.email];
        if (!u || u.password !== body.password) { return send(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' }); }
        return send(res, 200, session(u));
      }
      const id = refresh[body.refresh_token], u = Object.values(users).find(x => x.id === id);
      if (!u) { return send(res, 400, { code: 400, error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token: Refresh Token Not Found' }); }
      delete refresh[body.refresh_token];
      return send(res, 200, session(u));
    }
    if (p === '/auth/v1/recover' && m === 'POST') { return send(res, 200, {}); }
    if (!me) { return send(res, 401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT' }); }
    if (p === '/auth/v1/user' && m === 'GET') { return send(res, 200, { id: me.id, email: me.email }); }
    if (p === '/auth/v1/user' && m === 'PUT') { me.password = body.password; return send(res, 200, { id: me.id, email: me.email }); }
    if (p === '/auth/v1/logout') { delete access[bearer]; return send(res, 204); }
    if (p === '/rest/v1/rpc/delete_account') { delete rows[me.id]; delete users[me.email]; Object.keys(access).forEach(k => { if (access[k] === me.id) { delete access[k]; } }); Object.keys(refresh).forEach(k => { if (refresh[k] === me.id) { delete refresh[k]; } }); return send(res, 204); }
    if (p === '/rest/v1/progress') {
      /* the row rules: a person only ever sees or touches their own row */
      const want = (q.get('user_id') || '').replace(/^eq\./, ''), row = rows[me.id];
      if (m === 'GET') { return send(res, 200, row && (!want || want === me.id) ? [{ rev: row.rev, data: row.data }] : []); }
      if (m === 'POST') {
        if (body.user_id !== me.id) { return send(res, 403, { code: '42501', message: 'new row violates row-level security policy' }); }
        if (row) { return send(res, 409, { code: '23505', message: 'duplicate key value violates unique constraint' }); }
        rows[me.id] = { rev: body.rev, data: body.data }; return send(res, 201);
      }
      if (m === 'PATCH') {
        const rev = Number((q.get('rev') || '').replace(/^eq\./, ''));
        if (!row || want !== me.id || row.rev !== rev) { return send(res, 200, []); }
        rows[me.id] = { rev: body.rev, data: body.data }; return send(res, 200, [{ rev: body.rev }]);
      }
    }
    return send(res, 404, { message: 'not found' });
  };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (/^\/(auth|rest)\/v1\//.test(url.pathname)) {
      if (down) { req.socket.destroy(); return; }
      let raw = '';
      req.on('data', c => { raw += c; });
      req.on('end', () => { let body = {}; try { body = raw ? JSON.parse(raw) : {}; } catch (e) {} api(req, res, url, body); });
      return;
    }
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) { rel += index; }
    const f = path.join(root, rel);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    if (rel === '/' + index) {
      res.writeHead(200, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-store' });
      res.end(accounts ? html.replace(OFF, () => '"account":' + JSON.stringify({ url: base.replace(/\/$/, ''), key: APIKEY })) : html);
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://localhost:' + server.address().port + '/';

  /* ---------- the browser: each "device" is its own context with its own storage ---------- */
  const browser = await chromium.launch();
  const errors = [], over = [], fail = [];
  const ok = (cond, what) => { if (!cond) { fail.push(what); } console.log((cond ? 'ok   ' : 'FAIL ') + what); };
  const KEY = 'sat-grammar-sprint.v1', AKEY = 'sat-sprint-account';
  const T0 = new Date(2026, 10, 12, 10, 0, 0).getTime(), DAY = 86400000;
  const key = t => { const d = new Date(t); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  const device = async name => {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const d = { p, name, say: true };
    p.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts\.g|Failed to load resource/i.test(m.text())) { errors.push(name + ' console: ' + m.text()); } });
    p.on('pageerror', e => errors.push(name + ' pageerror: ' + e.message));
    p.on('dialog', x => { d.asked = x.message(); return d.say ? x.accept() : x.dismiss(); });
    d.open = async (t, hash) => { await p.goto('about:blank'); await p.clock.setFixedTime(t); await p.goto(base + (hash || '')); await p.waitForTimeout(900); };
    d.reload = async t => { if (t) { await p.clock.setFixedTime(t); } await p.reload(); await p.waitForTimeout(900); };
    d.go = async t => { await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(300); };
    d.text = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
    d.store = () => p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
    d.acct = () => p.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), AKEY);
    d.wide = async t => { const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (r[0] > r[1] + 1) { over.push(name + ' ' + t + ': ' + r[0] + '>' + r[1]); } };
    d.shot = async (n, full) => { if (dir) { await p.screenshot({ path: path.join(dir, 'account-' + width + '-' + n + '.png'), fullPage: !!full }); } };
    d.answerMath = async () => {
      await p.waitForSelector('#v-mprac .mpcard', { timeout: 15000 });
      if (await p.$('#v-mprac .mpcard .mpch[data-k="A"]')) { await p.click('#v-mprac .mpcard .mpch[data-k="A"]'); } else { await p.fill('#mp-gin', '7'); await p.press('#mp-gin', 'Enter'); }
      await p.waitForTimeout(300);
    };
    d.answerRW = async () => { await p.waitForSelector('#tcard .opt[data-k="A"]', { timeout: 15000 }); await p.click('#tcard .opt[data-k="A"]'); await p.waitForTimeout(300); };
    d.today = () => p.evaluate(() => ({
      line: document.querySelector('#htoday .hsec-h .muted').textContent, n: document.querySelector('#htoday .hstreak-n b').textContent,
      m: document.querySelector('#htoday .hqotd-math').getAttribute('href'), mDone: document.querySelector('#htoday .hqotd-math').classList.contains('done'),
      rw: document.querySelector('#htoday .hqotd-rw').getAttribute('href'), rwDone: document.querySelector('#htoday .hqotd-rw').classList.contains('done')
    }));
    d.form = async (mode, email, pw) => {
      await d.go('account');
      await p.click('label:has(#acct-mode-' + mode + ')');
      await p.fill('#acct-email', email); await p.fill('#acct-pw', pw);
      await p.click('#acct-go'); await p.waitForTimeout(700);
    };
    /* wait until this device has nothing left to send */
    d.settle = async () => { for (let i = 0; i < 40; i += 1) { const a = await d.acct(); const busy = await p.evaluate(() => (document.getElementById('acct-tool') || { getAttribute: () => '' }).getAttribute('data-state') === 'sync'); if (a && !a.dirty && !busy) { return true; } await p.waitForTimeout(250); } return false; };
    return d;
  };
  const row = email => { const u = users[email]; return u ? rows[u.id] : null; };
  const ME = 'student@example.com', PW = 'correct-horse-9';

  /* ---------- switched off: the site is exactly as it was ---------- */
  accounts = false;
  let X = await device('off');
  await X.open(T0);
  ok(!(await X.p.isVisible('#acct-tool')) && (await X.text('.hpill')) === 'Free · no account · no paywall', 'with no project set, there is no Sign in button and Home says “no account”');
  ok(!(await X.p.$('#htoday a[href="#account"]')) && !(await X.p.$('#footcols a[href="#account"]')) && (await X.text('#foot-saved')).includes('browser only'), 'no page links to an account');
  await X.go('account');
  ok((await X.text('#v-account')).includes('not switched on') && !(await X.p.$('#acct-form')), 'the account address explains that accounts are not switched on');
  ok(!log.length, 'and nothing is sent to any service');
  await X.p.context().close();
  accounts = true;

  /* ---------- a visitor practices first, then creates an account ---------- */
  const Aa = await device('laptop');
  await Aa.open(T0);
  ok(await Aa.p.isVisible('#acct-tool') && (await Aa.text('#acct-tool')) === 'Sign in' && (await Aa.text('.hpill')).includes('account optional'), 'with a project set, the top bar has “Sign in” and Home says an account is optional');
  ok(await Aa.p.isVisible('#htoday a[href="#account"]') && await Aa.p.isVisible('#footcols a[href="#account"]'), 'Today and the footer link to it');
  await Aa.wide('home signed out'); await Aa.shot('home-signed-out');
  let t = await Aa.today();
  const day1 = t;
  await Aa.p.click('#htoday .hqotd-math'); await Aa.answerMath();
  ok(!log.some(l => /rest/.test(l)), 'practicing without an account sends nothing');
  await Aa.go('account');
  ok(await Aa.p.isVisible('#acct-form') && (await Aa.text('#acct-go')) === 'Create my account', 'the account page opens on “Create an account”');
  await Aa.wide('account form'); await Aa.shot('form', true);
  await Aa.p.fill('#acct-email', 'not-an-email'); await Aa.p.click('#acct-go');
  ok((await Aa.text('#acct-msg')).includes('email address'), 'a bad email is caught before anything is sent');
  await Aa.p.fill('#acct-email', ME); await Aa.p.fill('#acct-pw', 'short'); await Aa.p.click('#acct-go');
  ok((await Aa.text('#acct-msg')).includes('at least 8 characters') && !users[ME], 'and so is a short password');
  await Aa.form('up', ME, PW); await Aa.settle();
  ok((await Aa.text('#v-account .vtitle')) === 'Signed in' && (await Aa.text('.acct-who')) === ME && (await Aa.text('#acct-tool')) === 'Account', 'creating the account signs in: ' + (await Aa.text('.acct-who')));
  let r = row(ME);
  ok(!!r && r.rev === 1 && Array.isArray(r.data.m[day1.m.slice(4)]) && r.data.s.days[key(T0)].join() === '1,0', 'the answer and the day from before the account are now in it: ' + JSON.stringify(r && r.data.s.days));
  ok(!('last' in r.data.s) && !('htry' in r.data.s), 'what belongs to one device (the last page) is not sent');
  ok((await Aa.text('#acct-st')).includes('Everything is saved to your account') && (await Aa.text('#v-account .data-rows li:first-child')).startsWith('1day in a row'), 'the page says it is saved and shows the streak: ' + (await Aa.text('#acct-st')) + ' / ' + (await Aa.text('#v-account .data-rows li:first-child')));
  ok((await Aa.p.evaluate(k => localStorage.getItem(k), KEY)).indexOf(PW) < 0 && (await Aa.p.evaluate(k => localStorage.getItem(k), AKEY)).indexOf(PW) < 0, 'the password is not kept on the device');
  await Aa.wide('account signed in'); await Aa.shot('signed-in', true);
  await Aa.go('my-data');
  ok((await Aa.text('#v-data .lede')).includes('your account') && (await Aa.text('#bk-erase')).includes('everywhere'), 'the backup page says progress is in the account too');

  /* ---------- a second device signs in and has everything ---------- */
  const B = await device('phone');
  await B.open(T0);
  t = await B.today();
  ok(t.n === '0' && !t.mDone, 'a second device starts empty');
  await B.form('in', ME, 'wrong-password');
  ok((await B.text('#acct-msg')).includes('do not match'), 'a wrong password is refused with a plain message');
  await B.form('up', ME, PW);
  ok((await B.text('#acct-msg')).includes('already an account'), 'creating a second account for the same email is refused');
  await B.form('in', ME, PW); await B.settle();
  await B.go('home'); t = await B.today();
  ok(t.n === '1' && t.mDone && !t.rwDone && t.line.includes('1 day in a row'), 'after signing in it has the streak and the answered question: ' + t.line);
  ok(row(ME).rev === 1, 'taking what the account holds does not write to it');
  await B.go('m-map');
  ok(/1 (of|question|answer)/i.test(await B.text('#v-mmap')) || Object.keys((await B.store()).m).length === 1, 'and the Math map has the answer');
  await B.p.click('a[href="#home"]'); await B.go(day1.rw.slice(1)); await B.answerRW(); await B.settle();
  r = row(ME);
  ok(r.rev === 2 && r.data.s.days[key(T0)].join() === '1,1', 'an answer on the phone reaches the account a moment later: version ' + r.rev + ', ' + r.data.s.days[key(T0)]);
  await Aa.reload(); await Aa.settle(); await Aa.go('home'); t = await Aa.today();
  ok(t.mDone && t.rwDone && (await Aa.store()).s.days[key(T0)].join() === '1,1', 'and is on the laptop the next time it opens');

  /* ---------- the next day, both devices are used while the laptop has no connection ---------- */
  await Aa.p.route(/\/(auth|rest)\/v1\//, x => x.abort());
  await Aa.reload(T0 + DAY); t = await Aa.today();
  const day2 = t;
  ok(t.n === '1' && t.line.includes('Answer one question today to keep it'), 'offline, the laptop still shows the streak from its own copy');
  await Aa.p.click('#htoday .hqotd-math'); await Aa.answerMath(); await Aa.p.waitForTimeout(3200);
  ok((await Aa.acct()).dirty === true && (await Aa.p.getAttribute('#acct-tool', 'data-state')) === 'err', 'an answer given offline waits on the device, and the button shows it is not saved yet');
  await Aa.go('account');
  ok((await Aa.text('#acct-st')).includes('Not saved to your account yet'), 'the account page says so');
  await B.reload(T0 + DAY); await B.settle();
  await B.go(day2.rw.slice(1)); await B.answerRW(); await B.settle();
  ok(row(ME).rev === 3, 'meanwhile the phone saves a different answer');
  await Aa.p.unroute(/\/(auth|rest)\/v1\//);
  await Aa.p.click('#acct-sync'); await Aa.settle();
  r = row(ME);
  let sa = await Aa.store();
  ok(r.rev === 4 && Array.isArray(r.data.m[day2.m.slice(4)]) && r.data.s.days[key(T0 + DAY)].join() === '1,1', 'back online, the two are joined: both answers of day two are in the account (' + r.data.s.days[key(T0 + DAY)] + ')');
  ok(sa.s.days[key(T0 + DAY)].join() === '1,1' && Object.keys(sa.m).length === 2, 'and on the laptop');
  await B.reload(); await B.settle(); await B.go('home'); t = await B.today();
  ok(t.n === '2' && t.mDone && t.rwDone, 'the phone then shows a two-day streak with both questions done: ' + t.line);

  /* ---------- two devices save at the same instant: the second one joins instead of overwriting ---------- */
  await Aa.go('suggest-notes'); await B.go('plan');
  await B.p.fill('#plan-date', key(T0 + 40 * DAY));
  await Aa.p.fill('#sg-notes', 'slope is rise over run');
  await B.p.click('#plan-form button[type="submit"]');
  await Aa.p.waitForTimeout(600); await Aa.settle(); await B.settle();
  await Aa.reload(); await Aa.settle(); await B.reload(); await B.settle();
  r = row(ME);
  ok(r.data.s.notes === 'slope is rise over run' && !!r.data.s.plan && (await Aa.store()).s.plan && (await B.store()).s.notes === 'slope is rise over run', 'a note from one device and a plan from the other, saved together, both survive everywhere');

  /* ---------- something removed on one device is removed on the other ---------- */
  await B.go('plan'); await B.p.click('#plan-delete, [id*="plan-del"]').catch(() => {});
  if ((await B.store()).s.plan) { await B.p.evaluate(() => { const b = Array.from(document.querySelectorAll('#v-plan button')).find(x => /delete/i.test(x.textContent)); if (b) { b.click(); } }); }
  await B.p.waitForTimeout(300); await B.settle();
  ok(!(await B.store()).s.plan && !row(ME).data.s.plan, 'deleting the plan on the phone removes it from the account');
  await Aa.reload(); await Aa.settle();
  ok(!(await Aa.store()).s.plan && (await Aa.store()).s.notes === 'slope is rise over run', 'and from the laptop, which keeps everything else');

  /* ---------- sessions: renewed quietly, and an ended one keeps the progress on the device ---------- */
  let before = log.filter(l => /token/.test(l)).length;
  await Aa.p.evaluate(k => { const a = JSON.parse(localStorage.getItem(k)); a.exp = 1; localStorage.setItem(k, JSON.stringify(a)); }, AKEY);
  await Aa.reload(); await Aa.settle();
  ok(log.filter(l => /token/.test(l)).length === before + 1 && (await Aa.acct()).exp > T0 && (await Aa.text('#acct-tool')) === 'Account', 'a session that ran out is renewed without asking');
  Object.keys(refresh).forEach(k => { delete refresh[k]; }); Object.keys(access).forEach(k => { delete access[k]; });
  await B.p.evaluate(k => { const a = JSON.parse(localStorage.getItem(k)); a.exp = 1; localStorage.setItem(k, JSON.stringify(a)); }, AKEY);
  await B.reload(); await B.go('account');
  ok((await B.text('#acct-tool')) === 'Sign in' && (await B.text('.acct-note')).includes('signed out') && Object.keys((await B.store()).m).length === 2, 'a session the service has ended signs the device out, says so, and keeps the progress on it');
  ok((await B.p.inputValue('#acct-email')) === ME && (await B.text('#acct-go')) === 'Sign in', 'the form is ready to sign in again');
  await B.go(day1.m.slice(1)); await B.answerMath();
  await B.form('in', ME, PW); await B.settle();
  ok((await B.text('#v-account .vtitle')) === 'Signed in' && Object.keys(row(ME).data.m).length === 2 && !(await B.acct()).dirty, 'signing in again sends what was answered in between');

  /* ---------- a forgotten password ---------- */
  const C = await device('library');
  await C.open(T0 + DAY, '#account');
  await C.p.fill('#acct-email', ME); await C.p.click('#acct-forgot'); await C.p.waitForTimeout(400);
  ok(log.includes('POST /auth/v1/recover') && (await C.text('#acct-msg')).includes('on its way'), 'asking for a new password sends the email');
  const link = session(users[ME]);
  await C.open(T0 + DAY, '#access_token=' + link.access_token + '&expires_in=3600&refresh_token=' + link.refresh_token + '&token_type=bearer&type=recovery'); await C.settle();
  ok((await C.p.evaluate(() => location.hash)) === '#account' && (await C.text('#v-account .vtitle')) === 'Signed in' && (await C.text('#v-account')).includes('Choose a new password below'), 'the emailed link signs in, asks for a new password, and its tokens leave the address bar');
  ok(Object.keys((await C.store()).m).length === 2, 'and the progress arrives on that device');
  await C.p.fill('#acct-newpw', 'a-new-password-1'); await C.p.click('#acct-pwform button[type="submit"]'); await C.p.waitForTimeout(400);
  ok(users[ME].password === 'a-new-password-1' && (await C.text('#acct-pwmsg')).includes('changed'), 'the new password is set');
  await C.open(T0 + DAY, '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');

  /* ---------- signing out clears a shared device; the account keeps everything ---------- */
  C.say = false; await C.go('account'); await C.p.click('#acct-out'); await C.p.waitForTimeout(400);
  ok((await C.text('#v-account .vtitle')) === 'Signed in' && /safe in your account/.test(C.asked), 'signing out asks first, saying the progress is safe in the account');
  C.say = true; await C.p.click('#acct-out'); await C.p.waitForTimeout(500);
  sa = await C.store();
  ok((await C.text('#acct-tool')) === 'Sign in' && !Object.keys(sa.m).length && !sa.s.days && (await C.acct()) === null && Object.keys(row(ME).data.m).length === 2, 'after signing out the device holds no progress and no session, and the account still has it all');
  await C.go('home'); t = await C.today();
  ok(t.n === '0' && !t.mDone, 'Home on that device is back to a fresh start');
  await C.form('in', ME, PW);
  ok((await C.text('#acct-msg')).includes('do not match'), 'the old password no longer works');
  await C.form('in', ME, 'a-new-password-1'); await C.settle(); await C.go('home'); t = await C.today();
  ok(t.n === '2' && t.mDone && t.rwDone, 'signing in with the new one brings the two-day streak back: ' + t.line);

  /* ---------- another person on the same device ---------- */
  await C.go('account'); await C.p.click('#acct-out'); await C.p.waitForTimeout(500);
  await C.form('up', 'second@example.com', PW); await C.settle();
  ok((await C.text('.acct-who')) === 'second@example.com' && !Object.keys(row('second@example.com').data.m).length && Object.keys(row(ME).data.m).length === 2, 'a second person gets an empty account of their own, and the first is untouched');
  await C.form('up', 'confirm-me@example.com', PW).catch(() => {});
  await C.p.click('#acct-out'); await C.p.waitForTimeout(500);
  await C.form('up', 'confirm-me@example.com', PW);
  ok((await C.text('#acct-msg')).includes('we sent a link') && (await C.text('#acct-tool')) === 'Sign in', 'where the project asks for a confirmed address, the page says to open the emailed link');

  /* ---------- erase everywhere, then delete the account ---------- */
  await Aa.reload(); await Aa.form('in', ME, 'a-new-password-1'); await Aa.settle();
  const meId = users[ME].id;
  await Aa.go('my-data'); await Aa.p.click('#bk-erase'); await Aa.p.waitForTimeout(300); await Aa.settle();
  ok(/AND in your account/.test(Aa.asked) && !Object.keys(row(ME).data.m).length && !Object.keys((await Aa.store()).m).length, 'signed in, “Erase my progress everywhere” empties the account as well');
  await B.reload(); await B.settle();
  ok(!Object.keys((await B.store()).m).length, 'and the other device follows');
  await B.go('home'); t = await B.today(); await B.p.click('#htoday .hqotd-math'); await B.answerMath(); await B.settle();
  await B.go('account'); await B.wide('account end');
  B.say = false; await B.p.click('#acct-del'); await B.p.waitForTimeout(300);
  ok(!!users[ME], 'deleting the account asks first');
  B.say = true; await B.p.click('#acct-del'); await B.p.waitForTimeout(500);
  ok(!users[ME] && !rows[meId] && (await B.text('.acct-note')).includes('deleted') && Object.keys((await B.store()).m).length === 1 && (await B.acct()) === null, 'saying yes removes the account and its row; the progress on that device stays in its browser');

  console.log(errors.length ? 'SCRIPT ERRORS:\n' + errors.join('\n') : 'no script errors');
  console.log(over.length ? 'SIDEWAYS SCROLL:\n' + over.join('\n') : 'no sideways scrolling');
  console.log(fail.length ? fail.length + ' FAILED' : 'all account checks passed');
  await browser.close(); server.close();
  process.exit(fail.length || errors.length || over.length ? 1 : 0);
})().catch(e => { console.log('FAIL ' + (e && e.stack || e)); process.exit(1); });
