/* Live rooms on the page (src/site/live.js) with three students, against the real src/account/club.sql and club-live.sql on
   PostgreSQL: joining a shared room live, figures walking where a student taps, reactions and quick phrases reaching the
   others, who's here, mute, report, block and unblock, the owner asking someone to leave (the room moves to a new topic),
   a student coming back, stopping sharing, the monthly limit, five quiet minutes, a hidden tab, closing the tab, a visitor
   who is signed out, a student with no nickname, and a project where club-live.sql was never run.
   The account service is a small stand-in for Supabase (sessions, the progress table, and club_* functions called the way
   PostgREST calls them, as in club.js), and Realtime is a stand-in too: a WebSocket server speaking Phoenix's protocol 1.0.0
   that lets a page listen to a private topic only when the policy on realtime.messages lets that student read it (checked
   the way Realtime checks it, as the student), and passes on each message the database sends with realtime.send. It notes
   anything a page tries to send on a channel: a page must never send anything there.
   PGHOST=... PGUSER=... PGPASSWORD=... node src/check/live.js index.html [width] [shots-folder] */
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
  /* why: what to print when a step fails, to help find the cause */
  const ok = (cond, what, why) => { if (!cond) { fail.push(what); } console.log((cond ? 'ok   ' : 'FAIL ') + what + (!cond && why ? '\n       ' + why() : '')); };

  /* ---------- the database: club.sql, its prize list, and club-live.sql ---------- */
  const DB = process.env.LIVE_PAGE_DB || 'live_page';
  const env = Object.assign({}, process.env, { PGOPTIONS: (process.env.PGOPTIONS || '') + ' -c client_min_messages=warning' });
  const psql = (args, input) => execFileSync('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1'].concat(args), { input, env, encoding: 'utf8', maxBuffer: 64 << 20 });
  const lit = s => "'" + String(s).replace(/'/g, "''") + "'";
  const sql = q => psql(['-A', '-t', '-d', DB, '-c', q]).trim();
  try { psql(['-d', 'postgres', '-c', 'drop database if exists ' + DB, '-c', 'create database ' + DB]); } catch (e) { console.log('FAIL no PostgreSQL to test with (set PGHOST, PGUSER and PGPASSWORD): ' + String(e.stderr || e.message).trim()); process.exit(1); }
  psql(['-d', DB, '-f', path.join(__dirname, 'club-shim.sql')]);
  psql(['-d', DB, '-o', '/dev/null', '-f', '-'], fs.readFileSync(path.join(src, 'account', 'club.sql'), 'utf8').split('\n').filter(l => !/^create extension/.test(l)).join('\n'));
  psql(['-d', DB, '-o', '/dev/null', '-f', '-'], "insert into net._http_response (id, status_code, content) select asked, 200, " + lit(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8')) + " from public.club_rules;\nselect public.club_catalog_sync();\n");
  psql(['-d', DB, '-o', '/dev/null', '-f', path.join(src, 'account', 'club-live.sql')]);
  /* as a signed-in student, in one transaction (the way PostgREST calls a function) */
  const asUser = (uid, q) => psql(['-A', '-t', '-d', DB, '-f', '-'], 'begin;\nset local role authenticated;\nset local request.jwt.claims to ' + lit(JSON.stringify({ sub: uid, role: 'authenticated' })) + ';\n' + q + '\ncommit;\n').trim();

  /* ---------- the students ---------- */
  const users = {}, access = {}, refresh = {}, rows = {}, log = [];
  let seq = 0;
  const session = u => { const a = 'at-' + (++seq), r = 'rt-' + seq; access[a] = u.id; refresh[r] = u.id; return { at: a, rt: r }; };
  const student = (name, nick, room) => {
    const u = users[name] = { id: crypto.randomUUID(), email: name.toLowerCase() + '@example.com', name };
    sql('insert into auth.users (id, email) values (' + lit(u.id) + ', ' + lit(u.email) + ')');
    asUser(u.id, "select public.club_join('{}');" + (nick ? 'select public.club_nick(' + lit(nick) + ');' : '') + (room ? 'select public.club_room_save(' + lit(JSON.stringify(room)) + ');' : ''));
    return u;
  };
  const oak = student('Oak', 'Oak', { av: ['teal', 'cap'] }), pine = student('Pine', 'Pine', { av: ['pink', 'bow'] }), quill = student('Quill', 'Quill', { av: ['orange', 'grad'] });
  const reed = student('Reed', '', null);
  let link = JSON.parse(asUser(oak.id, 'select public.club_room_link(true);')).link;
  const pidOf = u => sql('select pid from public.club_live_leases where user_id = ' + lit(u.id));
  const inRoom = () => sql("select coalesce(string_agg(p.nickname, ',' order by p.nickname), '') from public.club_live_leases l join public.club_profiles p using (user_id)");

  /* ---------- the stand-in service ---------- */
  const html0 = fs.readFileSync(path.join(root, index), 'utf8'), CFG = /"account":\{"url":"[^"]*","key":"[^"]*"\}/;
  if (!CFG.test(html0)) { console.log('FAIL the page has no account settings to swap (rebuild it: src/README.md)'); process.exit(1); }
  let base = '', noLive = false;
  const send = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(body === undefined ? '' : JSON.stringify(body)); };
  const ARGT = { p: 'jsonb', p_series: 'text', p_grant: 'text', p_code: 'text', p_name: 'text', p_on: 'boolean', p_link: 'text', p_sticker: 'text', p_id: 'bigint',
    p_kind: 'text', p_key: 'text', p_x: 'int', p_y: 'int', p_pid: 'text', p_why: 'text', p_nick: 'text', p_active: 'boolean' };
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
    log.push(m + ' ' + p + (fn ? ' ' + (me ? me.name : 'anon') + (fn === 'club_live_say' ? ' ' + body.p_kind + ':' + (body.p_key || body.p_x + ',' + body.p_y) : '') : '') + ' @' + ((Date.now() - T0) / 1000).toFixed(2));
    if (/^club_/.test(fn)) {
      if (noLive && /^club_live_/.test(fn)) { return send(res, ...missing(fn)); }
      if (bearer && !me) { return send(res, 401, { code: 'PGRST301', message: 'JWT expired' }); }
      return rpc(fn, body, me ? me.id : '').then(([code, b]) => send(res, code, b));
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

  /* ---------- the stand-in for Realtime: Phoenix over a WebSocket, written out by hand ---------- */
  const conns = new Set(), rt = { joins: 0, refused: 0, open: 0, notPrivate: 0, sent: [], tokens: 0, delivered: 0 };
  const wsFrame = b => {
    if (b.length < 2) { return null; }
    const op = b[0] & 15, masked = b[1] & 128;
    let n = b[1] & 127, o = 2;
    if (n === 126) { if (b.length < 4) { return null; } n = b.readUInt16BE(2); o = 4; } else if (n === 127) { if (b.length < 10) { return null; } n = Number(b.readBigUInt64BE(2)); o = 10; }
    const mk = masked ? b.subarray(o, o + 4) : null;
    if (masked) { o += 4; }
    if (b.length < o + n) { return null; }
    const data = Buffer.from(b.subarray(o, o + n));
    if (mk) { for (let i = 0; i < n; i++) { data[i] ^= mk[i & 3]; } }
    return { op, data, len: o + n };
  };
  const wsSend = (c, text, op) => {
    const d = Buffer.from(text), n = d.length, o = 128 | (op || 1);
    const h = n < 126 ? Buffer.from([o, n]) : n < 65536 ? Buffer.from([o, 126, n >> 8, n & 255]) : (() => { const x = Buffer.alloc(10); x[0] = o; x[1] = 127; x.writeBigUInt64BE(BigInt(n), 2); return x; })();
    try { c.sock.write(Buffer.concat([h, d])); } catch (e) {}
  };
  const reply = (c, m, status, response) => wsSend(c, JSON.stringify({ topic: m.topic, event: 'phx_reply', payload: { status, response: response || {} }, ref: m.ref, join_ref: m.join_ref || null }));
  /* may this student read this topic? Realtime's own question: a message on it, read back as the student under the policy */
  const mayListen = (uid, topic) => new Promise(done => {
    const q = 'begin;\ninsert into realtime.messages (topic, extension, event, private) values (' + lit(topic) + ", 'broadcast', 'probe', true);\n" +
      'set local role authenticated;\nset local request.jwt.claims to ' + lit(JSON.stringify({ sub: uid, role: 'authenticated' })) + ';\n' +
      "select set_config('realtime.topic', " + lit(topic) + ', true) is not null;\n' +
      'select count(*) from realtime.messages where topic = ' + lit(topic) + " and event = 'probe';\nrollback;\n";
    const ps = spawn('psql', ['-X', '-q', '-A', '-t', '-d', DB], { env });
    let out = '';
    ps.stdout.on('data', d => { out += d; });
    ps.on('close', () => { const lines = out.trim().split('\n'); done(Number(lines[lines.length - 1]) > 0); });
    ps.stdin.end(q);
  });
  const onText = (c, s) => {
    let m;
    try { m = JSON.parse(s); } catch (e) { return; }
    if (m.topic === 'phoenix' && m.event === 'heartbeat') { return reply(c, m, 'ok'); }
    if (m.event === 'phx_join') {
      rt.joins++;
      const cfg = (m.payload || {}).config || {}, uid = access[(m.payload || {}).access_token];
      if (cfg.private !== true) { rt.notPrivate++; }
      if (!uid || cfg.private !== true) { rt.refused++; return reply(c, m, 'error', { reason: 'Unauthorized: You do not have permissions to read from this Channel topic: ' + m.topic }); }
      return mayListen(uid, String(m.topic).replace(/^realtime:/, '')).then(yes => {
        if (!yes) { rt.refused++; return reply(c, m, 'error', { reason: 'Unauthorized: You do not have permissions to read from this Channel topic: ' + m.topic }); }
        c.subs[m.topic] = { uid, ref: m.ref };
        reply(c, m, 'ok', { postgres_changes: [] });
      });
    }
    if (m.event === 'access_token') { rt.tokens++; return; }
    if (m.event === 'phx_leave') { delete c.subs[m.topic]; return reply(c, m, 'ok'); }
    rt.sent.push(m.topic + ' ' + m.event);   // a page sending on a channel: never allowed
  };
  server.on('upgrade', (req, sock) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== '/realtime/v1/websocket' || url.searchParams.get('apikey') !== APIKEY || url.searchParams.get('vsn') !== '1.0.0') { sock.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return; }
    const accept = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
    const c = { sock, subs: {}, buf: Buffer.alloc(0) };
    conns.add(c); rt.open++;
    sock.on('data', d => {
      c.buf = Buffer.concat([c.buf, d]);
      for (;;) {
        const f = wsFrame(c.buf);
        if (!f) { break; }
        c.buf = c.buf.subarray(f.len);
        if (f.op === 8) { conns.delete(c); try { sock.end(); } catch (e) {} return; }
        if (f.op === 9) { wsSend(c, f.data, 10); continue; }
        if (f.op === 1) { onText(c, f.data.toString('utf8')); }
      }
    });
    sock.on('close', () => conns.delete(c));
    sock.on('error', () => conns.delete(c));
  });
  /* every message the database sends (realtime.send), passed on to the pages listening to its topic */
  let lastId = 0, polling = true, pollBusy = false;
  const poller = spawn('psql', ['-X', '-q', '-A', '-t', '-d', DB], { env });
  let pbuf = '', pwait = null;
  poller.stdout.on('data', d => { pbuf += d; const i = pbuf.indexOf('@@END@@'); if (i >= 0 && pwait) { const out = pbuf.slice(0, i); pbuf = ''; const w = pwait; pwait = null; w(out); } });
  const poll = () => new Promise(done => {
    pwait = done;
    poller.stdin.write("select coalesce(json_agg(json_build_object('id', id, 'topic', topic, 'event', event, 'payload', payload, 'private', private) order by id), '[]') from realtime.messages where id > " + lastId + " and event <> 'probe';\n\\echo @@END@@\n");
  });
  const pump = async () => {
    while (polling) {
      if (!pollBusy) {
        pollBusy = true;
        const out = await poll();
        pollBusy = false;
        let list = [];
        try { list = JSON.parse(out.trim() || '[]'); } catch (e) {}
        list.forEach(r => {
          lastId = Math.max(lastId, r.id);
          conns.forEach(c => {
            const t = 'realtime:' + r.topic;
            if (r.private && c.subs[t]) {
              rt.delivered++;
              wsSend(c, JSON.stringify({ event: 'broadcast', topic: t, payload: { event: r.event, payload: r.payload, type: 'broadcast', meta: { id: String(r.id) } }, ref: null }));
            }
          });
        });
      }
      await new Promise(r => setTimeout(r, 100));
    }
  };
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://localhost:' + server.address().port + '/';
  pump();

  /* ---------- the browser: each student on their own device, signed in ---------- */
  const browser = await chromium.launch();
  const device = async (who, opts) => {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 }, serviceWorkers: 'block', timezoneId: 'America/New_York', deviceScaleFactor: dir ? 2 : 1 });
    const name = who ? who.name : 'guest';
    if (who) {
      const s = session(who);
      await ctx.addInitScript(([k, v]) => { try { if (!localStorage.getItem(k)) { localStorage.setItem(k, v); } } catch (e) {} },
        ['sat-sprint-account', JSON.stringify({ uid: who.id, email: who.email, at: s.at, rt: s.rt, exp: Date.now() + 3600e3, rev: null, dirty: false })]);
    }
    const p = await ctx.newPage(), d = { p, name, ctx };
    if (opts && opts.clock) { await p.clock.install(); }
    p.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts\.g|Failed to load resource/i.test(m.text())) { errors.push(name + ' console: ' + m.text()); } });
    p.on('pageerror', e => errors.push(name + ' pageerror: ' + e.message));
    d.open = async hash => { await p.goto('about:blank'); await p.goto(base + (hash ? '#' + hash : '')); await p.waitForTimeout(600); };
    d.go = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(300); };
    d.text = async sel => ((await p.textContent(sel).catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    d.until = async (fn, arg, ms) => { const end = Date.now() + (ms || 10000); for (;;) { const v = await p.evaluate(fn, arg).catch(() => false); if (v || Date.now() > end) { return v; } await p.waitForTimeout(150); } };
    d.panel = () => d.text('#live-slot');
    d.join = async () => { await p.waitForSelector('#live-slot [data-live-join]', { timeout: 15000 }); await p.click('#live-slot [data-live-join]'); return d.until(() => /here live/.test((document.querySelector('#live-h') || {}).textContent || '') && !!document.querySelector('#live-slot [data-live-leave]')); };
    /* who this page shows in the room: names in the list, and figures on the floor */
    d.here = () => p.evaluate(() => Array.from(document.querySelectorAll('.live-who .live-row b')).map(b => b.textContent.replace(' (you)', '')).sort().join(','));
    d.figs = () => p.evaluate(() => document.querySelectorAll('#visit-box .live-fig').length);
    /* open the options for someone in the room (unless they are open already) */
    d.opts = async nick => { const b = await p.$('#live-slot [data-live-open][aria-label$=" ' + nick + '"]'); if (b && (await b.getAttribute('aria-expanded')) !== 'true') { await b.click(); } };
    d.pidOf = nick => p.evaluate(n => { const b = document.querySelector('#live-slot [data-live-open][aria-label$=" ' + n + '"]'); return b ? b.getAttribute('data-live-open') : ''; }, nick);
    d.fig = pid => p.evaluate(id => { const f = document.querySelector('#visit-box .live-fig[data-live-pid="' + id + '"]'); return f ? { x: parseFloat(f.style.left), y: parseFloat(f.style.top), bub: (f.querySelector('.live-bub:not([hidden])') || {}).textContent || '', pop: (f.querySelector('.live-pop') || {}).textContent || '' } : null; }, pid);
    d.news = () => p.evaluate(() => (document.querySelector('.live-news') || {}).textContent || '');
    /* a tap in the room, as a share of its width and height (measured at the time: the page may have scrolled) */
    d.tap = async (fx, fy) => { const room = p.locator('#visit-box .room-room'), bb = await room.boundingBox(); await room.click({ position: { x: bb.width * fx, y: bb.height * fy } }); };
    d.wide = async t => { const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (r[0] > r[1] + 1) { over.push(name + ' ' + t + ': ' + r[0] + '>' + r[1]); } };
    d.shot = async (n, sel) => {
      if (!dir) { return; }
      const f = path.join(dir, 'live-' + width + '-' + n + '.png');
      if (sel) { const el = await p.$(sel); if (el) { await el.screenshot({ path: f }); } return; }
      await p.screenshot({ path: f });
    };
    return d;
  };
  const says = (who, kind) => log.filter(l => l.startsWith('POST /rest/v1/rpc/club_live_say ' + who + ' ' + (kind || ''))).length;

  /* ---------- the lists on the page are the server's ---------- */
  const words = JSON.parse(sql('select public.club_live_words()')), liveSrc = fs.readFileSync(path.join(src, 'site', 'live.js'), 'utf8');
  const keysOf = name => { const a = liveSrc.indexOf('var ' + name + ' = ['); return Array.from(liveSrc.slice(a, liveSrc.indexOf('];', a)).matchAll(/\['([a-z]+)', /g)).map(x => x[1]); };
  ok(JSON.stringify(keysOf('LIVE_REACT')) === JSON.stringify(words.react) && JSON.stringify(keysOf('LIVE_SAY')) === JSON.stringify(words.say),
    'the page offers the same ' + words.react.length + ' reactions and ' + words.say.length + ' phrases the server accepts');

  /* ---------- a visitor who is not signed in sees who is live, and is asked to sign in ---------- */
  const G = await device(null);
  await G.open('r-' + link);
  await G.p.waitForSelector('#live-slot .live-panel', { timeout: 15000 });
  ok(/Hang out here live/.test(await G.panel()) && /Sign in to join this room live/.test(await G.panel()), 'a visitor who is not signed in is asked to sign in to join live: ' + (await G.panel()).slice(0, 90));

  /* ---------- Pine joins Oak's room live ---------- */
  const B = await device(pine);
  await B.open('r-' + link);
  await B.p.waitForSelector('#live-slot [data-live-join]', { timeout: 15000 });
  ok(/Join live to walk around this room/.test(await B.panel()), 'a signed-in student with a nickname is offered Join live');
  ok(await B.join(), 'Pine joins the room live');
  ok(inRoom() === 'Pine' && (await B.here()) === 'Pine' && (await B.figs()) === 1, 'the server has Pine in the room, and the page shows Pine in the list and on the floor');
  ok(await B.until(() => !!document.querySelector('#visit-box .live-fig.live-you .live-tag') && document.querySelector('#visit-box .live-fig.live-you .live-tag').textContent === 'You'), 'Pine’s own figure is marked You');
  ok(await B.until(() => true) && rt.joins >= 1 && rt.notPrivate === 0, 'the page listens on a private channel, with the student’s sign-in');
  await G.p.reload(); await G.p.waitForTimeout(400); await G.go('r-' + link);
  ok(await G.until(() => /1 person is here live/.test((document.querySelector('#live-h') || {}).textContent || '')), 'a visitor sees that 1 person is here live');

  /* ---------- Oak, the owner, joins; then Quill ---------- */
  const A = await device(oak);
  await A.open('r-' + link);
  ok(/This is your room/.test(await A.until(() => (document.querySelector('#live-slot') || {}).textContent || '')), 'the owner is told it is their room, and offered Join live');
  ok(await A.join(), 'Oak joins their own room live');
  ok(await B.until(() => document.querySelectorAll('.live-who .live-row').length === 2), 'Pine’s page shows Oak come in (2 here)');
  ok(await B.until(() => /Oak came in/.test((document.querySelector('.live-news') || {}).textContent || '')), 'and tells a screen reader: ' + await B.news());
  ok(await B.until(() => document.querySelector('#visit-box .room-room').classList.contains('live-owner-in')), 'the owner’s still figure steps aside while the owner is live in the room');
  const C = await device(quill);
  await C.open('r-' + link);
  ok(await C.join(), 'Quill joins');
  ok(await A.until(() => document.querySelectorAll('.live-who .live-row').length === 3) && await B.until(() => document.querySelectorAll('.live-who .live-row').length === 3), 'everyone sees 3 here');
  ok((await A.here()) === 'Oak,Pine,Quill' && (await A.figs()) === 3, 'with their names and figures');
  await A.wide('live'); await B.wide('live'); await A.shot('owner'); await B.shot('panel', '#live-slot');

  /* ---------- walking ---------- */
  const pPine = await A.pidOf('Pine'), pQuill = await A.pidOf('Quill');
  ok(pPine === pidOf(pine) && pQuill === pidOf(quill), 'the ids on the page are the server’s, not the accounts’ ids');
  await B.tap(0.3, 0.9);
  ok(await B.until(id => { const f = document.querySelector('#visit-box .live-fig.live-you'); return f && Math.abs(parseFloat(f.style.left) - 30) <= 1 && Math.abs(parseFloat(f.style.top) - 90) <= 1; }), 'Pine taps the floor and their figure walks there at once');
  ok(await A.until(id => { const f = document.querySelector('#visit-box .live-fig[data-live-pid="' + id + '"]'); return f && Math.abs(parseFloat(f.style.left) - 30) <= 1 && Math.abs(parseFloat(f.style.top) - 90) <= 1; }, pPine), 'Oak sees Pine walk there');
  await B.tap(0.6, 0.2);
  ok(await C.until(id => { const f = document.querySelector('#visit-box .live-fig[data-live-pid="' + id + '"]'); return f && Math.abs(parseFloat(f.style.left) - 60) <= 1 && parseFloat(f.style.top) === 78; }, pPine), 'a tap on the wall walks to the front of the floor below it, and Quill sees it');
  for (let i = 0; i < 4; i++) { await B.tap(0.4 + i * 0.1, 0.85); await B.p.waitForTimeout(120); }
  ok(await A.until(id => { const f = document.querySelector('#visit-box .live-fig[data-live-pid="' + id + '"]'); return f && Math.abs(parseFloat(f.style.left) - 70) <= 1; }, pPine, 8000), 'quick taps: the others see where Pine stopped');
  ok(says('Pine', 'walk') <= 4, 'and fewer moves are sent than taps (' + says('Pine', 'walk') + ' moves for 6 taps)');

  /* ---------- reactions and phrases ---------- */
  await B.p.click('#live-slot [data-live-react="clap"]');
  const restingNow = await B.p.evaluate(() => document.querySelector('#live-slot [data-live-react="fire"]').getAttribute('aria-disabled') === 'true');
  /* force: the page keeps resting buttons focusable (aria-disabled), and Playwright would wait for them to wake */
  await B.p.click('#live-slot [data-live-react="fire"]', { force: true });
  ok(await A.until(id => /👏/.test(((document.querySelector('#visit-box .live-fig[data-live-pid="' + id + '"] .live-pop') || {}).textContent) || ''), pPine, 5000), 'Pine claps, and the clap rises over Pine on Oak’s screen');
  ok(await A.until(() => /Pine sent clap/.test((document.querySelector('.live-news') || {}).textContent || '')), 'a screen reader hears it: ' + await A.news());
  ok(restingNow, 'the buttons rest for 3 seconds');
  ok(says('Pine', 'react') === 1, 'a tap while they rest sends nothing');
  ok(await B.until(() => !document.querySelector('#live-slot [data-live-react="fire"]').hasAttribute('aria-disabled'), null, 5000), 'then they are ready again');
  await C.p.focus('#live-slot [data-live-say="nice"]'); await C.p.keyboard.press('Enter');
  ok(await A.until(id => ((document.querySelector('#visit-box .live-fig[data-live-pid="' + id + '"] .live-bub:not([hidden])') || {}).textContent || '') === 'Nice room!', pQuill, 5000)
    && await B.until(id => ((document.querySelector('#visit-box .live-fig[data-live-pid="' + id + '"] .live-bub:not([hidden])') || {}).textContent || '') === 'Nice room!', pQuill, 5000), 'Quill says “Nice room!” with the keyboard, and Oak and Pine see the bubble');
  ok(await C.p.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-live-say') === 'nice'), 'the phrase button keeps the keyboard focus while the buttons rest and wake');
  ok(await A.until(() => /Quill: Nice room!/.test((document.querySelector('.live-news') || {}).textContent || '')), 'a screen reader hears “Quill: Nice room!”');
  await B.shot('room-talk', '#visit-box');

  /* ---------- mute, report ---------- */
  await A.opts('Quill');
  await A.p.click('#live-slot [data-live-mute="' + pQuill + '"]');
  ok(/Quill is muted on your screen/.test(await A.panel()) && /muted/.test(await A.text('.live-who')), 'Oak mutes Quill on their own screen');
  await C.p.waitForTimeout(3100);
  await C.p.click('#live-slot [data-live-say="luck"]');
  ok(await B.until(id => ((document.querySelector('#visit-box .live-fig[data-live-pid="' + id + '"] .live-bub:not([hidden])') || {}).textContent || '') === 'Good luck on the test!', pQuill, 5000), 'Quill wishes good luck: Pine sees it');
  await A.p.waitForTimeout(800);
  ok(((await A.fig(pQuill)) || {}).bub !== 'Good luck on the test!' && !/Good luck/.test(await A.news()), 'Oak, who muted Quill, does not');
  await B.opts('Quill');
  await B.p.click('#live-slot [data-live-ask="report:' + pQuill + '"]');
  ok(/What happened\?/.test(await B.panel()) && await B.p.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-live-cancel')), 'Report asks what happened, with focus on Cancel');
  await B.p.click('#live-slot [data-live-do="report:' + pQuill + ':unkind"]');
  ok(await B.until(() => /Your report went to the site’s owner/.test(document.querySelector('#live-slot').textContent)), 'Pine reports Quill and is thanked');
  const rep = JSON.parse(sql("select row_to_json(r) from (select from_nick, about_nick, room_nick, reason, recent from public.club_reports order by id desc limit 1) r"));
  ok(rep.from_nick === 'Pine' && rep.about_nick === 'Quill' && rep.room_nick === 'Oak' && rep.reason === 'unkind' && rep.recent.some(x => x[1] === 'say' && x[2] === 'luck'),
    'the report keeps who, about whom, where, why, and what Quill said: ' + JSON.stringify(rep.recent.map(x => x[1] + ' ' + x[2])));

  /* ---------- block and unblock (two visitors) ---------- */
  await B.opts('Quill');
  await B.p.click('#live-slot [data-live-ask="block:' + pQuill + '"]');
  await B.p.click('#live-slot [data-live-do="block:' + pQuill + '"]');
  ok(await B.until(() => /You blocked Quill/.test(document.querySelector('#live-slot').textContent)), 'Pine blocks Quill');
  ok((await B.here()) === 'Oak,Pine' && !(await B.fig(pQuill)), 'and no longer sees Quill in the list or on the floor');
  ok(await C.until(id => !document.querySelector('#visit-box .live-fig[data-live-pid="' + id + '"]') && !/Pine/.test(document.querySelector('.live-who').textContent), pPine, 40000), 'Quill’s page stops showing Pine too, at its next check with the server');
  ok((await A.here()) === 'Oak,Pine,Quill', 'Oak still sees both');
  await C.p.waitForTimeout(3100);
  await B.p.evaluate(() => { document.querySelector('.live-news').textContent = ''; });
  await C.p.click('#live-slot [data-live-say="hi"]');
  await B.p.waitForTimeout(1500);
  ok(says('Quill', 'say:hi') === 1 && !(await B.fig(pQuill)) && !/Quill/.test(await B.news()), 'what Quill sends does not reach Pine’s screen');
  await B.p.click('#live-slot [data-live-blocks]');
  ok(await B.until(() => /Quill/.test((document.querySelector('.live-blocked') || {}).textContent || '')), 'Pine sees Quill under People you blocked');
  await B.p.click('#live-slot [data-live-unblock="Quill"]');
  ok(await B.until(() => /You unblocked Quill/.test(document.querySelector('#live-slot').textContent) && /Quill/.test(document.querySelector('.live-who').textContent)), 'and unblocks them: Quill is back in Pine’s list');

  /* ---------- the owner asks Quill to leave: the room moves to a new topic ---------- */
  const topic0 = sql('select topic from public.club_live_rooms where room_id = ' + lit(oak.id));
  await A.opts('Quill');
  await A.p.click('#live-slot [data-live-ask="remove:' + pQuill + '"]');
  ok(/can’t come back until tomorrow/.test(await A.panel()), 'Ask to leave says Quill cannot come back until tomorrow');
  await A.p.click('#live-slot [data-live-do="remove:' + pQuill + '"]');
  ok(await C.until(() => /The owner asked you to leave this room/.test(document.querySelector('#live-slot').textContent)), 'Quill’s page says the owner asked them to leave');
  ok(!(await C.p.$('#live-slot [data-live-join]')) && (await C.figs()) === 0, 'with no Join button, and no figures any more');
  ok(await A.until(() => document.querySelectorAll('.live-who .live-row').length === 2) && await B.until(() => document.querySelectorAll('.live-who .live-row').length === 2), 'Oak and Pine see 2 here');
  const topic1 = sql('select topic from public.club_live_rooms where room_id = ' + lit(oak.id));
  ok(topic1 !== topic0, 'the room has a new topic');
  await B.p.waitForTimeout(1500);
  const listening = [...conns].map(c => Object.keys(c.subs)).flat();
  ok(listening.filter(t => t === 'realtime:' + topic1).length === 2 && !listening.includes('realtime:' + topic0), 'Oak’s and Pine’s pages listen to the new topic, and no page to the old one (' + listening.join(', ') + ')');
  await A.tap(0.8, 0.95);
  const pOak = await B.p.evaluate(() => { const f = document.querySelector('#visit-box .live-fig:not(.live-you)'); return f ? f.getAttribute('data-live-pid') : ''; });
  ok(await B.until(id => { const f = document.querySelector('#visit-box .live-fig[data-live-pid="' + id + '"]'); return f && Math.abs(parseFloat(f.style.left) - 80) <= 1; }, pOak, 8000), 'on the new topic, Pine sees Oak walk');
  await C.open('r-' + link);
  await C.p.waitForTimeout(800);
  ok(await C.until(() => !!document.querySelector('#live-slot [data-live-join]')), 'Quill opens the room again later');
  await C.p.click('#live-slot [data-live-join]');
  ok(await C.until(() => /The owner asked you to leave this room/.test(document.querySelector('#live-slot').textContent)), 'but cannot join it today');

  /* ---------- a student with no nickname ---------- */
  const D = await device(reed);
  await D.open('r-' + link);
  ok(await D.until(() => !!document.querySelector('#live-slot .room-nickin')), 'a student with no nickname is asked for one before joining');
  ok(/Choose a nickname under the room first/.test(await D.text('.room-leave')), 'and the sticker part points to it instead of asking twice');
  await D.p.fill('#live-slot .room-nickin', 'Reed');
  await D.p.click('#live-slot button[type="submit"]');
  ok(await D.until(() => !!document.querySelector('#live-slot [data-live-join]')), 'once it is saved, Join live is there');

  /* ---------- five quiet minutes, and a hidden tab (a device whose clock the check can move) ---------- */
  const E = await device(reed, { clock: true });
  await E.open('r-' + link);
  ok(await E.join(), 'Reed joins on another device');
  await E.p.clock.fastForward('05:40');
  ok(await E.until(() => /You left the live room after 5 quiet minutes/.test(document.querySelector('#live-slot').textContent), null, 8000), 'after 5 quiet minutes the page leaves the room by itself');
  ok(!inRoom().includes('Reed'), 'and the server has Reed out of the room');
  ok(await E.until(() => !!document.querySelector('#live-slot [data-live-join]')), 'Join again is offered');
  ok(await E.join(), 'Reed joins again');
  await E.p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await E.p.clock.fastForward('01:05');
  ok(await new Promise(r => setTimeout(r, 1500, true)) && !inRoom().includes('Reed'), 'a tab hidden for a minute leaves the room');
  await E.p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  ok(await E.until(() => !!document.querySelector('#live-slot [data-live-leave]'), null, 8000) && inRoom().includes('Reed'), 'and comes back in by itself when the tab is shown again');
  const calls = () => log.filter(l => /club_live_(leave|ping|join)/.test(l)).slice(-8).join(' | ');
  /* give the tab its real hidden flag back: closing it makes it hidden, as in a browser */
  await E.p.evaluate(() => { delete document.hidden; });
  const closedAt = ((Date.now() - T0) / 1000).toFixed(2), msgs0 = Number(sql('select coalesce(max(id), 0) from realtime.messages'));
  await E.p.close({ runBeforeUnload: true });
  const reedGone = await B.until(() => !/Reed/.test(document.querySelector('.live-who').textContent), null, 8000), pineList = await B.text('.live-who');
  ok(reedGone && !inRoom().includes('Reed'),
    'closing the tab leaves the room at once, and the others see Reed go', () => 'closed @' + closedAt + '; in the room: ' + inRoom() + '; Pine’s list: ' + pineList + '; last calls: ' + calls() +
      '; sent since: ' + sql("select string_agg(event || ' ' || payload::text, '; ' order by id) from realtime.messages where id > " + msgs0 + " and event <> 'probe'"));

  /* ---------- the monthly limit ---------- */
  sql('insert into public.club_live_budget (day, sent) values (public.club_day() - 1, 1000000) on conflict (day) do update set sent = excluded.sent');
  const before = Number(sql('select coalesce(max(id), 0) from realtime.messages'));
  /* Pine's last phrase was long ago, so the buttons are awake; if Pine's page checked in with the server just now, the button is gone already */
  const study = await B.p.$('#live-slot [data-live-say="study"]');
  if (study) { await study.click({ force: true }); }
  ok(await B.until(() => /Live rooms are resting/.test(document.querySelector('#live-slot').textContent)), 'past the monthly limit the page says live rooms are resting');
  ok(Number(sql("select count(*) from realtime.messages where id > " + before + " and event not in ('probe', 'bye', 'moved', 'closed')")) === 0,
    'and nothing more is sent but word that someone left' + (study ? ' (Pine’s phrase was refused)' : ''),
    () => sql("select string_agg(event || ' ' || payload::text, '; ' order by id) from realtime.messages where id > " + before + " and event <> 'probe'"));
  ok(!(await B.p.$('#live-slot [data-live-join]')) && (await B.figs()) === 0 && !!(await B.p.$('#visit-box .room-room')), 'with no Join button and no figures; the room itself still shows');
  await B.p.waitForTimeout(500);
  sql('delete from public.club_live_budget');
  const made0 = Number(sql("select count(*) from realtime.messages where event <> 'probe'")), delivered0 = rt.delivered;

  /* ---------- stopping sharing ends live visits ---------- */
  await B.open('r-' + link);
  ok(await B.join(), 'Pine joins again');
  asUser(oak.id, 'select public.club_room_link(false);');
  ok(await B.until(() => /This room is not shared any more/.test(document.querySelector('#live-slot').textContent), null, 8000), 'when Oak stops sharing, Pine’s page says the room is not shared any more');
  ok(!inRoom().includes('Pine'), 'and the visit has ended on the server');
  ok(await A.until(() => !document.querySelector('#live-slot [data-live-leave]'), null, 8000), 'Oak’s own live visit ended too');

  /* ---------- the page never sends on a channel, and the server counted at least what was delivered ---------- */
  ok(rt.sent.length === 0, 'no page sent anything on a channel' + (rt.sent.length ? ': ' + rt.sent.join('; ') : ''));
  const counted = Number(sql('select coalesce(sum(sent), 0) from public.club_live_budget')), made = Number(sql("select count(*) from realtime.messages where event <> 'probe'"));
  ok(counted > 0 && counted >= (made - made0) + (rt.delivered - delivered0), 'the server counted each message once for sending and once for each page that got it (' + counted + ' counted for ' + (made - made0) + ' sent and ' + (rt.delivered - delivered0) + ' delivered since the count was cleared)');
  ok(rt.refused === 0, 'pages only asked to listen to topics they were allowed (' + rt.refused + ' refused)');
  console.log('     ' + made + ' messages sent by the database, ' + rt.delivered + ' delivered, ' + rt.joins + ' channel joins, ' + rt.tokens + ' fresh sign-ins handed over');

  /* ---------- a project where club-live.sql was never run: no live part at all ---------- */
  link = JSON.parse(asUser(oak.id, 'select public.club_room_link(true);')).link;
  noLive = true;
  const F = await device(pine);
  await F.open('r-' + link);
  await F.p.waitForTimeout(1500);
  ok((await F.p.$('#visit-box .room-room')) && !(await F.p.$('#live-slot .live-panel')), 'without club-live.sql the shared room shows with no live part');

  polling = false;
  await browser.close(); server.close();
  await new Promise(r => { const t = setTimeout(r, 3000); poller.on('exit', () => { clearTimeout(t); r(); }); poller.stdin.end(); });
  try { psql(['-d', 'postgres', '-c', 'drop database ' + DB + ' with (force)']); } catch (e) { console.log('     (could not drop the test database ' + DB + ')'); }
  console.log(errors.length ? 'SCRIPT ERRORS:\n' + errors.join('\n') : 'no script errors');
  console.log(over.length ? 'SIDEWAYS SCROLL:\n' + over.join('\n') : 'no sideways scrolling');
  console.log(fail.length ? fail.length + ' FAILED' : 'all live room page checks passed');
  process.exit(fail.length || errors.length || over.length ? 1 : 0);
})().catch(e => { console.log('FAIL ' + (e && e.stack || e)); process.exit(1); });
