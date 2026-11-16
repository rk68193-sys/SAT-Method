  /* =================== My room (#room): a room in the clubhouse, decorated with the prizes a student has won =================== */
  /* The first part of the clubhouse. On its own it is kept on this device and only the student sees it; signed in to an account
     in the clubhouse, each save is also sent to the account, so it can be shared with a link (club.js: Share my room, #r-).
     Each spot takes one kind of prize, so looks added to the catalog later fit with no change here:
       walls   a theme, which paints the walls and floor      window  a paper as the view outside (with no paper, a living
       s0-s2   three display stands: an aura or an effect             theme's scene, or the sky)
       shelf   up to 3 streak styles, as trophies              board   up to 6 stickers
       plate   the student's name and a title                  me      their figure: a color and a hat
       desk    a calendar with the streak, changed only by practice
     store.s.room, once saved: { v: 1, t: when, w: theme id, win: paper id, st: [3 ids], sh: [ids], bd: [sticker ids], tl: title
     id, av: [color, hat] }, with ids as in PZ_BY and '' for an empty spot. The name on the plate is store.s.chn, the name the
     student signs challenges with. Until the first save the room is made from what the student has on and their rarest
     prizes (roomStart), so it fills up as they win more. roomRoomHTML draws a room from the record alone, so a friend's shared
     room is drawn the same way (clubVisit). */
  var ROOM_STANDS = 3, ROOM_SHELF = 3, ROOM_BOARD = 6;
  var ROOM_COLORS = [['violet', 'Violet', '#8B5CF6'], ['blue', 'Blue', '#3B82F6'], ['teal', 'Teal', '#14B8A6'], ['green', 'Green', '#22C55E'], ['yellow', 'Sunny', '#FACC15'], ['orange', 'Orange', '#F97316'], ['pink', 'Pink', '#EC4899'], ['gray', 'Silver', '#94A3B8']];
  var ROOM_HATS = [['', 'No hat'], ['grad', 'Graduation cap'], ['beanie', 'Beanie'], ['phones', 'Headphones'], ['bow', 'Bow'], ['cap', 'Ball cap']];
  var ROOM_SPOTS = [['walls', 'Walls'], ['window', 'Window'], ['s0', 'Stand 1'], ['s1', 'Stand 2'], ['s2', 'Stand 3'], ['shelf', 'Shelf'], ['board', 'Sticker board'], ['plate', 'Name plate'], ['me', 'You'], ['desk', 'Desk']];
  /* papers drawn for a dark page: the window draws them that way whatever the site is wearing */
  var ROOM_DARKP = { bpgrid: 1, stars: 1, 'const': 1, sky: 1, snow: 1, fireflies: 1, warp: 1, meteors: 1, ufo: 1, whale: 1, rain: 1, gears: 1, 'orbit-view': 1, gyre: 1 };
  /* the walls with no prize theme on them */
  var ROOM_CLASSIC = { paper: '#F3EEE4', card: '#FFFDF8', ink: '#2B2522', line: '#E2D8C6', act: '#6D28D9', act_ink: '#FFFFFF', ok: '#15803D', ok_soft: '#DCFCE7' };
  var ROOM = { edit: false, draft: null, spot: '', said: '' };

  function roomSpotName(id) { var s = ROOM_SPOTS.filter(function (x) { return x[0] === id; })[0]; return s ? s[1] : ''; }
  function roomColor(id) { return ROOM_COLORS.filter(function (c) { return c[0] === id; })[0] || ROOM_COLORS[0]; }
  function roomHat(id) { return ROOM_HATS.filter(function (h) { return h[0] === id; })[0] || ROOM_HATS[0]; }
  function roomHex(h) { h = String(h || '').replace('#', ''); return h.length === 6 ? [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }) : [128, 128, 128]; }
  function roomMix(a, b, t) { var A = roomHex(a), B = roomHex(b); return '#' + A.map(function (v, i) { return ('0' + Math.round(v + (B[i] - v) * t).toString(16)).slice(-2); }).join(''); }
  function roomRank(a, b) { return PZ_TIERS.indexOf(b.tier) - PZ_TIERS.indexOf(a.tier) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0); }
  /* what the student owns of some kinds, the rarest first */
  function roomOwn(kinds) { var own = pzOwned(); return PZ_ITEMS.filter(function (it) { return own[it.id] && kinds.indexOf(it.kind) >= 0; }).sort(roomRank); }
  /* stickers found, the newest first */
  function roomStickers() {
    var P = pz(), seen = {}, out = [];
    function add(k) { if (P.st[k] && !seen[k] && pzStickerName(k)) { seen[k] = 1; out.push(k); } }
    pzOpened().slice().reverse().forEach(function (o) { if (o.sticker) { add(o.sticker); } });
    Object.keys(P.st).forEach(add);
    return out;
  }
  function roomTitles() { return pzTitles().filter(function (t) { return t.have; }); }
  function roomTitleName(id) { var t = roomTitles().filter(function (x) { return x.id === id; })[0]; return t ? t.name : ''; }

  /* ---------- the record ---------- */
  function roomStart() {
    var st = [], sh = [];
    function add(list, n, id) { if (id && list.indexOf(id) < 0 && list.length < n) { list.push(id); } }
    add(st, ROOM_STANDS, pzWorn('aura')); add(st, ROOM_STANDS, pzWorn('fx'));
    roomOwn(['aura', 'fx']).forEach(function (it) { add(st, ROOM_STANDS, it.id); });
    add(sh, ROOM_SHELF, pzWorn('streak'));
    roomOwn(['streak']).forEach(function (it) { add(sh, ROOM_SHELF, it.id); });
    while (st.length < ROOM_STANDS) { st.push(''); }
    return { w: pzWorn('theme'), win: pzWorn('paper'), st: st, sh: sh, bd: roomStickers().slice(0, ROOM_BOARD), tl: pz().eq.title || '', av: ['violet', ''] };
  }
  /* only what this device owns: a saved room keeps working after a prize is gone, with that spot empty */
  function roomClean(r) {
    r = isObj(r) ? r : {};
    var own = pzOwned(), P = pz(), st = [];
    function item(id, kinds) { var it = typeof id === 'string' ? PZ_BY[id] : null; return it && own[id] && kinds.indexOf(it.kind) >= 0 ? id : ''; }
    function list(a, n, f) { var out = []; (Array.isArray(a) ? a : []).forEach(function (x) { var v = f(x); if (v && out.indexOf(v) < 0 && out.length < n) { out.push(v); } }); return out; }
    for (var i = 0; i < ROOM_STANDS; i++) { var id = item(Array.isArray(r.st) ? r.st[i] : '', ['aura', 'fx']); st.push(id && st.indexOf(id) < 0 ? id : ''); }
    var av = Array.isArray(r.av) ? r.av : [];
    return {
      w: item(r.w, ['theme']), win: item(r.win, ['paper']), st: st,
      sh: list(r.sh, ROOM_SHELF, function (x) { return item(x, ['streak']); }),
      bd: list(r.bd, ROOM_BOARD, function (x) { return typeof x === 'string' && P.st[x] && pzStickerName(x) ? x : ''; }),
      tl: typeof r.tl === 'string' && roomTitleName(r.tl) ? r.tl : '',
      av: [roomColor(av[0])[0], roomHat(av[1])[0]],
      nm: typeof r.nm === 'string' ? r.nm : chalMyName()
    };
  }
  function roomSaved() { return isObj(store.s.room) && store.s.room.v === 1; }
  function roomGet() { return roomClean(roomSaved() ? store.s.room : roomStart()); }
  function roomCopy(R) { return { w: R.w, win: R.win, st: R.st.slice(), sh: R.sh.slice(), bd: R.bd.slice(), tl: R.tl, av: R.av.slice(), nm: R.nm }; }
  function roomSave(R) {
    store.s.room = { v: 1, t: Date.now(), w: R.w, win: R.win, st: R.st.slice(), sh: R.sh.slice(), bd: R.bd.slice(), tl: R.tl, av: R.av.slice() };
    store.s.chn = chalName(R.nm);
    save();
    if (clubOn()) { clubRoomPush(); }
  }
  /* two devices' rooms joined (bkMerge): the one saved last */
  function roomMerge(a, b) { if (!isObj(a)) { return b; } if (!isObj(b)) { return a; } return (b.t || 0) > (a.t || 0) ? b : a; }

  /* ---------- drawing a room ---------- */
  function roomPal(R) { var it = R.w ? PZ_BY[R.w] : null; return (it && FX_PAL[it.key]) || ROOM_CLASSIC; }
  function roomVars(R) {
    var p = roomPal(R), dark = fxLum(p.paper) < 0.2, floor = dark ? roomMix(p.card, '#000000', 0.25) : roomMix('#C79A6B', p.paper, 0.12);
    var v = {
      wall: p.paper, wall2: roomMix(p.paper, p.line, dark ? 0.55 : 0.8), trim: dark ? roomMix(p.card, p.line, 0.6) : p.card, trim2: roomMix(p.paper, p.line, dark ? 0.85 : 0.5),
      acc: p.act, acc2: roomMix(p.act, '#000000', 0.28), floor: floor, floor2: roomMix(floor, dark ? '#FFFFFF' : '#000000', dark ? 0.08 : 0.13),
      wood: dark ? '#5C4737' : '#9C6B43', wood2: dark ? '#3E3026' : '#7A5134', wood3: dark ? '#71584A' : '#B9875A'
    };
    return { dark: dark, style: Object.keys(v).map(function (k) { return '--room-' + k + ':' + v[k]; }).join(';') };
  }
  function roomName(nm) { nm = chalName(nm); return nm ? nm + '’s room' : 'My room'; }
  function roomAvatar(av) {
    var c = roomColor(av[0])[2], hat = av[1] || '', belly = roomMix(c, '#FFFFFF', 0.55), edge = roomMix(c, '#000000', 0.38);
    var hats = {
      grad: '<path d="M17 17v7c0 3 6 5 13 5s13-2 13-5v-7l-13 5z" fill="#111827"/><path d="M30 5l24 8-24 8-24-8z" fill="#1F2937"/><path d="M51 13.5v12" stroke="#FACC15" stroke-width="1.6"/><circle cx="51" cy="26.5" r="2.3" fill="#FACC15"/>',
      beanie: '<path d="M10 31c0-13 9-21 20-21s20 8 20 21z" fill="#1E3A8A"/><rect x="8" y="26" width="44" height="7" rx="3.5" fill="#F8FAFC"/><circle cx="30" cy="9" r="4.6" fill="#F8FAFC"/>',
      phones: '<path d="M9 44C9 24 18 13 30 13s21 11 21 31" fill="none" stroke="#111827" stroke-width="3.6" stroke-linecap="round"/><rect x="3" y="36" width="10" height="16" rx="4.5" fill="#F59E0B"/><rect x="47" y="36" width="10" height="16" rx="4.5" fill="#F59E0B"/>',
      bow: '<path d="M39 17l-11-8v16zM39 17l11-8v16z" fill="#F43F5E"/><circle cx="39" cy="17" r="3.6" fill="#BE123C"/>',
      cap: '<path d="M11 31c0-12 8-19 19-19s19 7 19 19z" fill="#DC2626"/><path d="M38 28h19c0 3.5-3 5.5-7 5.5H36z" fill="#B91C1C"/><circle cx="30" cy="12.5" r="2.2" fill="#B91C1C"/>'
    };
    return '<svg class="room-av" viewBox="0 0 60 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><ellipse cx="30" cy="95" rx="21" ry="3.6" fill="rgba(0,0,0,.2)"/>' +
      '<ellipse cx="7.5" cy="62" rx="4.2" ry="7.5" fill="' + c + '" stroke="' + edge + '" stroke-width="1"/><ellipse cx="52.5" cy="62" rx="4.2" ry="7.5" fill="' + c + '" stroke="' + edge + '" stroke-width="1"/>' +
      '<ellipse cx="20" cy="91" rx="7.5" ry="3.8" fill="' + edge + '"/><ellipse cx="40" cy="91" rx="7.5" ry="3.8" fill="' + edge + '"/>' +
      '<path d="M30 16C45 16 52 28 52 46V82Q52 90 44 90H16Q8 90 8 82V46C8 28 15 16 30 16Z" fill="' + c + '" stroke="' + edge + '" stroke-width="1.2"/>' +
      '<ellipse cx="30" cy="68" rx="14.5" ry="15" fill="' + belly + '"/>' +
      '<ellipse cx="22" cy="42" rx="5.4" ry="6.2" fill="#FFFFFF" stroke="' + edge + '" stroke-width=".8"/><ellipse cx="38" cy="42" rx="5.4" ry="6.2" fill="#FFFFFF" stroke="' + edge + '" stroke-width=".8"/>' +
      '<circle cx="23" cy="43.5" r="2.8" fill="#111827"/><circle cx="39" cy="43.5" r="2.8" fill="#111827"/><circle cx="24" cy="42.3" r=".9" fill="#FFFFFF"/><circle cx="40" cy="42.3" r=".9" fill="#FFFFFF"/>' +
      '<ellipse cx="15.5" cy="52" rx="3.6" ry="2.1" fill="#F9A8D4" opacity=".75"/><ellipse cx="44.5" cy="52" rx="3.6" ry="2.1" fill="#F9A8D4" opacity=".75"/>' +
      '<path d="M25.5 52.5Q30 57 34.5 52.5" fill="none" stroke="#111827" stroke-width="1.6" stroke-linecap="round"/>' + (hats[hat] || '') + '</svg>';
  }
  var ROOM_FLOOR = (function () {
    var s = '<svg class="room-floor" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true"><rect width="400" height="100" class="room-f1"/>';
    for (var i = -13; i <= 13; i++) { s += '<path class="room-f2" d="M' + (200 + i * 21) + ' 0L' + (200 + i * 21 * 2.15).toFixed(1) + ' 100"/>'; }
    [17, 39, 66].forEach(function (y, k) { s += '<path class="room-f2 room-fj" d="M0 ' + y + 'H400" style="stroke-dasharray:' + (22 + k * 12) + ' ' + (3 + k * 2) + '"/>'; });
    return s + '<rect width="400" height="16" class="room-f3"/></svg>';
  }());
  function roomDesk(n) {
    return '<svg class="room-desk-art" viewBox="0 0 310 185" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' +
      '<ellipse class="room-glow" cx="104" cy="86" rx="46" ry="9"/>' +
      '<path class="room-lamp" d="M50 85L62 42L93 29"/><ellipse class="room-wood2" cx="50" cy="87" rx="19" ry="4.5"/><circle class="room-bulb" cx="101" cy="48" r="5"/><path class="room-acc" d="M86 24L101 20L120 45Q100 55 80 50Z"/>' +
      '<rect class="room-b1" x="122" y="72" width="62" height="15" rx="2.5"/><rect class="room-b2" x="128" y="58" width="52" height="14" rx="2.5"/><rect class="room-b3" x="120" y="46" width="58" height="12" rx="2.5"/>' +
      '<rect class="room-cup" x="191" y="62" width="20" height="25" rx="3"/><path class="room-pen" d="M196 62l-4-20M202 62l1-22M207 62l6-18"/>' +
      '<rect class="room-cal" x="226" y="30" width="64" height="57" rx="6"/><rect class="room-acc" x="226" y="30" width="64" height="15" rx="6"/><rect class="room-acc" x="226" y="38" width="64" height="7"/>' +
      '<circle class="room-ring" cx="241" cy="30" r="3"/><circle class="room-ring" cx="275" cy="30" r="3"/>' +
      '<text class="room-calnum" x="258" y="73" text-anchor="middle">' + n + '</text><text class="room-callbl" x="258" y="83" text-anchor="middle">' + (n === 1 ? 'DAY' : 'DAYS') + '</text>' +
      '<rect class="room-wood3" x="8" y="87" width="294" height="13" rx="3"/><rect class="room-wood2" x="8" y="100" width="294" height="7"/>' +
      '<rect class="room-wood2" x="22" y="107" width="13" height="76"/><rect class="room-wood" x="198" y="107" width="92" height="76" rx="3"/>' +
      '<rect class="room-wood3" x="206" y="115" width="76" height="27" rx="2.5"/><rect class="room-wood3" x="206" y="148" width="76" height="27" rx="2.5"/>' +
      '<circle class="room-wood2" cx="244" cy="128.5" r="3.2"/><circle class="room-wood2" cx="244" cy="161.5" r="3.2"/></svg>';
  }
  /* "a Rare", "an Epic" */
  function roomTierA(x) { var t = PZ_TIER[x.tier]; return (/^[AEIOU]/.test(t) ? 'an ' : 'a ') + t; }
  /* what is on a spot, in words: for the room's buttons and the list beside it */
  function roomWhat(spot, R, o) {
    var it = function (id) { return id ? PZ_BY[id] : null; }, x;
    if (spot === 'walls') { x = it(R.w); return x ? x.name + ', ' + roomTierA(x) + ' theme' : 'Classic, the plain walls'; }
    if (spot === 'window') { x = it(R.win); var w = it(R.w); return x ? x.name + ', ' + roomTierA(x) + ' paper' : w && FX_LIVING[w.key] ? 'The ' + w.name + ' view, from the walls' : 'The sky'; }
    if (/^s\d$/.test(spot)) { x = it(R.st[+spot.slice(1)]); return x ? x.name + ', ' + roomTierA(x) + ' ' + (x.kind === 'aura' ? 'aura' : 'right-answer effect') : 'Empty'; }
    if (spot === 'shelf') { return R.sh.length ? R.sh.map(function (id) { return PZ_BY[id].name; }).join(', ') : 'Empty'; }
    if (spot === 'board') { return R.bd.length ? plural(R.bd.length, 'sticker') : 'No stickers yet'; }
    if (spot === 'plate') { return roomName(R.nm) + (o.title ? ', ' + o.title : ''); }
    if (spot === 'me') { var h = roomHat(R.av[1]); return roomColor(R.av[0])[1] + (h[0] ? ', with a ' + h[1].toLowerCase() : ''); }
    if (spot === 'desk') { return 'A calendar: ' + plural(o.n, 'day') + ' in a row'; }
    return '';
  }
  /* o: { edit, title, n (days in a row), best, on (the spot tapped) } */
  function roomRoomHTML(R, o) {
    var V = roomVars(R), it = function (id) { return id ? PZ_BY[id] : null; }, html = '', x, i;
    function spot(id, cls, inner) {
      var what = roomWhat(id, R, o), label = o.edit ? (id === 'desk' ? 'Desk: ' + what + '. It changes when you practice.' : 'Change the ' + roomSpotName(id).toLowerCase() + ': now ' + what) : roomSpotName(id) + ': ' + what;
      if (id === 'me') { label = o.edit ? 'Change how you look: now ' + what : 'You: ' + what; }
      return '<button type="button" class="room-spot ' + cls + (o.on === id ? ' room-on' : '') + '" data-room-spot="' + id + '" aria-label="' + esc(label) + '">' + inner + '</button>';
    }
    /* the window: a paper, or the walls' living scene, or the sky */
    var paper = it(R.win), wl = it(R.w), view;
    if (paper) { view = '<span class="room-view pz-pt-' + paper.key + '">' + (FX_PAPER[paper.key] ? '<canvas data-room-scene="paper:' + paper.key + '" aria-hidden="true"></canvas>' : '') + '</span>'; }
    else if (wl && FX_LIVING[wl.key]) { view = '<span class="room-view" style="background:' + roomPal(R).paper + '"><canvas data-room-scene="living:' + wl.key + '" aria-hidden="true"></canvas></span>'; }
    else { view = '<span class="room-view room-sky' + (V.dark ? ' room-night' : '') + '"></span>'; }
    html += spot('walls', 'room-walls', '');
    html += spot('window', 'room-window', view + '<span class="room-panes"></span><span class="room-curt room-l"></span><span class="room-curt room-r"></span><span class="room-sill"></span>');
    html += spot('plate', 'room-plate', '<span class="room-plate-in"><b>' + esc(roomName(R.nm)) + '</b>' + (o.title ? '<small>' + esc(o.title) + '</small>' : '') + '</span>');
    html += spot('board', 'room-board', '<span class="room-cork">' + R.bd.map(function (id, k) { return '<span class="room-stk pz-stk-' + (k % 4) + ' room-k' + k + '">' + esc(pzStickerName(id)) + '</span>'; }).join('') + '</span>');
    var tro = '';
    for (i = 0; i < ROOM_SHELF; i++) { x = it(R.sh[i]); tro += '<span class="room-tro">' + (x ? fxStreakIcon(x.key, Math.max(o.best, 1)) : '') + '</span>'; }
    html += spot('shelf', 'room-shelf', '<span class="room-tros">' + tro + '</span><span class="room-plank"></span>');
    html += spot('desk', 'room-desk', roomDesk(o.n));
    for (i = 0; i < ROOM_STANDS; i++) {
      x = it(R.st[i]);
      var inside = !x ? (o.edit ? '<span class="room-plus" aria-hidden="true">+</span>' : '') : x.kind === 'aura' ? '<canvas data-room-aura="' + x.key + '" aria-hidden="true"></canvas>' : '<span class="pz-ans room-ans"><b>B</b>Correct</span>';
      html += spot('s' + i, 'room-stand room-st' + i + (x ? '' : ' room-none'), '<span class="room-case">' + inside + '</span><span class="room-plinth">' + (x ? '<span class="room-tag"><i class="pz-t-' + x.tier + '"></i>' + esc(x.name) + '</span>' : '') + '</span>');
    }
    html += spot('me', 'room-me', roomAvatar(R.av));
    return '<div class="room-room' + (V.dark ? ' room-dark' : '') + (o.edit ? ' room-edit' : '') + '" style="' + V.style + '" role="group" aria-label="' + esc(roomName(R.nm)) + '">' +
      '<span class="room-wallp" aria-hidden="true"></span><span class="room-wains" aria-hidden="true"></span><span class="room-base" aria-hidden="true"></span>' + ROOM_FLOOR + '<span class="room-rug" aria-hidden="true"></span>' + html + '</div>';
  }
  /* the moving parts: the window's view, and each aura drawn small inside its case */
  function roomScene(cv, make, ink) {
    return fxScene(cv, function (s) {
      var keep = FX_INK, draw; FX_INK = ink;
      try { draw = make(s); } finally { FX_INK = keep; }
      return function (t, dt) { var k = FX_INK; FX_INK = ink; try { draw(t, dt); } finally { FX_INK = k; } };
    }, { fps: 30 });
  }
  function roomAura(cv, key) {
    var A = FX_AURA[key];
    if (!A) { return null; }
    return fxScene(cv, function (s) {
      var v = { ctx: s.ctx, c: s.c, w: 250, h: 190 }, draw = A(v);
      return function (t, dt) {
        var c = s.ctx, k = Math.min(s.w / v.w, s.h / v.h);
        c.save(); c.translate((s.w - v.w * k) / 2, (s.h - v.h * k) / 2); c.scale(k, k);
        try { draw(t, dt); } finally { c.restore(); }
      };
    }, { fps: 30 });
  }
  function roomScenes(root, R) {
    var p = roomPal(R);
    $$('canvas[data-room-scene]', root).forEach(function (cv) {
      var m = /^(paper|living):(.+)$/.exec(cv.getAttribute('data-room-scene')), make = m ? (m[1] === 'paper' ? FX_PAPER[m[2]] : FX_LIVING[m[2]]) : null;
      if (!make) { return; }
      var dark = m[1] === 'paper' ? !!ROOM_DARKP[m[2]] : fxLum(p.paper) < 0.2;
      roomScene(cv, make, { dark: dark, acc: p.act, muted: dark ? '#A5B4CB' : '#62626B' });
    });
    $$('canvas[data-room-aura]', root).forEach(function (cv) { roomAura(cv, cv.getAttribute('data-room-aura')); });
  }

  /* ---------- the panel beside the room: what a spot holds, or, while decorating, what can go there ---------- */
  function roomHow(it) {
    var n = pzOneIn(it).toLocaleString('en-US'), ser = PZ_SER[it.series];
    if (it.series === 'any') { return 'Won in a crate. It can be in any crate, 1 in ' + n + '.'; }
    if (it.series === 'test') { return 'Won in the Test Day crate, which opens in the last week before the test date in a study plan: 1 in ' + n + '.'; }
    return ser ? 'Won in a crate. In the ' + ser.name + ' crate it is 1 in ' + n + '.' : 'Won in a crate.';
  }
  function roomCard(it, extra) {
    return '<div class="room-card"><div class="room-card-pic">' + pzPicture(it, true) + '</div><div class="room-card-t"><p class="room-card-k">' + esc(PZ_KIND[it.kind]) + '</p><h3 class="h3">' + esc(it.name) + '</h3>' +
      '<p class="room-card-m">' + pzTierChip(it.tier) + '</p><p>' + esc(it.what) + '</p><p class="fine">' + esc(roomHow(it)) + (extra || '') + '</p>' +
      (it.kind === 'fx' ? '<p><button class="btn ghost sm" type="button" data-room-play="' + it.key + '">Play it</button></p>' : '') + '</div></div>';
  }
  function roomInfoHTML(spot, R, o) {
    var it = function (id) { return id ? PZ_BY[id] : null; }, x, mine = !ROOM.edit, deco = mine ? ' Press Decorate to change it.' : '';
    var h = '<p class="room-side-k">' + esc(roomSpotName(spot)) + '</p>';
    if (spot === 'walls') { x = it(R.w); return h + (x ? roomCard(x, ' It paints the walls and the floor.') : '<p>Classic walls: cream paint and a wooden floor.</p><p class="fine">A theme you win in a crate paints the walls in its own colors.' + deco + '</p>'); }
    if (spot === 'window') {
      x = it(R.win); var w = it(R.w);
      if (x) { return h + roomCard(x, ' In the window it is the view outside.'); }
      return h + (w && FX_LIVING[w.key] ? '<p>The view comes from the ' + esc(w.name) + ' walls: a living theme shows its scene through the window.</p>' : '<p>Just the sky for now.</p>') + '<p class="fine">Any paper you win can be the view through the window.' + deco + '</p>';
    }
    if (/^s\d$/.test(spot)) {
      x = it(R.st[+spot.slice(1)]);
      return h + (x ? roomCard(x, x.kind === 'fx' ? ' On a stand it plays when someone taps it.' : ' On a stand it glows inside the case.') : '<p>This stand is empty.</p><p class="fine">A stand shows an aura or a right-answer effect you have won.' + deco + '</p>');
    }
    if (spot === 'shelf') {
      if (!R.sh.length) { return h + '<p>The shelf is empty.</p><p class="fine">Streak styles you win stand here as trophies, up to three.' + deco + '</p>'; }
      return h + '<ul class="room-list">' + R.sh.map(function (id) { var t = PZ_BY[id]; return '<li><span class="room-li-pic">' + fxStreakIcon(t.key, Math.max(o.best, 1)) + '</span><span><b>' + esc(t.name) + '</b> ' + pzTierChip(t.tier) + '<span class="fine">' + esc(t.what) + '</span></span></li>'; }).join('') + '</ul>' +
        '<p class="fine">Each trophy shows your best streak, ' + plural(o.best, 'day') + '.</p>';
    }
    if (spot === 'board') {
      if (!R.bd.length) { return h + '<p>No stickers on the board yet.</p><p class="fine">Every crate has a sticker in it. Up to six go on the board.' + deco + '</p>'; }
      return h + '<div class="room-stks">' + R.bd.map(function (id, k) { return '<span class="pz-stk pz-stk-' + (k % 4) + '">' + esc(pzStickerName(id)) + '</span>'; }).join('') + '</div><p class="fine">Every crate has a sticker in it.</p>';
    }
    if (spot === 'plate') {
      var t = roomTitles().filter(function (y) { return y.id === R.tl; })[0];
      return h + '<p><b>' + esc(roomName(R.nm)) + '</b></p>' + (t ? '<p>Title: <b>' + esc(t.name) + '</b>. Earned for this: ' + esc(t.how.charAt(0).toLowerCase() + t.how.slice(1)) + '</p>' : '<p class="fine">Titles are earned by what you do, like practicing 7 days in a row.</p>') + (mine ? '<p class="fine">Press Decorate to change your name or title.</p>' : '');
    }
    if (spot === 'me') { return h + '<p>This is you.</p><p class="fine">' + (mine ? 'Press Decorate to pick a color and a hat.' : 'Pick a color and a hat below.') + '</p>'; }
    if (spot === 'desk') { return h + '<p>The calendar shows your streak: <b>' + plural(o.n, 'day') + ' in a row</b>' + (o.best > o.n ? ', and ' + plural(o.best, 'day') + ' at your best' : '') + '.</p><p class="fine">' + (o.n ? 'Practice today to keep it going.' : 'Answer one question today to start a streak.') + ' <a href="#home">Open Today</a></p>'; }
    return '';
  }
  function roomTile(val, name, pic, on, tier, note, attr) {
    return '<button type="button" class="room-tile" ' + (attr || 'data-room-pick') + '="' + esc(val) + '" aria-pressed="' + (on ? 'true' : 'false') + '"><span class="room-tile-pic">' + pic + '</span><b>' + esc(name) + '</b>' + (tier ? pzTierChip(tier) : '') + (note ? '<span class="room-tile-note">' + esc(note) + '</span>' : '') + '</button>';
  }
  function roomClassicMini() {
    var p = ROOM_CLASSIC;
    return '<span class="pz-mini" style="background:' + p.paper + ';border-color:' + p.line + '" aria-hidden="true"><span class="pz-mini-card" style="background:' + p.card + ';border-color:' + p.line + '"><i style="background:' + p.ink + '"></i><i style="background:' + p.ink + ';width:60%"></i><b style="background:' + p.act + '"></b></span></span>';
  }
  function roomNone(kind) { return '<p class="room-none-msg">You have no ' + kind + ' yet. They come in crates, which you open with coins you earn by studying. <a href="#crates">Open crates</a></p>'; }
  function roomPickHTML(spot, R) {
    var h = '<p class="room-side-k">' + esc(roomSpotName(spot)) + '</p>', tiles = '', list;
    if (spot === 'walls') {
      list = roomOwn(['theme']);
      tiles = roomTile('', 'Classic', roomClassicMini(), !R.w) + list.map(function (it) { return roomTile(it.id, it.name, fxThemeMini(it.key), R.w === it.id, it.tier); }).join('');
      return h + '<p class="fine">A theme paints the walls and the floor.</p><div class="room-tiles">' + tiles + '</div>' + (list.length ? '' : roomNone('themes'));
    }
    if (spot === 'window') {
      list = roomOwn(['paper']);
      var w = R.w ? PZ_BY[R.w] : null, living = w && FX_LIVING[w.key];
      tiles = roomTile('', living ? 'The ' + w.name + ' view' : 'The sky', '<span class="pz-pic ' + (living ? '" style="background:' + roomPal(R).paper : 'room-sky') + '"></span>', !R.win) + list.map(function (it) { return roomTile(it.id, it.name, pzPicture(it), R.win === it.id, it.tier); }).join('');
      return h + '<p class="fine">A paper becomes the view outside.</p><div class="room-tiles">' + tiles + '</div>' + (list.length ? '' : roomNone('papers'));
    }
    if (/^s\d$/.test(spot)) {
      var k = +spot.slice(1);
      list = roomOwn(['aura', 'fx']);
      tiles = roomTile('', 'Empty', '<span class="pz-pic room-tile-empty"></span>', !R.st[k]) + list.map(function (it) { var at = R.st.indexOf(it.id); return roomTile(it.id, it.name, pzPicture(it), at === k, it.tier, at >= 0 && at !== k ? 'On stand ' + (at + 1) : ''); }).join('');
      return h + '<p class="fine">An aura glows in the case. An effect plays when someone taps the stand.</p><div class="room-tiles">' + tiles + '</div>' + (list.length ? '' : roomNone('auras or effects'));
    }
    if (spot === 'shelf') {
      list = roomOwn(['streak']);
      tiles = list.map(function (it) { var at = R.sh.indexOf(it.id); return roomTile(it.id, it.name, '<span class="pz-pic pz-pic-streak">' + fxStreakIcon(it.key, 30) + '</span>', at >= 0, it.tier, at >= 0 ? 'On the shelf' : ''); }).join('');
      return h + '<p class="fine">Pick up to three trophies. Tap one again to take it off.</p>' + (list.length ? '<div class="room-tiles">' + tiles + '</div>' : roomNone('streak styles'));
    }
    if (spot === 'board') {
      list = roomStickers();
      return h + '<p class="fine">Pick up to six stickers. Tap one again to take it off.</p>' + (list.length ? '<div class="room-stks">' + list.map(function (id, i) { return '<button type="button" class="pz-stk pz-stk-' + (i % 4) + ' room-stkb" data-room-pick="' + esc(id) + '" aria-pressed="' + (R.bd.indexOf(id) >= 0 ? 'true' : 'false') + '">' + esc(pzStickerName(id)) + '</button>'; }).join('') + '</div>' : roomNone('stickers'));
    }
    if (spot === 'plate') {
      var T = roomTitles();
      return h + '<label class="room-lbl" for="room-name">Your name</label><input class="room-name" id="room-name" type="text" maxlength="' + CHAL_NAME_MAX + '" autocomplete="nickname" spellcheck="false" value="' + esc(R.nm) + '" placeholder="Leave it empty for “My room”">' +
        '<p class="fine">Use a first name or a nickname. It is also the name on challenges you send.</p>' +
        '<p class="room-lbl">Title</p>' + (T.length ? '<div class="room-chips">' + [{ id: '', name: 'No title' }].concat(T).map(function (t) { return '<button type="button" class="room-chip" data-room-title="' + t.id + '" aria-pressed="' + (R.tl === t.id ? 'true' : 'false') + '">' + esc(t.name) + '</button>'; }).join('') + '</div>' : '<p class="fine">You have no titles yet. Titles are earned by what you do, like practicing 7 days in a row.</p>');
    }
    if (spot === 'me') {
      return h + '<p class="room-lbl">Color</p><div class="room-chips">' + ROOM_COLORS.map(function (c) { return '<button type="button" class="room-sw" data-room-color="' + c[0] + '" aria-pressed="' + (R.av[0] === c[0] ? 'true' : 'false') + '" aria-label="' + c[1] + '" style="background:' + c[2] + '"></button>'; }).join('') + '</div>' +
        '<p class="room-lbl">Hat</p><div class="room-tiles room-hats">' + ROOM_HATS.map(function (x) { return roomTile(x[0], x[1], roomAvatar([R.av[0], x[0]]), R.av[1] === x[0], '', '', 'data-room-hat'); }).join('') + '</div>';
    }
    if (spot === 'desk') { return h + '<p>The calendar on the desk shows your streak. It changes when you practice, so there is nothing to pick here.</p>'; }
    return '';
  }
  function roomModel(R) { var s = habitStreak(); return { edit: ROOM.edit, title: roomTitleName(R.tl), n: s.n, best: s.best, on: ROOM.spot }; }
  function roomSideHTML(R, o) {
    if (ROOM.edit) {
      return '<div class="room-chips room-spots" role="group" aria-label="Spots in the room">' + ROOM_SPOTS.filter(function (s) { return s[0] !== 'desk'; }).map(function (s) { return '<button type="button" class="room-chip" data-room-spot="' + s[0] + '" aria-pressed="' + (ROOM.spot === s[0] ? 'true' : 'false') + '">' + s[1] + '</button>'; }).join('') + '</div>' +
        (ROOM.spot ? roomPickHTML(ROOM.spot, R) : '<p>Tap a spot in your room, or pick one above. What you choose shows in the room straight away; nothing changes for good until you save.</p>');
    }
    if (ROOM.spot) { return roomInfoHTML(ROOM.spot, R, o) + '<p><button class="linkbtn" type="button" data-room-all>Everything in my room</button></p>'; }
    var any = pzOpened().length > 0;
    return (any ? '' : '<div class="room-hello"><p><b>Your room is ready for prizes.</b> You win them in crates, with coins you earn by studying. Your first crate is free once you have practiced on one day.</p><p><a class="btn sm" href="#crates">Open crates</a></p></div>') +
      '<p class="room-side-k">In my room</p><ul class="room-all">' + ROOM_SPOTS.map(function (s) { return '<li><button type="button" class="room-allb" data-room-spot="' + s[0] + '"><b>' + s[1] + '</b><span>' + esc(roomWhat(s[0], R, o)) + '</span></button></li>'; }).join('') + '</ul>';
  }
  function roomBarHTML() {
    if (ROOM.edit) { return '<button class="btn" type="button" id="room-save">Save my room</button><button class="btn ghost" type="button" id="room-cancel">Cancel</button>'; }
    return '<button class="btn" type="button" id="room-edit">Decorate</button><a class="btn ghost" href="#crates">Win more prizes</a>' + (ROOM.said ? '<span class="room-said" role="status">' + esc(ROOM.said) + '</span>' : '');
  }

  /* ---------- the page ---------- */
  function roomCur() { return ROOM.edit && ROOM.draft ? ROOM.draft : roomGet(); }
  function roomDrawRoom() {
    var box = $('#room-box', viewEl.room); if (!box) { return; }
    var R = roomCur();
    box.innerHTML = roomRoomHTML(R, roomModel(R));
    roomScenes(box, R);
  }
  function roomDrawSide() { var el = $('#room-side', viewEl.room); if (el) { var R = roomCur(); el.innerHTML = roomSideHTML(R, roomModel(R)); } }
  function roomDrawBar() { var el = $('#room-bar', viewEl.room); if (el) { el.innerHTML = roomBarHTML(); } }
  function roomDrawAll() { var pg = $('.room-page', viewEl.room); if (pg) { pg.classList.toggle('room-editing', ROOM.edit); } roomDrawRoom(); roomDrawSide(); roomDrawBar(); }
  /* on a phone the room stays at the top while decorating: bring the choices up under it, with the chosen spot's name in view */
  function roomShowSide() {
    var side = $('#room-side', viewEl.room), stage = $('.room-stage', viewEl.room), row = $('.room-spots', viewEl.room), chip = row ? $('[aria-pressed="true"]', row) : null;
    if (chip) { var cr = chip.getBoundingClientRect(), rr = row.getBoundingClientRect(); if (cr.left < rr.left || cr.right > rr.right) { row.scrollLeft = Math.max(0, row.scrollLeft + cr.left - rr.left - 16); } }
    if (!side || !stage || window.innerWidth >= 960) { return; }
    var top = parseFloat(getComputedStyle(stage).top) || 0, y = window.scrollY + side.getBoundingClientRect().top - top - stage.getBoundingClientRect().height - 8;
    if (Math.abs(y - window.scrollY) > 4) { try { window.scrollTo({ top: Math.max(0, y), behavior: FX_REDUCE ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, Math.max(0, y)); } }
  }
  function buildRoom() {
    viewEl.room.innerHTML = '<div class="wrap room-page">' +
      '<header class="room-head"><p class="eyebrow">Clubhouse</p><h2 class="vtitle">My room</h2><p class="lede">A room to show off the prizes you win by studying. Tap anything in it to see what it is, or press Decorate to change it.</p></header>' +
      '<div class="room-main"><div class="room-stage"><div id="room-box"></div><div class="room-bar" id="room-bar"></div></div><div class="room-side" id="room-side" aria-live="polite"></div></div>' +
      '<div id="room-share-box"></div><p class="fine room-foot" id="room-foot">' + esc(roomFoot()) + '</p></div>';
    roomDrawAll();
    clubShareDraw();
  }
  function roomFoot() {
    return clubShow() ? 'Your room is saved in your account. Only people you send its link to can see it, and only while it is shared.'
      : 'Only you can see your room for now. It is saved with the rest of your progress: on this device, in your backup file, and in your account if you sign in.';
  }
  /* a spot was tapped: while decorating, its choices; otherwise what it holds, and an effect plays */
  function roomTap(spot) {
    ROOM.spot = spot; ROOM.said = '';
    $$('.room-spot', viewEl.room).forEach(function (b) { b.classList.toggle('room-on', b.getAttribute('data-room-spot') === spot); });
    roomDrawSide();
    if (ROOM.edit) { roomShowSide(); return; }
    var m = /^s(\d)$/.exec(spot), R = roomCur(), it = m ? PZ_BY[R.st[+m[1]]] : null;
    if (it && it.kind === 'fx') { fxRight(it.key, $('.room-st' + m[1] + ' .room-ans', viewEl.room)); }
  }
  function roomPick(val) {
    var R = ROOM.draft, s = ROOM.spot, m = /^s(\d)$/.exec(s);
    if (!R) { return; }
    if (s === 'walls') { R.w = val; }
    else if (s === 'window') { R.win = val; }
    else if (m) { var k = +m[1], at = val ? R.st.indexOf(val) : -1; if (at >= 0 && at !== k) { R.st[at] = R.st[k]; } R.st[k] = val; }
    else if (s === 'shelf' || s === 'board') {
      var L = s === 'shelf' ? R.sh : R.bd, max = s === 'shelf' ? ROOM_SHELF : ROOM_BOARD, i = L.indexOf(val);
      if (i >= 0) { L.splice(i, 1); } else if (L.length < max) { L.push(val); } else { roomFlash(s === 'shelf' ? 'The shelf holds three. Tap one that is on it to take it off first.' : 'The board holds six. Tap one that is on it to take it off first.'); return; }
    }
    roomDrawRoom(); roomRefresh();
  }
  /* the choices stay where they are, so a long row keeps its place; only what is picked changes */
  function roomRefresh() {
    var side = $('#room-side', viewEl.room), R = ROOM.draft, s = ROOM.spot, m = /^s(\d)$/.exec(s);
    if (!side || !R) { return; }
    $$('[data-room-pick]', side).forEach(function (b) {
      var v = b.getAttribute('data-room-pick'), on = s === 'walls' ? R.w === v : s === 'window' ? R.win === v : m ? R.st[+m[1]] === v : s === 'shelf' ? R.sh.indexOf(v) >= 0 : R.bd.indexOf(v) >= 0;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var note = $('.room-tile-note', b), txt = '';
      if (m && v) { var at = R.st.indexOf(v); txt = at >= 0 && at !== +m[1] ? 'On stand ' + (at + 1) : ''; }
      if (s === 'shelf') { txt = on ? 'On the shelf' : ''; }
      if (txt && !note && b.classList.contains('room-tile')) { b.insertAdjacentHTML('beforeend', '<span class="room-tile-note"></span>'); note = $('.room-tile-note', b); }
      if (note) { note.textContent = txt; note.hidden = !txt; }
    });
    $$('[data-room-title]', side).forEach(function (b) { b.setAttribute('aria-pressed', R.tl === b.getAttribute('data-room-title') ? 'true' : 'false'); });
    $$('[data-room-color]', side).forEach(function (b) { b.setAttribute('aria-pressed', R.av[0] === b.getAttribute('data-room-color') ? 'true' : 'false'); });
    $$('[data-room-hat]', side).forEach(function (b) { var h = b.getAttribute('data-room-hat'); b.setAttribute('aria-pressed', R.av[1] === h ? 'true' : 'false'); $('.room-tile-pic', b).innerHTML = roomAvatar([R.av[0], h]); });
  }
  var roomFlashT = 0;
  function roomFlash(msg) {
    var side = $('#room-side', viewEl.room), el = $('.room-flash', side);
    if (!side) { return; }
    if (!el) { el = document.createElement('p'); el.className = 'room-flash'; el.setAttribute('role', 'status'); side.appendChild(el); }
    el.textContent = msg; clearTimeout(roomFlashT); roomFlashT = setTimeout(function () { if (el.isConnected) { el.remove(); } }, 4000);
  }
  function roomWire() {
    if (roomWire.done) { return; } roomWire.done = true;
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target : null;
      if (!t || !viewEl.room || !viewEl.room.contains(t)) { return; }
      var b, R;
      if (t.closest('#room-edit')) { ROOM.edit = true; ROOM.draft = roomCopy(roomGet()); ROOM.spot = ''; ROOM.said = ''; roomDrawAll(); focusQuiet($('#room-save', viewEl.room)); return; }
      if (t.closest('#room-save')) { roomSave(ROOM.draft || roomGet()); ROOM.edit = false; ROOM.draft = null; ROOM.spot = ''; ROOM.said = 'Your room is saved.'; roomDrawAll(); focusQuiet($('#room-edit', viewEl.room)); return; }
      if (t.closest('#room-cancel')) { ROOM.edit = false; ROOM.draft = null; ROOM.spot = ''; ROOM.said = ''; roomDrawAll(); focusQuiet($('#room-edit', viewEl.room)); return; }
      if (t.closest('[data-room-all]')) { ROOM.spot = ''; $$('.room-spot.room-on', viewEl.room).forEach(function (x) { x.classList.remove('room-on'); }); roomDrawSide(); focusQuiet($('.room-allb', viewEl.room)); return; }
      if ((b = t.closest('[data-room-play]'))) { var card = b.closest('.room-card'), ans = card ? $('.pz-ans', card) : null; if (ans) { fxRight(b.getAttribute('data-room-play'), ans); } return; }
      if ((b = t.closest('[data-room-spot]'))) {
        var from = b.closest('.room-side'), spot = b.getAttribute('data-room-spot');
        roomTap(spot);
        if (from) { focusQuiet($('#room-side [data-room-spot="' + spot + '"]', viewEl.room) || $('#room-side', viewEl.room)); }
        return;
      }
      if (!ROOM.edit || !(R = ROOM.draft)) { return; }
      if ((b = t.closest('[data-room-pick]'))) { roomPick(b.getAttribute('data-room-pick')); return; }
      if ((b = t.closest('[data-room-title]'))) { R.tl = b.getAttribute('data-room-title'); roomDrawRoom(); roomRefresh(); return; }
      if ((b = t.closest('[data-room-color]'))) { R.av[0] = b.getAttribute('data-room-color'); roomDrawRoom(); roomRefresh(); return; }
      if ((b = t.closest('[data-room-hat]'))) { R.av[1] = b.getAttribute('data-room-hat'); roomDrawRoom(); roomRefresh(); }
    });
    /* the name shows on the plate as it is typed; the room itself is not drawn again, so nothing restarts */
    document.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !t.classList || !t.classList.contains('room-name') || !ROOM.draft) { return; }
      ROOM.draft.nm = t.value;
      var b = $('.room-plate-in b', viewEl.room); if (b) { b.textContent = roomName(t.value); }
      var room = $('.room-room', viewEl.room); if (room) { room.setAttribute('aria-label', roomName(t.value)); }
    });
  }
  roomWire();
