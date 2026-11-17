  /* =================== Crews (#crew, and #c-<link> to join one): friends who study to build a room together =================== */
  /* The page side of src/account/club-crew.sql. A crew is 2 to 8 signed-in students in the clubhouse: one makes it and owns
     it, and shares its invite link (#c-<32 hex digits>); a friend who opens the link can join, one crew at a time. Each
     practice set or test section a member finishes with 5 or more questions they have not counted for a crew before adds a
     study session to the crew's project, up to 2 a day for each member (crewSet, called by setsNote and the two test pages):
     20 build a study corner, 30 more an aquarium corner, and 40 more turn the whole room Deep Sea. The server keeps it all
     and decides; the page shows its last answer (CREW.v, as club_crew_view makes it) and draws the room from it.
     A finished set waits on the device (CREW_LS: { uid, pend: [{ s, q, t }] }) until the server has answered, so one finished
     offline counts when the account can be reached again; a question counts once, so sending a set twice adds nothing. */
  var CREW_LS = 'sat-sprint-crew';
  /* the three upgrades, in order: [name, with "the", what it is] */
  var CREW_UP = [['Study corner', 'the study corner', 'A bookshelf, a reading lamp and a beanbag.'],
    ['Aquarium corner', 'the aquarium corner', 'A fish tank, with fish, plants and bubbles.'],
    ['Deep Sea room', 'the Deep Sea room', 'The whole room goes under the sea.']];
  var CREW = { uid: '', v: null, at: 0, loading: false, busy: false, link: '', peek: null, said: '', where: '', ask: '', askNick: '', missing: false,
    sending: false, note: { k: 0, html: '' } };
  var CREW_ICON = '<svg class="crew-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8.5" cy="8" r="3.3"/><circle cx="16.5" cy="9" r="2.7"/>' +
    '<path d="M2.8 19.5c.5-3.9 3-6 5.7-6s5.2 2.1 5.7 6z"/><path d="M15.2 19.5c-.2-2-.9-3.7-2-4.9.9-.6 2-1 3.3-1 2.4 0 4.3 1.9 4.7 5.9z"/></svg>';

  /* ---------- words ---------- */
  function crewUp(s, the) { var u = CREW_UP[s - 1]; return u ? u[the ? 1 : 0] : ''; }
  function crewList(a) { a = (a || []).map(function (x) { return String(x || 'Someone'); }); return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function crewUrl(link) { return chalBase() + '#c-' + link; }
  function crewWhy(w, fn) {
    if (w === 'crew') { return fn === 'club_crew_make' || fn === 'club_crew_join' ? 'You’re in a crew already, and you can be in one at a time.' : 'You’re not in this crew anymore.'; }
    return {
      off: 'Crews are switched off for now.', join: 'Sign in again, then try once more.', locked: 'Crews are switched off for this account.', nick: 'Choose a nickname first.',
      name: 'That name can’t be used. Try another: 3 to 24 letters or numbers (spaces, dots, dashes and apostrophes are fine in between), with nothing rude and no contact details or links.',
      closed: 'This invite link doesn’t work anymore. Ask for the new one.', removed: 'You were taken out of this crew, so you can’t join it again.', blocked: 'You can’t join this crew.',
      full: 'This crew is full.', owner: 'Only the crew’s owner can do that.', gone: 'They aren’t in the crew anymore.'
    }[w] || 'That did not work. Try again in a moment.';
  }

  /* ---------- what the server says ---------- */
  function crewForget() {
    if (!isObj(CREW)) { return; }
    CREW.uid = ''; CREW.v = null; CREW.peek = null; CREW.at = 0; CREW.ask = ''; CREW.said = ''; CREW.where = ''; CREW.missing = false;
  }
  /* the student's crew (and the crew an invite link is for), then the page again */
  function crewLoad() {
    if (!clubOn() || CREW.loading) { return; }
    var uid = A.uid, link = CREW.link;
    CREW.loading = true;
    Promise.all([clubCall('club_crew_state'), link ? clubCall('club_crew_peek', { p_link: link }) : null]).then(function (rs) {
      CREW.loading = false;
      if (!acctIn() || !A || A.uid !== uid) { return; }
      var r = rs[0], p = rs[1];
      if (r.missing) { CREW.missing = true; }
      else if (r.ok && isObj(r.body) && r.body.ok) { CREW.v = r.body; CREW.uid = uid; CREW.at = Date.now(); CREW.missing = false; }
      else if (!CREW.v) { CREW.where = 'top'; CREW.said = r.msg || 'That did not work. Try again in a moment.'; }
      if (link === CREW.link && p) { CREW.peek = p.ok && isObj(p.body) ? p.body : { ok: false, why: p.missing ? 'off' : '', msg: p.msg }; }
      /* an invite link opened while this was on its way: ask about that one too */
      if (CREW.link && CREW.link !== link && !CREW.missing) { crewLoad(); return; }
      crewFlush();
      if (cur.view === 'crew') { crewDraw(); }
      crewCardDraw(true);
    }, function () { CREW.loading = false; });
  }
  /* #crew, or an invite link (#c-...): what is known at once, then the server's answer */
  function crewOpen(link) {
    if (CREW.uid && (!A || CREW.uid !== A.uid)) { crewForget(); }
    if (link !== CREW.link) { CREW.peek = null; }
    CREW.link = link || ''; CREW.said = ''; CREW.where = ''; CREW.ask = '';
    crewDraw();
    crewLoad();
  }
  /* a call that changes the crew: the server answers with the whole view (or why not) */
  function crewDo(fn, args, where, done, btn) {
    if (!clubOn() || CREW.busy) { return; }
    var uid = A.uid;
    CREW.busy = true;
    if (btn) { btn.disabled = true; }
    clubCall(fn, args).then(function (r) {
      CREW.busy = false;
      if (!acctIn() || !A || A.uid !== uid) { return; }
      var b = isObj(r.body) ? r.body : null;
      if (r.missing) { CREW.missing = true; crewDraw(); return; }
      CREW.where = where;
      if (r.ok && b && b.ok) {
        CREW.v = b; CREW.at = Date.now(); CREW.ask = '';
        CREW.said = typeof done === 'function' ? done(b) : done;
      } else {
        CREW.said = r.ok ? crewWhy(b && b.why, fn) : r.msg;
        if (b && /^(crew|owner|gone|closed|removed|blocked|full)$/.test(b.why || '')) { crewLoad(); }
      }
      crewDraw();
      var m = $('.crew-said-' + where, viewEl.crew) || $('.crew-said-top', viewEl.crew);
      if (m) { focusQuiet(m); }
    }, function () { CREW.busy = false; if (btn) { btn.disabled = false; } });
  }

  /* ---------- finished sets ---------- */
  /* a set or test section finished (subj: 'm' or 'rw'; ids: the questions answered): kept on the device, then sent */
  function crewSet(subj, ids) {
    var t = Date.now();
    CREW.note = { k: t, html: '' };
    if (!acctOn || !A || !A.uid || CREW.missing) { return; }
    var q = [], seen = {};
    (Array.isArray(ids) ? ids : []).forEach(function (id) { var x = subj + ':' + id; if (!seen[x] && /^[A-Za-z0-9_.:#\/-]{1,40}$/.test(x)) { seen[x] = 1; q.push(x); } });
    var min = CREW.v && CREW.v.min > 0 ? CREW.v.min : 5, c = CREW.v && CREW.uid === A.uid ? CREW.v.crew : null;
    if (q.length < min) {
      /* a short set: said on its results when it would have counted otherwise */
      if (q.length && c && CREW.v.on && c.members.length > 1) { CREW.note.html = CREW_ICON + '<span>This set had ' + plural(q.length, 'question') + '. Sets of ' + min + ' or more add a study session for ' + esc(c.name) + '.</span>'; }
      return;
    }
    var o = crewKept();
    if (o.uid !== A.uid) { o = { uid: A.uid, pend: [] }; }
    o.pend.push({ s: subj, q: q.slice(0, 100), t: t });
    o.pend = o.pend.slice(-6);
    crewKeep(o);
    crewFlush();
  }
  function crewKept() {
    try { var o = JSON.parse(window.localStorage.getItem(CREW_LS) || 'null'); if (isObj(o) && Array.isArray(o.pend)) { return o; } } catch (e) {}
    return { uid: '', pend: [] };
  }
  function crewKeep(o) { try { window.localStorage.setItem(CREW_LS, JSON.stringify(o)); } catch (e) {} }
  /* the sets waiting, one at a time; one the server could not take now waits for the next try (a set over 3 days old is dropped) */
  function crewFlush() {
    if (!isObj(CREW) || CREW.sending || CREW.missing || !clubOn()) { return; }
    var uid = A.uid, o = crewKept();
    if (o.uid !== uid) { return; }
    var n = o.pend.length;
    o.pend = o.pend.filter(function (x) { return isObj(x) && Array.isArray(x.q) && Date.now() - (Number(x.t) || 0) < 3 * 864e5; });
    if (o.pend.length !== n) { crewKeep(o); }
    var x = o.pend[0];
    if (!x) { return; }
    CREW.sending = true;
    clubCall('club_crew_add', { p: { s: x.s, q: x.q } }).then(function (r) {
      CREW.sending = false;
      if (r.missing) { CREW.missing = true; crewKeep({ uid: uid, pend: [] }); return; }
      if (!r.ok && (!r.status || r.status >= 500 || r.status === 401 || r.status === 408 || r.status === 429)) { return; }
      var o2 = crewKept();
      if (o2.uid === uid) { o2.pend = o2.pend.filter(function (y) { return !isObj(y) || y.t !== x.t; }); crewKeep(o2); }
      if (r.ok && isObj(r.body)) { crewAdded(r.body, x.t); }
      if (acctIn() && A && A.uid === uid) { crewFlush(); }
    }, function () { CREW.sending = false; });
  }
  /* the server's answer to a finished set: said on the set's results, or in a toast once the student has moved on */
  function crewAdded(b, k) {
    var v = CREW.v, c = v && A && CREW.uid === A.uid ? v.crew : null, nm = typeof b.name === 'string' && b.name ? b.name : c ? c.name : 'your crew';
    if (b.ok) {
      if (c && c.name === nm) { c.step = b.step; c.n = b.n; c.total += 1; v.today = b.today; }
      CREW.at = 0;
      if (b.built) {
        crewNoteSay(k, '<b>' + esc(nm === 'your crew' ? 'Your crew' : nm) + ' built ' + esc(crewUp(b.built, true)) + '!</b> This set was the study session that finished it. <a href="#crew">See it in your crew’s room</a>',
          [(nm === 'your crew' ? 'Your crew' : nm) + ' built ' + crewUp(b.built, true) + '!', 'Open your crew to see it.']);
      } else {
        var toward = b.goal ? b.n + ' of ' + b.goal + ' toward ' + crewUp(b.step + 1, true) + '.' : 'Every one still counts.';
        crewNoteSay(k, '<b>+1 study session for ' + esc(nm) + '.</b> ' + esc(toward) + ' <a href="#crew">See your crew</a>', ['+1 study session for ' + nm, toward]);
      }
      return;
    }
    var cap = Number(b.cap) || (v ? v.cap : 2), min = Number(b.min) || (v ? v.min : 5);
    if (b.why === 'day') { crewNoteSay(k, 'You’ve added your ' + cap + ' study sessions for ' + esc(nm) + ' today. Sets you finish tomorrow count again.', null); }
    else if (b.why === 'few') {
      var f = Number(b.fresh) || 0;
      crewNoteSay(k, 'This set didn’t add a study session for ' + esc(nm) + ': it had ' + (f ? 'only ' + plural(f, 'question') : 'no questions') + ' you hadn’t counted for a crew before, and a set needs ' + min + '.', null);
    }
    else if (b.why === 'solo') { crewNoteSay(k, 'Study sessions count once ' + esc(nm) + ' has 2 members. <a href="#crew">Invite a friend</a>', null); }
  }
  function crewNoteSay(k, html, toast) {
    var el = CREW.note.k === k ? $('.view:not([hidden]) .crew-note[data-crew-note="' + k + '"]') : null;
    if (CREW.note.k === k) { CREW.note.html = CREW_ICON + '<span>' + html + '</span>'; }
    if (el) { el.innerHTML = CREW.note.html; return; }
    if (toast) { pzToast(toast[0], toast[1], 7000, CREW_ICON); }
  }
  /* the line on a set's results where the answer goes (empty until then, and for a student with no crew) */
  function crewNoteHTML() { return '<p class="crew-note" role="status" aria-live="polite" data-crew-note="' + CREW.note.k + '">' + CREW.note.html + '</p>'; }

  /* ---------- the room ---------- */
  var CREW_STUDY = (function () {
    var C = ['#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2', '#DB2777', '#65A30D'], books = '', k = 0;
    [120, 186, 252].forEach(function (bottom, r) {
      var x = 166;
      for (;;) {
        var w = 8 + (k * 5) % 6, ht = 34 + (k * 11) % 19;
        if (x + w > (r === 1 ? 244 : 286)) { break; }
        books += '<rect x="' + x + '" y="' + (bottom - ht) + '" width="' + w + '" height="' + ht + '" rx="1.5" fill="' + C[k % 8] + '"/><rect x="' + x + '" y="' + (bottom - ht + 6) + '" width="' + w + '" height="2.5" fill="#FFFFFF" opacity=".45"/>';
        x += w + 1.5; k += 1;
        if (k % 7 === 3) { x += 14; }
      }
    });
    return '<svg class="crew-art" viewBox="0 0 300 280" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' +
      '<ellipse class="room-glow" cx="128" cy="118" rx="36" ry="10"/>' +
      '<path class="crew-bean" d="M10 278c-6-34 10-62 46-68 34-5 64 10 70 40 4 18-2 26-10 28z"/><path class="crew-shine" d="M30 236c10-12 30-18 48-14-16 2-32 8-42 20z"/>' +
      '<path class="crew-pole" d="M128 274V112"/><ellipse class="room-wood2" cx="128" cy="276" rx="17" ry="4"/><path class="crew-shade" d="M106 112h44l-9-32h-26z"/>' +
      '<rect class="room-b1" x="94" y="266" width="34" height="9" rx="2"/><rect class="room-b3" x="98" y="257" width="28" height="9" rx="2"/>' +
      '<path class="crew-leaf" d="M249 38c-16-16-32-16-40-8 12 0 26 4 40 8zM251 38c6-20 22-28 34-22-12 4-24 10-34 22zM250 38c-4-16 0-28 8-34 2 10-2 22-8 34z"/><path class="crew-pot" d="M238 36h26l-4 18h-18z"/>' +
      '<rect class="room-wood2" x="152" y="54" width="144" height="226" rx="5"/><rect class="crew-back" x="162" y="64" width="124" height="206" rx="2"/>' + books +
      '<circle class="crew-globe" cx="262" cy="166" r="12"/><path class="crew-land" d="M254 160c4-3 9-2 10 2-3 1-4 4-8 3zM262 172c3-2 7-1 8 2-2 2-6 2-8-2z"/><path class="crew-pole2" d="M262 178v8"/>' +
      '<rect class="room-wood3" x="157" y="120" width="134" height="7" rx="1.5"/><rect class="room-wood3" x="157" y="186" width="134" height="7" rx="1.5"/><rect class="room-wood3" x="157" y="252" width="134" height="7" rx="1.5"/>' +
      '<rect class="room-wood" x="152" y="266" width="144" height="14" rx="3"/></svg>';
  }());
  var CREW_TANK = (function () {
    var fish = function (cls, x, y, body, fin, stripe) {
      return '<g transform="translate(' + x + ' ' + y + ')"><g class="crew-fish ' + cls + '"><path d="M0 0l-12-9v18z" fill="' + fin + '"/><path d="M-3 0c8-12 30-12 38 0-8 12-30 12-38 0z" fill="' + body + '"/>' +
        (stripe ? '<path d="M10-8v16M20-8v16" stroke="' + stripe + '" stroke-width="3.5"/>' : '') + '<circle cx="27" cy="-2" r="2.4" fill="#111827"/></g></g>';
    };
    var bubbles = [[236, 128, 4, 'b1'], [244, 136, 3, 'b2'], [230, 140, 2.5, 'b3'], [76, 136, 3, 'b4']].map(function (b) { return '<circle class="crew-bub crew-' + b[3] + '" cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '"/>'; }).join('');
    return '<svg class="crew-art" viewBox="0 0 300 240" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' +
      '<rect class="room-wood" x="18" y="168" width="264" height="72" rx="4"/><rect class="room-wood3" x="30" y="180" width="114" height="48" rx="3"/><rect class="room-wood3" x="156" y="180" width="114" height="48" rx="3"/>' +
      '<circle class="room-wood2" cx="134" cy="204" r="3.5"/><circle class="room-wood2" cx="166" cy="204" r="3.5"/>' +
      '<rect x="10" y="20" width="280" height="148" rx="6" fill="#38BDF8"/><rect x="10" y="80" width="280" height="88" rx="6" fill="#0E7490" opacity=".55"/>' +
      '<path d="M10 150q35-12 70-2t70 0 70-4 70 4v14a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6z" fill="#E9D5A6"/>' +
      '<path class="crew-weed" d="M40 154c-6-18 6-28 0-46s6-28 2-42" stroke="#16A34A"/><path class="crew-weed crew-w2" d="M56 154c4-14-6-24-1-38" stroke="#22C55E"/>' +
      '<path class="crew-weed crew-w3" d="M264 154c-5-16 6-26 1-44s5-22 1-34" stroke="#15803D"/>' +
      '<path d="M190 154v-34h10v8h8v-8h10v8h8v-8h10v34z" fill="#94A3B8"/><path d="M206 154v-14a6 6 0 0 1 12 0v14z" fill="#334155"/>' +
      fish('crew-f1', 40, 62, '#F97316', '#EA580C', '#FFFFFF') + fish('crew-f2', 90, 100, '#FACC15', '#EAB308', '') + fish('crew-f3', 60, 128, '#3B82F6', '#1D4ED8', '#FDE047') +
      bubbles + '<path d="M22 30h36l-26 112H20z" fill="#FFFFFF" opacity=".14"/>' +
      '<rect x="10" y="20" width="280" height="148" rx="6" fill="none" stroke="#1F2937" stroke-width="5"/><rect x="4" y="12" width="292" height="12" rx="3" fill="#1F2937"/></svg>';
  }());
  var CREW_KELP = '<svg class="crew-kelp" viewBox="0 0 60 200" preserveAspectRatio="none" aria-hidden="true"><path class="crew-weed" d="M18 200c-10-30 12-50 2-80s12-50 4-80" stroke="#0F766E"/>' +
    '<path class="crew-weed crew-w2" d="M38 200c8-26-10-46-2-70s-8-40 0-60" stroke="#14B8A6"/></svg>';
  /* the crew's room: the walls (Deep Sea's once it is built), what is built and what is coming, and the members on the floor */
  function crewRoomHTML(c) {
    var deep = c.step >= 3 && !!PZ_BY['theme:prize-abyss'], R = { w: deep ? 'theme:prize-abyss' : '' }, V = roomVars(R), goals = CREW.v.goals, h = '';
    var fresh = function (s) { return c.seen < s && c.step >= s ? ' crew-new' : ''; };
    h += '<span class="room-wallp"></span><span class="room-wains"></span><span class="room-base"></span>' + ROOM_FLOOR + '<span class="room-rug"></span>';
    h += '<span class="room-window crew-win">' + (deep ? '<span class="room-view" style="background:' + roomPal(R).paper + '"><canvas data-room-scene="living:prize-abyss"></canvas></span>' : '<span class="room-view room-sky"></span>') +
      '<span class="room-panes"></span><span class="room-curt room-l"></span><span class="room-curt room-r"></span><span class="room-sill"></span></span>';
    h += '<span class="room-plate crew-plate"><span class="room-plate-in"><b>' + esc(c.name) + '</b><small>A crew of ' + c.members.length + '</small></span></span>';
    h += c.step >= 1 ? '<span class="crew-study' + fresh(1) + '">' + CREW_STUDY + '</span>' : '<span class="crew-soon crew-study"><span>' + crewUp(1) + '<small>' + goals[0] + ' study sessions</small></span></span>';
    h += c.step >= 2 ? '<span class="crew-tank' + fresh(2) + '">' + CREW_TANK + '</span>' : '<span class="crew-soon crew-tank"><span>' + crewUp(2) + '<small>' + goals[1] + ' more</small></span></span>';
    if (deep) { h += '<span class="crew-deep' + fresh(3) + '"><span class="crew-rays"></span>' + [8, 21, 37, 52, 66, 79, 91].map(function (x, i) { return '<i style="left:' + x + '%;animation-delay:' + (i * 1.3 % 6).toFixed(1) + 's"></i>'; }).join('') + CREW_KELP + CREW_KELP + '</span>'; }
    var n = c.members.length, gap = n > 1 ? Math.min(13, 76 / (n - 1)) : 0;
    c.members.forEach(function (m, i) {
      var x = 50 + (i - (n - 1) / 2) * gap, y = 96 - (i % 2) * 3.5, who = (m[0] || 'Someone') + (m[3] ? ' (you)' : '') + (m[2] ? ', who owns the crew' : '');
      h += '<button type="button" class="crew-fig' + (m[3] ? ' crew-you' : '') + '" data-crew-fig="' + i + '" style="left:' + x.toFixed(1) + '%;top:' + y + '%;z-index:' + Math.round(10 + y) + '" aria-label="' + esc(who) + '">' +
        '<span class="crew-body">' + roomAvatar(m[1], { live: true }) + '</span><span class="crew-tag">' + esc(m[3] ? 'You' : m[0]) + '</span><span class="room-say" hidden></span></button>';
    });
    if (c.seen < c.step) {
      var ups = []; for (var s = c.seen + 1; s <= c.step; s++) { ups.push(crewUp(s, true)); }
      h += '<div class="crew-curtain"><span class="crew-cl"></span><span class="crew-cr"></span><div class="crew-reveal"><p class="crew-rv-k">Something new in your crew’s room</p>' +
        '<p class="crew-rv-t">Your crew built ' + esc(crewList(ups)) + '!</p><button class="btn" type="button" data-crew-reveal>Open the curtain</button></div></div>';
    }
    var built = c.built.map(function (b) { return crewUp(b[0]); });
    return '<div class="room-room crew-room' + (V.dark ? ' room-dark' : '') + (deep ? ' crew-deepsea' : '') + '" style="' + V.style + '" role="group" aria-label="' +
      esc(c.name + ', the crew’s room. ' + (built.length ? 'Built so far: ' + crewList(built) + '.' : 'Nothing is built yet.')) + '">' + h + '</div>';
  }
  function crewScenes() {
    var c = CREW.v && CREW.v.crew, box = viewEl.crew ? $('#crew-box', viewEl.crew) : null;
    if (c && box && c.step >= 3) { roomScenes(box, { w: 'theme:prize-abyss' }); }
  }
  /* the curtain opens on what is new, and the server keeps that this member has seen it */
  function crewReveal() {
    var c = CREW.v && CREW.v.crew, box = viewEl.crew ? $('#crew-box', viewEl.crew) : null, cu = box ? $('.crew-curtain', box) : null;
    if (!c || !cu) { return; }
    c.seen = c.step;
    cu.classList.add('crew-open');
    $$('.crew-study.crew-new, .crew-tank.crew-new', box).forEach(function (el) { el.classList.add('crew-glow'); });
    setTimeout(function () { if (cu.parentNode) { cu.parentNode.removeChild(cu); } }, FX_REDUCE ? 0 : 1400);
    var room = $('.crew-room', box);
    if (room) { room.setAttribute('tabindex', '-1'); focusQuiet(room); }
    clubCall('club_crew_seen', { p_step: c.step });
  }

  /* ---------- the page ---------- */
  function crewPage(head, body, eyebrow) {
    viewEl.crew.innerHTML = '<div class="wrap room-page crew-page"><header class="room-head"><p class="eyebrow">' + (eyebrow || 'Clubhouse') + '</p><h2 class="vtitle">' + head + '</h2>' + body + '</header></div>';
  }
  var CREW_WHAT = 'A crew is a small group of friends, up to 8, who build a room together by studying. Every practice set or test section you finish adds a study session to your crew’s project: 20 build a study corner, 30 more an aquarium corner, and 40 more turn the whole room into a deep-sea room.';
  function crewSaid(where) { return '<p class="room-msg crew-said-' + where + '" role="status" aria-live="polite" tabindex="-1">' + (CREW.where === where ? esc(CREW.said) : '') + '</p>'; }
  function crewDraw() {
    if (!viewEl.crew || cur.view !== 'crew') { return; }
    if (CREW.uid && (!A || CREW.uid !== A.uid)) { crewForget(); }
    var keep = crewHold(), y = window.scrollY, P = CREW.peek, inv = CREW.link && P && P.ok && !P.mine ? P : null;
    if (!acctOn) { crewPage('Crews', '<p class="lede">Crews are not switched on for this copy of the site.</p>'); return; }
    if (!acctIn()) {
      crewPage(CREW.link ? 'You’re invited to join a crew' : 'Crews', '<p class="lede">' + CREW_WHAT + '</p><p>' + (CREW.link ? 'Sign in to see this crew and join it. Then come back to this link.' : 'Sign in to make a crew or join a friend’s.') + '</p>' +
        '<p class="row"><a class="btn" href="#account">Sign in</a></p>');
      return;
    }
    if (!clubOn()) {
      /* CLUB.next is set once the clubhouse has been asked and has not answered */
      crewPage('Crews', CLUB.none ? '<p class="lede">Crews are not switched on for this site yet.</p>' : CLUB.trying || !CLUB.next ? '<p class="lede" role="status">Checking your account…</p>'
        : '<p class="lede">Your account hasn’t answered yet. Check your connection, then try again.</p><p class="row"><button class="btn" type="button" data-crew-retry>Try again</button></p>');
      return;
    }
    if (CLUB.st.blocked) { crewPage('Crews', '<p class="lede">Crews are switched off for this account.</p>'); return; }
    if (CREW.missing) { crewPage('Crews', '<p class="lede">Crews are not switched on for this site yet.</p>'); return; }
    if (!CREW.v) {
      /* asked already, and it did not work: the student says when to try again (so a page with no connection does not keep asking) */
      var stuck = CREW.where === 'top' && CREW.said;
      if (!stuck) { crewLoad(); }
      crewPage('Crews', stuck ? '<p class="lede">' + esc(CREW.said) + '</p><p class="row"><button class="btn" type="button" data-crew-retry>Try again</button></p>' : '<p class="lede" role="status">Opening your crew…</p>');
      return;
    }
    var v = CREW.v, c = v.crew;
    if (!CLUB.st.nick) {
      crewPage(inv ? 'You’re invited to join ' + esc(inv.name) : 'Crews', '<p class="lede">' + (inv ? 'First, choose a nickname. It’s how your crew will see you.' : CREW_WHAT) + '</p>' +
        '<section class="room-share">' + (inv ? '' : '<p>First, choose a nickname. It’s how your crew will see you. A first name or a made-up name is best, never your full name.</p>') + clubNickHTML('') + '</section>');
      crewRestore(keep, y);
      return;
    }
    var top = CREW.where === 'top' && CREW.said ? '<p class="room-flash crew-said-top" role="status" tabindex="-1">' + esc(CREW.said) + '</p>' : '';
    if (!c && CREW.link && !P) { crewPage('Crews', '<p class="lede" role="status">Opening the invite…</p>'); return; }
    if (!c) {
      crewPage(inv ? 'You’re invited to join ' + esc(inv.name) : 'Crews', top + (inv ? '' : '<p class="lede">' + CREW_WHAT + '</p>'), inv ? 'Clubhouse · Crews' : '');
      $('.room-page', viewEl.crew).insertAdjacentHTML('beforeend', (CREW.link ? crewInviteHTML(null) : '') + (inv && !inv.removed && !inv.blocked && !inv.full && v.on ? '' : crewStartHTML()) + (inv ? '<p class="fine room-foot">' + CREW_WHAT + '</p>' : ''));
      crewRestore(keep, y);
      return;
    }
    crewPage(esc(c.name), top + '<p class="lede">Your crew’s room. Every practice set you finish helps build it. Tap anyone in it to say hi.</p>' + (v.on ? '' : '<p class="room-flash">Crews are paused for now, so study sessions don’t count until they’re back.</p>'), 'My crew');
    $('.room-page', viewEl.crew).insertAdjacentHTML('beforeend', (CREW.link && P && !P.mine ? crewInviteHTML(c) : '') +
      '<div class="room-main"><div class="room-stage"><div id="crew-box">' + crewRoomHTML(c) + '</div></div><div class="room-side crew-side">' + crewProjectHTML(c) + crewBuiltHTML(c) + '</div></div>' +
      crewMembersHTML(c) + crewInviteBoxHTML(c) + crewMoreHTML(c));
    crewScenes();
    crewRestore(keep, y);
  }
  /* a name being typed survives the page being drawn again */
  function crewHold() {
    var f = document.activeElement;
    if (!f || !viewEl.crew || !viewEl.crew.contains(f) || f.tagName !== 'INPUT') { return null; }
    return { n: f.name ? 'input[name="' + f.name + '"]' : '.room-nickin', v: f.value, a: f.selectionStart, b: f.selectionEnd };
  }
  function crewRestore(k, y) {
    if (k) {
      var f = $(k.n, viewEl.crew);
      if (f) { f.value = k.v; focusQuiet(f); try { f.setSelectionRange(k.a, k.b); } catch (e) {} }
    }
    if (Math.abs(window.scrollY - y) > 1) { window.scrollTo(0, y); }
  }
  /* an invite link, while the student is not in that crew */
  function crewInviteHTML(c) {
    var P = CREW.peek, h = '<section class="room-share crew-inv" aria-labelledby="crew-inv-h">';
    if (!P) { return h + '<p role="status">Opening the invite…</p></section>'; }
    if (!P.ok) {
      if (P.why === 'closed') { return h + '<h3 class="h3" id="crew-inv-h">This invite link doesn’t work</h3><p>The crew’s owner may have made a new link or turned it off. Ask them to send you the link again.</p></section>'; }
      return h + '<p>' + esc(P.msg || 'That did not work. Try again in a moment.') + '</p></section>';
    }
    var nm = esc(P.name), mem = Array.isArray(P.members) ? P.members : [];
    h += '<h3 class="h3" id="crew-inv-h">' + (c ? 'An invite to ' + nm : 'Join ' + nm + '?') + '</h3><p>' + (mem.length ? 'In it: ' + esc(crewList(mem)) + '.' : '') + '</p>';
    if (P.removed) { return h + '<p>You were taken out of this crew, so you can’t join it again.</p></section>'; }
    if (P.blocked) { return h + '<p>You can’t join this crew.</p></section>'; }
    if (c) { return h + '<p>You’re in ' + esc(c.name) + ', and you can be in one crew at a time. To join ' + nm + ', leave ' + esc(c.name) + ' first: the button is at the bottom of this page.</p></section>'; }
    if (P.full) { return h + '<p>' + nm + ' is full: a crew has up to ' + CREW.v.max + ' members.</p></section>'; }
    if (!CREW.v.on) { return h + '<p>Crews are switched off for now, so no one can join one.</p></section>'; }
    return h + '<p>Join to study together: each practice set you finish helps build your crew’s room. Your crew sees your nickname and your character, and nothing else.</p>' +
      '<p class="row"><button class="btn" type="button" data-crew-join>Join ' + nm + '</button></p>' + crewSaid('inv') + '</section>';
  }
  /* no crew yet: make one */
  function crewStartHTML() {
    if (!CREW.v.on) { return '<section class="room-share"><p>Crews are switched off for now.</p></section>'; }
    return '<section class="room-share" aria-labelledby="crew-make-h"><h3 class="h3" id="crew-make-h">Make a crew</h3>' +
      '<p>You’ll get an invite link to send to friends. Anyone signed in who opens it can join, up to ' + CREW.v.max + ' of you.</p>' +
      '<form class="room-nickf" data-crew-make novalidate><label class="field"><span class="label">Crew name</span><input type="text" class="room-nickin crew-namein" name="crew-make" maxlength="24" autocomplete="off" spellcheck="false"></label>' +
      '<p class="fine">3 to 24 letters or numbers. Spaces, dots, dashes and apostrophes are fine in between. You can change it later.</p>' +
      '<p class="row"><button class="btn" type="submit">Make my crew</button></p>' + crewSaid('make') + '</form>' +
      '<p class="fine">Joining a friend’s crew instead? Open the invite link they sent you.</p></section>';
  }
  function crewProjectHTML(c) {
    var v = CREW.v, goal = v.goals[c.step], h = '';
    if (goal) {
      var at = Math.min(c.n, goal);
      h += '<p class="room-side-k">Now building</p><h3 class="h3">' + crewUp(c.step + 1) + '</h3><p class="fine">' + CREW_UP[c.step][2] + '</p>' +
        '<div class="crew-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + goal + '" aria-valuenow="' + at + '" aria-label="Study sessions toward ' + crewUp(c.step + 1, true) + '"><i style="width:' + Math.round(100 * at / goal) + '%"></i></div>' +
        '<p><b>' + at + ' of ' + goal + '</b> study sessions' + (goal > at ? ', ' + (goal - at) + ' to go.' : '.') + '</p>';
    } else {
      h += '<p class="room-side-k">All built</p><h3 class="h3">Your crew built the whole room</h3><p>' + plural(c.total, 'study session') + ' in all. Every new one still counts.</p>';
    }
    if (c.helpers.length) { h += '<p class="fine">' + (goal ? 'Helping build it: ' : 'Since then: ') + esc(crewList(c.helpers)) + '.</p>'; }
    if (c.members.length < 2) { h += '<p class="room-flash">Study sessions count once your crew has 2 members. Send a friend the invite link below.</p>'; }
    else {
      var t = Math.min(v.today, v.cap);
      h += '<p class="fine">' + (t >= v.cap ? 'You’ve added your ' + v.cap + ' study sessions today. Nice work. More count tomorrow.' : t ? 'You’ve added ' + t + ' of your ' + v.cap + ' study sessions today.' : 'You can add ' + v.cap + ' study sessions today.') + '</p>';
    }
    return h + '<details class="crew-how"><summary>How do study sessions work?</summary><p>Finish a practice set or a test section with at least ' + v.min + ' questions you haven’t counted for a crew before. Each one adds a study session, up to ' + v.cap + ' a day for each of you. The room changes when your crew reaches each goal.</p></details>';
  }
  function crewBuiltHTML(c) {
    if (!c.built.length) { return ''; }
    return '<p class="room-side-k">Built so far</p><ul class="crew-built">' + c.built.slice().reverse().map(function (b) {
      return '<li><b>' + esc(crewUp(b[0])) + '</b><span>Built ' + esc(clubDay(b[1])) + ' after ' + plural(b[2], 'study session') + (b[3].length ? '. ' + esc(crewList(b[3])) + ' helped.' : '.') + '</span></li>';
    }).join('') + '</ul>';
  }
  function crewMembersHTML(c) {
    var h = '<section class="room-share" aria-labelledby="crew-mem-h"><h3 class="h3" id="crew-mem-h">Who’s in ' + esc(c.name) + ' · ' + c.members.length + ' of ' + CREW.v.max + '</h3><ul class="crew-mems">';
    c.members.forEach(function (m) {
      var nick = m[0] || 'Someone', me = m[3] === 1, k = esc(nick);
      h += '<li><span class="crew-mem-pic">' + roomAvatar(m[1]) + '</span><span class="crew-mem-t"><b>' + k + (me ? ' (you)' : '') + '</b>' + (m[2] === 1 ? '<span class="crew-own">Owner</span>' : '') + '</span>';
      if (c.mine && !me) {
        if (CREW.askNick === nick && CREW.ask === 'hand') {
          h += '<span class="crew-ask" role="group" aria-label="Make ' + k + ' the owner?"><span>Make ' + k + ' the owner? They’ll have the invite link and can rename the crew or take someone out. You’ll stay in the crew.</span>' +
            '<span class="row"><button class="btn sm" type="button" data-crew-hand="' + k + '">Make ' + k + ' the owner</button><button class="btn ghost sm" type="button" data-crew-ask="">Cancel</button></span></span>';
        } else if (CREW.askNick === nick && CREW.ask === 'out') {
          h += '<span class="crew-ask" role="group" aria-label="Take ' + k + ' out of the crew?"><span>Take ' + k + ' out of ' + esc(c.name) + '? They won’t be able to join it again.</span>' +
            '<span class="row"><button class="btn sm" type="button" data-crew-out="' + k + '">Take ' + k + ' out</button><button class="btn ghost sm" type="button" data-crew-ask="">Cancel</button></span></span>';
        } else {
          h += '<span class="crew-mem-b"><button class="btn ghost sm" type="button" data-crew-ask="hand" data-crew-nick="' + k + '" aria-label="Make ' + k + ' the owner">Make owner</button>' +
            '<button class="btn ghost sm" type="button" data-crew-ask="out" data-crew-nick="' + k + '" aria-label="Take ' + k + ' out of the crew">Take out</button></span>';
        }
      }
      h += '</li>';
    });
    return h + '</ul>' + crewSaid('mem') + '</section>';
  }
  function crewInviteBoxHTML(c) {
    var v = CREW.v, full = c.members.length >= v.max, h = '<section class="room-share" aria-labelledby="crew-link-h"><h3 class="h3" id="crew-link-h">Invite friends</h3>';
    if (!c.mine) {
      var own = c.members.filter(function (m) { return m[2] === 1; })[0];
      return h + '<p>' + (own ? esc(own[0]) + ', who owns the crew, has' : 'The crew’s owner has') + ' the invite link. Ask them to send it to a friend.' + (full ? ' The crew is full for now.' : '') + '</p></section>';
    }
    if (full) { h += '<p>Your crew is full: ' + v.max + ' is the most a crew can have.</p>'; }
    if (c.link) {
      var share = chalCanShare();
      h += '<p>Anyone signed in who opens this link can join your crew. Send it only to friends.</p><p class="room-link"><input type="text" class="room-url" readonly value="' + esc(crewUrl(c.link)) + '" aria-label="Your crew’s invite link"></p>' +
        '<p class="row">' + (share ? '<button class="btn" type="button" data-crew-send>Send to a friend</button>' : '') + '<button class="btn' + (share ? ' ghost' : '') + '" type="button" data-crew-copy>Copy the link</button></p>';
      if (CREW.ask === 'new') {
        h += '<div class="crew-ask" role="group" aria-label="Make a new link?"><p>Make a new link? The old one will stop working, so friends who haven’t joined yet will need the new one.</p><p class="row"><button class="btn sm" type="button" data-crew-link="on">Make a new link</button><button class="btn ghost sm" type="button" data-crew-ask="">Cancel</button></p></div>';
      } else if (CREW.ask === 'off') {
        h += '<div class="crew-ask" role="group" aria-label="Turn the link off?"><p>Turn the link off? No one new can join until you make a new one. Everyone in the crew stays.</p><p class="row"><button class="btn sm" type="button" data-crew-link="off">Turn it off</button><button class="btn ghost sm" type="button" data-crew-ask="">Cancel</button></p></div>';
      } else {
        h += '<p class="row"><button class="btn ghost sm" type="button" data-crew-ask="new">Make a new link</button><button class="btn ghost sm" type="button" data-crew-ask="off">Turn the link off</button></p>';
      }
    } else {
      h += '<p>The invite link is off, so no one new can join.</p><p class="row"><button class="btn" type="button" data-crew-link="on">Make a link</button></p>';
    }
    return h + crewSaid('link') + '</section>';
  }
  function crewMoreHTML(c) {
    var h = '<section class="room-share" aria-labelledby="crew-more-h"><h3 class="h3" id="crew-more-h">' + (c.mine ? 'Crew settings' : 'Leaving the crew') + '</h3>';
    if (c.mine) {
      h += '<form class="room-nickf" data-crew-rename novalidate><label class="field"><span class="label">Crew name</span><input type="text" class="room-nickin crew-namein" name="crew-name" maxlength="24" autocomplete="off" spellcheck="false" value="' + esc(c.name) + '"></label>' +
        '<p class="row"><button class="btn ghost sm" type="submit">Save the name</button></p>' + crewSaid('name') + '</form>';
    }
    var others = c.members.filter(function (m) { return m[3] !== 1; });
    if (CREW.ask === 'leave') {
      var what = !others.length ? 'You’re the only one in it, so the crew and everything it built will be deleted.' : c.mine ? esc(others[0][0] || 'The next member') + ' will own the crew.' : 'You can join again with an invite link.';
      h += '<div class="crew-ask" role="group" aria-label="Leave the crew?"><p><b>Leave ' + esc(c.name) + '?</b> ' + what + '</p><p class="row"><button class="btn sm" type="button" data-crew-leave>Leave the crew</button><button class="btn ghost sm" type="button" data-crew-ask="">Cancel</button></p></div>';
    } else {
      h += '<p class="row"><button class="btn ghost sm" type="button" data-crew-ask="leave">Leave the crew</button></p>';
    }
    return h + crewSaid('leave') + '</section>';
  }
  /* on My room: the way in (asking the server for the latest when it is over 30 seconds old; fresh: it was just asked) */
  function crewCardHTML(fresh) {
    if (!acctOn || CREW.missing) { return ''; }
    if (!fresh && clubOn() && !CREW.loading && Date.now() - CREW.at > 30000) { crewLoad(); }
    var c = CREW.v && CREW.uid && A && CREW.uid === A.uid ? CREW.v.crew : null, goal = c ? CREW.v.goals[c.step] : 0;
    return '<section class="room-share crew-card" aria-labelledby="crew-card-h"><h3 class="h3" id="crew-card-h">' + (c ? 'My crew: ' + esc(c.name) : 'Build a room with friends') + '</h3>' +
      '<p>' + (c ? (goal ? c.n + ' of ' + goal + ' study sessions toward ' + crewUp(c.step + 1, true) + '.' : 'Your crew built the whole room.') : 'In a crew, up to 8 friends study to build a room together: a study corner, then an aquarium, then the whole room under the sea.') + '</p>' +
      '<p><a class="btn ghost" href="#crew">' + (c ? 'Open my crew' : 'Find out about crews') + '</a></p></section>';
  }
  function crewCardDraw(fresh) { var card = cur.view === 'room' && viewEl.room ? $('.crew-card', viewEl.room) : null; if (card) { card.outerHTML = crewCardHTML(fresh); } }

  /* ---------- taps and forms ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null, b;
    if (!t || !viewEl.crew || !viewEl.crew.contains(t)) { return; }
    if (t.closest('[data-crew-retry]')) { CREW.said = ''; CREW.where = ''; clubAgain(); clubSynced(); crewDraw(); crewLoad(); return; }
    var c = CREW.v && CREW.v.crew;
    if ((b = t.closest('[data-crew-fig]'))) { var m = c ? c.members[Number(b.getAttribute('data-crew-fig'))] : null; if (m) { roomHi(b, roomAvClean(m[1])); } return; }
    if (t.closest('[data-crew-reveal]')) { crewReveal(); return; }
    if ((b = t.closest('[data-crew-ask]'))) {
      CREW.ask = b.getAttribute('data-crew-ask'); CREW.askNick = b.getAttribute('data-crew-nick') || ''; CREW.said = '';
      var back = CREW.ask ? '' : b.closest('li') ? 'mem' : '';
      crewDraw();
      var go = CREW.ask ? $('.crew-ask button', viewEl.crew) : $(back === 'mem' ? '.crew-mems' : '.crew-said-leave', viewEl.crew);
      if (go) { focusQuiet(go); }
      return;
    }
    if ((b = t.closest('[data-crew-join]'))) {
      crewDo('club_crew_join', { p_link: CREW.link }, 'inv', function (v) {
        CREW.link = ''; CREW.peek = null; CREW.where = 'top';
        try { history.replaceState(null, '', location.pathname + location.search + '#crew'); } catch (err) {}
        return 'Welcome to ' + v.crew.name + '! Every practice set you finish now helps build your crew’s room.';
      }, b);
      return;
    }
    if ((b = t.closest('[data-crew-leave]'))) {
      var was = c ? c.name : '';
      crewDo('club_crew_leave', {}, 'leave', function () { CREW.where = 'top'; return 'You left ' + was + '.'; }, b);
      return;
    }
    if ((b = t.closest('[data-crew-link]'))) {
      var on = b.getAttribute('data-crew-link') === 'on', had = !!(c && c.link);
      crewDo('club_crew_link', { p_on: on }, 'link', on ? (had ? 'Your new link is ready. The old one doesn’t work anymore.' : 'Your link is ready. Send it to a friend.') : 'The link is off. No one new can join.', b);
      return;
    }
    if ((b = t.closest('[data-crew-hand]'))) { var hn = b.getAttribute('data-crew-hand'); crewDo('club_crew_hand', { p_nick: hn }, 'mem', hn + ' owns the crew now.', b); return; }
    if ((b = t.closest('[data-crew-out]'))) { var on2 = b.getAttribute('data-crew-out'); crewDo('club_crew_remove', { p_nick: on2 }, 'mem', on2 + ' is out of the crew.', b); return; }
    var box = t.closest('.room-share'), url = box ? $('.room-url', box) : null, msg = box ? $('.room-msg', box) : null;
    if (t.closest('[data-crew-copy]') && url && msg) { clubCopy(url.value, msg, box); return; }
    if (t.closest('[data-crew-send]') && url && msg) {
      try {
        navigator.share({ title: 'Join my crew on SAT Sprint', text: 'Join my crew, and let’s build our room by studying.', url: url.value }).then(function () { msg.textContent = 'Sent.'; }, function (err) { if (!err || err.name !== 'AbortError') { clubCopy(url.value, msg, box); } });
      } catch (err) { clubCopy(url.value, msg, box); }
    }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target && e.target.closest ? e.target.closest('[data-crew-make],[data-crew-rename]') : null;
    if (!f || !viewEl.crew || !viewEl.crew.contains(f)) { return; }
    e.preventDefault();
    var inp = $('.crew-namein', f), name = inp ? inp.value.replace(/[‘’]/g, '\'') : '', btn = $('button[type="submit"]', f);
    if (inp) { inp.blur(); }
    if (f.hasAttribute('data-crew-make')) {
      crewDo('club_crew_make', { p_name: name }, 'make', function (v) { CREW.where = 'top'; return 'Your crew is ready. Send the invite link below to friends so they can join.'; }, btn);
    } else {
      crewDo('club_crew_rename', { p_name: name }, 'name', 'The crew’s name is saved.', btn);
    }
  });
  /* back to the page, or to the tab: the crew's latest, at most every 30 seconds */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { return; }
    crewFlush();
    if (cur.view === 'crew' && clubOn() && Date.now() - CREW.at > 30000) { crewLoad(); }
  });
  window.addEventListener('online', function () { crewFlush(); });
