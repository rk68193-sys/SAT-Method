  /* =================== The clubhouse on the account (src/account/club.sql): coins, crates and shared rooms =================== */
  /* Signed in, once club.sql has been run in the account's project, a student's coins, crates, prizes, stickers, free crates
     and streak freezes are kept by the server instead of in the saved progress. The page shows what the server answers (CLUB.P,
     in the shape of store.s.pz; pz() returns it instead) and asks the server to count the day's coins (club_claim), open a crate
     (club_open), buy a freeze (club_freeze) or take the owner's link (club_gift); it changes nothing itself. The first time, the
     device's own record is carried over (club_join), checked by the server. What the student has on (store.s.pz.eq) stays in the
     saved progress. Guests, and a project where club.sql has not been run, keep everything on the device as before.
     A room saved while signed in is sent too (club_room_save), so it can be shared: its link (#r-<32 hex digits>, clubVisit)
     shows anyone the room, the nickname and the streak, and a signed-in visitor can leave one sticker a day on its board.
     Kept on the device under CLUB_LS, for the account signed in: { uid, st (the server's last answer, so the page shows it at
     once), pend (coins and days not yet counted by the server) }. store.s.club = 1 marks an account in the clubhouse, so a
     device that has not heard from the server yet earns and opens nothing on its own meanwhile (clubWait). */
  var CLUB_LS = 'sat-sprint-club';
  var CLUB = { on: false, uid: '', st: null, P: null, none: false, wait: null, trying: false, next: 0, at: 0, erasing: false, joined: false,
    pend: {}, sent: {}, flushing: false, flushT: 0, opening: false, room: null, roomAgain: false, nickEdit: false, said: '', visit: null };

  /* the record shown is the account's: this device's person, signed in now or until their session ran out */
  function clubShow() { return typeof CLUB === 'object' && !!CLUB && CLUB.on && !!CLUB.P && !!A && A.uid === CLUB.uid; }
  /* and the server can be asked */
  function clubOn() { return clubShow() && acctIn(); }
  /* an account in the clubhouse that cannot be asked yet (its record has not arrived, or the session ran out): nothing is
     earned or opened on the device meanwhile */
  function clubWait() { return typeof CLUB === 'object' && !!CLUB && !clubOn() && !CLUB.none && !!A && !!A.uid && isObj(store.s) && store.s.club === 1; }
  /* the account keeps the record, not the device: nothing is earned, opened or bought here on the device's own */
  function clubKeeps() { return clubShow() || clubWait(); }
  /* a tap on a crate or a freeze while the account cannot be asked: nothing happens, and the account is asked again */
  function clubHold() {
    if (clubOn() || !clubKeeps()) { return false; }
    if (!acctIn()) { pzToast('Your coins are kept in your account', 'Sign in again to use them.', 6000); return true; }
    pzToast('Your coins are kept in your account', 'It has not answered yet. Try again in a moment.', 5000);
    CLUB.next = 0; clubSynced();
    return true;
  }
  /* one of club.sql's functions, as the signed-in student, or with anon true as anyone (a shared room) */
  function clubCall(fn, args, anon) {
    return (anon ? Promise.resolve('') : acctToken()).then(function (tok) {
      if (!anon && !tok) { return { ok: false, status: 0, body: null, missing: false, msg: 'Sign in again, then try once more.' }; }
      return acctReq('POST', '/rest/v1/rpc/' + fn, args || {}, tok || null).then(function (r) {
        var b = isObj(r.body) ? r.body : {};
        r.missing = r.status === 404 && (b.code === 'PGRST202' || /could not find the function/i.test(String(b.message || '')));
        r.msg = r.ok ? '' : clubSay(r);
        return r;
      });
    });
  }
  /* what went wrong, in words; the server's own refusals are already plain ("not enough coins") */
  function clubSay(r) {
    var b = isObj(r.body) ? r.body : {}, m = String(b.message || '');
    if (!r.status) { return 'No connection to your account. Try again when you are online.'; }
    if (b.code === 'P0001' && m) {
      if (m === 'not enough coins') { return 'You need more coins for that.'; }
      if (m === 'join first' || m === 'sign in first') { return 'Sign in again, then try once more.'; }
      if (m === 'the clubhouse is not ready yet') { return 'The clubhouse is still being set up. Try again in a few minutes.'; }
      return m.charAt(0).toUpperCase() + m.slice(1) + '.';
    }
    if (r.status === 429) { return 'Too many tries just now. Wait a minute, then try again.'; }
    return 'That did not work. Try again in a moment.';
  }

  /* ---------- the record: the server's answer, in the shapes the prize code reads ---------- */
  function clubWhy(k) {
    var m;
    if (k === 'welcome') { return 'Welcome: your first crate is free.'; }
    if ((m = /^ms(\d+)\./.exec(k))) { return 'A ' + m[1] + '-day streak.'; }
    if ((m = /^page\.([a-z]+)$/.exec(k)) && PZ_SER[m[1]]) { return 'You finished the ' + PZ_SER[m[1]].name + ' sticker page.'; }
    if (/^test\./.test(k)) { return 'Your test is this week.'; }
    return '';
  }
  function clubTake(st) {
    if (!isObj(st) || !st.joined) { return false; }
    var obj = function (o) { return isObj(o) ? o : {}; }, g = {}, G = obj(st.g);
    Object.keys(G).forEach(function (k) { var v = G[k]; if (Array.isArray(v)) { g[k] = [v[0] || 0, v[1] || '', v[2] || 'c', clubWhy(k)]; } });
    CLUB.st = st; CLUB.at = Date.now(); CLUB.uid = A.uid;
    CLUB.P = { e: obj(st.e), x: obj(st.x), o: obj(st.o), g: g, fz: obj(st.fz), st: obj(st.st), eq: {} };
    CLUB.on = true;
    clubSave();
    return true;
  }
  /* pz() in club mode: the server's record, with what this device has on */
  function clubPz() {
    var L = store.s.pz;
    if (!isObj(L)) { L = store.s.pz = {}; }
    if (!isObj(L.eq)) { L.eq = {}; }
    CLUB.P.eq = L.eq;
    return CLUB.P;
  }
  /* the device's own record, carried over once: the prize record and the days practiced */
  function clubRecord() {
    var L = isObj(store.s.pz) ? store.s.pz : {}, out = {}, D = daysAll();
    ['e', 'x', 'o', 'g', 'fz', 'st'].forEach(function (k) { out[k] = isObj(L[k]) ? L[k] : {}; });
    out.days = Object.keys(D).filter(function (k) { return Array.isArray(D[k]) && (D[k][0] || 0) + (D[k][1] || 0) > 0; });
    return out;
  }

  /* ---------- finding the clubhouse: after each sync with the account ---------- */
  function clubSynced() {
    if (!acctIn() || CLUB.erasing) { return; }
    if (!CLUB.on && clubLoad(A.uid).erase) { if (Date.now() >= CLUB.next) { clubEraseNow(A.uid); } return; }
    if (CLUB.on) { if (Date.now() - CLUB.at > 30000) { clubRefresh(); } return; }
    if (CLUB.none || CLUB.trying || Date.now() < CLUB.next) { return; }
    CLUB.wait = clubStart();
  }
  /* the student asked to check now, or the connection is back: no waiting for the next try */
  function clubAgain() { CLUB.next = 0; }
  function clubStart() {
    var uid = A.uid;
    CLUB.trying = true;
    if (!CLUB.on) { var o = clubLoad(uid); CLUB.pend = isObj(o.pend) ? o.pend : {}; }
    return clubCall('club_state').then(function (r) {
      if (r.missing) { CLUB.none = true; return null; }
      if (!r.ok || !isObj(r.body) || !r.body.ready) { return null; }
      if (r.body.joined) { return r.body; }
      return clubCall('club_join', { p: clubRecord() }).then(function (j) { if (j.ok && isObj(j.body)) { CLUB.joined = true; return j.body; } return null; });
    }).then(function (st) {
      CLUB.trying = false;
      if (!st || !acctIn() || A.uid !== uid || !clubTake(st)) { CLUB.next = Date.now() + 60000; clubRedraw(); return false; }
      clubAfter();
      return true;
    }, function () { CLUB.trying = false; CLUB.next = Date.now() + 60000; return false; });
  }
  /* the record again; an account whose clubhouse record is gone (erased on another device) joins again, and a project
     without club.sql any more goes back to keeping prizes on the device */
  function clubRefresh() {
    var uid = A.uid;
    CLUB.at = Date.now();
    return clubCall('club_state').then(function (r) {
      if (!clubOn() || A.uid !== uid) { return; }
      if (r.missing || (r.ok && isObj(r.body) && r.body.ready && !r.body.joined)) {
        var none = r.missing;
        clubStop(); CLUB.none = none;
        pzChip(); clubRedraw(); clubSynced();
        return;
      }
      var before = JSON.stringify(CLUB.st);
      if (r.ok && clubTake(r.body)) { clubAfter(JSON.stringify(CLUB.st) === before); }
    });
  }
  /* after each answer from the server about the whole record; same: nothing in it changed, so nothing is drawn again */
  function clubAfter(same) {
    if (store.s.club !== 1) { store.s.club = 1; save(); }
    if (CLUB.joined) {
      /* said only when something came over from the device */
      var c = isObj(CLUB.st.carried) ? CLUB.st.carried : {};
      CLUB.joined = false;
      if ((Number(c.prizes) || 0) + (Number(c.coins) || 0) > 0) { pzToast('Your coins and prizes are in your account', 'They are kept there now, the same on every device you sign in to.', 7000); }
    }
    clubRoomCheck();
    clubTick();
    if (!same) { pzChip(); clubRedraw(); }
  }
  /* when the account resolves: true in club mode (the gift link waits for this) */
  function clubReady() {
    if (!acctIn()) { return Promise.resolve(false); }
    if (CLUB.on) { return Promise.resolve(true); }
    if (CLUB.wait) { return CLUB.wait; }
    return acctSync().then(function () { return CLUB.wait || false; });
  }
  /* signed out, the account deleted, or another tab signed out */
  function clubStop() {
    clearTimeout(CLUB.flushT);
    CLUB.on = false; CLUB.uid = ''; CLUB.st = null; CLUB.P = null; CLUB.none = false; CLUB.wait = null; CLUB.trying = false; CLUB.next = 0; CLUB.at = 0;
    CLUB.pend = {}; CLUB.sent = {}; CLUB.nickEdit = false; CLUB.said = '';
    try { window.localStorage.removeItem(CLUB_LS); } catch (e) {}
  }
  /* the account was deleted: this device keeps the prizes it was showing, as its own record again */
  function clubHandBack() {
    if (clubOn()) {
      var P = CLUB.P, L = isObj(store.s.pz) ? store.s.pz : {};
      store.s.pz = { e: P.e, x: P.x, o: P.o, g: P.g, fz: P.fz, st: P.st, eq: isObj(L.eq) ? L.eq : {} };
    }
    delete store.s.club;
    clubStop();
  }
  /* pages that show prizes are drawn again when the record changes, unless the student is typing or opening a crate */
  function clubRedraw() {
    if (pzModalOpen) { return; }
    var f = document.activeElement;
    if (f && /^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName)) { return; }
    var y = window.scrollY;
    if (cur.view === 'crates') { buildCrates(); window.scrollTo(0, y); }
    else if (cur.view === 'room') { if (!ROOM.edit) { roomDrawAll(); } clubShareDraw(); }
    else if (cur.view === 'visit') { clubVisitDraw(); window.scrollTo(0, y); }
    else if (cur.view === 'home') { acctRedraw(); }
  }

  /* ---------- what this device keeps for the account signed in ---------- */
  function clubLoad(uid) {
    try { var o = JSON.parse(window.localStorage.getItem(CLUB_LS) || 'null'); return isObj(o) && o.uid === uid ? o : {}; } catch (e) { return {}; }
  }
  function clubSave() {
    try { if (A && A.uid && CLUB.st) { window.localStorage.setItem(CLUB_LS, JSON.stringify({ uid: A.uid, st: CLUB.st, pend: CLUB.pend })); } } catch (e) {}
  }

  /* ---------- coins for the day: what the page would have counted, sent to the server to count ---------- */
  /* each reason is sent once per page load at most (CLUB.sent), even if the server does not count it */
  function clubTick() {
    if (!clubOn() || !CLUB.at) { return; }
    var P = clubPz(), now = Date.now(), today = dayKey(now), want = CLUB.pend, was = JSON.stringify(want), t = dayStart(now), i, pl = null;
    var add = function (k, v) { if (!((P.e[k] || 0) >= v) && !((want[k] || 0) >= v) && !((CLUB.sent[k] || 0) >= v)) { want[k] = v; } };
    try { if (qotdDone('m', qotd('m'))) { add('qotd.m.' + today, PZ_EARN.qotd); } } catch (e) { /* no question of the day */ }
    try { if (qotdDone('rw', qotd('rw'))) { add('qotd.rw.' + today, PZ_EARN.qotd); } } catch (e) { /* no question of the day */ }
    try { pl = planGet(); if (pl) { var pr = planProgress(pl); if (pr.of && pr.done >= pr.of) { add('plan.' + today, PZ_EARN.plan); } } } catch (e) { /* no plan */ }
    var rv = Math.min(PZ_EARN.revMax, pzReasonsSince(t));
    if (rv) { add('rev.' + today, rv * PZ_EARN.rev); }
    /* the days practiced, for the server's streak: today and the two before, once each */
    for (i = 0; i < 3; i++, t = dayBefore(t)) { var c = dayCount(t); if (c[0] + c[1] > 0) { add('day.' + dayKey(t), 1); } }
    if (pl && pzTestOpen() && CLUB.st.test !== pl.date) { add('test.' + pl.date, 1); }
    if (JSON.stringify(want) !== was) { clubSave(); }
    if (Object.keys(want).length) { clearTimeout(CLUB.flushT); CLUB.flushT = setTimeout(clubFlush, 300); }
  }
  function clubFlush() {
    if (!clubOn() || CLUB.flushing) { return; }
    var send = {}, keys = Object.keys(CLUB.pend).slice(0, 20);
    if (!keys.length) { return; }
    keys.forEach(function (k) { send[k] = CLUB.pend[k]; });
    CLUB.flushing = true;
    var was = {}, g0 = pzGrants().length;
    keys.forEach(function (k) { was[k] = CLUB.P.e[k] || 0; });
    clubCall('club_claim', { p: send }).then(function (r) {
      CLUB.flushing = false;
      if (!clubOn()) { return; }
      if (!r.ok) {
        /* refused outright: those reasons will never count, so they are dropped; otherwise tried again in a minute */
        if (r.status >= 400 && r.status < 500 && [401, 408, 429].indexOf(r.status) < 0) { keys.forEach(function (k) { delete CLUB.pend[k]; CLUB.sent[k] = send[k]; }); clubSave(); }
        else { clearTimeout(CLUB.flushT); CLUB.flushT = setTimeout(clubFlush, 60000); }
        return;
      }
      keys.forEach(function (k) { if (CLUB.pend[k] === send[k]) { delete CLUB.pend[k]; } CLUB.sent[k] = Math.max(CLUB.sent[k] || 0, send[k]); });
      if (!clubTake(r.body)) { return; }
      /* only what this claim added: coins another device counted first are not news */
      var got = 0, fresh = pzGrants().length > g0, why = '';
      keys.forEach(function (k) { var d = (CLUB.P.e[k] || 0) - was[k], w = PZ_WHY[k.split('.')[0]]; if (d > 0 && w) { got += d; why = w; } });
      if (got > 0) { pzToast('+' + got + ' coins', why + (fresh ? ' · and a free crate' : '')); } else if (fresh) { pzToast('A free crate', 'is waiting for you'); }
      pzChip(); clubRedraw();
      if (Object.keys(CLUB.pend).length) { CLUB.flushT = setTimeout(clubFlush, 300); }
    });
  }

  /* ---------- crates, freezes and the owner's link, opened by the server ---------- */
  function clubOpen(btn, series, grant) {
    if (CLUB.opening) { return; }
    CLUB.opening = true;
    var was = btn.innerHTML;
    btn.disabled = true; btn.textContent = 'Opening…';
    clubCall('club_open', { p_series: series, p_grant: grant || null }).then(function (r) {
      CLUB.opening = false;
      var res = isObj(r.body) ? r.body : null;
      if (!r.ok || !res) { if (btn.isConnected) { btn.disabled = false; btn.innerHTML = was; } pzToast('The crate did not open', r.msg, 7000); return; }
      clubTake(res.state); pzChip();
      var it = PZ_BY[res.item];
      if (!it) { buildCrates(); pzToast('You won a prize', 'It is newer than this page. Reload the page to see it.', 8000); return; }
      pzShowOpen({ id: res.id, item: it, dupe: res.dupe ? 1 : 0, sticker: res.sticker || '', series: res.series });
    });
  }
  function clubFreeze(btn) {
    if (btn) { btn.disabled = true; }
    clubCall('club_freeze').then(function (r) {
      if (r.ok && clubTake(r.body)) { pzChip(); if (cur.view === 'crates') { buildCrates(); } pzToast('A streak freeze is ready', 'It covers a day you miss, on its own.'); return; }
      if (btn && btn.isConnected) { btn.disabled = false; }
      pzToast('No freeze was bought', r.msg, 7000);
    });
  }
  /* the owner's link while signed in: the server checks the code too, and gives everything to the account. false: not in club mode */
  function clubGift(code) {
    return clubReady().then(function () {
      if (!clubOn()) { return false; }
      return clubCall('club_gift', { p_code: code }).then(function (r) {
        if (r.ok && clubTake(r.body)) {
          pzChip(); if (cur.view === 'crates') { buildCrates(); }
          pzToast('Everything is unlocked', 'All ' + PZ_ITEMS.length + ' prizes, every sticker and title, and ' + pzNum(PZ_GIFT_COINS) + ' coins, kept in your account.', 8000);
        } else { pzToast('Nothing was unlocked', r.msg, 8000); }
        return true;
      });
    });
  }
  /* "Erase my progress everywhere" empties the clubhouse record too; the next sync joins again with what is left (nothing).
     Until the server has done it, the device remembers to ask again ({ uid, erase: 1 } under CLUB_LS). */
  function clubErase() {
    if (!acctIn() || CLUB.none) { return; }
    var uid = A.uid;
    clubStop();
    try { window.localStorage.setItem(CLUB_LS, JSON.stringify({ uid: uid, erase: 1 })); } catch (e) {}
    clubEraseNow(uid);
  }
  function clubEraseNow(uid) {
    CLUB.erasing = true;
    clubCall('club_erase').then(function (r) {
      CLUB.erasing = false;
      if (!A || A.uid !== uid) { return; }
      if (r.ok || r.missing) { try { window.localStorage.removeItem(CLUB_LS); } catch (e) {} CLUB.none = r.missing; clubSynced(); }
      else { CLUB.next = Date.now() + 60000; }
    });
  }

  /* ---------- my room on the server, for sharing ---------- */
  function clubRoomLayout() { var r = store.s.room; return { w: r.w || '', win: r.win || '', st: r.st || [], sh: r.sh || [], bd: r.bd || [], tl: r.tl || '', av: r.av || [] }; }
  /* this device's room goes to the server when it is newer than the one there */
  function clubRoomCheck() {
    if (!clubOn() || !roomSaved()) { return; }
    var srv = CLUB.st.room;
    if (!isObj(srv) || (store.s.room.t || 0) > (srv.at || 0)) { clubRoomPush(); }
  }
  function clubRoomPush() {
    if (!clubOn() || !roomSaved()) { return Promise.resolve(false); }
    if (CLUB.room) { CLUB.roomAgain = true; return CLUB.room; }
    CLUB.room = clubCall('club_room_save', { p: clubRoomLayout() }).then(function (r) {
      CLUB.room = null;
      if (r.ok && isObj(r.body) && clubOn()) { CLUB.st.room = r.body; }
      if (CLUB.roomAgain) { CLUB.roomAgain = false; return clubRoomPush(); }
      return r.ok;
    });
    return CLUB.room;
  }
  /* the server has this device's room: a save on its way is waited for, an older one is sent again */
  function clubRoomSent() {
    if (CLUB.room) { return CLUB.room; }
    var srv = CLUB.st.room;
    return isObj(srv) && (srv.at || 0) >= (store.s.room.t || 0) ? Promise.resolve(true) : clubRoomPush();
  }
  function clubRoomUrl(link) { return chalBase() + '#r-' + link; }
  function clubDay(k) { var t = parseDay(k); return isNaN(t) ? '' : new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  /* stickers visitors left: [id, sticker, nickname, day], newest first */
  function clubBoardHTML(board, mine) {
    var B = (Array.isArray(board) ? board : []).filter(function (b) { return Array.isArray(b) && pzStickerName(b[1]); });
    var h = '<div class="room-guests"><h4 class="room-h4">Stickers from visitors</h4>';
    if (!B.length) { return h + '<p class="fine">' + (mine ? 'None yet. A friend who opens your link and is signed in can leave one a day.' : 'None yet. Be the first!') + '</p></div>'; }
    return h + '<ul class="room-gb">' + B.map(function (b, i) {
      return '<li><span class="pz-stk pz-stk-' + (i % 4) + '">' + esc(pzStickerName(b[1])) + '</span><span class="fine">from ' + esc(b[2] || 'a visitor') + (clubDay(b[3]) ? ', ' + esc(clubDay(b[3])) : '') + '</span>' +
        (mine ? '<button class="linkbtn" type="button" data-club-unstick="' + Number(b[0]) + '">Take it off</button>' : '') + '</li>';
    }).join('') + '</ul></div>';
  }
  function clubNickHTML(nick) {
    return '<form class="room-nickf" data-club-nickform novalidate><label class="field"><span class="label">Nickname</span><input type="text" class="room-nickin" maxlength="20" autocomplete="nickname" spellcheck="false" value="' + esc(nick || chalMyName()) + '"></label>' +
      '<p class="fine">3 to 20 letters or numbers, with spaces, dots or dashes between them if you like.</p>' +
      '<p class="row"><button class="btn sm" type="submit">Save nickname</button>' + (nick ? '<button class="btn ghost sm" type="button" data-club-nickcancel>Cancel</button>' : '') + '</p><p class="room-msg" role="status" aria-live="polite"></p></form>';
  }
  /* the Share my room part of #room */
  function clubShareHTML() {
    if (!acctOn) { return ''; }
    var h = '<section class="room-share" aria-labelledby="room-share-h"><h3 class="h3" id="room-share-h">Share my room</h3>';
    if (!acctIn()) { return h + '<p>Sign in to get a link your friends can open to see your room, and to leave stickers in theirs.</p><p><a class="btn ghost sm" href="#account">Sign in</a></p></section>'; }
    if (!clubOn()) { return CLUB.trying ? h + '<p class="muted">Checking your account…</p></section>' : ''; }
    var st = CLUB.st, nick = st.nick || '', link = isObj(st.room) && st.room.link ? clubRoomUrl(st.room.link) : '', share = chalCanShare();
    if (st.blocked) { return h + '<p>Sharing is switched off for this account.</p></section>'; }
    if (!nick || CLUB.nickEdit) {
      return h + (nick ? '' : '<p>First, choose a nickname. It shows on your shared room and on stickers you leave for friends. A first name or a made-up name is best, never your full name.</p>') + clubNickHTML(nick) + '</section>';
    }
    h += '<p class="room-nick">Your nickname: <b>' + esc(nick) + '</b> <button class="linkbtn" type="button" data-club-nickedit>Change it</button></p>';
    if (!link) {
      h += '<p>Make a link to your room. Anyone you send it to sees your room, your nickname and your streak, and nothing else. You can switch it off at any time.</p>' +
        '<p class="row"><button class="btn" type="button" data-club-share>Make a link</button></p>';
    } else {
      h += '<p><b>Your room is shared.</b> Anyone with this link can see it:</p><p class="room-link"><input type="text" class="room-url" readonly value="' + esc(link) + '" aria-label="The link to your room"></p>' +
        '<p class="row">' + (share ? '<button class="btn" type="button" data-club-send>Send to a friend</button>' : '') + '<button class="btn' + (share ? ' ghost' : '') + '" type="button" data-club-copy>Copy the link</button>' +
        '<button class="btn ghost" type="button" data-club-unshare>Stop sharing</button></p>';
    }
    h += '<p class="room-msg" role="status" aria-live="polite">' + esc(CLUB.said) + '</p>';
    if (link || (Array.isArray(st.board) && st.board.length)) { h += clubBoardHTML(st.board, true); }
    return h + '</section>';
  }
  function clubShareDraw() {
    var box = viewEl.room ? $('#room-share-box', viewEl.room) : null, foot = viewEl.room ? $('#room-foot', viewEl.room) : null;
    if (box) { box.innerHTML = clubShareHTML(); }
    if (foot) { foot.textContent = roomFoot(); }
  }
  function clubShareSay(msg) { CLUB.said = msg; clubShareDraw(); var m = viewEl.room ? $('.room-share .room-msg', viewEl.room) : null; if (m) { focusQuiet(m); } }
  function clubCopy(url, msg, box) {
    var inp = box ? $('.room-url', box) : null;
    function done(ok) { msg.textContent = ok ? 'Copied. Paste it into a message to a friend.' : 'Copy the link above, then paste it into a message to a friend.'; if (!ok && inp) { focusQuiet(inp); try { inp.select(); } catch (e) {} } }
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(inp ? chalCopyOld(inp) : false); }); return; } } catch (e) {}
    done(inp ? chalCopyOld(inp) : false);
  }

  /* ---------- #r-<link>: someone's shared room ---------- */
  function clubTitleName(id) { var t = PZ_TITLES.filter(function (x) { return x[0] === id; })[0]; return t ? t[1] : ''; }
  /* a shared room's record, kept to what this page knows how to draw (the server already checked the owner has it all) */
  function clubRoomFrom(L, nick) {
    L = isObj(L) ? L : {};
    var item = function (id, kinds) { var it = typeof id === 'string' ? PZ_BY[id] : null; return it && kinds.indexOf(it.kind) >= 0 ? id : ''; };
    var list = function (a, n, f) { var out = []; (Array.isArray(a) ? a : []).forEach(function (x) { var v = f(x); if (v && out.indexOf(v) < 0 && out.length < n) { out.push(v); } }); return out; };
    var st = [], av = Array.isArray(L.av) ? L.av : [];
    for (var i = 0; i < ROOM_STANDS; i++) { st.push(item(Array.isArray(L.st) ? L.st[i] : '', ['aura', 'fx'])); }
    return { w: item(L.w, ['theme']), win: item(L.win, ['paper']), st: st, sh: list(L.sh, ROOM_SHELF, function (x) { return item(x, ['streak']); }),
      bd: list(L.bd, ROOM_BOARD, function (x) { return typeof x === 'string' && pzStickerName(x) ? x : ''; }), tl: typeof L.tl === 'string' ? L.tl : '',
      av: [roomColor(av[0])[0], roomHat(av[1])[0]], nm: nick || '' };
  }
  function clubVisitPage(head, body) {
    viewEl.visit.innerHTML = '<div class="wrap room-page room-visit"><header class="room-head"><p class="eyebrow">Clubhouse</p><h2 class="vtitle">' + head + '</h2>' + body + '</header></div>';
  }
  function clubVisit(link) {
    CLUB.visit = { link: link, v: null, spot: '', said: '' };
    clubVisitPage('A shared room', '<p class="lede" role="status">Opening the room…</p>');
    if (!acctOn) { clubVisitPage('A shared room', '<p class="lede">Shared rooms are not switched on for this copy of the site.</p>'); return; }
    clubCall('club_room_view', { p_link: link }, !acctIn()).then(function (r) {
      if (cur.view !== 'visit' || !CLUB.visit || CLUB.visit.link !== link) { return; }
      if (r.ok && isObj(r.body)) { CLUB.visit.v = r.body; clubVisitDraw(); return; }
      clubVisitPage('This room is not shared right now', '<p class="lede">' + (r.ok || r.missing ? 'Its owner may have switched the link off, or it was copied wrong.' : esc(r.msg)) + '</p>' +
        '<p class="row"><a class="btn" href="#room">See my own room</a><a class="btn ghost" href="#home">Go to Today</a></p>');
    });
  }
  function clubVisitModel(v) { var R = clubRoomFrom(v.layout, v.nick); return { R: R, o: { edit: false, title: clubTitleName(R.tl), n: Number(v.n) || 0, best: Number(v.best) || 0, on: CLUB.visit.spot } }; }
  function clubVisitSideHTML(R, o) {
    var sp = CLUB.visit.spot;
    return (sp ? '<div class="room-card"><p class="room-side-k">' + esc(roomSpotName(sp)) + '</p><p>' + esc(roomWhat(sp, R, o)) + '</p></div>' : '') +
      '<p class="room-side-k">In this room</p><ul class="room-all">' + ROOM_SPOTS.map(function (s) {
        return '<li><button type="button" class="room-allb" data-visit-spot="' + s[0] + '"><b>' + s[1] + '</b><span>' + esc(roomWhat(s[0], R, o)) + '</span></button></li>';
      }).join('') + '</ul>';
  }
  function clubLeaveHTML(v) {
    var h = '<div class="room-leave"><h4 class="room-h4">Leave a sticker</h4>', nick = esc(v.nick || 'them');
    if (v.mine) { return h + '<p>This is your room. Friends you send the link to can leave stickers here.</p><p><a class="btn ghost sm" href="#room">Go to my room</a></p></div>'; }
    if (!acctIn()) { return h + '<p>Sign in to leave one of your stickers on ' + nick + '’s board.</p><p><a class="btn ghost sm" href="#account">Sign in</a></p></div>'; }
    if (!clubOn()) { return CLUB.trying ? h + '<p class="muted">Checking your account…</p></div>' : ''; }
    if (CLUB.st.blocked) { return h + '<p>Leaving stickers is switched off for this account.</p></div>'; }
    if (!CLUB.st.nick || CLUB.nickEdit) { return h + '<p>Choose a nickname first, so ' + nick + ' knows who it is from. A first name or a made-up name is best.</p>' + clubNickHTML(CLUB.st.nick) + '</div>'; }
    var mine = Object.keys(clubPz().st).filter(function (s) { return pzStickerName(s); }).sort();
    if (!mine.length) { return h + '<p>You have no stickers yet. Every crate holds one. <a href="#crates">Open crates</a></p></div>'; }
    return h + '<p>Pick one of yours. You can leave one a day here; a second one that day takes the first one’s place.</p><div class="room-leave-pick">' + mine.map(function (s, i) {
      return '<button type="button" class="room-stkb" data-club-stick="' + esc(s) + '" aria-label="Leave the ' + esc(pzStickerName(s)) + ' sticker"><span class="pz-stk pz-stk-' + (i % 4) + '">' + esc(pzStickerName(s)) + '</span></button>';
    }).join('') + '</div><p class="room-msg" role="status" aria-live="polite">' + esc(CLUB.visit.said) + '</p></div>';
  }
  function clubVisitDraw() {
    var V = CLUB.visit, v = V && V.v;
    if (!v || !viewEl.visit) { return; }
    var M = clubVisitModel(v), nm = esc(v.nick || 'A friend');
    viewEl.visit.innerHTML = '<div class="wrap room-page room-visit">' +
      '<header class="room-head"><p class="eyebrow">Clubhouse</p><h2 class="vtitle">' + esc(roomName(v.nick)) + '</h2><p class="lede">' + nm + ' decorated this room with prizes won by studying for the SAT. Tap anything in it to see what it is.</p></header>' +
      '<div class="room-main"><div class="room-stage"><div id="visit-box">' + roomRoomHTML(M.R, M.o) + '</div></div><div class="room-side" id="visit-side" aria-live="polite">' + clubVisitSideHTML(M.R, M.o) + '</div></div>' +
      '<section class="room-share" aria-label="Stickers">' + clubBoardHTML(v.board, false) + clubLeaveHTML(v) + '</section>' +
      (acctIn() ? '' : '<p class="fine room-foot">Want a room of your own? Every lesson and question on this site is free, and studying earns the prizes. <a href="#home">Start here</a></p>') + '</div>';
    roomScenes($('#visit-box', viewEl.visit), M.R);
  }
  function clubVisitTap(spot) {
    var V = CLUB.visit;
    if (!V || !V.v) { return; }
    V.spot = spot;
    var M = clubVisitModel(V.v), side = $('#visit-side', viewEl.visit), m = /^s(\d)$/.exec(spot), it = m ? PZ_BY[M.R.st[+m[1]]] : null;
    $$('#visit-box .room-spot', viewEl.visit).forEach(function (b) { b.classList.toggle('room-on', b.getAttribute('data-room-spot') === spot); });
    if (side) { side.innerHTML = clubVisitSideHTML(M.R, M.o); }
    if (it && it.kind === 'fx') { fxRight(it.key, $('#visit-box .room-st' + m[1] + ' .room-ans', viewEl.visit)); }
  }

  /* ---------- taps and forms ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null, b;
    if (!t) { return; }
    if (viewEl.visit && viewEl.visit.contains(t)) {
      if ((b = t.closest('[data-room-spot],[data-visit-spot]'))) { clubVisitTap(b.getAttribute('data-room-spot') || b.getAttribute('data-visit-spot')); return; }
      if ((b = t.closest('[data-club-stick]')) && clubOn() && CLUB.visit && CLUB.visit.v) {
        var V = CLUB.visit, sticker = b.getAttribute('data-club-stick');
        b.disabled = true;
        clubCall('club_board_add', { p_link: V.link, p_sticker: sticker }).then(function (r) {
          if (CLUB.visit !== V) { return; }
          if (r.ok && Array.isArray(r.body)) { V.v.board = r.body; V.said = 'Your ' + pzStickerName(sticker) + ' sticker is on ' + (V.v.nick || 'their') + '’s board.'; }
          else { V.said = r.msg; }
          clubVisitDraw();
          var m = $('.room-leave .room-msg', viewEl.visit); if (m) { focusQuiet(m); }
        });
        return;
      }
    }
    if (!clubOn() || !t.closest('.room-share')) { return; }
    var box = t.closest('.room-share');
    if (t.closest('[data-club-nickedit]')) { CLUB.nickEdit = true; CLUB.said = ''; clubShareDraw(); clubVisitDraw(); var inp = $('.room-nickin'); if (inp) { focusQuiet(inp); } return; }
    if (t.closest('[data-club-nickcancel]')) { CLUB.nickEdit = false; clubShareDraw(); clubVisitDraw(); return; }
    if ((b = t.closest('[data-club-share]'))) {
      b.disabled = true;
      if (!roomSaved()) { roomSave(roomGet()); }
      clubRoomSent().then(function () { return clubCall('club_room_link', { p_on: true }); }).then(function (r) {
        if (r.ok && isObj(r.body)) { CLUB.st.room = r.body; clubShareSay('Your link is ready. Send it to a friend.'); } else { clubShareSay(r.msg); }
      });
      return;
    }
    if ((b = t.closest('[data-club-unshare]'))) {
      b.disabled = true;
      clubCall('club_room_link', { p_on: false }).then(function (r) {
        if (r.ok && isObj(r.body)) { CLUB.st.room = r.body; clubShareSay('Sharing is off. The old link no longer opens your room.'); } else { clubShareSay(r.msg); }
      });
      return;
    }
    var url = $('.room-url', box), msg = $('.room-msg', box);
    if (t.closest('[data-club-copy]') && url) { clubCopy(url.value, msg, box); return; }
    if (t.closest('[data-club-send]') && url) {
      try {
        navigator.share({ title: 'My room on SAT Sprint', text: 'Come and see my room.', url: url.value }).then(function () { msg.textContent = 'Sent.'; }, function (err) { if (!err || err.name !== 'AbortError') { clubCopy(url.value, msg, box); } });
      } catch (err) { clubCopy(url.value, msg, box); }
      return;
    }
    if ((b = t.closest('[data-club-unstick]'))) {
      b.disabled = true;
      clubCall('club_board_remove', { p_id: Number(b.getAttribute('data-club-unstick')) }).then(function (r) {
        if (r.ok && Array.isArray(r.body)) { CLUB.st.board = r.body; clubShareSay('The sticker is off your board.'); } else { clubShareSay(r.msg); }
      });
    }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target && e.target.closest ? e.target.closest('[data-club-nickform]') : null;
    if (!f) { return; }
    e.preventDefault();
    var inp = $('.room-nickin', f), msg = $('.room-msg', f), btn = $('button[type="submit"]', f);
    if (!clubOn() || !inp) { return; }
    msg.textContent = 'Saving…'; btn.disabled = true;
    clubCall('club_nick', { p_name: inp.value }).then(function (r) {
      var b = isObj(r.body) ? r.body : null;
      btn.disabled = false;
      if (r.ok && b && b.ok) {
        CLUB.st.nick = b.nick; CLUB.nickEdit = false; CLUB.said = 'Your nickname is saved.';
        if (cur.view === 'visit') { clubVisitDraw(); } else { clubShareDraw(); var m = $('.room-share .room-msg', viewEl.room); if (m) { focusQuiet(m); } }
        return;
      }
      msg.textContent = !r.ok ? r.msg : b && b.why === 'taken' ? 'Someone already has that nickname. Try another.'
        : b && b.why === 'words' ? 'That nickname has a word that is not allowed here. Try another.'
        : 'Use 3 to 20 letters or numbers, with spaces, dots or dashes between them if you like (not a phone number).';
      focusQuiet(inp);
    });
  });

  /* ---------- start: the page opens with the account's last record, so it does not change when the server says the same ---------- */
  (function () {
    if (!acctOn || !A || !A.uid) { return; }
    var o = clubLoad(A.uid);
    if (!isObj(o.st)) { return; }
    CLUB.pend = isObj(o.pend) ? o.pend : {};
    if (clubTake(o.st)) { CLUB.at = 0; }
  }());
