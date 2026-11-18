/* Crews on the page (src/site/crew.js) with four students, against the real src/account/club.sql, club-live.sql and
   club-crew.sql on PostgreSQL: a visitor who is signed out, making a crew (a name that can't be used, then one that can),
   its invite link (copied; a friend opening it and joining; a student with no nickname choosing one first; a link that no
   longer works), the crew's room (everyone on the floor, what is still to come, tapping someone), finished practice sets
   adding study sessions (said on the set's results: alone in a crew, +1 for Math and for Reading and Writing, a set that was
   too short, the day's limit, too few new questions), a set finished while the account could not be reached (kept on the
   device, sent once the connection is back, said in a short note on whatever page the student is on), an upgrade built and
   revealed behind a curtain, crews paused, the owner's tools (a new link, the link off and on again, a new name, taking
   someone out, handing the crew over), leaving, the crew on My room, the whole room built, Help, and a project where
   club-crew.sql was never run.
   The account service is a small stand-in for Supabase (sessions, the progress table, and club_* functions called the way
   PostgREST calls them), as in club.js and live.js.
   PGHOST=... PGUSER=... PGPASSWORD=... node src/check/crew.js index.html [width] [shots-folder] */
const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { execFileSync, spawn } = require('child_process');
const { chromium } = require('playwright');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const APIKEY = 'test-public-key-0123456789';
(async () => {
  const root = path.dirname(path.resolve(process.argv[2])), index = path.basename(process.argv[2]), src = path.join(__dirname, '..');
  const width = Number(process.argv[3] || 390), dir = process.argv[4] || '';
  if (dir) { fs.mkdirSync(dir, { recursive: true }); }
  const fail = [], errors = [], over = [], T0 = Date.now();
  /* why: what to print when a step fails, to help find the cause (it may answer later: it is printed when it does) */
  const ok = (cond, what, why) => {
    if (!cond) { fail.push(what); }
    console.log((cond ? 'ok   ' : 'FAIL ') + what);
    if (!cond && why) { Promise.resolve().then(why).then(s => console.log('       ' + s), e => console.log('       (' + e + ')')); }
  };

  /* ---------- the database: club.sql, its prize list, club-live.sql and club-crew.sql ---------- */
  const DB = process.env.CREW_PAGE_DB || 'crew_page';
  const env = Object.assign({}, process.env, { PGOPTIONS: (process.env.PGOPTIONS || '') + ' -c client_min_messages=warning' });
  const psql = (args, input) => execFileSync('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1'].concat(args), { input, env, encoding: 'utf8', maxBuffer: 64 << 20 });
  const lit = s => "'" + String(s).replace(/'/g, "''") + "'";
  const sql = q => psql(['-A', '-t', '-d', DB, '-c', q]).trim();
  try { psql(['-d', 'postgres', '-c', 'drop database if exists ' + DB, '-c', 'create database ' + DB]); } catch (e) { console.log('FAIL no PostgreSQL to test with (set PGHOST, PGUSER and PGPASSWORD): ' + String(e.stderr || e.message).trim()); process.exit(1); }
  psql(['-d', DB, '-f', path.join(__dirname, 'club-shim.sql')]);
  psql(['-d', DB, '-o', '/dev/null', '-f', path.join(src, 'account', 'club.sql')]);
  psql(['-d', DB, '-o', '/dev/null', '-f', '-'], "insert into net._http_response (id, status_code, content) select asked, 200, " + lit(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8')) + " from public.club_rules;\nselect public.club_catalog_sync();\n");
  psql(['-d', DB, '-o', '/dev/null', '-f', path.join(src, 'account', 'club-live.sql')]);
  psql(['-d', DB, '-o', '/dev/null', '-f', path.join(src, 'account', 'club-crew.sql')]);
  /* as a signed-in student, in one transaction (the way PostgREST calls a function) */
  const asUser = (uid, q) => psql(['-A', '-t', '-d', DB, '-f', '-'], 'begin;\nset local role authenticated;\nset local request.jwt.claims to ' + lit(JSON.stringify({ sub: uid, role: 'authenticated' })) + ';\n' + q + '\ncommit;\n').trim();
  /* wait for the server to say so (the page's call may still be on its way) */
  const soon = async (fn, ms) => { const end = Date.now() + (ms || 5000); for (;;) { const v = fn(); if (v || Date.now() > end) { return v; } await new Promise(r => setTimeout(r, 150)); } };

  /* ---------- the students ---------- */
  const users = {}, access = {}, refresh = {}, rows = {}, log = [], adds = [];
  let seq = 0;
  const session = u => { const a = 'at-' + (++seq), r = 'rt-' + seq; access[a] = u.id; refresh[r] = u.id; return { at: a, rt: r }; };
  const student = (name, nick, room) => {
    const u = users[name] = { id: crypto.randomUUID(), email: name.toLowerCase() + '@example.com', name };
    sql('insert into auth.users (id, email) values (' + lit(u.id) + ', ' + lit(u.email) + ')');
    asUser(u.id, "select public.club_join('{}');" + (nick ? 'select public.club_nick(' + lit(nick) + ');' : '') + (room ? 'select public.club_room_save(' + lit(JSON.stringify(room)) + ');' : ''));
    return u;
  };
  const kite = student('Kite', 'Kite', { av: ['teal', 'cap'] }), lark = student('Lark', 'Lark', { av: ['pink', 'bow'] }), moss = student('Moss', 'Moss', { av: ['orange', 'grad'] });
  const reed = student('Reed', '', null);
  const crewOf = name => sql("select row(c.name, c.step, c.n, c.total)::text from public.club_crews c where c.name = " + lit(name));

  /* ---------- the stand-in service ---------- */
  const html0 = fs.readFileSync(path.join(root, index), 'utf8'), CFG = /"account":\{"url":"[^"]*","key":"[^"]*"\}/;
  if (!CFG.test(html0)) { console.log('FAIL the page has no account settings to swap (rebuild it: src/README.md)'); process.exit(1); }
  let base = '', noCrew = false;
  const send = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(body === undefined ? '' : JSON.stringify(body)); };
  const ARGT = { p: 'jsonb', p_series: 'text', p_grant: 'text', p_code: 'text', p_name: 'text', p_on: 'boolean', p_link: 'text', p_sticker: 'text', p_id: 'bigint',
    p_kind: 'text', p_key: 'text', p_x: 'int', p_y: 'int', p_pid: 'text', p_why: 'text', p_nick: 'text', p_active: 'boolean', p_text: 'text', p_month: 'int', p_year: 'int', p_step: 'int' };
  const missing = fn => [404, { code: 'PGRST202', message: 'Could not find the function public.' + fn + ' in the schema cache' }];
  const rpc = (fn, args, uid) => new Promise(done => {
    const keys = Object.keys(args || {});
    if (keys.some(k => !ARGT[k])) { return done(missing(fn)); }
    const call = 'public.' + fn + '(' + keys.map(k => { const v = args[k], t = ARGT[k]; return k + ' := ' + (v === null || v === undefined ? 'null' : lit(t === 'jsonb' ? JSON.stringify(v) : String(v))) + '::' + t; }).join(', ') + ')';
    const q = '\\set VERBOSITY verbose\nbegin;\nset local role ' + (uid ? 'authenticated' : 'anon') + ';\n' + (uid ? 'set local request.jwt.claims to ' + lit(JSON.stringify({ sub: uid, role: 'authenticated' })) + ';\n' : '') +
      'select coalesce(' + call + "::text, 'null');\ncommit;\n";
    const ps = spawn('psql', ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-d', DB], { env });
    let out = '', err = '';
    ps.stdout.on('data', d => { out += d; }); ps.stderr.on('data', d => { err += d; });
    ps.on('close', code => {
      if (code === 0) { return done([200, JSON.parse(out.trim() || 'null')]); }
      const m = /ERROR:\s+([0-9A-Z]{5}):\s+(.*)/.exec(err) || [], st = m[1] || 'XX000', msg = m[2] || err.trim();
      if (st === '42883') { return done(missing(fn)); }
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
    log.push(m + ' ' + p + (fn ? ' ' + (me ? me.name : 'anon') : '') + ' @' + ((Date.now() - T0) / 1000).toFixed(2));
    if (/^club_/.test(fn)) {
      if (noCrew && /^club_crew_/.test(fn)) { return send(res, ...missing(fn)); }
      if (bearer && !me) { return send(res, 401, { code: 'PGRST301', message: 'JWT expired' }); }
      const n = log.length - 1;
      return rpc(fn, body, me ? me.id : '').then(([code, b]) => {
        log[n] += ' (answered @' + ((Date.now() - T0) / 1000).toFixed(2) + ')';
        if (fn === 'club_crew_add') { adds.push({ who: me ? me.name : 'anon', p: body.p, answer: b }); }
        send(res, code, b);
      });
    }
    if (fn === 'count_visit') { return send(res, 204); }
    if (p === '/auth/v1/token' && m === 'POST' && q.get('grant_type') === 'refresh_token') {
      const id = refresh[body.refresh_token], u = Object.values(users).find(x => x.id === id);
      if (!u) { return send(res, 400, { code: 400, error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' }); }
      delete refresh[body.refresh_token];
      const s = session(u);
      return send(res, 200, { access_token: s.at, refresh_token: s.rt, token_type: 'bearer', expires_in: 3600, user: { id: u.id, email: u.email } });
    }
    if (!me) { return send(res, 401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT' }); }
    if (p === '/auth/v1/user' && m === 'GET') { return send(res, 200, { id: me.id, email: me.email }); }
    if (p === '/rest/v1/progress') {
      const row = rows[me.id];
      if (m === 'GET') { return send(res, 200, row ? [{ rev: row.rev, data: row.data }] : []); }
      if (m === 'POST') { if (row) { return send(res, 409, { code: '23505', message: 'duplicate key' }); } rows[me.id] = { rev: body.rev, data: body.data }; return send(res, 201); }
      if (m === 'PATCH') {
        const rev = Number((q.get('rev') || '').replace(/^eq\./, ''));
        if (!row || row.rev !== rev) { return send(res, 200, []); }
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
      res.end(html0.replace(CFG, () => '"account":' + JSON.stringify({ url: base.replace(/\/$/, ''), key: APIKEY })));
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://localhost:' + server.address().port + '/';

  /* ---------- the browser: each student on their own device, signed in ---------- */
  const browser = await chromium.launch();
  const device = async who => {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 }, serviceWorkers: 'block', timezoneId: 'America/New_York', deviceScaleFactor: dir ? 2 : 1 });
    const name = who ? who.name : 'guest';
    if (who) {
      const s = session(who);
      await ctx.addInitScript(([k, v]) => { try { if (!localStorage.getItem(k)) { localStorage.setItem(k, v); } } catch (e) {} },
        ['sat-sprint-account', JSON.stringify({ uid: who.id, email: who.email, at: s.at, rt: s.rt, exp: Date.now() + 3600e3, rev: null, dirty: false })]);
    }
    const p = await ctx.newPage(), d = { p, name, ctx };
    p.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts\.g|Failed to load resource/i.test(m.text())) { errors.push(name + ' console: ' + m.text()); } });
    p.on('pageerror', e => errors.push(name + ' pageerror: ' + e.message));
    p.on('dialog', dl => { errors.push(name + ' dialog: ' + dl.message()); dl.dismiss(); });
    d.open = async hash => { await p.goto('about:blank'); await p.goto(base + (hash ? '#' + hash : '')); await p.waitForTimeout(600); };
    d.go = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(300); };
    d.text = async sel => ((await p.textContent(sel).catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    d.until = async (fn, arg, ms) => { const end = Date.now() + (ms || 10000); for (;;) { const v = await p.evaluate(fn, arg).catch(() => false); if (v || Date.now() > end) { return v; } await p.waitForTimeout(150); } };
    /* the crew page's heading, once the page has drawn it */
    d.head = () => p.evaluate(() => ((document.querySelector('#v-crew h2') || {}).textContent || '').trim());
    d.headIs = t => d.until(x => ((document.querySelector('#v-crew h2') || {}).textContent || '').trim() === x, t);
    /* the people standing in the crew's room: the names on their tags */
    d.figs = () => p.evaluate(() => Array.from(document.querySelectorAll('#crew-box .crew-fig .crew-tag')).map(t => t.textContent).join(','));
    /* what the set's results say about the crew, once the server has answered */
    d.note = () => p.evaluate(() => ((document.querySelector('.view:not([hidden]) .crew-note') || {}).textContent || '').replace(/\s+/g, ' ').trim());
    d.noteHas = (re, ms) => d.until(s => new RegExp(s).test(((document.querySelector('.view:not([hidden]) .crew-note') || {}).textContent || '').replace(/\s+/g, ' ')), re.source, ms);
    d.pend = () => p.evaluate(() => { try { return JSON.parse(localStorage.getItem('sat-sprint-crew') || 'null'); } catch (e) { return 'bad'; } });
    d.said = where => d.text('#v-crew .crew-said-' + where);
    /* sideways scrolling, with the elements that reach past the right edge */
    d.wide = async t => {
      const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth,
        Array.from(document.querySelectorAll('body *')).filter(e => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && e.getClientRects().length)
          .slice(0, 6).map(e => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '') + ' ' + Math.round(e.getBoundingClientRect().right)).join(', ')]);
      if (r[0] > r[1] + 1) { over.push(name + ' ' + t + ': ' + r[0] + '>' + r[1] + ' (' + r[2] + ')'); }
    };
    /* buttons on the crew page smaller than 24 by 24 pixels (links inside sentences are left out, as WCAG 2.5.8 allows) */
    d.small = () => p.evaluate(() => Array.from(document.querySelectorAll('#v-crew button, #v-crew .btn, #v-crew summary, #v-crew input')).filter(e => e.getClientRects().length)
      .map(e => [e, e.getBoundingClientRect()]).filter(x => x[1].width < 24 || x[1].height < 24).map(x => (x[0].textContent || x[0].name || x[0].className).trim().slice(0, 30) + ' ' + Math.round(x[1].width) + '×' + Math.round(x[1].height)));
    d.shot = async (n, full) => {
      if (!dir) { return; }
      /* the whole page, without the subject bar that stays at the bottom of a phone's screen (it would show in the middle) */
      const st = full ? await p.addStyleTag({ content: '.subj { visibility: hidden !important; }' }) : null;
      await p.screenshot({ path: path.join(dir, 'crew-' + width + '-' + n + '.png'), fullPage: !!full });
      if (st) { await st.evaluate(x => x.remove()); }
    };
    /* the crew's room alone, with the bars that stay on screen put back in the page's flow, so they do not cover it */
    d.shotRoom = async n => {
      if (!dir) { return; }
      const el = await p.$('#crew-box');
      if (!el) { return; }
      const st = await p.addStyleTag({ content: '.top, .guide, .subj { position: static !important; }' });
      await el.screenshot({ path: path.join(dir, 'crew-' + width + '-' + n + '.png') });
      await st.evaluate(x => x.remove());
    };
    return d;
  };
  /* one Math question after another, always answering A (the quick sets are all multiple choice); stop: how many to answer
     before pressing Stop practicing. Answers the ids of the questions answered. */
  const playMath = async (S, stop) => {
    const p = S.p, ids = [];
    for (let i = 0; i < 12; i++) {
      await p.waitForSelector('#v-mprac .mpcard', { timeout: 15000 });
      if (stop != null && i === stop) { await p.click('#mp-end'); break; }
      ids.push(await p.evaluate(() => { const t = document.querySelector('.mpcard .mpq [data-mtx]'), im = document.querySelector('.mpcard .mpq img'); return t ? t.getAttribute('data-mtx').split(':')[1] : ((im && im.getAttribute('src') || '').match(/([0-9a-f]{8})\.webp/) || [])[1]; }));
      await p.click('.mpch[data-k="A"]');
      await p.waitForSelector('#mp-fb:not([hidden]) .mpverdict');
      const last = /See my results/.test(await p.textContent('#mp-next'));
      await p.click('#mp-next');
      if (last) { break; }
    }
    await p.waitForSelector('#v-mprac .mpsum, #v-mprac .mpraise', { timeout: 10000 }).catch(() => {});
    return ids;
  };
  /* one Reading and Writing question after another, always answering B */
  const playRW = async S => {
    const p = S.p;
    for (let i = 0; i < 12; i++) {
      await p.waitForSelector('#tcard > *', { timeout: 15000 });
      await p.waitForTimeout(150);
      await p.keyboard.press('B');
      await p.waitForSelector('#tnext');
      const last = /See my results/.test(await p.textContent('#tnext'));
      await p.click('#tnext');
      if (last) { break; }
    }
    await p.waitForSelector('#thost .dresult', { timeout: 10000 }).catch(() => {});
  };
  const calls = (who, fn) => log.filter(l => l.startsWith('POST /rest/v1/rpc/' + fn + ' ' + who + ' ')).length;

  /* ---------- a visitor who is not signed in is asked to sign in ---------- */
  const G = await device(null);
  await G.open('crew');
  ok((await G.head()) === 'Crews' && /Sign in to make a crew or join a friend’s/.test(await G.text('#v-crew')) && !!(await G.p.$('#v-crew a.btn[href="#account"]')),
    'a visitor who is signed out learns what a crew is and is asked to sign in', async () => G.text('#v-crew'));
  await G.open('c-0123456789abcdef0123456789abcdef');
  ok((await G.head()) === 'You’re invited to join a crew' && /Sign in to see this crew and join it/.test(await G.text('#v-crew')), 'and so is one who opens an invite link');
  await G.wide('signed out');

  /* ---------- making a crew ---------- */
  const K = await device(kite);
  await K.open('crew');
  await K.p.waitForSelector('#v-crew form[data-crew-make]', { timeout: 15000 }).catch(() => {});
  ok(!!(await K.p.$('#v-crew form[data-crew-make]')) && /A crew is a small group of friends, up to 8/.test(await K.text('#v-crew .lede')),
    'Kite, signed in with a nickname, sees what a crew is and a form to make one', () => 'the page: ' + log.slice(-6).join('; '));
  ok(!!(await K.p.$('footer a[href="#crew"], #foot a[href="#crew"], a[href="#crew"]')), 'the site’s links include My crew');
  await K.wide('make'); await K.shot('make', true);
  ok(!(await K.small()).length, 'every button on the crew page is at least 24 by 24 pixels', async () => (await K.small()).join('; '));
  await K.p.fill('#v-crew input[name="crew-make"]', 'Owls!');
  await K.p.click('#v-crew form[data-crew-make] button[type="submit"]');
  ok(await K.until(() => /That name can’t be used/.test((document.querySelector('#v-crew .crew-said-make') || {}).textContent || '')), 'a name that can’t be used is turned down, saying what a name can be');
  ok(Number(sql('select count(*) from public.club_crews')) === 0, 'and no crew is made');
  await K.p.fill('#v-crew input[name="crew-make"]', 'Night Owls');
  await K.p.click('#v-crew form[data-crew-make] button[type="submit"]');
  ok(await K.headIs('Night Owls'), 'a crew is made, and the page becomes its room', async () => K.text('#v-crew'));
  let link = sql("select link from public.club_crews where name = 'Night Owls'");
  ok(/^[0-9a-f]{32}$/.test(link) && sql("select owner from public.club_crews where name = 'Night Owls'") === kite.id, 'on the server it is Kite’s, with an invite link');
  ok((await K.said('top')) === 'Your crew is ready. Send the invite link below to friends so they can join.' &&
    await K.p.evaluate(() => !!document.activeElement && document.activeElement.classList.contains('crew-said-top')), 'the page says so, and moves the focus there');
  ok((await K.p.inputValue('#v-crew .room-url')) === base + '#c-' + link, 'the invite link is shown');
  ok((await K.figs()) === 'You' && (await K.p.$$('#crew-box .crew-soon')).length === 2, 'the room has Kite in it, with the study corner and the aquarium corner still to come');
  ok(/Now building\s*Study corner/.test(await K.text('#v-crew .crew-side')) && /0 of 20 study sessions, 20 to go\./.test(await K.text('#v-crew .crew-side')) &&
    /Study sessions count once your crew has 2 members/.test(await K.text('#v-crew .crew-side')), 'beside it: 0 of 20 study sessions toward the study corner, and sessions count once a friend joins', async () => K.text('#v-crew .crew-side'));
  ok(await K.p.getAttribute('#crew-box .crew-room', 'aria-label') === 'Night Owls, the crew’s room. Nothing is built yet.', 'the room says what is in it to a screen reader');
  await K.wide('made'); await K.shot('made', true); await K.shotRoom('room-new');
  await K.ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base.replace(/\/$/, '') });
  await K.p.click('#v-crew [data-crew-copy]');
  ok(await K.until(() => /^Copied/.test((document.querySelector('#v-crew .crew-said-link') || {}).textContent || '')) &&
    (await K.p.evaluate(() => navigator.clipboard.readText()).catch(e => String(e))) === base + '#c-' + link, 'Copy the link copies it, and says so');

  /* ---------- a set finished alone in a crew ---------- */
  await K.go('m-easy');
  await playMath(K);
  ok(await K.noteHas(/Study sessions count once Night Owls has 2 members\. Invite a friend/), 'a set finished alone in a crew says sessions count once a friend joins', async () => 'the note: ' + (await K.note()) + '; sent: ' + JSON.stringify(adds));
  ok(Number(sql('select count(*) from public.club_crew_adds')) === 0 && Number(sql('select count(*) from public.club_crew_qs')) === 0, 'and nothing is counted, so the questions can count later');
  ok(((await K.pend()) || {}).pend.length === 0, 'nothing is left waiting on the device', async () => JSON.stringify(await K.pend()));

  /* ---------- a friend opens the invite link and joins ---------- */
  const L = await device(lark);
  await L.open('c-' + link);
  await L.p.waitForSelector('#v-crew [data-crew-join]', { timeout: 15000 }).catch(() => {});
  ok((await L.head()) === 'You’re invited to join Night Owls' && /In it: Kite\./.test(await L.text('#v-crew .crew-inv')) && !!(await L.p.$('#v-crew [data-crew-join]')),
    'Lark opens the link: who is in the crew, and a button to join', async () => L.text('#v-crew'));
  ok(!(await L.p.$('#v-crew form[data-crew-make]')), 'with no form to make a crew instead');
  await L.wide('invite'); await L.shot('invite', true);
  await L.p.click('#v-crew [data-crew-join]');
  ok(await L.headIs('Night Owls'), 'Lark joins');
  ok(/^Welcome to Night Owls!/.test(await L.said('top')) && (await L.p.evaluate(() => location.hash)) === '#crew', 'welcomed, with the address now the crew’s page');
  ok((await L.figs()) === 'Kite,You', 'both are in the room', async () => L.figs());
  ok(/Kite, who owns the crew, has the invite link/.test(await L.text('#v-crew')) && !(await L.p.$('#v-crew .room-url')) && !(await L.p.$('#v-crew [data-crew-ask="out"]')),
    'only the owner has the invite link, and only the owner can take someone out');
  ok(/You can add 2 study sessions today/.test(await L.text('#v-crew .crew-side')), 'the room’s side says how many sessions Lark can add today');
  await L.p.click('#crew-box .crew-fig[data-crew-fig="0"]');
  ok(await L.until(() => { const s = document.querySelector('#crew-box .crew-fig[data-crew-fig="0"] .room-say'); return !!s && !s.hidden && s.textContent.length > 0; }), 'tapping Kite in the room makes Kite say something');

  /* ---------- a student with no nickname yet ---------- */
  const R = await device(reed);
  await R.open('c-' + link);
  await R.p.waitForSelector('#v-crew form[data-club-nickform]', { timeout: 15000 }).catch(() => {});
  ok((await R.head()) === 'You’re invited to join Night Owls' && /First, choose a nickname/.test(await R.text('#v-crew')), 'Reed, with no nickname, is asked to choose one first');
  await R.p.fill('#v-crew .room-nickin', 'Reed');
  await R.p.click('#v-crew form[data-club-nickform] button[type="submit"]');
  ok(await R.until(() => !!document.querySelector('#v-crew [data-crew-join]')), 'then sees the invite, with its Join button');
  await R.p.click('#v-crew [data-crew-join]');
  ok(await R.headIs('Night Owls') && (await R.figs()) === 'Kite,Lark,You', 'and joins: three in the room');

  /* ---------- study sessions ---------- */
  const m1 = await playMathAt(L);
  /* a new quick Math set (by way of another page: the address may be #m-easy already) */
  async function playMathAt(S, stop) { await S.go('m-practice'); await S.go('m-easy'); return playMath(S, stop); }
  ok(await L.noteHas(/\+1 study session for Night Owls\. 1 of 20 toward the study corner\. See your crew/), 'Lark’s Math set adds a study session, said on its results', async () => 'the note: ' + (await L.note()) + '; sent: ' + JSON.stringify(adds.slice(-2)));
  const a1 = adds.filter(a => a.who === 'Lark')[0] || { p: {} };
  ok(a1.p.s === 'm' && JSON.stringify(a1.p.q) === JSON.stringify(m1.map(id => 'm:' + id)), 'the page sent the five questions Lark answered', () => JSON.stringify(a1) + ' for ' + m1.join(','));
  ok(crewOf('Night Owls') === '("Night Owls",0,1,1)', 'and the server counted it');
  await L.go('rw-easy');
  await playRW(L);
  ok(await L.noteHas(/\+1 study session for Night Owls\. 2 of 20 toward the study corner\./), 'a Reading and Writing set adds one too', async () => 'the note: ' + (await L.note()));
  ok((adds.filter(a => a.who === 'Lark')[1] || { p: {} }).p.s === 'rw', 'sent as Reading and Writing');
  await L.shot('note');
  await playMathAt(L, 3);
  ok(await L.noteHas(/This set had 3 questions\. Sets of 5 or more add a study session for Night Owls\./), 'a set stopped after 3 questions says sets of 5 or more count', async () => 'the note: ' + (await L.note()));
  ok(adds.filter(a => a.who === 'Lark').length === 2, 'and is not sent');
  await playMathAt(L);
  ok(await L.noteHas(/You’ve added your 2 study sessions for Night Owls today\. Sets you finish tomorrow count again\./), 'a third full set says the day’s 2 are done', async () => 'the note: ' + (await L.note()));
  ok(crewOf('Night Owls') === '("Night Owls",0,2,2)', 'and adds nothing');
  await L.go('crew');
  ok(await L.until(() => /You’ve added your 2 study sessions today\. Nice work\. More count tomorrow\./.test(document.querySelector('#v-crew .crew-side').textContent) &&
    /2 of 20/.test(document.querySelector('#v-crew .crew-side').textContent) && /Helping build it: Lark\./.test(document.querySelector('#v-crew .crew-side').textContent)),
  'the crew’s page shows 2 of 20, who helped, and that Lark is done for today', async () => L.text('#v-crew .crew-side'));
  ok(await L.p.getAttribute('#v-crew .crew-bar', 'aria-valuenow') === '2', 'its progress bar says 2 to a screen reader');

  /* too few new questions: the server's own limit, said with its number */
  sql('update public.club_crew_config set min_qs = 6');
  await playMathAt(R);
  ok(await R.noteHas(/This set didn’t add a study session for Night Owls: it had only 5 questions you hadn’t counted for a crew before, and a set needs 6\./),
    'when the server asks for more new questions than a set had, the results say how many it needs', async () => 'the note: ' + (await R.note()));
  sql('update public.club_crew_config set min_qs = 5');

  /* ---------- a set finished while the account can't be reached ---------- */
  await R.p.route('**/rest/v1/rpc/club_crew_add', r => r.abort('internetdisconnected'));
  await playMathAt(R);
  await R.p.waitForTimeout(800);
  ok(((await R.pend()) || { pend: [] }).pend.length === 1 && (await R.note()) === '', 'a set finished while the account can’t be reached waits on the device, with nothing said yet', async () => JSON.stringify(await R.pend()) + ' / ' + (await R.note()));
  await R.go('home');
  await R.p.unroute('**/rest/v1/rpc/club_crew_add');
  await R.p.evaluate(() => window.dispatchEvent(new Event('online')));
  ok(await R.until(() => /\+1 study session for Night Owls/.test((document.getElementById('pz-toast') || {}).textContent || '') && document.getElementById('pz-toast').classList.contains('show')),
    'it is sent once the connection is back, and Reed, on another page by then, sees a short note', async () => 'the toast: ' + (await R.text('#pz-toast')) + '; sent: ' + JSON.stringify(adds.slice(-2)));
  await R.shot('toast');
  ok(((await R.pend()) || { pend: [1] }).pend.length === 0 && crewOf('Night Owls') === '("Night Owls",0,3,3)', 'nothing is left waiting, and the server counted it once');

  /* ---------- an upgrade is built, and revealed ---------- */
  sql("update public.club_crews set n = 19 where name = 'Night Owls'");
  await playMathAt(K);
  ok(await K.noteHas(/Night Owls built the study corner!/), 'the 20th study session builds the study corner, said on the set’s results', async () => 'the note: ' + (await K.note()));
  await K.shot('built-note');
  await K.go('crew');
  ok(await K.until(() => !!document.querySelector('#crew-box .crew-curtain [data-crew-reveal]')) && /Your crew built the study corner!/.test(await K.text('#crew-box .crew-curtain')),
    'opening the crew, a curtain says something new is in the room', async () => K.text('#v-crew'));
  await K.wide('curtain'); await K.shotRoom('room-curtain');
  await K.p.click('#crew-box [data-crew-reveal]');
  ok(await K.until(() => !document.querySelector('#crew-box .crew-curtain'), null, 5000), 'the curtain opens');
  ok(!!(await K.p.$('#crew-box .crew-room > .crew-study:not(.crew-soon) .crew-art')) && (await K.p.$$('#crew-box .crew-soon')).length === 1 &&
    await K.p.evaluate(() => document.activeElement && document.activeElement.classList.contains('crew-room')), 'on the study corner, with the aquarium corner still to come, and the focus on the room');
  ok(await soon(() => sql('select seen from public.club_crew_members where user_id = ' + lit(kite.id)) === '1'), 'the server keeps that Kite has seen it');
  await K.p.waitForTimeout(1600); await K.shotRoom('room-study');
  await K.open('crew');
  await K.headIs('Night Owls');
  ok(!(await K.p.$('#crew-box .crew-curtain')), 'so the curtain is not shown again');
  ok(/Built so far\s*Study corner\s*Built .* after 20 study sessions\. Lark, Reed and Kite helped\./.test(await K.text('#v-crew .crew-side')) &&
    /Now building\s*Aquarium corner/.test(await K.text('#v-crew .crew-side')) && /0 of 30/.test(await K.text('#v-crew .crew-side')),
  'beside the room: built so far, after 20 sessions, with who helped (in the order they first did); and now the aquarium corner, 0 of 30', async () => K.text('#v-crew .crew-side'));
  ok(await K.p.getAttribute('#crew-box .crew-room', 'aria-label') === 'Night Owls, the crew’s room. Built so far: Study corner.', 'the room says what is built to a screen reader');

  /* ---------- crews paused ---------- */
  sql('update public.club_crew_config set crews_on = false');
  await L.open('crew');
  ok(await L.until(() => /Crews are paused for now, so study sessions don’t count until they’re back\./.test(document.querySelector('#v-crew').textContent)), 'when crews are switched off, the crew’s page says they are paused');
  sql('update public.club_crew_config set crews_on = true');

  /* ---------- the owner's tools ---------- */
  await K.open('crew');
  await K.headIs('Night Owls');
  const members = async S => S.p.evaluate(() => Array.from(document.querySelectorAll('#v-crew .crew-mems b')).map(b => b.textContent).join(','));
  ok((await members(K)) === 'Kite (you),Lark,Reed' && (await K.p.$$('#v-crew .crew-mems [data-crew-ask="out"]')).length === 2, 'Kite sees who is in the crew, with buttons for each of the others');
  const old = link;
  await K.p.click('#v-crew [data-crew-ask="new"]');
  ok(/Make a new link\? The old one will stop working/.test(await K.text('#v-crew .crew-ask')), 'a new link is asked about first');
  await K.p.click('#v-crew [data-crew-link="on"]');
  ok(await K.until(() => /Your new link is ready\. The old one doesn’t work anymore\./.test((document.querySelector('#v-crew .crew-said-link') || {}).textContent || '')), 'a new link is made');
  link = sql("select link from public.club_crews where name = 'Night Owls'");
  ok(link !== old && (await K.p.inputValue('#v-crew .room-url')) === base + '#c-' + link, 'and shown');
  const M = await device(moss);
  await M.open('c-' + old);
  ok(await M.until(() => /This invite link doesn’t work/.test(document.querySelector('#v-crew').textContent)) && !!(await M.p.$('#v-crew form[data-crew-make]')),
    'Moss, opening the old link, is told it doesn’t work, and can make a crew instead', async () => M.text('#v-crew'));
  await M.wide('closed');
  await K.p.click('#v-crew [data-crew-ask="off"]');
  await K.p.click('#v-crew [data-crew-link="off"]');
  ok(await K.until(() => /The link is off\. No one new can join\./.test((document.querySelector('#v-crew .crew-said-link') || {}).textContent || '') && !document.querySelector('#v-crew .room-url')) &&
    sql("select coalesce(link, 'off') from public.club_crews where name = 'Night Owls'") === 'off', 'the link can be turned off');
  await K.p.click('#v-crew [data-crew-link="on"]');
  ok(await K.until(() => /Your link is ready\. Send it to a friend\./.test((document.querySelector('#v-crew .crew-said-link') || {}).textContent || '')), 'and a new one made');
  link = sql("select link from public.club_crews where name = 'Night Owls'");
  await M.open('c-' + link);
  await M.p.waitForSelector('#v-crew [data-crew-join]', { timeout: 15000 }).catch(() => {});
  await M.p.click('#v-crew [data-crew-join]');
  ok(await M.headIs('Night Owls') && (await M.figs()) === 'Kite,Lark,Reed,You', 'Moss joins with it: four in the room', async () => M.figs());
  await M.shotRoom('room-four');
  await K.open('crew');
  await K.headIs('Night Owls');
  await K.p.fill('#v-crew input[name="crew-name"]', 'Kite’s Crew');
  await K.p.click('#v-crew form[data-crew-rename] button[type="submit"]');
  ok(await K.headIs('Kite\'s Crew') && (await K.said('name')) === 'The crew’s name is saved.' && crewOf('Kite\'s Crew') !== '', 'Kite renames the crew (a curly apostrophe saved as a straight one)', async () => (await K.head()) + ' / ' + (await K.said('name')));
  await K.p.click('#v-crew .crew-mems [data-crew-ask="out"][data-crew-nick="Moss"]');
  ok(/Take Moss out of Kite's Crew\? They won’t be able to join it again\./.test(await K.text('#v-crew .crew-mems .crew-ask')), 'taking someone out is asked about first');
  await K.shot('ask-out');
  await K.p.click('#v-crew [data-crew-out="Moss"]');
  ok(await K.until(() => /Moss is out of the crew\./.test((document.querySelector('#v-crew .crew-said-mem') || {}).textContent || '')) && (await members(K)) === 'Kite (you),Lark,Reed', 'Kite takes Moss out');
  await M.open('c-' + link);
  ok(await M.until(() => /You were taken out of this crew, so you can’t join it again\./.test(document.querySelector('#v-crew').textContent)) && !(await M.p.$('#v-crew [data-crew-join]')),
    'Moss, opening the link again, is told they were taken out', async () => M.text('#v-crew'));
  await K.p.click('#v-crew .crew-mems [data-crew-ask="hand"][data-crew-nick="Lark"]');
  await K.p.click('#v-crew [data-crew-hand="Lark"]');
  ok(await K.until(() => /Lark owns the crew now\./.test((document.querySelector('#v-crew .crew-said-mem') || {}).textContent || '')) &&
    /Lark, who owns the crew, has the invite link/.test(await K.text('#v-crew')) && !(await K.p.$('#v-crew form[data-crew-rename]')), 'Kite hands the crew to Lark, and no longer has the owner’s tools');
  await L.open('crew');
  await L.headIs('Kite\'s Crew');
  ok(!!(await L.p.$('#v-crew .room-url')) && !!(await L.p.$('#v-crew form[data-crew-rename]')) && /Owner/.test(await L.text('#v-crew .crew-mems')), 'Lark has them now');

  /* ---------- leaving ---------- */
  await K.p.click('#v-crew [data-crew-ask="leave"]');
  ok(/Leave Kite's Crew\? You can join again with an invite link\./.test(await K.text('#v-crew .crew-ask')), 'leaving is asked about first');
  await K.p.click('#v-crew [data-crew-leave]');
  ok(await K.until(() => /You left Kite's Crew\./.test((document.querySelector('#v-crew .crew-said-top') || {}).textContent || '') && !!document.querySelector('#v-crew form[data-crew-make]')) &&
    sql('select count(*) from public.club_crew_members where user_id = ' + lit(kite.id)) === '0', 'Kite leaves, and can make a crew again');

  /* ---------- the crew on My room ---------- */
  await L.open('room');
  ok(await L.until(() => /My crew: Kite's Crew/.test(((document.querySelector('#v-room .crew-card') || {}).textContent || '')) && /0 of 30 study sessions toward the aquarium corner\./.test(document.querySelector('#v-room .crew-card').textContent)),
    'My room shows Lark’s crew and how far along it is', async () => L.text('#v-room .crew-card'));
  await K.open('room');
  ok(await K.until(() => /Build a room with friends/.test(((document.querySelector('#v-room .crew-card') || {}).textContent || '')) && !!document.querySelector('#v-room .crew-card a[href="#crew"]')),
    'and Kite, in no crew now, a way to find out about crews', async () => K.text('#v-room .crew-card'));
  await K.wide('room');

  /* ---------- the whole room built ---------- */
  sql("update public.club_crews set step = 3, n = 4, total = 95 where name = 'Kite''s Crew'");
  sql("insert into public.club_crew_built (crew_id, step, sessions) select id, s, case s when 2 then 30 else 40 end from public.club_crews, generate_series(2, 3) s where name = 'Kite''s Crew'");
  await L.open('crew');
  ok(await L.until(() => /Your crew built the study corner, the aquarium corner and the Deep Sea room!/.test(((document.querySelector('#crew-box .crew-curtain') || {}).textContent || ''))),
    'Lark, who has not opened the crew since, sees all three behind the curtain', async () => L.text('#crew-box'));
  await L.p.click('#crew-box [data-crew-reveal]');
  ok(await L.until(() => !document.querySelector('#crew-box .crew-curtain'), null, 5000) && !!(await L.p.$('#crew-box .crew-deepsea .crew-deep')) &&
    !!(await L.p.$('#crew-box canvas[data-room-scene="living:prize-abyss"]')) && !!(await L.p.$('#crew-box .crew-tank:not(.crew-soon) .crew-art')),
  'the room is Deep Sea, with the aquarium and the living deep-sea window');
  ok(/Your crew built the whole room/.test(await L.text('#v-crew .crew-side')) && /95 study sessions in all/.test(await L.text('#v-crew .crew-side')), 'beside it: the whole room is built, with every session counted');
  await L.p.waitForTimeout(1600);
  await L.wide('deep'); await L.shot('deep', true); await L.shotRoom('room-deep');

  /* ---------- Help ---------- */
  await L.p.click('#help-btn');
  await L.p.waitForTimeout(200);
  ok((await L.text('#help-h')) === 'Help with crews' && /What is a crew\?/.test(await L.text('#help')), 'Help on the crew page answers questions about crews', async () => L.text('#help-h'));
  await L.p.keyboard.press('Escape');

  /* ---------- a project where club-crew.sql was never run ---------- */
  noCrew = true;
  const N = await device(moss);
  await N.open('crew');
  ok(await N.until(() => /Crews are not switched on for this site yet\./.test(document.querySelector('#v-crew').textContent)), 'without club-crew.sql the crew page says crews are not switched on yet');
  await N.go('room');
  await N.p.waitForTimeout(800);
  ok(!(await N.p.$('#v-room .crew-card')), 'and My room has no crew card');
  const before = calls('Moss', 'club_crew_add');
  await playMathAt(N);
  await N.p.waitForTimeout(800);
  ok(calls('Moss', 'club_crew_add') === before && (await N.note()) === '', 'a finished set sends nothing and says nothing about crews');

  await browser.close(); server.close();
  try { psql(['-d', 'postgres', '-c', 'drop database ' + DB + ' with (force)']); } catch (e) { console.log('     (could not drop the test database ' + DB + ')'); }
  console.log(errors.length ? 'SCRIPT ERRORS:\n' + errors.join('\n') : 'no script errors');
  console.log(over.length ? 'SIDEWAYS SCROLL:\n' + over.join('\n') : 'no sideways scrolling');
  console.log(fail.length ? fail.length + ' FAILED' : 'all crew page checks passed');
  process.exit(fail.length || errors.length || over.length ? 1 : 0);
})().catch(e => { console.log('FAIL ' + (e && e.stack || e)); process.exit(1); });
