/* The clubhouse on the page (src/site/club.js), against the real src/account/club.sql on PostgreSQL: a guest's prizes carried
   into a new account, coins counted and crates opened by the server, a streak freeze, the page opening with the account's last
   record while the server cannot be reached, a second and a third device, a nickname, sharing a room, a visitor signed out and
   one signed in leaving stickers, the owner taking one off and switching the link off, the owner's link, erasing everything,
   deleting the account, signing out, and a project where club.sql was never run.
   The account service is a small stand-in for Supabase's auth and progress table (as in account.js); calls to club_* go to
   the database the way PostgREST sends them: as the signed-in person (role authenticated, their id in request.jwt.claims) or
   as anyone (anon). The database is made fresh (CLUB_PAGE_DB, club_page by default) with club-shim.sql standing in for the
   rest of Supabase, and dropped at the end.
   PGHOST=... PGUSER=... PGPASSWORD=... node src/check/club.js index.html [width] [shots-folder] */
const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { execFileSync, spawn } = require('child_process');
const { chromium } = require('playwright');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const APIKEY = 'test-public-key-0123456789';
const KEY = 'sat-grammar-sprint.v1', CKEY = 'sat-sprint-club';
(async () => {
  const root = path.dirname(path.resolve(process.argv[2])), index = path.basename(process.argv[2]), src = path.join(__dirname, '..');
  const width = Number(process.argv[3] || 390), dir = process.argv[4] || '';
  if (dir) { fs.mkdirSync(dir, { recursive: true }); }
  const fail = [], errors = [], over = [];
  const ok = (cond, what) => { if (!cond) { fail.push(what); } console.log((cond ? 'ok   ' : 'FAIL ') + what); };

  /* ---------- the database ---------- */
  const DB = process.env.CLUB_PAGE_DB || 'club_page';
  const env = Object.assign({}, process.env, { PGOPTIONS: (process.env.PGOPTIONS || '') + ' -c client_min_messages=warning' });
  const psql = (args, input) => execFileSync('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1'].concat(args), { input, env, encoding: 'utf8', maxBuffer: 64 << 20 });
  const lit = s => "'" + String(s).replace(/'/g, "''") + "'";
  const sql = q => psql(['-A', '-t', '-d', DB, '-c', q]).trim();
  try { psql(['-d', 'postgres', '-c', 'drop database if exists ' + DB, '-c', 'create database ' + DB]); } catch (e) { console.log('FAIL no PostgreSQL to test with (set PGHOST, PGUSER and PGPASSWORD): ' + String(e.stderr || e.message).trim()); process.exit(1); }
  psql(['-d', DB, '-f', path.join(__dirname, 'club-shim.sql')]);
  psql(['-d', DB, '-o', '/dev/null', '-f', '-'], fs.readFileSync(path.join(src, 'account', 'club.sql'), 'utf8').split('\n').filter(l => !/^create extension/.test(l)).join('\n'));
  psql(['-d', DB, '-o', '/dev/null', '-f', '-'], "insert into net._http_response (id, status_code, content) select asked, 200, " + lit(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8')) + " from public.club_rules;\nselect public.club_catalog_sync();\n");
  /* the owner's link, tested with a throwaway code: its hash goes into this copy of the page and into the rules */
  const CODE = 'check' + crypto.randomBytes(12).toString('hex'), HASH = crypto.createHash('sha256').update(CODE).digest('hex');
  sql("update public.club_rules set rules = jsonb_set(rules, '{gift}', to_jsonb(" + lit(HASH) + "::text)) where id = 1");
  const ITEMS = Number(sql('select count(*) from public.club_catalog where active'));
  /* each prize's name, from the source (PZ_ITEMS in site/prizes.js) */
  const NAMES = (() => {
    const s = fs.readFileSync(path.join(src, 'site', 'prizes.js'), 'utf8'), a = s.indexOf('var PZ_ITEMS = ['), o = {};
    for (const m of s.slice(a, s.indexOf('].map(function (r)', a)).matchAll(/\['([^']+)', '((?:[^'\\]|\\.)*)', '[crelmz]', '(theme|paper|fx|streak|aura)'/g)) { o[m[3] + ':' + m[1]] = m[2].replace(/\\(.)/g, '$1'); }
    return o;
  })();

  /* ---------- the stand-in service ---------- */
  const html0 = fs.readFileSync(path.join(root, index), 'utf8'), CFG = /"account":\{"url":"[^"]*","key":"[^"]*"\}/, GIFT = /PZ_GIFT = '[0-9a-f]{64}'/;
  if (!CFG.test(html0) || !GIFT.test(html0)) { console.log('FAIL the page has no account settings or no owner’s link hash to swap (rebuild it: src/README.md)'); process.exit(1); }
  const html = html0.replace(GIFT, () => "PZ_GIFT = '" + HASH + "'");
  let base = '', noClub = false;
  const users = {}, rows = {}, access = {}, refresh = {}, log = [];
  let seq = 0;
  const session = u => { const a = 'at-' + (++seq), r = 'rt-' + seq; access[a] = u.id; refresh[r] = u.id; return { access_token: a, refresh_token: r, token_type: 'bearer', expires_in: 3600, user: { id: u.id, email: u.email } }; };
  const send = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(body === undefined ? '' : JSON.stringify(body)); };
  /* a club.sql function, called the way PostgREST calls it, with each argument as the type club.sql declares */
  const ARGT = { p: 'jsonb', p_series: 'text', p_grant: 'text', p_code: 'text', p_name: 'text', p_on: 'boolean', p_link: 'text', p_sticker: 'text', p_id: 'bigint' };
  const rpc = (fn, args, uid) => new Promise(done => {
    const keys = Object.keys(args || {});
    if (keys.some(k => !ARGT[k])) { return done([404, { code: 'PGRST202', message: 'Could not find the function public.' + fn + ' in the schema cache' }]); }
    const call = 'public.' + fn + '(' + keys.map(k => { const v = args[k], t = ARGT[k]; return k + ' := ' + (v === null || v === undefined ? 'null' : lit(t === 'jsonb' ? JSON.stringify(v) : String(v))) + '::' + t; }).join(', ') + ')';
    const q = '\\set VERBOSITY verbose\nbegin;\nset local role ' + (uid ? 'authenticated' : 'anon') + ';\n' + (uid ? 'set local request.jwt.claims to ' + lit(JSON.stringify({ sub: uid, role: 'authenticated' })) + ';\n' : '') +
      (fn === 'club_erase' ? 'select ' + call + ';\n' : 'select coalesce(' + call + "::text, 'null');\n") + 'commit;\n';
    const ps = spawn('psql', ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-d', DB], { env });
    let out = '', err = '';
    ps.stdout.on('data', d => { out += d; }); ps.stderr.on('data', d => { err += d; });
    ps.on('close', code => {
      if (code === 0) { const t = out.trim(); return done(fn === 'club_erase' ? [204] : [200, JSON.parse(t || 'null')]); }
      const m = /ERROR:\s+([0-9A-Z]{5}):\s+(.*)/.exec(err) || [], st = m[1] || 'XX000', msg = m[2] || err.trim();
      if (st === '42883') { return done([404, { code: 'PGRST202', message: 'Could not find the function public.' + fn + ' in the schema cache' }]); }
      if (st === '42501') { return done([uid ? 403 : 401, { code: st, message: msg }]); }
      return done([400, { code: st, message: msg, details: null, hint: null }]);
    });
    ps.stdin.end(q);
  });
  const api = (req, res, url, body) => {
    const p = url.pathname, q = url.searchParams, m = req.method;
    if (req.headers.apikey !== APIKEY) { return send(res, 401, { message: 'No API key found in request' }); }
    const bearer = (req.headers.authorization || '').replace(/^Bearer /, ''), uid = access[bearer], me = Object.values(users).find(u => u.id === uid);
    const fn = (/^\/rest\/v1\/rpc\/([a-z_]+)$/.exec(p) || [])[1] || '';
    log.push(m + ' ' + p + (fn ? ' ' + (me ? me.email : 'anon') : ''));
    if (/^club_/.test(fn)) {
      if (noClub) { return send(res, 404, { code: 'PGRST202', message: 'Could not find the function public.' + fn + ' in the schema cache' }); }
      if (bearer && !me) { return send(res, 401, { code: 'PGRST301', message: 'JWT expired' }); }
      return rpc(fn, body, me ? me.id : '').then(([code, b]) => send(res, code, b));
    }
    if (p === '/auth/v1/signup' && m === 'POST') {
      if (users[body.email]) { return send(res, 422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' }); }
      const u = users[body.email] = { id: '00000000-0000-4000-8000-' + ('000000000000' + (Object.keys(users).length + 1)).slice(-12), email: body.email, password: body.password };
      sql('insert into auth.users (id, email) values (' + lit(u.id) + ', ' + lit(u.email) + ')');
      return send(res, 200, session(u));
    }
    if (p === '/auth/v1/token' && m === 'POST') {
      if (q.get('grant_type') === 'password') {
        const u = users[body.email];
        if (!u || u.password !== body.password) { return send(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' }); }
        return send(res, 200, session(u));
      }
      const id = refresh[body.refresh_token], u = Object.values(users).find(x => x.id === id);
      if (!u) { return send(res, 400, { code: 400, error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' }); }
      delete refresh[body.refresh_token];
      return send(res, 200, session(u));
    }
    if (!me) { return send(res, 401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT' }); }
    if (p === '/auth/v1/user' && m === 'GET') { return send(res, 200, { id: me.id, email: me.email }); }
    if (p === '/auth/v1/logout') { delete access[bearer]; return send(res, 204); }
    if (fn === 'delete_account') {
      sql('delete from auth.users where id = ' + lit(me.id));
      delete rows[me.id]; delete users[me.email];
      Object.keys(access).forEach(k => { if (access[k] === me.id) { delete access[k]; } }); Object.keys(refresh).forEach(k => { if (refresh[k] === me.id) { delete refresh[k]; } });
      return send(res, 204);
    }
    if (p === '/rest/v1/progress') {
      const want = (q.get('user_id') || '').replace(/^eq\./, ''), row = rows[me.id];
      if (m === 'GET') { return send(res, 200, row && (!want || want === me.id) ? [{ rev: row.rev, data: row.data }] : []); }
      if (m === 'POST') { if (row) { return send(res, 409, { code: '23505', message: 'duplicate key' }); } rows[me.id] = { rev: body.rev, data: body.data }; return send(res, 201); }
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
      res.end(html.replace(CFG, () => '"account":' + JSON.stringify({ url: base.replace(/\/$/, ''), key: APIKEY })));
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://localhost:' + server.address().port + '/';

  /* ---------- the browser: each device is its own context, on US Eastern time like the clubhouse's days ---------- */
  const browser = await chromium.launch();
  const device = async name => {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', timezoneId: 'America/New_York', deviceScaleFactor: dir ? 2 : 1 });
    const p = await ctx.newPage(), d = { p, name };
    p.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts\.g|Failed to load resource/i.test(m.text())) { errors.push(name + ' console: ' + m.text()); } });
    p.on('pageerror', e => errors.push(name + ' pageerror: ' + e.message));
    p.on('dialog', x => x.accept());
    /* a fresh load of the page (a hop through a blank page, so a link to the same page loads it again) */
    d.open = async hash => { await p.goto('about:blank'); await p.goto(base + (hash ? '#' + hash : '')); await p.waitForTimeout(900); };
    d.go = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(400); };
    d.text = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
    d.store = () => p.evaluate(k => JSON.parse(localStorage.getItem(k) || '{}'), KEY);
    d.club = () => p.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), CKEY);
    d.toast = () => p.evaluate(() => { const el = document.querySelector('#pz-toast.show'); return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; });
    /* a condition in the page, asked again until it holds (the server answers a moment later) */
    d.until = async (fn, arg, ms) => { const end = Date.now() + (ms || 10000); for (;;) { const v = await p.evaluate(fn, arg).catch(() => false); if (v || Date.now() > end) { return v; } await p.waitForTimeout(150); } };
    d.joined = () => d.until(k => { try { const o = JSON.parse(localStorage.getItem(k) || 'null'); return !!(o && o.st && o.st.joined); } catch (e) { return false; } }, CKEY);
    d.bal = async () => Number(((await p.textContent('.pz-bal b').catch(() => '')) || '').replace(/,/g, ''));
    d.coll = async () => Number((/· ([\d,]+) of/.exec(await d.text('#pz-collection h3')) || [0, '-1'])[1].replace(/,/g, ''));
    d.form = async (mode, email, pw) => {
      await d.go('account');
      await p.click('label:has(#acct-mode-' + mode + ')');
      await p.fill('#acct-email', email); await p.fill('#acct-pw', pw);
      await p.click('#acct-go'); await p.waitForTimeout(700);
    };
    d.answerRW = async () => { await p.waitForSelector('.view:not([hidden]) .opt[data-k="A"]', { timeout: 15000 }); await p.click('.view:not([hidden]) .opt[data-k="A"]'); await p.waitForTimeout(400); };
    d.answerMath = async () => {
      await p.waitForSelector('#v-mprac .mpcard', { timeout: 15000 });
      if (await p.$('#v-mprac .mpcard .mpch[data-k="A"]')) { await p.click('#v-mprac .mpcard .mpch[data-k="A"]'); } else { await p.fill('#mp-gin', '7'); await p.press('#mp-gin', 'Enter'); }
      await p.waitForTimeout(400);
    };
    d.wide = async t => { const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (r[0] > r[1] + 1) { over.push(name + ' ' + t + ': ' + r[0] + '>' + r[1]); } };
    /* a picture of one part of the page, or with no part named, of the screen from the top of the page */
    d.shot = async (n, sel) => {
      if (!dir) { return; }
      const f = path.join(dir, 'club-' + width + '-' + n + '.png');
      if (sel) { await (await p.$(sel)).screenshot({ path: f }); return; }
      await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300); await p.screenshot({ path: f });
    };
    return d;
  };
  const ME = 'student@example.com', FR = 'friend@example.com', PW = 'correct-horse-9';
  const uidOf = email => users[email].id;
  const balance = email => Number(sql('select public.club_balance(' + lit(uidOf(email)) + ')'));
  const crates = email => Number(sql('select count(*) from public.club_crates where user_id = ' + lit(uidOf(email))));
  const owned = email => Number(sql('select count(distinct item) from public.club_crates where user_id = ' + lit(uidOf(email))));
  const calls = (fn, email) => log.filter(l => l === 'POST /rest/v1/rpc/' + fn + ' ' + email).length;

  /* ---------- a guest earns and opens a crate on the device, then makes an account: it all comes along ---------- */
  const A = await device('laptop');
  await A.open('crates');
  await A.p.click('.pz-earn li:nth-child(2) a'); await A.answerRW();
  await A.go('crates');
  await A.p.click('.pz-free [data-pz-grant]'); await A.p.waitForSelector('.pz-modal'); await A.p.click('#pz-skip'); await A.p.waitForSelector('#pz-prize.show');
  await A.p.click('#pz-close'); await A.p.waitForTimeout(200);
  const g0 = (await A.store()).s.pz, guestCrate = g0.o['g.welcome'];
  ok(!!guestCrate && g0.e[Object.keys(g0.e)[0]] === 10 && !log.some(l => /rpc\/club_/.test(l)), 'a guest earns 10 coins and opens the free welcome crate on the device, and nothing is sent (' + (guestCrate && guestCrate[2]) + ')');
  ok((await A.text('.pz-rules')).includes('saved with the rest of your progress'), 'the Crates page says prizes are saved with the progress');
  /* a record changed by hand on the device: 500 coins nobody earned (written as the next page load starts) */
  await A.p.addInitScript(k => {
    try { if (location.protocol !== 'http:' || sessionStorage.getItem('club-check-seed')) { return; } sessionStorage.setItem('club-check-seed', '1'); } catch (e) { return; }
    const st = JSON.parse(localStorage.getItem(k)); st.s.pz.e.seed = 500; localStorage.setItem(k, JSON.stringify(st));
  }, KEY);
  await A.open('crates');
  ok((await A.bal()) === 510, 'the device now shows 510 coins');
  await A.go('room');
  ok((await A.text('.room-share')).includes('Sign in to get a link'), 'My room offers sharing to anyone who signs in');
  await A.form('up', ME, PW);
  ok(await A.joined(), 'making an account joins the clubhouse');
  ok(calls('club_join', ME) === 1, 'the device’s record is sent once (club_join)');
  ok(Number(sql("select count(*) from public.club_crates where user_id = " + lit(uidOf(ME)) + " and id = 'g.welcome' and item = " + lit(guestCrate[2]))) === 1, 'the guest’s crate is in the account, with the same prize');
  ok(balance(ME) === 10, 'its 10 earned coins came along, and the 500 changed by hand did not (balance ' + balance(ME) + ')');
  ok(/in your account/i.test(await A.toast()), 'a note says the coins and prizes are in the account: ' + await A.toast());
  await A.go('crates');
  ok((await A.bal()) === 10 && (await A.coll()) === 1, 'the Crates page shows the account’s 10 coins and 1 prize');
  ok((await A.text('.pz-rules')).includes('kept in your account'), 'and says they are kept in the account');
  const local0 = JSON.stringify((await A.store()).s.pz.o);

  /* ---------- coins are counted by the server ---------- */
  await A.p.click('.pz-earn li:nth-child(1) a'); await A.answerMath();
  const today = await A.p.evaluate(() => { const d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); });
  await A.until(() => !!document.querySelector('#pz-toast.show'));
  ok(sql('select amount from public.club_ledger where user_id = ' + lit(uidOf(ME)) + " and key = 'qotd.m." + today + "'") === '10', 'answering the Math question of the day: the server counts 10 coins');
  ok(/\+10 coins/.test(await A.toast()) && /Question of the day/.test(await A.toast()), 'and the note says so: ' + await A.toast());
  ok(sql('select count(*) from public.club_days where user_id = ' + lit(uidOf(ME)) + " and day = '" + today + "'") === '1', 'the server knows today was practiced');
  ok(calls('club_claim', ME) >= 1 && JSON.stringify((await A.store()).s.pz.o) === local0, 'the device’s own record is left as it was');

  /* ---------- a crate opened by the server ---------- */
  sql('insert into public.club_ledger (user_id, key, amount) values (' + lit(uidOf(ME)) + ", 'check.coins', 1000)");
  await A.open('crates');
  ok(await A.until(n => Number((document.querySelector('.pz-bal b') || { textContent: '' }).textContent.replace(/,/g, '')) === n, 1020), 'coins added in the account show on the page: 1,020');
  await A.p.click('[data-pz-open="pencil"]'); await A.p.waitForSelector('.pz-modal', { timeout: 10000 }); await A.p.click('#pz-skip'); await A.p.waitForSelector('#pz-prize.show');
  const won = sql('select item from public.club_crates where user_id = ' + lit(uidOf(ME)) + " and how = 'crate' order by at desc limit 1");
  ok(!!won && (await A.text('#pz-prize .pz-prize-name')) === NAMES[won], 'the server opens the crate and the page shows its prize: ' + NAMES[won] + ' (' + won + ')');
  ok(Number(sql('select -amount from public.club_ledger where user_id = ' + lit(uidOf(ME)) + " and key like 'crate.%'")) === 50, 'for 50 coins');
  await A.p.click('#pz-close'); await A.p.waitForTimeout(300);
  ok((await A.bal()) === balance(ME) && (await A.coll()) === owned(ME), 'the page’s coins and collection match the account: ' + balance(ME) + ' coins, ' + owned(ME) + ' prizes');
  ok(JSON.stringify((await A.store()).s.pz.o) === local0, 'nothing was opened on the device itself');
  await A.p.click('#pz-buy-freeze');
  ok(await A.until(() => /Streak freezes: 1 of/.test(document.querySelector('.pz-freeze').textContent)), 'a streak freeze bought from the server shows: 1 of 2');
  ok(sql('select count(*) from public.club_ledger where user_id = ' + lit(uidOf(ME)) + " and key like 'freeze.%'") === '1', 'and is in the account');
  await A.wide('crates'); await A.shot('crates', '.pz-top');

  /* ---------- the server out of reach: the page shows the account's last record and opens nothing ---------- */
  const bal1 = balance(ME), n1 = crates(ME);
  await A.p.route(/\/rest\/v1\/rpc\/club_/, r => r.abort());
  await A.open('crates');
  ok((await A.bal()) === bal1 && (await A.coll()) === owned(ME), 'offline, the page still shows the account’s ' + bal1 + ' coins');
  await A.p.click('[data-pz-open="pencil"]');
  ok(await A.until(() => /did not open/.test((document.querySelector('#pz-toast.show') || { textContent: '' }).textContent)), 'opening a crate says it did not open: ' + await A.toast());
  ok(crates(ME) === n1 && !(await A.p.$('.pz-modal')) && JSON.stringify((await A.store()).s.pz.o) === local0, 'and nothing was opened, here or in the account');
  await A.p.unroute(/\/rest\/v1\/rpc\/club_/);

  /* ---------- a second device: the account's record, not the device's ---------- */
  const B = await device('phone');
  await B.open('crates');
  await B.form('in', ME, PW);
  ok(await B.joined(), 'signing in on a phone finds the account in the clubhouse');
  await B.go('crates');
  ok((await B.bal()) === balance(ME) && (await B.coll()) === owned(ME), 'the phone shows the same coins and prizes: ' + (await B.bal()) + ' coins, ' + (await B.coll()) + ' prizes');
  ok(calls('club_join', ME) === 1, 'and does not join a second time');
  /* a third device whose clubhouse record cannot arrive yet earns and opens nothing on its own */
  const C = await device('school');
  await C.p.route(/\/rest\/v1\/rpc\/club_/, r => r.abort());
  await C.open();
  await C.form('in', ME, PW);
  ok(await C.until(k => { const s = JSON.parse(localStorage.getItem(k) || '{}'); return !!(s.s && s.s.club === 1); }, KEY), 'a third device learns from the saved progress that the account is in the clubhouse');
  await C.go('crates');
  const c0 = JSON.stringify((await C.store()).s.pz);
  await C.p.click('[data-pz-open="pencil"]').catch(() => {});
  await C.p.waitForTimeout(400);
  ok(/kept in your account/.test(await C.toast()) && !(await C.p.$('.pz-modal')) && JSON.stringify((await C.store()).s.pz) === c0, 'until the account answers, a crate is not opened on the device: ' + await C.toast());
  await C.p.unroute(/\/rest\/v1\/rpc\/club_/);
  await C.go('account'); await C.p.click('#acct-sync');
  ok(await C.joined(), 'once it answers, the device has the account’s record');
  await C.go('crates');
  ok((await C.bal()) === balance(ME), 'and its coins');
  await C.p.context().close();

  /* ---------- the phone's session runs out: it still shows the account's coins, and opens nothing until signing in again ---------- */
  const AK = 'sat-sprint-account', bs = await B.p.evaluate(k => JSON.parse(localStorage.getItem(k)), AK);
  delete refresh[bs.rt];
  await B.p.evaluate(k => { const o = JSON.parse(localStorage.getItem(k)); o.exp = 0; localStorage.setItem(k, JSON.stringify(o)); }, AK);
  await B.open('crates');
  ok(await B.until(k => { const o = JSON.parse(localStorage.getItem(k) || 'null'); return !!o && !o.rt; }, AK), 'the phone’s session runs out');
  ok((await B.bal()) === balance(ME) && (await B.text('.pz-rules')).includes('kept in your account'), 'it still shows the account’s ' + balance(ME) + ' coins');
  const bz = JSON.stringify((await B.store()).s.pz);
  await B.p.click('[data-pz-open="pencil"]'); await B.p.waitForTimeout(300);
  ok(/Sign in again/.test(await B.toast()) && !(await B.p.$('.pz-modal')) && JSON.stringify((await B.store()).s.pz) === bz && crates(ME) === n1, 'and opens nothing until the student signs in again: ' + await B.toast());
  await B.form('in', ME, PW); await B.go('crates');
  ok((await B.bal()) === balance(ME) && !(await B.p.$('[data-pz-open="pencil"][disabled]')), 'signed in again, the crates open as before');

  /* ---------- a friend with an account, a nickname taken already, and stickers ---------- */
  const F = await device('friend');
  await F.open();
  await F.form('up', FR, PW);
  ok(await F.joined(), 'a friend makes an account too');
  const FRID = uidOf(FR);
  sql("update public.club_profiles set nickname = 'Riley' where user_id = " + lit(uidOf(FR)));
  sql('insert into public.club_stickers (user_id, sticker) values (' + lit(uidOf(FR)) + ", 'pencil-0'), (" + lit(uidOf(FR)) + ", 'varsity-1')");

  /* ---------- a nickname, then sharing the room ---------- */
  await A.go('room');
  ok(await A.until(() => !!document.querySelector('.room-share .room-nickin')), 'signed in, Share my room asks for a nickname first');
  ok((await A.text('#room-foot')).includes('saved in your account'), 'and the page says the room is saved in the account');
  await A.shot('nickname', '.room-share');
  const nick = async v => { await A.p.fill('.room-nickin', v); await A.p.click('.room-nickf button[type="submit"]'); await A.until(() => { const m = document.querySelector('.room-share .room-msg'); return !!m && !/Saving/.test(m.textContent); }); return A.text('.room-share'); };
  ok((await nick('riley')).includes('already has that nickname'), 'a nickname someone else has is refused, whatever the capitals');
  ok((await nick('555 123 4567')).includes('not a phone number'), 'so is a phone number');
  ok((await nick('  Sam  ')).includes('Your nickname: Sam') && sql('select nickname from public.club_profiles where user_id = ' + lit(uidOf(ME))) === 'Sam', 'a good one is saved: Sam');
  await A.p.click('[data-club-share]');
  ok(await A.until(() => !!document.querySelector('.room-url')), 'Make a link gives a link');
  const url = await A.p.inputValue('.room-url'), link = (/#r-([0-9a-f]{32})$/.exec(url) || [])[1];
  ok(!!link && sql('select link from public.club_rooms where user_id = ' + lit(uidOf(ME))) === link, 'the link opens this room: ' + url);
  ok(!!sql('select layout from public.club_rooms where user_id = ' + lit(uidOf(ME))), 'the room was saved to the account first');
  await A.p.click('[data-club-copy]');
  ok(await A.until(() => /Cop(ied|y the link)/.test(document.querySelector('.room-share .room-msg').textContent)), 'Copy the link says what to do next: ' + await A.text('.room-share .room-msg'));
  await A.wide('room shared'); await A.shot('room-shared', '.room-share');

  /* ---------- someone signed out opens the link ---------- */
  const V = await device('visitor');
  await V.open('r-' + link);
  ok(await V.until(() => !!document.querySelector('#v-visit .room-room')), 'a visitor with no account sees the room');
  ok((await V.text('#v-visit .vtitle')) === 'Sam’s room' && (await V.text('#v-visit')).includes('Sam decorated this room'), 'with the owner’s nickname: ' + await V.text('#v-visit .vtitle'));
  ok((await V.text('.room-guests')).includes('None yet') && (await V.text('.room-leave')).includes('Sign in to leave'), 'no stickers yet, and signing in is how to leave one');
  ok(log.includes('POST /rest/v1/rpc/club_room_view anon') && !(await V.club()), 'the room is asked for as anyone, and nothing is kept on the device');
  await V.p.click('#v-visit .room-allb[data-visit-spot="desk"]');
  ok((await V.text('#visit-side')).includes('A calendar'), 'tapping a spot says what is there');
  await V.wide('visit'); await V.shot('visit');
  await V.open('r-' + 'f'.repeat(32));
  ok(await V.until(() => /not shared right now/.test(document.querySelector('#v-visit').textContent)), 'a wrong link says the room is not shared');

  /* ---------- the friend, signed in, leaves a sticker ---------- */
  await F.open('r-' + link);
  ok(await F.until(() => document.querySelectorAll('[data-club-stick]').length === 2), 'a signed-in friend can pick one of their 2 stickers to leave');
  await F.shot('leave', '#v-visit .room-share');
  await F.p.click('[data-club-stick="pencil-0"]');
  ok(await F.until(() => /from Riley/.test(document.querySelector('.room-guests').textContent)), 'the sticker shows on the board, from Riley');
  const first = await F.text('.room-gb li .pz-stk');
  await F.p.click('[data-club-stick="varsity-1"]');
  ok(await F.until(f => document.querySelectorAll('.room-gb li').length === 1 && document.querySelector('.room-gb li .pz-stk').textContent !== f, first), 'a second one the same day takes the first one’s place: ' + await F.text('.room-gb li .pz-stk'));
  ok(sql("select string_agg(sticker, ',') from public.club_board where room_id = " + lit(uidOf(ME))) === 'varsity-1', 'the account holds just that one from the friend today');
  await F.shot('left', '#v-visit .room-share');

  /* ---------- the owner sees it, and can take it off; then stops sharing ---------- */
  await A.open('room');
  ok(await A.until(() => /from Riley/.test((document.querySelector('.room-share') || { textContent: '' }).textContent)), 'the owner sees the friend’s sticker under Share my room');
  await A.shot('board', '.room-share');
  await A.p.click('[data-club-unstick]');
  ok(await A.until(() => /off your board/.test(document.querySelector('.room-share .room-msg').textContent)) && sql('select count(*) from public.club_board where room_id = ' + lit(uidOf(ME))) === '0', 'Take it off removes it');
  await A.p.click('[data-club-unshare]');
  ok(await A.until(() => !!document.querySelector('[data-club-share]')) && sql('select coalesce(link, \'none\') from public.club_rooms where user_id = ' + lit(uidOf(ME))) === 'none', 'Stop sharing switches the link off');
  await V.open('r-' + link);
  ok(await V.until(() => /not shared right now/.test(document.querySelector('#v-visit').textContent)), 'the old link no longer opens the room');

  /* ---------- the owner's link, signed in: the server checks the code and keeps everything ---------- */
  await F.open('gift-' + CODE);
  ok(await F.until(() => /Everything is unlocked/.test((document.querySelector('#pz-toast.show') || { textContent: '' }).textContent)), 'the owner’s link while signed in: ' + await F.toast());
  ok(owned(FR) === ITEMS && balance(FR) >= 10000, 'the account has all ' + ITEMS + ' prizes and 10,000 coins');
  await F.go('crates');
  ok((await F.coll()) === ITEMS, 'and the Crates page shows them all');

  /* ---------- erasing everything empties the clubhouse record too ---------- */
  await A.p.route(/\/rest\/v1\/rpc\/club_erase/, r => r.abort());
  await A.go('my-data'); await A.p.click('#bk-erase');
  await A.p.waitForTimeout(1000);
  ok(crates(ME) > 0 && ((await A.club()) || {}).erase === 1, 'erasing with no connection: the account’s record is still there, and the device remembers to erase it');
  await A.p.unroute(/\/rest\/v1\/rpc\/club_erase/);
  await A.go('account'); await A.p.click('#acct-sync');
  ok(await A.joined(), 'back online, it is erased and the account starts again in the clubhouse');
  ok(crates(ME) === 0 && sql('select count(*) from public.club_rooms where user_id = ' + lit(uidOf(ME))) === '0' && balance(ME) === 0, 'Erase my progress everywhere leaves no coins, crates or room in the account');
  await A.go('crates');
  ok((await A.bal()) === 0 && (await A.coll()) === 0, 'and the page starts again from 0');

  /* ---------- deleting the account: the device keeps the prizes it showed ---------- */
  await F.go('account'); await F.p.click('#acct-del');
  ok(await F.until(() => /account is deleted/.test(document.querySelector('#v-account').textContent)), 'the friend deletes their account');
  ok(sql('select count(*) from public.club_profiles where user_id = ' + lit(FRID)) === '0' && sql('select count(*) from public.club_crates where user_id = ' + lit(FRID)) === '0', 'nothing of theirs is left in the clubhouse');
  await F.go('crates');
  ok((await F.coll()) === ITEMS && !(await F.club()), 'the device keeps the prizes, as its own record again');

  /* ---------- signing out ---------- */
  await B.go('account'); await B.p.click('#acct-out');
  ok(await B.until(() => !localStorage.getItem('sat-sprint-club')), 'signing out removes the clubhouse record from the device');

  /* ---------- a project where club.sql was never run: prizes stay on the device, as before ---------- */
  noClub = true;
  const G = await device('no-club');
  await G.open();
  await G.form('up', 'nobody@example.com', PW);
  await G.p.waitForTimeout(1500);
  await G.go('crates');
  ok(calls('club_state', 'nobody@example.com') === 1 && !calls('club_join', 'nobody@example.com'), 'without club.sql the page asks once and stops');
  ok((await G.text('.pz-rules')).includes('saved with the rest of your progress') && !(await G.club()), 'and keeps prizes on the device');
  await G.go('room');
  ok(!(await G.p.$('.room-share')), 'My room has no Share part');

  await browser.close(); server.close();
  try { psql(['-d', 'postgres', '-c', 'drop database ' + DB]); } catch (e) {}
  console.log(errors.length ? 'SCRIPT ERRORS:\n' + errors.join('\n') : 'no script errors');
  console.log(over.length ? 'SIDEWAYS SCROLL:\n' + over.join('\n') : 'no sideways scrolling');
  console.log(fail.length ? fail.length + ' FAILED' : 'all clubhouse page checks passed');
  process.exit(fail.length || errors.length || over.length ? 1 : 0);
})().catch(e => { console.log('FAIL ' + (e && e.stack || e)); process.exit(1); });
