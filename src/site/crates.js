  /* =================== The Crates page (#crates): coins, crates, the collection, stickers and titles =================== */
  function pzTierChip(t) { return '<span class="pz-tier pz-t-' + t + '">' + PZ_TIER[t] + '</span>'; }
  function pzOdd(it) { return '<span class="pz-one">1 in ' + pzOneIn(it).toLocaleString('en-US') + '</span>'; }
  function pzPct(v) { return v >= 10 ? v.toFixed(0) + '%' : v >= 1 ? v.toFixed(1).replace(/\.0$/, '') + '%' : v.toFixed(2).replace(/0$/, '') + '%'; }
  /* a picture of a prize: a theme in its own colors, an aura on its plate, the others drawn small */
  function pzPicture(it, big) {
    if (it.kind === 'theme') { return fxThemeMini(it.key); }
    if (it.kind === 'aura') { return '<span class="pz-plate pz-plate-sm' + (big ? ' big' : '') + '"><canvas class="pz-aura" data-pz-aura="' + it.key + '" aria-hidden="true"></canvas><span class="pz-badge">' + PZ_FLAME + '12</span></span>'; }
    if (it.kind === 'streak') { return '<span class="pz-pic pz-pic-streak">' + fxStreakIcon(it.key, it.key === 'plant' ? 100 : 30) + '</span>'; }
    if (it.kind === 'paper') { return '<span class="pz-pic pz-pt pz-pt-' + it.key + '" aria-hidden="true"></span>'; }
    return '<span class="pz-pic pz-pic-fx pz-t-' + it.tier + '-soft" aria-hidden="true"><span class="pz-ans"><b>B</b>Correct</span></span>';
  }

  function pzEarnHTML() {
    var d = pzToday(), mq = null, rq = null, P = null;
    try { mq = qotd('m'); rq = qotd('rw'); } catch (e) { /* no question of the day */ }
    try { P = planGet(); } catch (e) { P = null; }
    function row(done, what, coins, link) { return '<li class="' + (done ? 'done' : '') + '"><span class="pz-ck" aria-hidden="true">' + (done ? '✓' : '') + '</span><span>' + what + (link && !done ? ' · ' + link : '') + '</span><b>+' + coins + '</b></li>'; }
    return '<section class="pz-sec"><h3 class="h3">Earn coins today</h3><ul class="pz-earn">' +
      row(d.qm, 'Math question of the day', PZ_EARN.qotd, mq ? '<a href="#mq-' + mq.id + '">Answer it</a>' : '') +
      row(d.qr, 'Reading &amp; Writing question of the day', PZ_EARN.qotd, rq ? '<a href="#rq-' + rq.id + '">Answer it</a>' : '') +
      row(d.plan, 'Every task on today’s plan', PZ_EARN.plan, P ? '<a href="#plan">Open my plan</a>' : '<a href="#plan">Make a plan</a>') +
      row(d.rev >= PZ_EARN.revMax, 'Say why you missed a question (' + d.rev + ' of ' + PZ_EARN.revMax + ' today)', PZ_EARN.rev + ' each', '') +
      '</ul><p class="fine">A 7, 30 and 100-day streak each give a free crate. A prize you already have turns into ' + PZ_DUPE + ' coins.</p></section>';
  }
  function pzWalletHTML() {
    var n = Math.max(0, pzBalance()), L = pzLuck(), s = habitStreak(), fz = pzFreezes(), pity = pzPityLeft();
    var luck = L > 1 ? '<b>Study luck ×' + L + '</b> from your ' + plural(s.n, 'day') + ' in a row: Legendary and Mythic prizes are ' + (L === 2 ? 'twice' : '1.5 times') + ' as likely.' + (L < 2 ? ' At 30 days they are twice as likely.' : '')
      : 'Practice 7 days in a row for <b>study luck</b>: Legendary and Mythic prizes 1.5 times as likely, and twice as likely at 30 days.';
    return '<section class="pz-wallet" aria-label="Your coins">' +
      '<p class="pz-bal">' + PZ_COIN + '<b>' + n + '</b><span>' + (n === 1 ? 'coin' : 'coins') + '</span></p>' +
      '<p class="pz-luck">' + luck + '</p>' +
      '<p class="fine">An Epic or better is certain within ' + plural(pity, 'more crate') + '.</p>' +
      '<div class="pz-freeze"><p><b>Streak freezes: ' + fz + ' of ' + PZ_FREEZE_MAX + '.</b> One covers a day you miss, so the streak and its luck carry on. It is used on its own.</p>' +
      '<button class="btn ghost sm" type="button" id="pz-buy-freeze"' + (fz >= PZ_FREEZE_MAX || n < PZ_FREEZE ? ' disabled' : '') + '>Buy one · ' + PZ_FREEZE + ' coins</button></div>' +
      '</section>';
  }
  function pzOddsList(series, minTier) {
    var o = pzOdds(minTier, pzLuck());
    return '<ul class="pz-odds">' + PZ_TIERS.filter(function (t) { return o[t] > 0; }).map(function (t) { return '<li>' + pzTierChip(t) + '<span>' + pzPct(o[t]) + '</span></li>'; }).join('') + '</ul>';
  }
  function pzFreeHTML() {
    var g = pzGrants();
    if (!g.length) { return ''; }
    return '<section class="pz-sec"><h3 class="h3">Free crates</h3><div class="pz-grid">' + g.map(function (x) {
      var btns = x.series ? '<button class="btn" type="button" data-pz-grant="' + esc(x.key) + '" data-pz-series="' + x.series + '">Open the ' + esc(PZ_SER[x.series].name) + ' crate</button>'
        : '<p class="fine">Pick a series:</p><div class="pz-pickser">' + PZ_SERIES.filter(function (s) { return s[0] !== 'test'; }).map(function (s) { return '<button class="btn ghost sm" type="button" data-pz-grant="' + esc(x.key) + '" data-pz-series="' + s[0] + '">' + esc(s[1]) + '</button>'; }).join('') + '</div>';
      return '<article class="pz-card pz-free"><h4>' + (x.min === 'c' ? 'Free crate' : 'Free crate: ' + PZ_TIER[x.min] + ' or better') + '</h4><p class="muted">' + esc(x.why) + '</p>' + btns + '</article>';
    }).join('') + '</div></section>';
  }
  function pzSeriesHTML() {
    var bal = pzBalance();
    return '<section class="pz-sec"><h3 class="h3">Crates · ' + PZ_PRICE + ' coins each</h3><p class="fine">Any crate can hold any prize; a series’ own prizes are 3 times as likely in its crate. These odds are exact.</p><div class="pz-grid">' + PZ_SERIES.map(function (s) {
      var id = s[0], test = id === 'test', open = !test || pzTestOpen(), own = PZ_ITEMS.filter(function (it) { return it.series === id; }), have = own.filter(function (it) { return pzOwns(it.id); }).length;
      var btn = !open ? '<p class="fine">Opens 7 days before the test date in <a href="#plan">your plan</a>.</p>'
        : '<button class="btn" type="button" data-pz-open="' + id + '"' + (bal < PZ_PRICE ? ' disabled' : '') + '>Open · ' + PZ_PRICE + ' coins</button>' + (bal < PZ_PRICE ? '<p class="fine">You need ' + (PZ_PRICE - Math.max(0, bal)) + ' more coins.</p>' : '');
      return '<article class="pz-card pz-ser pz-ser-' + id + '"><div class="pz-ser-art" aria-hidden="true">' + pzLockerArt() + '</div><h4>' + esc(s[1]) + '</h4><p class="muted">' + esc(s[2]) + '</p>' +
        '<p class="pz-have">' + have + ' of ' + own.length + ' of its prizes found</p>' + pzOddsList(id, test ? 'e' : 'c') + btn + '</article>';
    }).join('') + '</div></section>';
  }
  function pzLockerArt() { return '<span class="pz-lk"><span class="pz-lk-vents"></span><span class="pz-lk-dial"></span><span class="pz-lk-handle"></span></span>'; }
  function pzCollectionHTML() {
    var own = pzOwned();
    return '<section class="pz-sec" id="pz-collection"><h3 class="h3">Your collection · ' + Object.keys(own).length + ' of ' + PZ_ITEMS.length + '</h3>' + PZ_SLOTS.map(function (sl) {
      var slot = sl[0], worn = pzWorn(slot), items = PZ_ITEMS.filter(function (it) { return it.kind === slot; }).sort(function (a, b) { return PZ_TIERS.indexOf(a.tier) - PZ_TIERS.indexOf(b.tier); });
      var off = slot === 'theme' ? '' : '<button class="linkbtn" type="button" data-pz-wear="' + slot + '" data-pz-id=""' + (worn ? '' : ' disabled') + '>' + (worn ? 'Take it off' : 'Nothing on') + '</button>';
      return '<div class="pz-slot"><div class="pz-slot-h"><h4>' + sl[1] + '</h4>' + off + '</div><div class="pz-items">' + items.map(function (it) {
        var have = !!own[it.id], on = worn === it.id;
        if (!have) { return '<div class="pz-item locked"><span class="pz-pic pz-q" aria-hidden="true">?</span><span class="pz-nm">' + pzTierChip(it.tier) + pzOdd(it) + '</span><span class="fine">In ' + esc(PZ_SER[it.series].name) + '</span></div>'; }
        var act = slot === 'fx' ? '<button class="btn ghost sm" type="button" data-pz-try="' + it.key + '">Try</button>' : '';
        return '<div class="pz-item' + (on ? ' on' : '') + '">' + pzPicture(it) + '<span class="pz-nm"><b>' + esc(it.name) + '</b>' + pzTierChip(it.tier) + '</span><span class="fine">' + esc(it.what) + '</span>' +
          '<span class="pz-acts">' + act + '<button class="btn sm' + (on ? ' ghost' : '') + '" type="button" data-pz-wear="' + slot + '" data-pz-id="' + it.id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + (on ? 'Wearing' : 'Wear') + '</button></span></div>';
      }).join('') + '</div></div>';
    }).join('') + '</section>';
  }
  function pzStickersHTML() {
    return '<section class="pz-sec"><h3 class="h3">Sticker book</h3><p class="fine">Every crate also holds a sticker from its series. Finish a page of 8 for a free crate from that series.</p><div class="pz-pages">' + PZ_SERIES.map(function (s) {
      var page = pzPage(s[0]), n = page.filter(function (x) { return x.have; }).length;
      return '<div class="pz-pg"><p class="pz-pg-h"><b>' + esc(s[1]) + '</b><span class="muted">' + n + ' of ' + page.length + '</span></p><div class="pz-book">' + page.map(function (x, i) {
        return x.have ? '<span class="pz-stk pz-stk-' + (i % 4) + '">' + esc(x.name) + '</span>' : '<span class="pz-stk-q" aria-label="Not found yet">?</span>';
      }).join('') + '</div></div>';
    }).join('') + '</div></section>';
  }
  function pzTitlesHTML() {
    var cur = pz().eq.title || '';
    return '<section class="pz-sec"><h3 class="h3">Titles</h3><p class="fine">Earned by what you do, never found in a crate. The one you pick shows under your streak on Home.</p><ul class="pz-titles">' + pzTitles().map(function (t) {
      return '<li class="' + (t.have ? 'have' : '') + '"><b>' + esc(t.name) + '</b><span class="muted">' + esc(t.how) + '</span>' +
        (t.have ? '<button class="btn sm' + (cur === t.id ? ' ghost' : '') + '" type="button" data-pz-title="' + t.id + '" aria-pressed="' + (cur === t.id ? 'true' : 'false') + '">' + (cur === t.id ? 'Showing' : 'Show it') + '</button>' : '<span class="pz-lockd">Not yet</span>') + '</li>';
    }).join('') + '</ul></section>';
  }
  function buildCrates() {
    pzTick();
    viewEl.crates.innerHTML = '<div class="wrap pz-page">' +
      '<header class="pz-head"><p class="eyebrow">Prizes</p><h2 class="vtitle">Crates</h2><p class="lede">Earn coins by studying, then open crates of looks for the site. Prizes only change how the site looks: every lesson and question stays free and open.</p></header>' +
      '<div class="pz-top">' + pzWalletHTML() + pzEarnHTML() + '</div>' + pzFreeHTML() + pzSeriesHTML() + pzCollectionHTML() + pzStickersHTML() + pzTitlesHTML() +
      '<p class="fine pz-rules">Coins can’t be bought, and no money ever touches a crate. Effects, auras and moving backgrounds never play in a timed module, and stay still on a device set to reduce motion. Coins, prizes and stickers are saved with the rest of your progress, in your backup file and your account.</p>' +
      '</div>';
    fxScan();
  }
  /* ---------- opening a crate, full screen: the locker dial spins, the door swings, then the reveal for the tier ---------- */
  var pzModalOpen = false;
  function pzShowOpen(r) {
    var it = r.item, odds = '1 in ' + pzOneIn(it).toLocaleString('en-US');
    var host = document.createElement('div'); host.className = 'pz-modal'; host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true'); host.setAttribute('aria-label', 'Opening a crate');
    host.innerHTML = '<div class="pz-stage" id="pz-stage"><div class="pz-locker" id="pz-locker"><div class="pz-locker-in"><span class="pz-locker-glow pz-t-' + it.tier + '-soft"></span></div><div class="pz-door">' + '<span class="pz-lk-vents"></span><svg class="pz-dial" viewBox="0 0 52 52" aria-hidden="true">' + pzDialTicks() + '</svg><span class="pz-lk-handle"></span></div></div>' +
      '<div class="pz-prize pz-r-' + it.tier + '" id="pz-prize" role="status"><span class="pz-prize-pic">' + pzPicture(it, true) + '</span><b>' + esc(it.name) + '</b><small>' + esc(PZ_KIND[it.kind]) + '</small><span class="pz-prize-meta">' + pzTierChip(it.tier) + '<span class="pz-one">' + odds + '</span></span>' +
      (r.dupe ? '<p class="pz-dupe">You already have it: +' + PZ_DUPE + ' coins instead.</p>' : '') + (r.sticker ? '<p class="pz-gotstk">Sticker: <b>' + esc(pzStickerName(r.sticker)) + '</b></p>' : '') +
      '<p class="pz-prize-acts">' + (r.dupe ? '' : '<button class="btn" type="button" id="pz-wear-now" data-pz-wear="' + it.kind + '" data-pz-id="' + it.id + '">Wear it</button>') + '<button class="btn ghost" type="button" id="pz-close">Close</button></p></div>' +
      '<button class="linkbtn pz-skip" type="button" id="pz-skip">Skip</button></div>';
    document.body.appendChild(host); pzModalOpen = true;
    var stage = $('#pz-stage', host), prize = $('#pz-prize', host), skipped = false, timers = [];
    function show() { if (prize.classList.contains('show')) { return; } prize.classList.add('show'); $('#pz-skip', host).hidden = true; fxScan(); focusQuiet($('#pz-wear-now', host) || $('#pz-close', host)); }
    function close() { timers.forEach(clearTimeout); host.remove(); pzModalOpen = false; buildCrates(); }
    function skip() { if (skipped) { return; } skipped = true; timers.forEach(clearTimeout); $$('canvas.pz-rv', stage).forEach(function (n) { n.remove(); }); $('#pz-locker', host).classList.add('open'); show(); }
    host.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('#pz-skip')) { skip(); return; }
      if (t.closest('#pz-close')) { close(); return; }
      var w = t.closest('#pz-wear-now'); if (w) { pzEquip(w.getAttribute('data-pz-wear'), w.getAttribute('data-pz-id')); w.textContent = 'Wearing'; w.disabled = true; }
    });
    host.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (prize.classList.contains('show')) { close(); } else { skip(); } } });
    focusQuiet($('#pz-skip', host));
    if (FX_REDUCE) { skip(); return; }
    var dial = $('.pz-dial', host), steps = [540, 160, 430], at = 0;
    steps.forEach(function (deg) { at += 640; timers.push(setTimeout(function () { dial.style.transform = 'rotate(' + deg + 'deg)'; }, at - 640)); });
    timers.push(setTimeout(function () { $('#pz-locker', host).classList.add('open'); }, at));
    timers.push(setTimeout(function () { if (!skipped) { fxReveal(stage, it.tier, it.tier === 'l' || it.tier === 'm' ? odds : '', show); } }, at + 650));
  }
  function pzDialTicks() {
    var t = '<circle class="pz-dl-face" cx="26" cy="26" r="25"/><g class="pz-dl-ticks">';
    for (var i = 0; i < 40; i++) { var a = i * 9 * Math.PI / 180, r1 = i % 5 === 0 ? 18 : 21; t += '<line x1="' + (26 + r1 * Math.sin(a)).toFixed(2) + '" y1="' + (26 - r1 * Math.cos(a)).toFixed(2) + '" x2="' + (26 + 24 * Math.sin(a)).toFixed(2) + '" y2="' + (26 - 24 * Math.cos(a)).toFixed(2) + '"/>'; }
    return t + '</g><circle class="pz-dl-knob" cx="26" cy="26" r="9"/><path class="pz-dl-mark" d="M26 3v7"/>';
  }
  function pzWire() {
    if (pzWire.done) { return; } pzWire.done = true;
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target : null; if (!t || !viewEl.crates || !viewEl.crates.contains(t)) { return; }
      var b;
      if ((b = t.closest('[data-pz-open]'))) { var r = pzOpen(b.getAttribute('data-pz-open')); if (r) { pzShowOpen(r); } return; }
      if ((b = t.closest('[data-pz-grant]'))) { var g = pzOpen(b.getAttribute('data-pz-series'), b.getAttribute('data-pz-grant')); if (g) { pzShowOpen(g); } return; }
      if ((b = t.closest('[data-pz-wear]'))) { var slot = b.getAttribute('data-pz-wear'), id = b.getAttribute('data-pz-id'); pzEquip(slot, b.getAttribute('aria-pressed') === 'true' ? '' : id); buildCrates(); var back = $('[data-pz-wear="' + slot + '"][data-pz-id="' + id + '"]', viewEl.crates); if (back) { focusQuiet(back); } return; }
      if ((b = t.closest('[data-pz-try]'))) { var tile = b.closest('.pz-item'), ans = tile ? $('.pz-ans', tile) : null; if (ans) { fxRight(b.getAttribute('data-pz-try'), ans); } return; }
      if ((b = t.closest('[data-pz-title]'))) { var tid = b.getAttribute('data-pz-title'); pzEquip('title', b.getAttribute('aria-pressed') === 'true' ? '' : tid); buildCrates(); return; }
      if (t.closest('#pz-buy-freeze')) { pzBuyFreeze(); buildCrates(); }
    });
  }
  pzWire();
  /* start once the rest of the page has run: count today's coins, put on the backgrounds, show the coin count */
  setTimeout(function () { try { pzTick(); fxApply(); pzChip(); fxScan(); } catch (e) { /* prizes never stop the page */ } }, 0);
