  /* =================== Prizes: coins, crates and the looks inside them =================== */
  /* Prizes only change how the site looks: no lesson or question is ever locked, and coins are never sold.
     store.s.pz keeps the record in a shape two devices can join without losing or doubling anything (pzMerge, from bkMerge):
       e  coins earned, one key per event: 'qotd.m.2026-11-15' 10, 'plan.2026-11-15' 20, 'rev.2026-11-15' 15, 'dupe.<crate>' 20
       x  coins spent, one key per purchase: 'crate.<crate>' 50, 'freeze.<id>' 30
       o  crates opened: <crate> -> [time, series, prize, tier, duplicate 0/1, sticker]
       g  free crates: <key> -> [time, series or '' for any, lowest tier, why]   ('welcome', 'ms7.<day>', 'ms30.<day>', 'ms100.<day>', 'page.<series>', 'test.<date>')
       fz days a streak freeze covered: '2026-11-14' 1
       st stickers found: <sticker> 1
       eq what this device has on: { fx, aura, paper, streak, title }   (the theme is the Appearance setting)
     Keys use only letters, digits, '.', '-' and '_', the names a backup file may hold (BK_KEY in data.js).
     e, x and st join by the larger value; o, g and fz by union; eq keeps this device's. The balance is e minus x, never stored. */
  var PZ_TIERS = ['c', 'r', 'e', 'l', 'm'];
  var PZ_TIER = { c: 'Common', r: 'Rare', e: 'Epic', l: 'Legendary', m: 'Mythic' };
  var PZ_ODDS = { c: 60, r: 27, e: 10, l: 2.5, m: 0.5 };
  var PZ_PRICE = 50, PZ_FREEZE = 30, PZ_FREEZE_MAX = 2, PZ_DUPE = 20, PZ_PITY = 10, PZ_HOME = 3;
  var PZ_EARN = { qotd: 10, plan: 20, rev: 5, revMax: 4 };
  var PZ_KIND = { theme: 'Theme', fx: 'Right-answer effect', aura: 'Aura', paper: 'Paper', streak: 'Streak style' };
  var PZ_SLOTS = [['theme', 'Themes'], ['fx', 'Right-answer effects'], ['aura', 'Auras'], ['paper', 'Paper'], ['streak', 'Streak styles']];
  var PZ_SERIES = [
    ['pencil', 'Pencil Case', 'Always in stock. Stationery basics.'],
    ['varsity', 'Varsity Locker', 'School spirit, classrooms and math on the board.'],
    ['night', 'Night Shift', 'Dark themes, stars and the black hole.'],
    ['arcade', 'Arcade', 'Neon, sunsets and electricity.'],
    ['seasons', 'Seasons', 'Bright colors that come back every year.'],
    ['test', 'Test Day', 'Opens in the last week before the test date in your plan. Epic or better.']
  ];
  /* [id, name, tier, kind, series, what it does]; a theme's id is its Appearance value */
  var PZ_ITEMS = [
    ['prize-graphite', 'Graphite', 'c', 'theme', 'pencil', 'Warm gray paper and charcoal, like a pencil sketch.'],
    ['prize-highlighter', 'Highlighter', 'c', 'theme', 'pencil', 'Bright yellow buttons and highlights on cream.'],
    ['prize-sunrise', 'Sunrise', 'c', 'theme', 'seasons', 'Peach paper with coral and orange.'],
    ['prize-ocean', 'Ocean', 'c', 'theme', 'seasons', 'Pale aqua with deep teal.'],
    ['prize-library', 'Library', 'r', 'theme', 'varsity', 'Ivory pages and oxblood, like an old reading room.'],
    ['prize-varsity', 'Varsity', 'r', 'theme', 'varsity', 'Navy and gold, in school colors.'],
    ['prize-chalkboard', 'Chalkboard', 'r', 'theme', 'night', 'A dark green board with chalk-yellow accents.'],
    ['prize-blueprint', 'Blueprint', 'r', 'theme', 'night', 'Deep blue drafting paper with white lines.'],
    ['prize-lamplight', 'Lamplight', 'e', 'theme', 'night', 'Midnight navy with a warm desk-lamp glow.'],
    ['prize-arcade', 'Arcade', 'e', 'theme', 'arcade', 'Neon pink and cyan on near-black.'],
    ['prize-aurora', 'Aurora', 'e', 'theme', 'seasons', 'Dark teal with a green-to-violet glow.'],
    ['prize-synthwave', 'Synthwave', 'e', 'theme', 'arcade', 'A living theme: a striped sunset and a neon grid that rolls toward you.'],
    ['prize-inferno', 'Inferno', 'e', 'theme', 'seasons', 'A living theme: embers rise behind the page and the buttons glow like coals.'],
    ['prize-gold', 'Perfect 1600', 'l', 'theme', 'test', 'Black and gold.'],
    ['prize-nebula', 'Nebula', 'l', 'theme', 'night', 'A living theme: violet and blue clouds drift behind the page among the stars.'],
    ['prize-holo', 'Holographic', 'm', 'theme', 'test', 'A living theme: rainbow foil that shifts as it moves, on bright white.'],
    ['lined', 'Lined notebook', 'c', 'paper', 'pencil', 'Blue rules and a red margin behind the page.'],
    ['dots', 'Dot grid', 'c', 'paper', 'pencil', 'A light grid of dots behind the page.'],
    ['graph', 'Graph paper', 'r', 'paper', 'varsity', 'Squares behind the page.'],
    ['plot', 'Plotting', 'r', 'paper', 'varsity', 'Moving: a curve draws itself across graph paper.'],
    ['bpgrid', 'Blueprint grid', 'e', 'paper', 'night', 'Fine and bold grid lines behind the page.'],
    ['stars', 'Starfield', 'e', 'paper', 'night', 'Moving: drifting stars, with a shooting star now and then.'],
    ['eqrain', 'Equation rain', 'e', 'paper', 'varsity', 'Moving: math symbols fall softly down the page.'],
    ['const', 'Constellation', 'l', 'paper', 'night', 'Moving: stars drift and link up whenever two come close.'],
    ['sky', 'Aurora sky', 'l', 'paper', 'seasons', 'Moving: curtains of green and violet light ripple across the page.'],
    ['check', 'Pencil check', 'c', 'fx', 'pencil', 'A check mark draws itself beside your answer.'],
    ['swipe', 'Highlighter swipe', 'c', 'fx', 'pencil', 'A highlighter stroke runs across the right answer.'],
    ['star', 'Gold star', 'r', 'fx', 'varsity', 'A gold star sticker slaps onto your answer.'],
    ['stamp', 'Teacher’s stamp', 'r', 'fx', 'varsity', 'A “Nice!” stamp lands at an angle.'],
    ['sparkle', 'Sparkles', 'r', 'fx', 'pencil', 'A few sparkles pop around your answer.'],
    ['confetti', 'Confetti', 'e', 'fx', 'arcade', 'A short burst of confetti.'],
    ['neon', 'Neon trace', 'e', 'fx', 'arcade', 'A rainbow neon tube races around your answer.'],
    ['lightning', 'Lightning strike', 'e', 'fx', 'arcade', 'The page goes dark and three bolts hit your answer.'],
    ['storm', 'Equation storm', 'e', 'fx', 'varsity', 'Math symbols spiral into your answer, then burst out.'],
    ['fireworks', 'Fireworks', 'l', 'fx', 'test', 'Two fireworks over your answer.'],
    ['golden', 'Golden hour', 'l', 'fx', 'varsity', 'Gold rays turn behind your answer as glitter rises.'],
    ['comet', 'Comet', 'l', 'fx', 'night', 'A comet streaks across the dark and slams into your answer.'],
    ['supernova', 'Supernova', 'm', 'fx', 'test', 'Darkness, a heartbeat, then shockwaves and a rainbow ring.'],
    ['shatter', 'Shatter', 'm', 'fx', 'test', 'Your answer bursts into glowing shards that snap back together.'],
    ['candle', 'Candle', 'c', 'streak', 'pencil', 'A candle burns beside your streak.'],
    ['coffee', 'Coffee cups', 'c', 'streak', 'pencil', 'One cup for every week in a row.'],
    ['books', 'Book stack', 'r', 'streak', 'varsity', 'A book added to the pile every week.'],
    ['rocket', 'Rocket', 'r', 'streak', 'arcade', 'A rocket that climbs as the streak grows.'],
    ['plant', 'Growing plant', 'e', 'streak', 'test', 'A seed that sprouts at 7 days, leafs out at 30 and flowers at 100.'],
    ['glow', 'Soft glow', 'c', 'aura', 'pencil', 'A slow, breathing glow in violet and pink.'],
    ['twinkle', 'Twinkle', 'c', 'aura', 'pencil', 'Stars wink on and off around your streak.'],
    ['orbit', 'Orbit', 'r', 'aura', 'night', 'Three small planets circle your streak.'],
    ['sine', 'Sine ring', 'r', 'aura', 'varsity', 'A ring of light that ripples like a wave.'],
    ['static', 'Static charge', 'e', 'aura', 'arcade', 'Electric arcs crackle and jump around your streak.'],
    ['ember', 'Ember crown', 'e', 'aura', 'seasons', 'Sparks and embers rise like a campfire.'],
    ['spiral', 'Golden spiral', 'e', 'aura', 'night', 'Two arms of the golden-ratio spiral turn, lit from inside.'],
    ['equation', 'Equation orbit', 'l', 'aura', 'varsity', 'Math symbols circle in two rings, glowing as they pass in front.'],
    ['unit', 'Unit circle', 'l', 'aura', 'varsity', 'A radius sweeps the circle while sine and cosine waves stream out.'],
    ['prism', 'Prism', 'l', 'aura', 'arcade', 'A rainbow ring with beams of colored light.'],
    ['infinity', 'Infinity', 'm', 'aura', 'test', 'Two comets trace an endless ∞ with rainbow tails.'],
    ['horizon', 'Event horizon', 'm', 'aura', 'night', 'A black hole: a disk of fire, bent light, stars pulled in.']
  ].map(function (r) { return { id: r[3] + ':' + r[0], key: r[0], name: r[1], tier: r[2], kind: r[3], series: r[4], what: r[5] }; });
  var PZ_BY = {}, PZ_SER = {};
  PZ_ITEMS.forEach(function (it) { PZ_BY[it.id] = it; });
  PZ_SERIES.forEach(function (s) { PZ_SER[s[0]] = { id: s[0], name: s[1], what: s[2] }; });
  /* eight stickers to a series page; finishing a page earns a free crate from that series */
  var PZ_STK = {
    pencil: ['Sharp Pencil', 'Eraser Pro', 'Highlighter Hero', 'Margin Notes', 'Sticky Note', 'Paper Clip', 'Coffee Break', 'Early Bird'],
    varsity: ['Comma Commander', 'Slope Hero', 'Word Nerd', 'Sentence Surgeon', 'Evidence Hunter', 'Main Idea Machine', 'Transition Tamer', 'Honor Roll'],
    night: ['Star Student', 'Moonshot', 'Desk Lamp', 'Deep Focus', 'Quiet Hours', 'North Star', 'Night Sky', 'Constellation Mapper'],
    arcade: ['Back-Solver', 'Plug-In Pro', 'Graphing Wizard', 'Combo Streak', 'Level Up', 'High Score', 'Speed Run', 'Extra Life'],
    seasons: ['First Frost', 'Snow Day Study', 'Spring Bloom', 'Summer Reader', 'Fresh Start', 'Falling Leaves', 'Heatwave Hustle', 'Rainy Day Reps'],
    test: ['Test Day Ready', 'Pencils Down', 'Calm Breath', 'Full Tank', 'Perfect Score', 'Poem Decoder', 'Trap Spotter', 'Unit Circle Survivor']
  };
  var PZ_TITLES = [
    ['week', 'Week Strong', 'Practice 7 days in a row.', function (c) { return c.best >= 7; }],
    ['planner', 'Plan Keeper', 'Finish every task on your study plan on 7 days.', function (c) { return c.plans >= 7; }],
    ['traps', 'Trap Spotter', 'Say why you missed 50 questions.', function (c) { return c.reasons >= 50; }],
    ['module', 'Full Module', 'Finish a timed module in both subjects.', function (c) { return c.mods; }],
    ['collector', 'Collector', 'Win 25 different prizes.', function (c) { return c.owned >= 25; }],
    ['mythic', 'Mythic Finder', 'Win a Mythic prize.', function (c) { return c.mythic; }],
    ['century', 'Century', 'Practice 100 days in a row.', function (c) { return c.best >= 100; }]
  ];

  function pz() {
    var p = store.s.pz;
    if (!isObj(p)) { p = store.s.pz = {}; }
    ['e', 'x', 'o', 'g', 'fz', 'st', 'eq'].forEach(function (k) { if (!isObj(p[k])) { p[k] = {}; } });
    return p;
  }
  function pzSum(o) { var n = 0; Object.keys(o).forEach(function (k) { if (typeof o[k] === 'number' && o[k] > 0) { n += o[k]; } }); return n; }
  function pzBalance() { var P = pz(); return pzSum(P.e) - pzSum(P.x); }
  function pzId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function pzOpened() { var P = pz(); return Object.keys(P.o).map(function (id) { var r = P.o[id]; return Array.isArray(r) && PZ_BY[r[2]] ? { id: id, t: r[0] || 0, series: r[1], item: PZ_BY[r[2]], dupe: !!r[4], sticker: r[5] || '' } : null; }).filter(Boolean).sort(function (a, b) { return a.t - b.t; }); }
  function pzOwned() { var own = {}; pzOpened().forEach(function (o) { own[o.item.id] = 1; }); return own; }
  function pzOwns(id) { return !!pzOwned()[id]; }

  /* two devices' records joined: the larger value for coins and stickers, everything opened or granted from both */
  function pzMerge(a, b) {
    a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
    var out = {};
    ['e', 'x', 'st'].forEach(function (k) {
      var m = {}, A = isObj(a[k]) ? a[k] : {}, B = isObj(b[k]) ? b[k] : {};
      Object.keys(A).concat(Object.keys(B)).forEach(function (id) { var v = Math.max(typeof A[id] === 'number' ? A[id] : 0, typeof B[id] === 'number' ? B[id] : 0); if (v > 0) { m[id] = v; } });
      out[k] = m;
    });
    ['o', 'g', 'fz'].forEach(function (k) { out[k] = bkUnion(isObj(b[k]) ? b[k] : {}, isObj(a[k]) ? a[k] : {}); });
    out.eq = isObj(a.eq) ? a.eq : isObj(b.eq) ? b.eq : {};
    return out;
  }

  /* ---------- odds: each series' own prizes are 3 times as likely in its crate; luck lifts Legendary and Mythic ---------- */
  function pzLuck() { var n = 0; try { n = habitStreak().n; } catch (e) { n = 0; } return n >= 30 ? 2 : n >= 7 ? 1.5 : 1; }
  function pzOdds(minTier, luck) {
    var L = luck || 1, lo = PZ_TIERS.indexOf(minTier || 'c'), o = {}, tot = 0;
    PZ_TIERS.forEach(function (t, i) { var v = i < lo ? 0 : PZ_ODDS[t] * (t === 'l' || t === 'm' ? L : 1); o[t] = v; tot += v; });
    PZ_TIERS.forEach(function (t) { o[t] = tot ? o[t] / tot * 100 : 0; });
    return o;
  }
  function pzWeight(it, series) { return it.series === series ? 3 : 1; }
  function pzChance(it, series, minTier, luck) {
    var o = pzOdds(minTier, luck), pool = PZ_ITEMS.filter(function (x) { return x.tier === it.tier; }), w = 0;
    pool.forEach(function (x) { w += pzWeight(x, series); });
    return o[it.tier] / 100 * pzWeight(it, series) / w;
  }
  /* "1 in N" for a prize, in its own series' crate at plain luck */
  function pzOneIn(it) { var p = pzChance(it, it.series, it.series === 'test' ? 'e' : 'c', 1); return p > 0 ? Math.max(1, Math.round(1 / p)) : 0; }
  function pzDraw(series, minTier, luck) {
    var o = pzOdds(minTier, luck), r = Math.random() * 100, acc = 0, tier = PZ_TIERS[PZ_TIERS.length - 1];
    for (var i = 0; i < PZ_TIERS.length; i++) { acc += o[PZ_TIERS[i]]; if (r < acc && o[PZ_TIERS[i]] > 0) { tier = PZ_TIERS[i]; break; } }
    var pool = PZ_ITEMS.filter(function (x) { return x.tier === tier; }), w = 0;
    pool.forEach(function (x) { w += pzWeight(x, series); });
    var q = Math.random() * w;
    for (var j = 0; j < pool.length; j++) { q -= pzWeight(pool[j], series); if (q < 0) { return pool[j]; } }
    return pool[pool.length - 1];
  }
  /* an Epic or better at least once in every 10 crates */
  function pzPityLeft() {
    var list = pzOpened(), n = 0;
    for (var i = list.length - 1; i >= 0; i--) { if (PZ_TIERS.indexOf(list[i].item.tier) >= 2) { break; } n += 1; }
    return Math.max(1, PZ_PITY - n);
  }

  /* ---------- the Test Day crate: the last week before the test date in the plan ---------- */
  function pzTestDays() { try { var P = planGet(); if (!P || !P.date) { return -1; } var d = parseDay(P.date); return isNaN(d) ? -1 : Math.round((dayStart(d) - dayStart(Date.now())) / 864e5); } catch (e) { return -1; } }
  function pzTestOpen() { var n = pzTestDays(); return n >= 0 && n <= 7; }

  /* ---------- opening ---------- */
  function pzGrants() { var P = pz(); return Object.keys(P.g).filter(function (k) { return Array.isArray(P.g[k]) && !P.o['g.' + k]; }).map(function (k) { var g = P.g[k]; return { key: k, t: g[0] || 0, series: g[1] || '', min: g[2] || 'c', why: g[3] || '' }; }).sort(function (a, b) { return a.t - b.t; }); }
  function pzCanBuy(series) { return !!PZ_SER[series] && pzBalance() >= PZ_PRICE && (series !== 'test' || pzTestOpen()); }
  function pzOpen(series, grantKey) {
    var P = pz(), id, minTier = series === 'test' ? 'e' : 'c';
    if (grantKey) {
      var g = P.g[grantKey];
      if (!Array.isArray(g) || P.o['g.' + grantKey]) { return null; }
      series = g[1] || series; minTier = PZ_TIERS[Math.max(PZ_TIERS.indexOf(minTier), PZ_TIERS.indexOf(g[2] || 'c'))]; id = 'g.' + grantKey;
    } else {
      if (!pzCanBuy(series)) { return null; }
      id = pzId(); P.x['crate.' + id] = PZ_PRICE;
    }
    if (!PZ_SER[series]) { return null; }
    if (pzPityLeft() <= 1 && PZ_TIERS.indexOf(minTier) < 2) { minTier = 'e'; }
    var it = pzDraw(series, minTier, pzLuck()), dupe = pzOwns(it.id) ? 1 : 0, page = PZ_STK[series] || [], stk = page.length ? series + '-' + Math.floor(Math.random() * page.length) : '';
    P.o[id] = [Date.now(), series, it.id, it.tier, dupe, stk];
    if (dupe) { P.e['dupe.' + id] = PZ_DUPE; }
    if (stk) { P.st[stk] = 1; pzPageCheck(series); }
    save(); pzChip();
    return { id: id, item: it, dupe: dupe, sticker: stk, series: series };
  }
  function pzStickerName(id) { var m = /^([a-z]+)-(\d+)$/.exec(id || ''); return m && PZ_STK[m[1]] ? PZ_STK[m[1]][+m[2]] : ''; }
  function pzPage(series) { var P = pz(); return (PZ_STK[series] || []).map(function (n, i) { return { id: series + '-' + i, name: n, have: !!P.st[series + '-' + i] }; }); }
  function pzPageCheck(series) { var P = pz(), page = pzPage(series); if (page.length && page.every(function (s) { return s.have; }) && !P.g['page.' + series]) { P.g['page.' + series] = [Date.now(), series, 'c', 'You finished the ' + PZ_SER[series].name + ' sticker page.']; } }

  /* ---------- streak freezes: bought ahead, used on their own when a missed day would end a streak ---------- */
  function pzFreezes() { var P = pz(), bought = Object.keys(P.x).filter(function (k) { return k.indexOf('freeze.') === 0; }).length; return Math.max(0, bought - Object.keys(P.fz).length); }
  function pzBuyFreeze() { var P = pz(); if (pzBalance() < PZ_FREEZE || pzFreezes() >= PZ_FREEZE_MAX) { return false; } P.x['freeze.' + pzId()] = PZ_FREEZE; save(); pzChip(); return true; }
  function pzFrozen(t) { var P = store.s.pz; return isObj(P) && isObj(P.fz) && !!P.fz[dayKey(t)]; }
  function pzFrozenKeys() { var P = store.s.pz; return isObj(P) && isObj(P.fz) ? Object.keys(P.fz) : []; }
  function pzApplyFreeze() {
    var did = function (t) { var c = dayCount(t); return c[0] + c[1] > 0 || pzFrozen(t); }, today = dayStart(Date.now()), t = dayBefore(today), gap = [];
    if (did(t)) { return false; }
    while (!did(t) && gap.length <= PZ_FREEZE_MAX) { gap.push(t); t = dayBefore(t); }
    if (gap.length > pzFreezes() || !did(t)) { return false; }
    gap.forEach(function (d) { pz().fz[dayKey(d)] = 1; });
    return true;
  }

  /* ---------- free crates for long streaks and the test-day week ---------- */
  function pzMilestones() {
    var P = pz(), changed = false, s = habitStreak();
    if (!P.g.welcome && s.days > 0) { P.g.welcome = [Date.now(), 'pencil', 'c', 'Welcome: your first crate is free.']; changed = true; }
    if (!s.n) { return changed; }
    var end = s.today ? dayStart(Date.now()) : dayBefore(dayStart(Date.now())), start = end;
    for (var i = 1; i < s.n; i++) { start = dayBefore(start); }
    [[7, 'r', 'A 7-day streak.'], [30, 'e', 'A 30-day streak.'], [100, 'l', 'A 100-day streak.']].forEach(function (m) {
      var k = 'ms' + m[0] + '.' + dayKey(start);
      if (s.n >= m[0] && !P.g[k]) { P.g[k] = [Date.now(), '', m[1], m[2]]; changed = true; }
    });
    if (pzTestOpen()) { var pl = planGet(), tk = 'test.' + pl.date; if (!P.g[tk]) { P.g[tk] = [Date.now(), 'test', 'e', 'Your test is this week.']; changed = true; } }
    return changed;
  }

  /* ---------- coins: counted after every save from what the student did today ---------- */
  function pzReasonsSince(t0) {
    var n = 0;
    Object.keys(isObj(store.x) ? store.x : {}).forEach(function (id) { var r = store.x[id]; if (Array.isArray(r) && r[0] && (r[1] || 0) >= t0) { n += 1; } });
    ['t', 'r', 'b'].forEach(function (b) { Object.keys(isObj(store[b]) ? store[b] : {}).forEach(function (id) { var x = store[b][id]; if (isObj(x) && x.cause && (x.at || 0) >= t0) { n += 1; } }); });
    return n;
  }
  function pzToday() {
    var P = pz(), k = dayKey(Date.now());
    return { qm: !!P.e['qotd.m.' + k], qr: !!P.e['qotd.rw.' + k], plan: !!P.e['plan.' + k], rev: Math.round((P.e['rev.' + k] || 0) / PZ_EARN.rev) };
  }
  var pzBusy = false, pzTimer = 0;
  function pzSoon() { if (pzBusy) { return; } clearTimeout(pzTimer); pzTimer = setTimeout(pzTick, 60); }
  function pzTick() {
    if (pzBusy) { return; }
    pzBusy = true;
    try {
      var P = pz(), today = dayKey(Date.now()), changed = false, got = 0, why = '', g0 = Object.keys(P.g).length;
      var earn = function (k, v) { var was = P.e[k] || 0; if (!(was >= v)) { P.e[k] = v; changed = true; got += v - was; why = PZ_WHY[k.split('.')[0]] || why; } };
      try { if (qotdDone('m', qotd('m'))) { earn('qotd.m.' + today, PZ_EARN.qotd); } } catch (e) { /* no question of the day */ }
      try { if (qotdDone('rw', qotd('rw'))) { earn('qotd.rw.' + today, PZ_EARN.qotd); } } catch (e) { /* no question of the day */ }
      try { var pl = planGet(); if (pl) { var pr = planProgress(pl); if (pr.of && pr.done >= pr.of) { earn('plan.' + today, PZ_EARN.plan); } } } catch (e) { /* no plan */ }
      var rv = Math.min(PZ_EARN.revMax, pzReasonsSince(dayStart(Date.now())));
      if (rv) { earn('rev.' + today, rv * PZ_EARN.rev); }
      if (pzApplyFreeze()) { changed = true; }
      if (pzMilestones()) { changed = true; }
      if (changed) { save(); }
      var fresh = Object.keys(P.g).length > g0;
      if (got > 0) { pzToast('+' + got + ' coins', why + (fresh ? ' · and a free crate' : '')); } else if (fresh) { pzToast('A free crate', 'is waiting for you'); }
      pzChip();
    } finally { pzBusy = false; }
  }

  /* ---------- titles, earned on purpose and never in crates ---------- */
  function pzTitleCounts() {
    var s = habitStreak(), P = pz(), own = pzOwned(), mythic = false;
    Object.keys(own).forEach(function (id) { if (PZ_BY[id].tier === 'm') { mythic = true; } });
    var rw = 0; ['t', 'r', 'b'].forEach(function (b) { Object.keys(isObj(store[b]) ? store[b] : {}).forEach(function (id) { var x = store[b][id]; if (isObj(x) && x.cause) { rw += 1; } }); });
    var mx = Object.keys(isObj(store.x) ? store.x : {}).filter(function (id) { return Array.isArray(store.x[id]) && store.x[id][0]; }).length;
    return {
      best: s.best, plans: Object.keys(P.e).filter(function (k) { return k.indexOf('plan.') === 0; }).length, reasons: rw + mx,
      mods: Array.isArray(store.s.modules) && store.s.modules.length > 0 && Array.isArray(store.s.rwmodules) && store.s.rwmodules.length > 0,
      owned: Object.keys(own).length, mythic: mythic
    };
  }
  function pzTitles() { var c = pzTitleCounts(); return PZ_TITLES.map(function (t) { return { id: t[0], name: t[1], how: t[2], have: !!t[3](c) }; }); }
  function pzShownTitle() { var id = pz().eq.title, t = pzTitles().filter(function (x) { return x.id === id && x.have; })[0]; return t ? t.name : ''; }

  /* ---------- wearing prizes ---------- */
  function pzEquip(slot, id) {
    var P = pz();
    if (id && slot !== 'title' && !pzOwns(id)) { return; }
    if (slot === 'theme') { setTheme(id ? PZ_BY[id].key : 'auto'); }
    else { if (id) { P.eq[slot] = id; } else { delete P.eq[slot]; } save(); }
    fxApply();
  }
  function pzWorn(slot) { if (slot === 'theme') { var t = getTheme(), it = PZ_BY['theme:' + t]; return it ? it.id : ''; } var id = pz().eq[slot]; return id && pzOwns(id) ? id : ''; }
  /* owned prize themes, for the Appearance menu (home.js) */
  function pzThemeRows() { var own = pzOwned(); return PZ_ITEMS.filter(function (it) { return it.kind === 'theme' && own[it.id]; }).map(function (it) { var p = fxThemeSwatch(it.key); return [it.key, it.name, PZ_TIER[it.tier] + ' prize', p]; }); }
  /* the right answer was just shown: play the effect the student has on */
  function pzRight(el) { if (!el) { return; } var id = pzWorn('fx'); if (id) { fxRight(PZ_BY[id].key, el); } }
  /* Home's streak number, on its aura plate, with the streak style and the title on show */
  function pzStreakNum(html, s) {
    var aura = pzWorn('aura'), st = pzWorn('streak'), title = pzShownTitle(), icon = st ? fxStreakIcon(PZ_BY[st].key, s.n) : '';
    if (icon) { html = html.replace('<p class="hstreak-n">', '<p class="hstreak-n pz-styled">' + icon); }
    if (title) { html += '<p class="pz-title">' + esc(title) + '</p>'; }
    var n = Math.max(0, pzBalance()), free = pzGrants().length;
    html += '<a class="pz-homecoins" href="#crates">' + PZ_COIN + '<span><b>' + n + '</b> ' + (n === 1 ? 'coin' : 'coins') + (free ? ' · ' + plural(free, 'free crate') : '') + ' · Open crates</span></a>';
    return aura ? '<div class="pz-plate"><canvas class="pz-aura" data-pz-aura="' + PZ_BY[aura].key + '" aria-hidden="true"></canvas>' + html + '</div>' : '<div class="pz-snum">' + html + '</div>';
  }

  /* ---------- the coin count in the top bar ---------- */
  var PZ_FLAME = '<svg class="pz-flame" viewBox="0 0 24 24" aria-hidden="true"><path fill="#FB923C" d="M12 2c2.5 3.5 6.5 6 6.5 11a6.5 6.5 0 0 1-13 0c0-2.6 1.4-4.7 3-6.4.1 2 1 3.4 2.4 3.9C10.6 7.6 10.6 4.6 12 2z"/></svg>';
  var PZ_COIN = '<svg class="pz-coin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="7" class="pz-coin-in"/><path d="M8.6 12.3l2.3 2.3 4.6-4.9" class="pz-coin-ck"/></svg>';
  /* beside the Text size control, and only where it fits on the same line: a top bar that wraps to a second line would
     push the page down and move the buttons under the boxes they open. On a phone the coins show on Home instead. */
  function pzChip() {
    var tb = document.getElementById('theme-btn'), top = document.getElementById('top');
    if (!tb || !top) { return; }
    var wrap = tb.closest('.theme') || tb, a = document.getElementById('pz-chip'), n = Math.max(0, pzBalance());
    if (!wrap.parentNode) { return; }
    if (!a) { a = document.createElement('a'); a.id = 'pz-chip'; a.className = 'tool pz-chip'; a.href = '#crates'; wrap.parentNode.insertBefore(a, wrap); }
    a.innerHTML = PZ_COIN + '<span>' + n + '</span>';
    a.setAttribute('aria-label', plural(n, 'coin') + '. Open crates.');
    a.hidden = true; var h0 = top.offsetHeight; a.hidden = false;
    if (top.offsetHeight > h0 + 2) { a.hidden = true; }
  }
  /* whatever changes the width of the bar's buttons asks again: the window, the fonts arriving, the text size */
  var pzChipT = 0;
  window.addEventListener('resize', function () { clearTimeout(pzChipT); pzChipT = setTimeout(pzChip, 200); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { pzChip(); }); }
  if ('MutationObserver' in window) { new MutationObserver(function () { pzChip(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-size'] }); }

  /* a short note at the bottom when coins come in or a free crate arrives; never during a timed module. It never takes a
     tap, so a button under it still works while it shows. */
  var pzToastT = 0;
  function pzToast(head, why) {
    if (document.querySelector('.view:not([hidden]) .mmwrap')) { return; }
    var el = document.getElementById('pz-toast');
    if (!el) { el = document.createElement('div'); el.id = 'pz-toast'; el.className = 'pz-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = '<p class="pz-toast-in">' + PZ_COIN + '<b>' + esc(head) + '</b>' + (why ? ' <span>' + esc(why) + '</span>' : '') + '</p>';
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(pzToastT); pzToastT = setTimeout(function () { el.classList.remove('show'); }, 3500);
  }
  var PZ_WHY = { qotd: 'Question of the day', plan: 'Today’s plan is done', rev: 'For saying why you missed it' };
