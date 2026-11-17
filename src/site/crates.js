  /* =================== The Crates page (#crates): coins, crates, the collection, stickers and titles =================== */
  function pzTierChip(t) { return '<span class="pz-tier pz-t-' + t + '">' + PZ_TIER[t] + '</span>'; }
  function pzOdd(it) { return '<span class="pz-one">1 in ' + pzOneIn(it).toLocaleString('en-US') + '</span>'; }
  function pzPct(v) { return v >= 10 ? v.toFixed(0) + '%' : v >= 1 ? v.toFixed(1).replace(/\.0$/, '') + '%' : v.toFixed(2).replace(/0$/, '') + '%'; }
  /* a picture of a prize: a theme in its own colors, an aura on its plate, a skin on the student's own character (moving when
     big, as when it is won), the others drawn small */
  function pzPicture(it, big) {
    if (it.kind === 'theme') { return fxThemeMini(it.key); }
    if (it.kind === 'skin') { var av = roomGet().av.slice(); av[2] = it.id; return '<span class="pz-pic pz-pic-skin pz-t-' + it.tier + '-soft' + (big ? ' big' : '') + '" aria-hidden="true">' + budSVG(roomLook(av), { still: !big, cls: big ? 'bud-live' : 'bud-pic' }) + '</span>'; }
    if (it.kind === 'aura') { return '<span class="pz-plate pz-plate-sm' + (big ? ' big' : '') + fxStageCls(it.key) + '"><canvas class="pz-aura" data-pz-aura="' + it.key + '" aria-hidden="true"></canvas><span class="pz-badge">' + PZ_FLAME + '12</span></span>'; }
    if (it.kind === 'streak') { return '<span class="pz-pic pz-pic-streak">' + fxStreakIcon(it.key, { plant: 1, tree: 1, rainbow: 1, lotus: 1, ouroboros: 1, marquee: 1, hearts: 1, xp: 1, banner: 1, tower: 1, sword: 1, owl: 1 }[it.key] ? 100 : 30) + '</span>'; }
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
    var luck = L > 1 ? '<b>Study luck ×' + L + '</b> from your ' + plural(s.n, 'day') + ' in a row: Legendary, Mythic and Radiant prizes are ' + (L === 2 ? 'twice' : '1.5 times') + ' as likely.' + (L < 2 ? ' At 30 days they are twice as likely.' : '')
      : 'Practice 7 days in a row for <b>study luck</b>: Legendary, Mythic and Radiant prizes 1.5 times as likely, and twice as likely at 30 days.';
    return '<section class="pz-wallet" aria-label="Your coins">' +
      '<p class="pz-bal">' + PZ_COIN + '<b>' + pzNum(n) + '</b><span>' + (n === 1 ? 'coin' : 'coins') + '</span></p>' +
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
    return '<section class="pz-sec"><h3 class="h3">Crates · ' + PZ_PRICE + ' coins each</h3><p class="fine">Any crate can hold any prize; a series’ own prizes are 3 times as likely in its crate, and the Seasons prizes in season 6 times. These odds are exact.</p><div class="pz-grid">' + PZ_SERIES.map(function (s) {
      var id = s[0], test = id === 'test', open = !test || pzTestOpen(), own = PZ_ITEMS.filter(function (it) { return it.series === id; }), have = own.filter(function (it) { return pzOwns(it.id); }).length;
      var btn = !open ? '<p class="fine">Opens 7 days before the test date in <a href="#plan">your plan</a>.</p>'
        : '<button class="btn" type="button" data-pz-open="' + id + '"' + (bal < PZ_PRICE ? ' disabled' : '') + '>Open · ' + PZ_PRICE + ' coins</button>' + (bal < PZ_PRICE ? '<p class="fine">You need ' + (PZ_PRICE - Math.max(0, bal)) + ' more coins.</p>' : '');
      return '<article class="pz-card pz-ser pz-ser-' + id + '"><div class="pz-ser-art" aria-hidden="true">' + pzLockerArt() + '</div><h4>' + esc(s[1]) + '</h4><p class="muted">' + esc(s[2]) + '</p>' + (id === 'seasons' ? pzSeasonLine() : '') +
        '<p class="pz-have">' + have + ' of ' + own.length + ' of its prizes found</p>' + pzOddsList(id, test ? 'e' : 'c') + btn + '</article>';
    }).join('') + '</div></section>';
  }
  function pzSeasonLine() { var S = pzSeason(); return '<p class="pz-season pz-season-' + S[0] + '"><b>In season now · ' + S[1] + ':</b> ' + S[3].map(function (id) { return esc(PZ_BY[id].name); }).join(', ') + '</p>'; }
  function pzLockerArt() { return '<span class="pz-lk"><span class="pz-lk-vents"></span><span class="pz-lk-dial"></span><span class="pz-lk-handle"></span></span>'; }
  function pzCollectionHTML() {
    var own = pzOwned();
    return '<section class="pz-sec" id="pz-collection"><h3 class="h3">Your collection · ' + Object.keys(own).length + ' of ' + PZ_ITEMS.length + '</h3><p class="fine">Put your favorites on show in <a href="#room">your room</a>.</p>' + PZ_SLOTS.map(function (sl) {
      var slot = sl[0], worn = pzWorn(slot), items = PZ_ITEMS.filter(function (it) { return it.kind === slot; }).sort(function (a, b) { return PZ_TIERS.indexOf(a.tier) - PZ_TIERS.indexOf(b.tier); });
      var off = slot === 'theme' ? '' : '<button class="linkbtn" type="button" data-pz-wear="' + slot + '" data-pz-id=""' + (worn ? '' : ' disabled') + '>' + (worn ? 'Take it off' : 'Nothing on') + '</button>';
      return '<div class="pz-slot"><div class="pz-slot-h"><h4>' + sl[1] + '</h4>' + off + '</div><div class="pz-items">' + items.map(function (it) {
        var have = !!own[it.id], on = worn === it.id;
        var season = pzInSeason(it.id) ? ' <span class="pz-inseason">In season</span>' : '';
        if (!have) { return '<div class="pz-item locked"><span class="pz-pic pz-q" aria-hidden="true">?</span><span class="pz-nm">' + pzTierChip(it.tier) + pzOdd(it) + '</span><span class="fine">' + (PZ_SER[it.series] ? 'In ' + esc(PZ_SER[it.series].name) : 'In any crate') + season + '</span></div>'; }
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
      '<p class="fine pz-rules">Coins can’t be bought, and no money ever touches a crate. Effects, auras and moving backgrounds never play in a timed module, and stay still on a device set to reduce motion. ' +
      (clubShow() ? 'Coins, prizes and stickers are kept in your account, the same on every device you sign in to.' : 'Coins, prizes and stickers are saved with the rest of your progress, in your backup file and your account.') + '</p>' +
      '</div>';
    fxScan();
  }
  /* ---------- opening a crate, full screen: the locker dial spins, the door swings, then the reveal for the tier ---------- */
  var pzModalOpen = false;
  function pzShowOpen(r) {
    var it = r.item, odds = '1 in ' + pzOneIn(it).toLocaleString('en-US');
    var host = document.createElement('div'); host.className = 'pz-modal'; host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true'); host.setAttribute('aria-label', 'Opening a crate');
    host.innerHTML = '<div class="pz-stage" id="pz-stage"><div class="pz-locker" id="pz-locker"><div class="pz-locker-in"><span class="pz-locker-glow pz-t-' + it.tier + '-soft"></span></div><div class="pz-door">' + '<span class="pz-lk-vents"></span><svg class="pz-dial" viewBox="0 0 52 52" aria-hidden="true">' + pzDialTicks() + '</svg><span class="pz-lk-handle"></span></div></div>' +
      '<div class="pz-prize pz-r-' + it.tier + '" id="pz-prize" role="status"><span class="pz-prize-pic">' + pzPicture(it, true) + '</span><b class="pz-prize-name">' + esc(it.name) + '</b><small>' + esc(PZ_KIND[it.kind]) + '</small><span class="pz-prize-meta">' + pzTierChip(it.tier) + '<span class="pz-one">' + odds + '</span></span>' +
      (r.dupe ? '<p class="pz-dupe">You already have it: +' + PZ_DUPE + ' coins instead.</p>' : '') + (r.sticker ? '<p class="pz-gotstk">Sticker: <b>' + esc(pzStickerName(r.sticker)) + '</b></p>' : '') +
      '<p class="pz-prize-acts">' + (r.dupe ? '' : '<button class="btn" type="button" id="pz-wear-now" data-pz-wear="' + it.kind + '" data-pz-id="' + it.id + '">Wear it</button>') + '<button class="btn ghost" type="button" id="pz-close">Close</button></p></div>' +
      '<button class="linkbtn pz-skip" type="button" id="pz-skip">Skip</button></div>';
    document.body.appendChild(host); pzModalOpen = true;
    var stage = $('#pz-stage', host), prize = $('#pz-prize', host), skipped = false, timers = [];
    function show() {
      if (prize.classList.contains('show')) { return; }
      prize.classList.add('show'); $('#pz-skip', host).hidden = true; fxScan(); focusQuiet($('#pz-wear-now', host) || $('#pz-close', host));
      var sv = it.kind === 'skin' && !FX_REDUCE ? $('.pz-prize-pic .bud', host) : null;
      if (sv) { timers.push(setTimeout(function () { budPlay(sv, budWho(it.key).tap[0][0]); }, 500)); }
    }
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
    timers.push(setTimeout(function () { if (!skipped) { fxReveal(stage, it.tier, PZ_TIERS.indexOf(it.tier) >= 3 ? odds : '', show, it); } }, at + 650));
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
      /* signed in to an account in the clubhouse, the server opens the crate (club.js) */
      if ((b = t.closest('[data-pz-open]'))) {
        if (clubHold()) { return; }
        if (clubOn()) { clubOpen(b, b.getAttribute('data-pz-open'), ''); return; }
        var r = pzOpen(b.getAttribute('data-pz-open')); if (r) { pzShowOpen(r); } return;
      }
      if ((b = t.closest('[data-pz-grant]'))) {
        if (clubHold()) { return; }
        if (clubOn()) { clubOpen(b, b.getAttribute('data-pz-series'), b.getAttribute('data-pz-grant')); return; }
        var g = pzOpen(b.getAttribute('data-pz-series'), b.getAttribute('data-pz-grant')); if (g) { pzShowOpen(g); } return;
      }
      if ((b = t.closest('[data-pz-wear]'))) { var slot = b.getAttribute('data-pz-wear'), id = b.getAttribute('data-pz-id'); pzEquip(slot, b.getAttribute('aria-pressed') === 'true' ? '' : id); buildCrates(); var back = $('[data-pz-wear="' + slot + '"][data-pz-id="' + id + '"]', viewEl.crates); if (back) { focusQuiet(back); } return; }
      if ((b = t.closest('[data-pz-try]'))) { var tile = b.closest('.pz-item'), ans = tile ? $('.pz-ans', tile) : null; if (ans) { fxRight(b.getAttribute('data-pz-try'), ans); } return; }
      if ((b = t.closest('[data-pz-title]'))) { var tid = b.getAttribute('data-pz-title'); pzEquip('title', b.getAttribute('aria-pressed') === 'true' ? '' : tid); buildCrates(); return; }
      if ((b = t.closest('#pz-buy-freeze'))) { if (clubHold()) { return; } if (clubOn()) { clubFreeze(b); return; } pzBuyFreeze(); buildCrates(); }
    });
  }
  pzWire();
  /* the owner's link, #gift-<code>: it leaves the address bar and the history at once, before the router reads it; the code is
     then checked against PZ_GIFT. This runs before boot.js, so its hashchange listener goes first too. Signed in to an account
     in the clubhouse, the server checks the code again and keeps the prizes (clubGift). */
  function pzGiftLink() {
    var m = /^#gift-([\w-]{16,64})$/.exec(location.hash);
    if (!m) { return; }
    try { history.replaceState(null, '', location.pathname + location.search + '#crates'); } catch (e) { location.hash = 'crates'; }
    var subtle = window.crypto && window.crypto.subtle;
    if (!subtle || !window.TextEncoder) { return; }
    subtle.digest('SHA-256', new TextEncoder().encode(m[1])).then(function (buf) {
      var hex = Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      if (hex !== PZ_GIFT) { pzToast('That link does not unlock anything', ''); return; }
      (acctIn() ? clubGift(m[1]) : Promise.resolve(false)).then(function (done) {
        if (done) { return; }
        if (clubKeeps()) { pzToast('Nothing was unlocked yet', acctIn() ? 'Your account did not answer. Open the link again in a moment.' : 'Sign in again, then open the link again.', 8000); return; }
        pzGiftAll();
        if (viewEl.crates && !viewEl.crates.hidden) { buildCrates(); }
        pzToast('Everything is unlocked', 'All ' + PZ_ITEMS.length + ' prizes, every sticker and title, and ' + pzNum(PZ_GIFT_COINS) + ' coins' + (acctIn() ? '.' : '. Sign in to keep them on every device.'), 8000);
      });
    }).catch(function () {});
  }
  pzGiftLink();
  window.addEventListener('hashchange', pzGiftLink);
  /* start once the rest of the page has run: count today's coins, put on the backgrounds, show the coin count */
  setTimeout(function () { try { pzTick(); fxApply(); pzChip(); fxScan(); } catch (e) { /* prizes never stop the page */ } }, 0);
