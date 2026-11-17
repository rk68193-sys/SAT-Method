  /* =================== Live rooms (src/account/club-live.sql): friends in a shared room at the same time =================== */
  /* On a shared room's page (#r-, club.js) a signed-in student with a nickname can join the room live (club_live_join). The
     server keeps them a place in it while this page pings every 30 seconds (club_live_ping), and the page listens to the
     room's private Supabase Realtime channel through a WebSocket: a small Phoenix client (liveSock) that joins the channel
     with the student's sign-in, keeps the connection alive, hands over a fresh sign-in, and never sends on the channel.
     Everything the student does goes through club_live_say: a move (a tap in the room, and their figure walks there), a
     reaction or a quick phrase from the lists below. The server sends it to every page in the room, this one included.
     Typed chat goes through club_live_chat, which checks each line first (words, links, phone numbers and the like) and
     tells this page why when it holds one back. A student types once they have said when they were born (only whether
     they are 13 or older is kept) and agreed to the chat rules; until then, or under 13, typed lines are not shown.
     Who is in the room comes only from the server (join and ping), and only they are drawn: a message from anyone else is
     ignored, and "hi" (someone came in) asks the server again. That is how a block hides two students from each other. Mute
     is kept on this page; block, report and the owner's "ask to leave" go to the server. The page leaves (club_live_leave)
     when the student presses Leave, opens another page, closes the tab, keeps it hidden for a minute, or does nothing for
     five minutes. The words of the reactions and phrases are here; the server checks the keys against the same lists. */
  var LIVE_REACT = [['clap', '\uD83D\uDC4F', 'Clap'], ['fire', '\uD83D\uDD25', 'Fire'], ['party', '\uD83C\uDF89', 'Party'], ['laugh', '\uD83D\uDE02', 'Laugh'],
    ['heart', '\u2764\uFE0F', 'Heart'], ['wow', '\uD83D\uDE2E', 'Wow']];
  var LIVE_SAY = [['hi', 'Hi!'], ['nice', 'Nice room!'], ['study', 'Let’s study!'], ['luck', 'Good luck on the test!'], ['gotthis', 'You got this!'],
    ['great', 'Great job!'], ['thanks', 'Thanks!'], ['practice', 'Want to practice together?'], ['brb', 'Be right back'], ['bye', 'See you later!']];
  /* why a student is not in the room (the server's reasons, and the page's own: idle, away, out, left, net) */
  var LIVE_WHY = {
    off: 'Live rooms are switched off right now. You can still look around and leave a sticker.',
    rest: 'Live rooms are resting for a few days, so the site stays free for everyone. You can still look around and leave a sticker.',
    join: 'Your account is still joining the clubhouse. Try again in a moment.',
    locked: 'Live rooms are switched off for this account.',
    closed: 'This room is not shared any more, so the live visit ended.',
    removed: 'The owner asked you to leave this room. You can come back tomorrow.',
    blocked: 'You can’t join this room live.',
    full: 'This room is full: 8 people are in it. Try again in a little while.',
    busy: 'Live rooms are full right now: 20 people are in them across the site. Try again in a little while.',
    day: 'You have used today’s 400 live moves, reactions, phrases and messages. They come back tomorrow.',
    idle: 'You left the live room after 5 quiet minutes.',
    away: 'You left the live room while this page was in the background.',
    expired: 'The connection dropped, so you left the live room.',
    out: 'You blocked the owner of this room, so you left it.',
    left: 'You left the live room.',
    net: 'No connection to your account. Try again when you are online.'
  };
  /* reasons after which Join live is offered again */
  var LIVE_AGAIN = { join: 1, full: 1, busy: 1, idle: 1, away: 1, expired: 1, left: 1, net: 1, out: 1, blocked: 1 };
  /* why a typed line was not sent (club_live_chat) */
  var LIVE_HELD = {
    contact: 'That line wasn’t sent. To keep everyone safe, the chat doesn’t pass on phone numbers, emails, @handles or social apps, or questions about where someone lives or goes to school.',
    link: 'That line wasn’t sent, because the chat doesn’t pass on links.',
    words: 'That line wasn’t sent, because it has a word this chat doesn’t allow.',
    same: 'You just sent that line.',
    long: 'A line can be up to 160 characters.',
    pause: 'Typing is resting for a few minutes, because several lines in a row weren’t sent. You can still send reactions and phrases.',
    form: ''
  };
  var LIVE_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var LIVE_PING = 30000, LIVE_IDLE = 5 * 60000, LIVE_AWAY = 60000, LIVE_WALK = 2050, LIVE_COOL = 3000, LIVE_LINES = 50;
  var LIVE = { link: '', known: false, none: false, on: false, n: 0, countT: 0, st: '', why: '', msg: '', seq: 0,
    me: '', mine: false, topic: '', ppl: {}, order: [], hide: {}, mute: {}, byeAt: {}, left: 400,
    chatOn: false, chat: '', lines: [], chatEl: null, chatShown: '', chatBusy: false, chatT: 0, draft: '',
    ws: null, chan: '', ref: 0, joinRef: '', joined: false, tok: '', hbT: 0, pingT: 0, retryT: 0, tries: 0, soonT: 0, soonAt: 0, autoAt: 0,
    lastIn: 0, inSince: false, awayT: 0, walkWant: null, walkAt: 0, walkBusy: false, walkT: 0, sayAt: 0, coolT: 0,
    open: '', ask: '', blocks: null, showBlocks: false, news: null };

  function liveNum(v, lo, hi, d) { v = Number(v); return isFinite(v) ? Math.round(Math.min(hi, Math.max(lo, v))) : d; }
  function liveReactOf(k) { return LIVE_REACT.filter(function (r) { return r[0] === k; })[0] || null; }
  function liveSayOf(k) { return LIVE_SAY.filter(function (s) { return s[0] === k; })[0] || null; }
  function liveCall(fn, args) { return clubSend(fn, args || {}, false); }
  /* the student did something on the page (for the 5 quiet minutes, and the ping's "still active") */
  function liveTouch() { LIVE.lastIn = Date.now(); LIVE.inSince = true; }
  /* told to screen readers, from a region that stays put while the panel is drawn again */
  function liveAnnounce(text) {
    if (!text) { return; }
    if (!LIVE.news) { LIVE.news = document.createElement('p'); LIVE.news.className = 'live-news'; LIVE.news.setAttribute('aria-live', 'polite'); document.body.appendChild(LIVE.news); }
    LIVE.news.textContent = '';
    var el = LIVE.news;
    setTimeout(function () { el.textContent = text; }, 60);
  }

  /* ---------- the page of a shared room: how many are live in it, and Join ---------- */
  /* called by clubVisit when a shared room has loaded, and by showView when the student leaves that page */
  function liveEnter(link) {
    if (LIVE.link !== link) { liveAway(); LIVE.link = link; LIVE.mute = {}; LIVE.why = ''; LIVE.msg = ''; LIVE.known = false; LIVE.none = false; LIVE.on = false; LIVE.n = 0; LIVE.draft = ''; }
    liveCount();
  }
  function liveAway() {
    clearTimeout(LIVE.countT); LIVE.countT = 0;
    if (LIVE.st) { liveLeave(''); }
    LIVE.why = ''; LIVE.msg = '';
  }
  function liveCount() {
    clearTimeout(LIVE.countT); LIVE.countT = 0;
    if (!acctOn || !LIVE.link || cur.view !== 'visit' || LIVE.st) { return; }
    var link = LIVE.link;
    clubSend('club_live_count', { p_link: link }, !acctIn()).then(function (r) {
      if (LIVE.link !== link || cur.view !== 'visit' || LIVE.st) { return; }
      var was = liveNickHere();
      if (r.missing) { LIVE.known = true; LIVE.none = true; liveRedraw(was); return; }
      if (r.ok && isObj(r.body)) { LIVE.known = true; LIVE.none = false; LIVE.on = !!r.body.on; LIVE.chatOn = r.body.chat === true; LIVE.n = Number(r.body.n) || 0; liveRedraw(was); }
      LIVE.countT = setTimeout(liveCount, 60000);
    });
  }
  /* the live panel shows the nickname form, so the sticker part of the page does not show a second one */
  function liveNickHere() { return LIVE.known && !LIVE.none && LIVE.on && !LIVE.st && clubOn() && !CLUB.st.blocked && !CLUB.st.nick; }
  /* when that changes, the sticker part is drawn again too (with the whole shared room); otherwise only the live panel */
  function liveRedraw(was) { if (liveNickHere() !== was) { clubVisitDraw(); } else { liveDraw(); } }

  function liveJoin(auto) {
    if (LIVE.st || !clubOn() || !LIVE.link || cur.view !== 'visit') { return; }
    var link = LIVE.link, seq = ++LIVE.seq;
    clearTimeout(LIVE.countT); LIVE.countT = 0;
    LIVE.st = 'joining'; LIVE.why = ''; LIVE.msg = auto ? '' : 'Joining…'; LIVE.open = ''; LIVE.ask = '';
    liveDraw();
    liveCall('club_live_join', { p_link: link }).then(function (r) {
      if (seq !== LIVE.seq || LIVE.link !== link) { return; }
      var b = r.ok && isObj(r.body) ? r.body : null;
      if (b && b.ok) {
        LIVE.st = 'on'; LIVE.msg = ''; LIVE.tries = 0; LIVE.ppl = {}; LIVE.topic = ''; liveTouch();
        liveTake(b, true);
        liveSock();
        clearInterval(LIVE.pingT); LIVE.pingT = setInterval(liveTick, LIVE_PING);
        liveAnnounce(auto ? 'You are back in the room live.' : 'You joined the room live. Tap the floor to walk there.');
        return;
      }
      LIVE.st = '';
      if (r.missing) { LIVE.none = true; }
      LIVE.why = b ? String(b.why || 'net') : 'net';
      LIVE.msg = b ? '' : r.msg;
      if (b) { liveAnnounce(LIVE_WHY[LIVE.why] || ''); }
      liveDraw();
      liveCount();
    });
  }
  /* the server's view of the room: topic, own id, who is there, whom to hide, actions left today. `asked` is when the page
     asked for it: word that came after that (someone left, or walked) is newer, so an answer cannot bring them back or move them back */
  function liveTake(v, first, asked) {
    var topic = String(v.topic || '');
    if (topic !== LIVE.topic) { var old = LIVE.chan; LIVE.topic = topic; if (!first) { liveRechan(old); } }
    LIVE.me = String(v.me || ''); LIVE.mine = !!v.mine; LIVE.left = Number(v.left) || 0;
    LIVE.chat = { ok: 1, ask: 1, no: 1 }[v.chat] ? v.chat : 'off'; LIVE.chatOn = LIVE.chat !== 'off';
    LIVE.hide = {};
    (Array.isArray(v.hide) ? v.hide : []).forEach(function (p) { LIVE.hide[String(p)] = 1; });
    var had = LIVE.ppl, now = {}, order = [], walking = LIVE.walkWant || LIVE.walkBusy || Date.now() - LIVE.walkAt < 3000;
    (Array.isArray(v.members) ? v.members : []).forEach(function (m) {
      if (!Array.isArray(m) || typeof m[0] !== 'string' || now[m[0]]) { return; }
      var pid = m[0], p = had[pid] || { pid: pid, x: 60, y: 90, wAt: 0 };
      if (asked && LIVE.byeAt[pid] > asked) { return; }
      p.nick = chalName(m[1]) || 'A friend'; p.av = roomAvClean(Array.isArray(m[7]) && m[7].length ? m[7] : [m[2], m[3]]); p.c = p.av[0]; p.own = m[6] === 1;
      if (!(pid === LIVE.me && walking && had[pid]) && !(asked && p.wAt > asked)) { p.x = liveNum(m[4], 5, 95, 60); p.y = liveNum(m[5], 78, 98, 90); }
      now[pid] = p; order.push(pid);
      if (!first && !had[pid] && pid !== LIVE.me) { liveAnnounce(p.nick + ' came in.'); }
    });
    if (!first) { Object.keys(had).forEach(function (pid) { if (!now[pid] && pid !== LIVE.me && !LIVE.hide[pid]) { liveAnnounce(had[pid].nick + ' left.'); } }); }
    LIVE.ppl = now; LIVE.order = order;
    if (LIVE.open && !now[LIVE.open]) { LIVE.open = ''; LIVE.ask = ''; }
    liveDraw();
  }
  function liveTick() {
    if (LIVE.st !== 'on') { return; }
    if (Date.now() - LIVE.lastIn > LIVE_IDLE) { liveLeave('idle'); return; }
    livePing();
  }
  function livePing() {
    if (LIVE.st !== 'on') { return; }
    var seq = LIVE.seq, act = LIVE.inSince, asked = Date.now();
    LIVE.inSince = false;
    liveCall('club_live_ping', { p_active: act }).then(function (r) {
      if (seq !== LIVE.seq || LIVE.st !== 'on') { return; }
      var b = r.ok && isObj(r.body) ? r.body : null;
      if (b && b.ok) {
        liveTake(b, false, asked);
        if (!LIVE.ws) { liveSock(); } else if (!LIVE.joined) { liveChan(); }
        liveFresh();
        return;
      }
      if (b) { liveGone(String(b.why || 'expired')); return; }
      if (act) { LIVE.inSince = true; }
      liveRetry();
    });
  }
  /* someone came in, or a message came from someone not on the list: ask the server, not more than every 2 seconds */
  function liveSoon() {
    if (LIVE.soonT) { return; }
    LIVE.soonT = setTimeout(function () { LIVE.soonT = 0; LIVE.soonAt = Date.now(); livePing(); }, Math.max(250, LIVE.soonAt + 2000 - Date.now()));
  }
  /* the place ended (the server said why) */
  function liveGone(why) {
    liveStop();
    LIVE.why = why;
    /* the connection dropped for a while: back in by itself, at most once a minute */
    if (why === 'expired' && cur.view === 'visit' && !document.hidden && Date.now() - LIVE.autoAt > 60000) { LIVE.autoAt = Date.now(); liveJoin(true); return; }
    liveAnnounce(LIVE_WHY[why] || LIVE_WHY.left);
    liveDraw();
    liveCount();
  }
  function liveLeave(why) {
    if (!LIVE.st) { return; }
    liveStop();
    liveCall('club_live_leave');
    LIVE.why = why || ''; LIVE.msg = '';
    if (why) { liveAnnounce(LIVE_WHY[why] || ''); }
    liveDraw();
    liveCount();
  }
  /* stop listening and drawing (the place itself is the server's) */
  function liveStop() {
    LIVE.seq++;
    LIVE.st = ''; LIVE.joined = false; LIVE.topic = ''; LIVE.chan = ''; LIVE.joinRef = ''; LIVE.ppl = {}; LIVE.order = []; LIVE.byeAt = {}; LIVE.open = ''; LIVE.ask = '';
    LIVE.walkWant = null; LIVE.walkBusy = false; LIVE.showBlocks = false; LIVE.chat = ''; LIVE.lines = []; LIVE.chatBusy = false;
    clearTimeout(LIVE.chatT); LIVE.chatT = 0;
    clearInterval(LIVE.pingT); clearInterval(LIVE.hbT); clearTimeout(LIVE.retryT); clearTimeout(LIVE.walkT); clearTimeout(LIVE.soonT); clearTimeout(LIVE.awayT); clearTimeout(LIVE.coolT);
    LIVE.pingT = LIVE.hbT = LIVE.retryT = LIVE.walkT = LIVE.soonT = LIVE.awayT = LIVE.coolT = 0;
    var ws = LIVE.ws;
    LIVE.ws = null;
    if (ws) { try { ws.close(1000); } catch (e) {} }
  }
  /* closing the tab: the leave is sent with keepalive, so it goes even as the page closes */
  function liveBeacon() {
    if (!A || !A.at || !window.fetch) { return; }
    try {
      window.fetch(ACCT_URL + '/rest/v1/rpc/club_live_leave', { method: 'POST', keepalive: true, cache: 'no-store',
        headers: { apikey: ACCT_KEY, Authorization: 'Bearer ' + A.at, 'Content-Type': 'application/json' }, body: '{}' }).catch(function () {});
    } catch (e) {}
  }

  /* ---------- the connection: a Phoenix WebSocket to Supabase Realtime (protocol 1.0.0, JSON) ---------- */
  function liveSock() {
    if (LIVE.st !== 'on' || LIVE.ws || !window.WebSocket) { return; }
    var ws;
    try { ws = new WebSocket(ACCT_URL.replace(/^http/, 'ws') + '/realtime/v1/websocket?apikey=' + encodeURIComponent(ACCT_KEY) + '&vsn=1.0.0'); }
    catch (e) { liveRetry(); return; }
    LIVE.ws = ws; LIVE.joined = false;
    ws.onopen = function () {
      if (LIVE.ws !== ws) { return; }
      clearInterval(LIVE.hbT);
      LIVE.hbT = setInterval(function () { liveSend('phoenix', 'heartbeat', {}); }, 25000);
      liveChan();
    };
    ws.onmessage = function (e) {
      if (LIVE.ws !== ws) { return; }
      var m = null;
      try { m = JSON.parse(e.data); } catch (x) {}
      if (isObj(m)) { liveMsg(m); }
    };
    ws.onclose = function () {
      if (LIVE.ws !== ws) { return; }
      LIVE.ws = null; LIVE.joined = false; clearInterval(LIVE.hbT);
      liveRetry();
    };
  }
  function liveSend(topic, event, payload, joinRef) {
    var ws = LIVE.ws;
    if (!ws || ws.readyState !== 1) { return ''; }
    LIVE.ref += 1;
    try { ws.send(JSON.stringify({ topic: topic, event: event, payload: payload, ref: String(LIVE.ref), join_ref: joinRef || null })); } catch (e) { return ''; }
    return String(LIVE.ref);
  }
  /* listen to the room's topic, as the signed-in student (Realtime checks the policy in club-live.sql) */
  function liveChan() {
    var seq = LIVE.seq;
    acctToken().then(function (tok) {
      if (seq !== LIVE.seq || LIVE.st !== 'on' || !LIVE.ws || LIVE.ws.readyState !== 1 || !LIVE.topic) { return; }
      if (!tok) { liveGone('net'); return; }
      LIVE.tok = tok; LIVE.chan = 'realtime:' + LIVE.topic; LIVE.joined = false;
      LIVE.joinRef = liveSend(LIVE.chan, 'phx_join', { config: { broadcast: { ack: false, self: false }, presence: { enabled: false }, postgres_changes: [], 'private': true }, access_token: tok });
    });
  }
  /* the room moved to a new topic (someone was asked to leave): stop listening to the old one, listen to the new */
  function liveRechan(old) {
    if (!LIVE.ws || LIVE.ws.readyState !== 1) { return; }
    if (old) { liveSend(old, 'phx_leave', {}, LIVE.joinRef); }
    LIVE.joined = false;
    liveChan();
  }
  /* a sign-in lasts an hour: Realtime is handed the new one */
  function liveFresh() {
    var seq = LIVE.seq;
    acctToken().then(function (tok) {
      if (seq !== LIVE.seq || !tok || tok === LIVE.tok || !LIVE.joined) { return; }
      LIVE.tok = tok;
      liveSend(LIVE.chan, 'access_token', { access_token: tok }, LIVE.joinRef);
    });
  }
  /* the connection or the channel failed: ask the server again after a pause that grows (1, 2, 4 ... 30 seconds) */
  function liveRetry() {
    if (LIVE.st !== 'on' || LIVE.retryT) { return; }
    var d = Math.min(30000, 1000 * Math.pow(2, Math.min(LIVE.tries, 5)));
    LIVE.tries += 1;
    LIVE.retryT = setTimeout(function () { LIVE.retryT = 0; livePing(); }, d);
  }
  function liveMsg(m) {
    if (m.topic !== LIVE.chan || !LIVE.chan) { return; }
    var p = isObj(m.payload) ? m.payload : {};
    if (m.event === 'phx_reply' && m.ref === LIVE.joinRef) {
      if (p.status === 'ok') { LIVE.joined = true; LIVE.tries = 0; } else { LIVE.joined = false; liveRetry(); }
      return;
    }
    if (m.event === 'phx_close' || m.event === 'phx_error' || (m.event === 'system' && p.status === 'error')) {
      if (m.event !== 'system' || LIVE.joined) { LIVE.joined = false; liveRetry(); }
      return;
    }
    if (m.event === 'broadcast') { liveHear(String(p.event || ''), isObj(p.payload) ? p.payload : {}); }
  }
  /* what the room heard: w (a move), r (a reaction), s (a phrase), c (a typed line), hi, bye, moved (someone was asked to
     leave), closed */
  function liveHear(ev, p) {
    var pid = String(p.p || ''), who = LIVE.ppl[pid], x;
    if (ev === 'closed') { livePing(); return; }
    if (ev === 'moved') { if (pid && pid !== LIVE.me) { LIVE.byeAt[pid] = Date.now(); } if (pid !== LIVE.me && who) { delete LIVE.ppl[pid]; LIVE.order = LIVE.order.filter(function (k) { return k !== pid; }); liveDraw(); } livePing(); return; }
    if (ev === 'hi') { if (pid && pid !== LIVE.me && !LIVE.hide[pid]) { liveSoon(); } return; }
    if (ev === 'bye') {
      if (pid && pid !== LIVE.me) { LIVE.byeAt[pid] = Date.now(); }
      if (who && pid !== LIVE.me) { delete LIVE.ppl[pid]; LIVE.order = LIVE.order.filter(function (k) { return k !== pid; }); liveAnnounce(who.nick + ' left.'); liveDraw(); }
      return;
    }
    if (!who) { if (pid && pid !== LIVE.me && !LIVE.hide[pid]) { liveSoon(); } return; }
    if (pid === LIVE.me) { return; }
    if (ev === 'w') { who.x = liveNum(p.x, 5, 95, who.x); who.y = liveNum(p.y, 78, 98, who.y); who.wAt = Date.now(); liveFigPos(who); return; }
    if (LIVE.mute[pid]) { return; }
    if (ev === 'r' && (x = liveReactOf(p.k))) { liveBubble(who, x[1], true); liveAnnounce(who.nick + ' sent ' + x[2].toLowerCase() + '.'); return; }
    if (ev === 's' && (x = liveSayOf(p.k))) { liveBubble(who, x[1], false); liveAnnounce(who.nick + ': ' + x[1]); return; }
    if (ev === 'c' && LIVE.chat === 'ok' && typeof p.t === 'string' && (x = p.t.slice(0, 200))) { liveLine(pid, who.nick, x); liveBubble(who, liveShort(x), false, 6000); }
  }

  /* ---------- what the student does ---------- */
  /* a tap in the room walks there (kept on the floor); a key on one of its spots walks to the front of that spot */
  function liveTap(e, room, t) {
    var r = room.getBoundingClientRect(), x, y;
    if (!r.width || !r.height) { return; }
    if (!e.detail && !e.clientX && !e.clientY) {
      var s = t.closest('.room-spot'), q = s && !s.classList.contains('room-walls') ? s.getBoundingClientRect() : null;
      x = q ? (q.left + q.width / 2 - r.left) / r.width * 100 : 50; y = q ? (q.bottom - r.top) / r.height * 100 + 3 : 92;
    } else {
      x = (e.clientX - r.left) / r.width * 100; y = (e.clientY - r.top) / r.height * 100;
    }
    liveWalk(x, y);
  }
  /* the figure moves at once on this page; the move is sent once every 2 seconds at most, the latest one */
  function liveWalk(x, y) {
    var me = LIVE.ppl[LIVE.me];
    x = liveNum(x, 5, 95, 50); y = liveNum(y, 78, 98, 90);
    if (me) { me.x = x; me.y = y; liveFigPos(me); }
    LIVE.walkWant = [x, y];
    liveWalkSend();
  }
  function liveWalkSend() {
    if (!LIVE.walkWant || LIVE.walkBusy || LIVE.st !== 'on' || LIVE.left <= 0) { return; }
    var wait = LIVE.walkAt + LIVE_WALK - Date.now(), seq = LIVE.seq;
    if (wait > 0) { clearTimeout(LIVE.walkT); LIVE.walkT = setTimeout(liveWalkSend, wait); return; }
    var w = LIVE.walkWant;
    LIVE.walkWant = null; LIVE.walkBusy = true; LIVE.walkAt = Date.now();
    liveCall('club_live_say', { p_kind: 'walk', p_key: null, p_x: w[0], p_y: w[1] }).then(function (r) {
      if (seq !== LIVE.seq) { return; }
      LIVE.walkBusy = false;
      var b = r.ok && isObj(r.body) ? r.body : null;
      if (b && b.ok) { LIVE.left = Number(b.left) || 0; }
      else if (b && b.why === 'wait') { LIVE.walkAt = Date.now() + (Number(b.ms) || 500) - LIVE_WALK; if (!LIVE.walkWant) { LIVE.walkWant = w; } }
      else if (b) { liveNo(String(b.why || '')); return; }
      else if (!LIVE.walkWant) { LIVE.walkWant = w; LIVE.walkAt = Date.now() + 3000 - LIVE_WALK; }
      liveWalkSend();
    });
  }
  /* a reaction or a phrase: shown at once over the student's own figure, then sent; one every 3 seconds */
  function liveSayIt(kind, k) {
    var me = LIVE.ppl[LIVE.me], x = kind === 'react' ? liveReactOf(k) : liveSayOf(k), seq = LIVE.seq;
    if (LIVE.st !== 'on' || !x || Date.now() < LIVE.sayAt + LIVE_COOL || LIVE.left <= 0) { return; }
    LIVE.sayAt = Date.now(); LIVE.msg = '';
    if (me) { liveBubble(me, x[1], kind === 'react'); }
    liveCool();
    liveCall('club_live_say', { p_kind: kind, p_key: k, p_x: null, p_y: null }).then(function (r) {
      if (seq !== LIVE.seq) { return; }
      var b = r.ok && isObj(r.body) ? r.body : null;
      if (b && b.ok) { LIVE.left = Number(b.left) || 0; if (LIVE.left < 50) { liveDraw(); } return; }
      if (b && b.why !== 'wait') { liveNo(String(b.why || '')); return; }
      if (!b) { LIVE.msg = r.msg; liveDraw(); }
    });
  }
  /* the reaction and phrase buttons rest for 3 seconds after one is sent (aria-disabled, so a focused one keeps its focus) */
  function liveCool() {
    liveDraw();
    clearTimeout(LIVE.coolT);
    LIVE.coolT = setTimeout(function () { LIVE.coolT = 0; liveDraw(); }, Math.max(50, LIVE.sayAt + LIVE_COOL - Date.now()));
  }
  /* the server would not send it */
  function liveNo(why) {
    if (why === 'day') { LIVE.left = 0; LIVE.walkWant = null; liveDraw(); liveAnnounce(LIVE_WHY.day); return; }
    if (why === 'form' || why === 'wait') { return; }
    liveGone(why);
  }
  /* block, report, or (the room's owner) ask to leave */
  function liveAct(kind, pid, why) {
    var p = LIVE.ppl[pid], seq = LIVE.seq, asked = Date.now();
    if (!p || LIVE.st !== 'on' || ['block', 'report', 'remove'].indexOf(kind) < 0) { return; }
    var fn = kind === 'remove' ? 'club_live_remove' : kind === 'block' ? 'club_live_block' : 'club_live_report';
    LIVE.msg = '';
    liveCall(fn, kind === 'report' ? { p_pid: pid, p_why: why } : { p_pid: pid }).then(function (r) {
      if (seq !== LIVE.seq) { return; }
      var b = r.ok && isObj(r.body) ? r.body : null;
      LIVE.open = ''; LIVE.ask = '';
      if (!b) { LIVE.msg = r.msg; }
      else if (kind === 'report') {
        LIVE.msg = b.ok ? 'Thank you. Your report went to the site’s owner, who will read it. You can also mute or block ' + p.nick + '.'
          : b.why === 'day' ? 'You have sent 10 reports today. The site’s owner will read them.' : p.nick + ' is not in the room any more.';
      } else if (b.out) { LIVE.blocks = null; liveGone('out'); liveFocusHead(); return; }
      else if (b.ok) {
        LIVE.blocks = null;
        LIVE.msg = kind === 'block' ? 'You blocked ' + p.nick + '. You won’t see each other in rooms, and they can’t come into yours.'
          : p.nick + ' has left your room and can’t come back until tomorrow.';
        liveTake(b, false, asked);
      } else { LIVE.msg = p.nick + ' is not in the room any more.'; }
      liveDraw();
      liveFocusMsg();
    });
  }
  function liveBlocksLoad() {
    var seq = LIVE.seq;
    liveCall('club_live_blocks').then(function (r) {
      if (seq !== LIVE.seq && LIVE.st) { return; }
      LIVE.blocks = r.ok && Array.isArray(r.body) ? r.body.map(String) : [];
      if (!r.ok) { LIVE.msg = r.msg; }
      liveDraw();
    });
  }
  function liveUnblock(nick) {
    liveCall('club_live_unblock', { p_nick: nick }).then(function (r) {
      if (r.ok && Array.isArray(r.body)) { LIVE.blocks = r.body.map(String); LIVE.msg = 'You unblocked ' + nick + '.'; } else { LIVE.msg = r.msg; }
      if (LIVE.why === 'blocked') { LIVE.why = ''; }
      liveDraw();
      liveFocusMsg();
      if (LIVE.st === 'on') { livePing(); }
    });
  }

  /* ---------- drawing ---------- */
  function liveHere(n) { return n === 1 ? '1 person is here live' : n + ' people are here live'; }
  function livePanelHTML() {
    if (!acctOn || !LIVE.known || LIVE.none) { return ''; }
    var v = CLUB.visit && CLUB.visit.v, mine = !!(v && v.mine), h = '<section class="live-panel" aria-labelledby="live-h">';
    /* live: the chat sits between the two parts, and stays put while they are drawn again (liveDraw) */
    if (LIVE.st === 'on') { return h.replace('class="live-panel"', 'class="live-panel live-on"') + '<div class="live-a">' + liveOnHTML() + '</div><div class="live-chat-spot"></div><div class="live-b">' + liveWhoHTML() + '</div></section>'; }
    h += '<h3 class="room-h4" id="live-h">' + (LIVE.on && LIVE.n ? '<span class="live-dot" aria-hidden="true"></span>' + liveHere(LIVE.n) : 'Hang out here live') + '</h3>';
    if (!LIVE.on) { return h + '<p>' + LIVE_WHY.rest.replace(' for a few days', ' right now') + '</p></section>'; }
    if (!acctIn()) {
      return h + '<p>Sign in to join this room live: see who else is here, walk around, and send a wave or a quick hello' + (LIVE.chatOn ? ', or chat' : '. There is no typing') + '.</p><p><a class="btn ghost sm" href="#account">Sign in</a></p></section>';
    }
    if (!clubOn()) { return CLUB.trying ? h + '<p class="muted">Checking your account…</p></section>' : ''; }
    if (CLUB.st.blocked) { return h + '<p>' + LIVE_WHY.locked + '</p></section>'; }
    if (!CLUB.st.nick) {
      return h + '<p>Choose a nickname first, so the others in the room know who you are. A first name or a made-up name is best, never your full name.</p>' + clubNickHTML('') + '</section>';
    }
    var can = LIVE.chatOn ? 'reactions, quick phrases and typed messages.' : 'reactions and quick phrases. There is no typing.';
    h += '<p>' + (mine ? 'This is your room. Join live to hang out with friends who open your link: everyone here sees the others walk around, and can send ' + can
      : 'Join live to walk around this room with anyone else who is here right now, and send ' + can) + '</p>';
    if (LIVE.why) { h += '<p class="live-msg">' + esc(LIVE.msg || LIVE_WHY[LIVE.why] || '') + '</p>'; }
    else if (LIVE.msg) { h += '<p class="live-msg">' + esc(LIVE.msg) + '</p>'; }
    if (LIVE.st === 'joining') { return h + '<p class="row"><button class="btn" type="button" disabled>Joining…</button></p></section>'; }
    if (!LIVE.why || LIVE_AGAIN[LIVE.why]) { h += '<p class="row"><button class="btn" type="button" data-live-join>' + (LIVE.why && LIVE.why !== 'blocked' ? 'Join again' : 'Join live') + '</button></p>'; }
    if (LIVE.why === 'blocked' || LIVE.why === 'out') { h += liveBlocksHTML(); }
    return h + '</section>';
  }
  function liveOnHTML() {
    var rest = Date.now() < LIVE.sayAt + LIVE_COOL || LIVE.left <= 0, dis = rest ? ' aria-disabled="true"' : '';
    var h = '<div class="live-top"><h3 class="room-h4" id="live-h"><span class="live-dot" aria-hidden="true"></span>You’re here live</h3>' +
      '<button class="btn ghost sm" type="button" data-live-leave>Leave</button></div>' +
      '<p class="fine">Tap anywhere in the room to walk there. Everyone here sees you move.</p>' +
      '<div class="live-reacts" role="group" aria-label="Send a reaction">' + LIVE_REACT.map(function (r) {
        return '<button type="button" class="live-rb" data-live-react="' + r[0] + '" aria-label="' + r[2] + '" title="' + r[2] + '"' + dis + '>' + r[1] + '</button>';
      }).join('') + '</div>' +
      '<div class="live-says" role="group" aria-label="Say something">' + LIVE_SAY.map(function (s) {
        return '<button type="button" class="live-sb" data-live-say="' + s[0] + '"' + dis + '>' + esc(s[1]) + '</button>';
      }).join('') + '</div>';
    if (LIVE.left <= 0) { h += '<p class="live-msg">' + LIVE_WHY.day + '</p>'; }
    else if (LIVE.left < 50) { h += '<p class="fine">' + LIVE.left + ' moves, reactions, phrases and messages left today.</p>'; }
    return h + '<p class="live-msg" role="status" aria-live="polite">' + esc(LIVE.msg) + '</p>';
  }
  function liveWhoHTML() {
    return '<h4 class="room-h4">Here now (' + LIVE.order.length + ')</h4><ul class="live-who">' + LIVE.order.map(liveRowHTML).join('') + '</ul>' + liveBlocksHTML();
  }
  function liveRowHTML(pid) {
    var p = LIVE.ppl[pid], me = pid === LIVE.me, open = LIVE.open === pid;
    var h = '<li class="live-row"><div class="live-row-top"><span class="live-sw" style="background:' + roomColor(p.c)[2] + '" aria-hidden="true"></span><b>' + esc(p.nick) + (me ? ' (you)' : '') + '</b>' +
      (p.own ? '<small>owns this room</small>' : '') + (LIVE.mute[pid] ? '<small>muted</small>' : '') +
      (me ? '' : '<button type="button" class="linkbtn" data-live-open="' + pid + '" aria-expanded="' + open + '" aria-label="' + (open ? 'Close the options for ' : 'Options for ') + esc(p.nick) + '">' + (open ? 'Close' : 'Options') + '</button>') + '</div>';
    return h + (open ? liveOptsHTML(p) : '') + '</li>';
  }
  function liveOptsHTML(p) {
    var a = LIVE.ask.split(':'), pid = p.pid, nm = esc(p.nick), no = '<button class="btn ghost sm" type="button" data-live-cancel>Cancel</button>';
    if (a[1] === pid && a[0] === 'block') {
      return '<div class="live-ask"><p>Block ' + nm + '? They won’t be able to come into your room, and you won’t see each other in any room. You can unblock them later.</p>' +
        '<p class="row"><button class="btn sm" type="button" data-live-do="block:' + pid + '">Block ' + nm + '</button>' + no + '</p></div>';
    }
    if (a[1] === pid && a[0] === 'report') {
      return '<div class="live-ask"><p>What happened? Your report goes to the site’s owner, with what ' + nm + ' did in this room in the last 30 minutes' + (LIVE.chat === 'ok' ? ', and the room’s chat' : '') + '. They won’t know it was you.</p>' +
        '<p class="row"><button class="btn sm" type="button" data-live-do="report:' + pid + ':spam">Too many messages</button><button class="btn sm" type="button" data-live-do="report:' + pid + ':unkind">Unkind or rude</button>' +
        (LIVE.chat === 'ok' ? '<button class="btn sm" type="button" data-live-do="report:' + pid + ':personal">Asked for or shared personal details</button>' : '') +
        '<button class="btn sm" type="button" data-live-do="report:' + pid + ':other">Something else</button>' + no + '</p></div>';
    }
    if (a[1] === pid && a[0] === 'remove' && LIVE.mine) {
      return '<div class="live-ask"><p>Ask ' + nm + ' to leave your room? They can’t come back until tomorrow.</p>' +
        '<p class="row"><button class="btn sm" type="button" data-live-do="remove:' + pid + '">Ask ' + nm + ' to leave</button>' + no + '</p></div>';
    }
    return '<div class="live-opts"><button class="btn ghost sm" type="button" data-live-mute="' + pid + '">' + (LIVE.mute[pid] ? 'Unmute' : 'Mute') + '</button>' +
      '<button class="btn ghost sm" type="button" data-live-ask="block:' + pid + '">Block</button><button class="btn ghost sm" type="button" data-live-ask="report:' + pid + '">Report</button>' +
      (LIVE.mine ? '<button class="btn ghost sm" type="button" data-live-ask="remove:' + pid + '">Ask to leave</button>' : '') + '</div>' +
      '<p class="fine">Mute hides ' + nm + '’s reactions, phrases' + (LIVE.chat === 'ok' ? ' and messages' : '') + ' on your screen only, until you leave. They can’t tell.</p>';
  }
  function liveBlocksHTML() {
    var h = '<p><button type="button" class="linkbtn" data-live-blocks aria-expanded="' + LIVE.showBlocks + '">People you blocked</button></p>';
    if (!LIVE.showBlocks) { return h; }
    if (!LIVE.blocks) { return h + '<p class="muted">Loading…</p>'; }
    if (!LIVE.blocks.length) { return h + '<p class="muted">No one.</p>'; }
    return h + '<ul class="live-blocked">' + LIVE.blocks.map(function (nick) {
      return '<li><b>' + esc(nick) + '</b><button type="button" class="linkbtn" data-live-unblock="' + esc(nick) + '" aria-label="Unblock ' + esc(nick) + '">Unblock</button></li>';
    }).join('') + '</ul>';
  }
  /* the panel under the room, and the figures in it; fk names the panel's button to keep focused (liveFocusKey) */
  function liveDraw(fk) {
    if (cur.view !== 'visit' || !viewEl.visit) { return; }
    var slot = $('#live-slot', viewEl.visit);
    if (!slot) { return; }
    var key = fk === undefined ? liveFocusKey() : fk, a = $('.live-a', slot), b = $('.live-b', slot), ce = LIVE.chatEl;
    if (LIVE.st === 'on' && a && b && ce && ce.parentNode && slot.contains(ce)) {
      /* the chat between the two parts is left as it is, so a line being typed keeps its text, and the keyboard stays open */
      a.innerHTML = liveOnHTML(); b.innerHTML = liveWhoHTML();
    } else {
      var f = ce && ce.contains(document.activeElement) ? document.activeElement : null, sel = f && f.selectionStart !== undefined ? [f.selectionStart, f.selectionEnd] : null;
      slot.innerHTML = livePanelHTML();
      var spot = $('.live-chat-spot', slot);
      if (spot) {
        spot.parentNode.replaceChild(liveChatEl(), spot);
        if (f && LIVE.chatEl.contains(f)) { focusQuiet(f); if (sel) { try { f.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }
      }
    }
    liveChatFill();
    liveFloor($('#visit-box .room-room', viewEl.visit));
    if (key) { var el = $('#live-slot ' + key, viewEl.visit); if (el) { focusQuiet(el); } }
  }

  /* ---------- typed chat ---------- */
  function liveChatEl() {
    if (!LIVE.chatEl) { LIVE.chatEl = document.createElement('div'); LIVE.chatEl.className = 'live-chat'; LIVE.chatEl.hidden = true; LIVE.chatShown = ''; }
    return LIVE.chatEl;
  }
  /* the chat part of the panel is drawn again only when what it shows changes: ok (the lines, and a box to type in), ask
     (the birth question and the rules), no (not on this account); nothing when chat is off or the student is not live */
  function liveChatFill() {
    var el = LIVE.chatEl, st = LIVE.st === 'on' && { ok: 1, ask: 1, no: 1 }[LIVE.chat] ? LIVE.chat : '';
    if (!el || st === LIVE.chatShown) { return; }
    var inp = $('.live-text', el), had = !!inp && document.activeElement === inp;
    if (inp) { LIVE.draft = inp.value; }
    LIVE.chatShown = st;
    el.hidden = !st;
    el.innerHTML = st === 'ok' ? liveChatOkHTML() : st === 'ask' ? liveChatAskHTML() : st === 'no' ? liveChatNoHTML() : '';
    if (st !== 'ok') { return; }
    inp = $('.live-text', el);
    inp.value = LIVE.draft;
    liveChatCount();
    liveLinesDraw();
    if (had) { focusQuiet(inp); }
  }
  function liveChatOkHTML() {
    return '<h4 class="room-h4" id="live-chat-h">Chat</h4>' +
      '<ol class="live-lines" role="log" aria-labelledby="live-chat-h" tabindex="0"></ol><p class="fine live-none">No messages yet. Say hi!</p>' +
      '<form class="live-type" data-live-type novalidate><label class="sr" for="live-text">Your message</label>' +
      '<input type="text" id="live-text" class="live-text" maxlength="160" autocomplete="off" enterkeyhint="send" aria-describedby="live-chat-help">' +
      '<button class="btn sm" type="submit">Send</button></form>' +
      '<p class="fine" id="live-chat-help"><span class="live-n">0</span> of 160 characters. Be kind, and keep personal details to yourself.</p>' +
      '<p class="live-cmsg" role="status" aria-live="polite"></p>';
  }
  /* asked once: a neutral question (nothing says what age it looks for), then the rules */
  function liveChatAskHTML() {
    var y = new Date().getFullYear(), ys = '';
    for (var i = y; i >= y - 100; i--) { ys += '<option value="' + i + '">' + i + '</option>'; }
    return '<h4 class="room-h4" id="live-chat-h">Chat</h4>' +
      '<form class="live-age" data-live-age novalidate><p>To read and send typed messages, answer one question and agree to the chat rules. You only do this once, and your birthday isn’t saved.</p>' +
      '<fieldset class="live-born"><legend>When were you born?</legend>' +
      '<label class="field"><span class="label">Month</span><select name="m"><option value="">Month</option>' + LIVE_MONTHS.map(function (m, j) { return '<option value="' + (j + 1) + '">' + m + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span class="label">Year</span><select name="y"><option value="">Year</option>' + ys + '</select></label></fieldset>' +
      '<div class="live-rules-box"><p><b>The chat rules</b></p><ul class="live-rules">' +
      '<li>Be kind. No insults, swearing or teasing.</li>' +
      '<li>Keep personal details to yourself: your full name, phone number, email, address, school and social apps.</li>' +
      '<li>Never agree to meet someone from here, or to move the chat to another app.</li>' +
      '<li>If something feels wrong, leave the room, then block or report. Telling an adult you trust helps too.</li></ul></div>' +
      '<p class="row"><button class="btn sm" type="submit">I agree, start chatting</button></p><p class="live-cmsg" role="status" aria-live="polite"></p></form>';
  }
  function liveChatNoHTML() {
    return '<h4 class="room-h4" id="live-chat-h">Chat</h4><p>Typed chat isn’t available on your account. You can still walk around, and send reactions and quick phrases.</p>';
  }
  function liveChatMsg(text) { var m = LIVE.chatEl && $('.live-cmsg', LIVE.chatEl); if (m) { m.textContent = text || ''; } }
  function liveChatCount() {
    var inp = LIVE.chatEl && $('.live-text', LIVE.chatEl), n = LIVE.chatEl && $('.live-n', LIVE.chatEl);
    if (inp && n) { n.textContent = String(inp.value.length); }
  }
  function liveShort(t) { return t.length > 80 ? t.slice(0, 78) + '…' : t; }
  /* the lines: the last 50 are kept on the page while the student is live; a muted student's lines are hidden */
  function liveLineEl(x) {
    var li = document.createElement('li');
    li.setAttribute('data-live-line', x.pid);
    if (x.pid === LIVE.me) { li.className = 'live-mine'; }
    li.hidden = !!LIVE.mute[x.pid];
    li.innerHTML = '<b>' + esc(x.nick) + ':</b> ' + esc(x.t);
    return li;
  }
  function liveLinesDraw() {
    var ol = LIVE.chatEl && $('.live-lines', LIVE.chatEl);
    if (!ol) { return; }
    ol.innerHTML = '';
    LIVE.lines.forEach(function (x) { ol.appendChild(liveLineEl(x)); });
    liveLinesSeen(ol);
    ol.scrollTop = ol.scrollHeight;
  }
  function liveLinesSeen(ol) {
    $$('[data-live-line]', ol).forEach(function (li) { li.hidden = !!LIVE.mute[li.getAttribute('data-live-line')]; });
    var none = $('.live-none', LIVE.chatEl);
    if (none) { none.hidden = !!$('[data-live-line]:not([hidden])', ol); }
  }
  function liveLine(pid, nick, text) {
    var x = { pid: pid, nick: nick, t: text }, ol = LIVE.chatEl && $('.live-lines', LIVE.chatEl);
    LIVE.lines.push(x);
    if (LIVE.lines.length > LIVE_LINES) { LIVE.lines.shift(); }
    if (!ol) { return; }
    var near = ol.scrollHeight - ol.scrollTop - ol.clientHeight < 48;
    ol.appendChild(liveLineEl(x));
    while (ol.children.length > LIVE_LINES) { ol.removeChild(ol.firstChild); }
    liveLinesSeen(ol);
    if (near || pid === LIVE.me) { ol.scrollTop = ol.scrollHeight; }
  }
  /* the birth question: the server keeps only whether the student may type */
  function liveChatStart(f) {
    var m = Number(f.elements.m.value), y = Number(f.elements.y.value), btn = $('button[type="submit"]', f), seq = LIVE.seq;
    if (!m || !y) { liveChatMsg('Choose the month and the year you were born.'); return; }
    if (btn) { btn.disabled = true; }
    liveCall('club_live_chat_start', { p_month: m, p_year: y }).then(function (r) {
      if (seq !== LIVE.seq || LIVE.chat !== 'ask') { return; }
      var b = r.ok && isObj(r.body) ? r.body : null;
      if (b && b.ok) {
        LIVE.chat = b.chat === 'ok' ? 'ok' : 'no';
        liveChatFill();
        var t = LIVE.chat === 'ok' ? $('.live-text', LIVE.chatEl) : $('#live-chat-h', LIVE.chatEl);
        if (t) { if (LIVE.chat !== 'ok') { t.setAttribute('tabindex', '-1'); } focusQuiet(t); }
        liveAnnounce(LIVE.chat === 'ok' ? 'Chat is on. Type a message and press Enter to send it.' : 'Typed chat isn’t available on your account.');
        return;
      }
      if (r.missing) { LIVE.chat = 'off'; liveChatFill(); return; }
      if (btn) { btn.disabled = false; }
      liveChatMsg(b ? 'Choose the month and the year you were born.' : r.msg);
    });
  }
  /* a typed line: sent when the 3-second wait after the last reaction, phrase or line is over, and shown once the server
     has sent it (as it sent it). A line held back stays in the box, with why. */
  function liveChatSend() {
    var inp = LIVE.chatEl && $('.live-text', LIVE.chatEl), seq = LIVE.seq;
    clearTimeout(LIVE.chatT); LIVE.chatT = 0;
    if (!inp || LIVE.st !== 'on' || LIVE.chat !== 'ok' || LIVE.chatBusy) { return; }
    var text = inp.value.replace(/\s+/g, ' ').trim();
    if (!text) { return; }
    if (LIVE.left <= 0) { liveChatMsg(LIVE_WHY.day); return; }
    var wait = LIVE.sayAt + LIVE_COOL - Date.now();
    if (wait > 0) { LIVE.chatT = setTimeout(liveChatSend, wait + 30); return; }
    LIVE.chatBusy = true; LIVE.sayAt = Date.now();
    liveChatMsg('');
    liveCool();
    liveCall('club_live_chat', { p_text: text }).then(function (r) {
      if (seq !== LIVE.seq) { return; }
      LIVE.chatBusy = false;
      var b = r.ok && isObj(r.body) ? r.body : null, el = LIVE.chatEl && $('.live-text', LIVE.chatEl), me = LIVE.ppl[LIVE.me];
      if (b && b.ok) {
        var line = typeof b.t === 'string' && b.t ? b.t : text;
        LIVE.left = Number(b.left) || 0;
        if (el && el.value.replace(/\s+/g, ' ').trim() === text) { el.value = ''; LIVE.draft = ''; liveChatCount(); }
        liveLine(LIVE.me, 'You', line);
        if (me) { liveBubble(me, liveShort(line), false, 6000); }
        if (LIVE.left < 50) { liveDraw(); }
        return;
      }
      if (b && b.why === 'wait') { var ms = Number(b.ms) || 500; LIVE.sayAt = Date.now() + ms - LIVE_COOL; LIVE.chatT = setTimeout(liveChatSend, ms + 30); return; }
      if (b && LIVE_HELD.hasOwnProperty(b.why)) { liveChatMsg(LIVE_HELD[b.why]); return; }
      if (b && b.why === 'chat') { livePing(); return; }
      if (b) { liveNo(String(b.why || '')); return; }
      if (r.missing) { LIVE.chat = 'off'; liveChatFill(); return; }
      liveChatMsg(r.msg || 'That line wasn’t sent. Try again in a moment.');
    });
  }
  var LIVE_KEYS = ['data-live-join', 'data-live-leave', 'data-live-react', 'data-live-say', 'data-live-open', 'data-live-mute', 'data-live-ask', 'data-live-do', 'data-live-cancel', 'data-live-blocks', 'data-live-unblock'];
  function liveFocusKey() {
    var f = document.activeElement;
    if (!f || !f.closest || !f.closest('#live-slot')) { return ''; }
    for (var i = 0; i < LIVE_KEYS.length; i++) {
      if (f.hasAttribute(LIVE_KEYS[i])) { var v = f.getAttribute(LIVE_KEYS[i]) || ''; return '[' + LIVE_KEYS[i] + (v ? '="' + v.replace(/["\\]/g, '') + '"' : '') + ']'; }
    }
    return '';
  }
  function liveFocusMsg() { var m = $('#live-slot .live-msg', viewEl.visit); if (m && m.textContent) { m.setAttribute('tabindex', '-1'); focusQuiet(m); } }
  function liveFocusHead() { var h = $('#live-h', viewEl.visit); if (h) { h.setAttribute('tabindex', '-1'); focusQuiet(h); } }
  /* the figures: each one keeps its element, so a move slides it across the floor */
  function liveFloor(room) {
    if (!room) { return; }
    var fl = $('.live-floor', room);
    if (LIVE.st !== 'on') { if (fl) { fl.parentNode.removeChild(fl); } room.classList.remove('live-owner-in'); return; }
    if (!fl) { fl = document.createElement('div'); fl.className = 'live-floor'; fl.setAttribute('aria-hidden', 'true'); room.appendChild(fl); }
    var keep = {};
    LIVE.order.forEach(function (pid) {
      var p = LIVE.ppl[pid], look = p.av.join() + '|' + p.nick + '|' + (pid === LIVE.me);
      keep[pid] = 1;
      if (!p.el || p.el.parentNode !== fl) { p.el = document.createElement('div'); p.el.setAttribute('data-live-pid', pid); p.look = ''; fl.appendChild(p.el); }
      if (p.look !== look) {
        p.el.innerHTML = '<span class="live-body">' + roomAvatar(p.av, { live: true }) + '</span><span class="live-tag">' + esc(pid === LIVE.me ? 'You' : p.nick) + '</span><span class="live-bub" hidden></span>';
        p.look = look;
      }
      p.el.className = 'live-fig' + (pid === LIVE.me ? ' live-you' : '') + (LIVE.mute[pid] ? ' live-muted' : '');
      liveFigPos(p);
    });
    $$('.live-fig', fl).forEach(function (el) { if (!keep[el.getAttribute('data-live-pid')]) { el.parentNode.removeChild(el); } });
    room.classList.toggle('live-owner-in', LIVE.order.some(function (pid) { return LIVE.ppl[pid].own; }));
  }
  function liveFigPos(p) {
    if (!p.el) { return; }
    var moved = p.el.style.left && (p.el.style.left !== p.x + '%' || p.el.style.top !== p.y + '%'), svg = $('.room-av', p.el);
    p.el.style.left = p.x + '%'; p.el.style.top = p.y + '%'; p.el.style.zIndex = String(10 + p.y);
    if (moved && svg && !FX_REDUCE) { budPlay(svg, 'walk'); clearTimeout(p.walkT); p.walkT = setTimeout(function () { budRest(svg); }, 1000); }
  }
  /* a phrase in a bubble for 4.5 seconds (a typed line for `ms`); a reaction floats up and fades */
  function liveBubble(p, text, pop, ms) {
    if (!p || !p.el) { return; }
    if (pop) {
      var svg = $('.room-av', p.el);
      if (svg && !FX_REDUCE) { budPlay(svg, 'hop'); }
      var f = document.createElement('span');
      f.className = 'live-pop'; f.textContent = text;
      p.el.appendChild(f);
      setTimeout(function () { if (f.parentNode) { f.parentNode.removeChild(f); } }, 2600);
      return;
    }
    var b = $('.live-bub', p.el);
    if (!b) { return; }
    b.textContent = text; b.hidden = false;
    clearTimeout(p.bubT);
    p.bubT = setTimeout(function () { b.hidden = true; }, ms || 4500);
  }

  /* ---------- taps, keys, and the page coming and going ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null, b, a;
    if (!t || cur.view !== 'visit' || !viewEl.visit || !viewEl.visit.contains(t)) { return; }
    /* a tap in the room walks there; club.js shows what the spot is as well */
    if (LIVE.st === 'on' && (b = t.closest('#visit-box .room-room'))) { liveTap(e, b, t); return; }
    if (!t.closest('#live-slot')) { return; }
    if (t.closest('[data-live-join]')) { liveJoin(false); return; }
    if (t.closest('[data-live-leave]')) { liveLeave('left'); liveFocusHead(); return; }
    if ((b = t.closest('[data-live-react]'))) { liveSayIt('react', b.getAttribute('data-live-react')); return; }
    if ((b = t.closest('[data-live-say]'))) { liveSayIt('say', b.getAttribute('data-live-say')); return; }
    if ((b = t.closest('[data-live-open]'))) { a = b.getAttribute('data-live-open'); LIVE.open = LIVE.open === a ? '' : a; LIVE.ask = ''; liveDraw(); return; }
    if ((b = t.closest('[data-live-mute]'))) {
      a = b.getAttribute('data-live-mute');
      var who = LIVE.ppl[a];
      if (LIVE.mute[a]) { delete LIVE.mute[a]; } else { LIVE.mute[a] = 1; }
      LIVE.msg = who ? (LIVE.mute[a] ? who.nick + ' is muted on your screen.' : who.nick + ' is no longer muted.') : '';
      liveDraw();
      var ol = LIVE.chatEl && $('.live-lines', LIVE.chatEl);
      if (ol) { liveLinesSeen(ol); }
      return;
    }
    if ((b = t.closest('[data-live-ask]'))) {
      LIVE.ask = b.getAttribute('data-live-ask');
      liveDraw('[data-live-cancel]');
      return;
    }
    if (t.closest('[data-live-cancel]')) { a = LIVE.ask.split(':')[1] || ''; LIVE.ask = ''; liveDraw(a ? '[data-live-open="' + a + '"]' : ''); return; }
    if ((b = t.closest('[data-live-do]'))) { a = b.getAttribute('data-live-do').split(':'); b.disabled = true; liveAct(a[0], a[1], a[2]); return; }
    if (t.closest('[data-live-blocks]')) { LIVE.showBlocks = !LIVE.showBlocks; if (LIVE.showBlocks) { LIVE.blocks = null; liveBlocksLoad(); } liveDraw(); return; }
    if ((b = t.closest('[data-live-unblock]'))) { b.disabled = true; liveUnblock(b.getAttribute('data-live-unblock')); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || !f.closest || !f.closest('#live-slot')) { return; }
    if (f.hasAttribute('data-live-type')) { e.preventDefault(); liveTouch(); liveChatSend(); }
    else if (f.hasAttribute('data-live-age')) { e.preventDefault(); liveChatStart(f); }
  });
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'live-text') { liveChatCount(); } });
  ['pointerdown', 'keydown'].forEach(function (k) { document.addEventListener(k, function () { if (LIVE.st) { liveTouch(); } }, true); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (LIVE.st === 'on') {
        clearTimeout(LIVE.awayT);
        LIVE.awayT = setTimeout(function () { LIVE.awayT = 0; if (document.hidden && LIVE.st === 'on') { liveLeave('away'); } }, LIVE_AWAY);
      }
      return;
    }
    clearTimeout(LIVE.awayT); LIVE.awayT = 0;
    if (LIVE.why === 'away' && !LIVE.st && cur.view === 'visit' && LIVE.link) { liveTouch(); liveJoin(true); }
    else if (LIVE.st === 'on') { livePing(); }
  });
  window.addEventListener('pagehide', function () {
    if (!LIVE.st) { return; }
    liveBeacon();
    liveStop();
    LIVE.why = 'away';
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted && LIVE.why === 'away' && !LIVE.st && cur.view === 'visit' && LIVE.link) { liveJoin(true); } });
