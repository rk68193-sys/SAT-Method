  /* =================== The study buddy: the student's character, small, keeping them company on every page =================== */
  /* It wears the look from My room (roomGet().av, room.js), skin and all, and buddy.js draws it. It keeps out of the page's way:
     on a wide screen it stands bottom left, beside the page; on a narrower one only its head peeks up in the bottom right corner
     (from behind the bottom bar on a phone), and it pops up when tapped. Tapped, it does one of its skin's own moves and says something; now and then it
     does something on its own; it cheers a right answer (pzRight) and takes a miss in its stride (noteAnswer); it walks in when
     the student goes to another page, and dozes off when the page is left alone.
     Only the figure and its Hide button take taps; its effects and its bubble let taps through to the page. It is never there in
     a timed module or in a room, where the student's character already stands (palCheck), nor in the tour or while the calculator
     is open (buddy.css); a crate opening covers it. Hide puts it away until the tab is closed (PAL_HIDE); the switch in Text size and colors
     turns it off on this device (PAL_KEY). Set to reduce motion, it stands still: only its face and its bubble change. */
  var PAL_KEY = 'sat-sprint-buddy', PAL_HIDE = 'sat-sprint-buddy-hide', PAL_HI = 'sat-sprint-buddy-hi';
  var PAL = { el: null, svg: null, look: '', off: false, peek: false, idleT: 0, sayT: 0, outT: 0, walkT: 0, sleepT: 0, hiT: 0, chk: 0, asleep: false, busy: 0, run: 0, missAt: 0, taps: [], lastTap: '', walkAt: 0, view: '' };
  function palOn() { try { return window.localStorage.getItem(PAL_KEY) !== 'off'; } catch (e) { return true; } }
  function palHidden() { try { return window.sessionStorage.getItem(PAL_HIDE) === '1'; } catch (e) { return false; } }
  /* the switch in Text size and colors (home.js) */
  function palSet(on) {
    try { if (on) { window.localStorage.removeItem(PAL_KEY); window.sessionStorage.removeItem(PAL_HIDE); } else { window.localStorage.setItem(PAL_KEY, 'off'); } } catch (e) { /* private mode: for this visit only */ }
    PAL.off = !on; palDraw();
  }
  function palSkin() { var av = roomGet().av, it = av[2] ? PZ_BY[av[2]] : null; return { av: av, key: it ? it.key : '', name: it ? it.name : '' }; }
  /* on the page and not put away by what the page is doing */
  function palShown() { return !!(PAL.el && PAL.el.isConnected && !PAL.el.hidden && getComputedStyle(PAL.el).display !== 'none' && !document.hidden); }
  /* a timed module is plain, like the real test, and a room already has the student's character in it */
  function palCheck() {
    if (!PAL.el) { return; }
    var away = !!document.querySelector('.view:not([hidden]) .mmwrap') || cur.view === 'room' || cur.view === 'visit';
    if (PAL.el.hidden !== away) { PAL.el.hidden = away; palPlace(); }
  }

  /* ---------- drawing it, and putting it away ---------- */
  function palDraw() {
    try {
      var want = palOn() && !PAL.off && !palHidden();
      if (!want) { if (PAL.el) { palStop(); PAL.el.remove(); PAL.el = null; PAL.svg = null; PAL.look = ''; palPlace(); } return; }
      if (!PAL.chk) { PAL.chk = setInterval(palCheck, 800); }
      var S = palSkin(), look = S.av.join();
      if (!PAL.el) {
        PAL.el = document.createElement('div'); PAL.el.className = 'pal'; PAL.el.id = 'pal';
        PAL.el.innerHTML = '<button type="button" class="pal-me"></button><div class="pal-say" hidden><span class="pal-line"></span><button type="button" class="pal-hide" hidden>Hide me</button></div>' +
          '<button type="button" class="pal-x" aria-label="Hide the study buddy"><span aria-hidden="true">×</span></button>';
        document.body.appendChild(PAL.el);
        palPlace();
      }
      palCheck();
      if (PAL.look !== look) {
        $('.pal-me', PAL.el).innerHTML = budSVG(roomLook(S.av), { cls: 'bud-live' });
        PAL.svg = $('.pal-me .bud', PAL.el); PAL.look = look; PAL.asleep = false;
      }
      $('.pal-me', PAL.el).setAttribute('aria-label', 'Your study buddy' + (S.name ? ', in the ' + S.name + ' skin' : '') + '. Tap to say hi.');
      palIdle();
      /* the first time it is on screen it says hello */
      if (!PAL.hiT && !palSeen()) { PAL.hiT = setTimeout(function () { PAL.hiT = 0; if (palShown()) { palSeen(true); palDo('wave', 'Hi! I’m your study buddy. Tap me any time. You can change how I look in My room.', 7000); } }, 1800); }
    } catch (e) { /* the buddy never stops the page */ }
  }
  function palSeen(set) { try { if (set) { window.localStorage.setItem(PAL_HI, '1'); return true; } return window.localStorage.getItem(PAL_HI) === '1'; } catch (e) { return true; } }
  function palStop() { clearTimeout(PAL.idleT); clearTimeout(PAL.sayT); clearTimeout(PAL.outT); clearTimeout(PAL.walkT); clearTimeout(PAL.sleepT); clearTimeout(PAL.hiT); clearInterval(PAL.chk); PAL.hiT = 0; PAL.chk = 0; }
  /* bottom left beside the page when there is room for it there, otherwise peeking up in the bottom right corner, with room left
     at the foot of the page so nothing has to stay under it */
  function palPlace() {
    if (!PAL.el) { document.body.classList.remove('pal-pad'); return; }
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16, page = Math.min(window.innerWidth, 74 * rem), side = (window.innerWidth - page) / 2;
    PAL.peek = window.innerWidth <= 700 || side < 104;
    PAL.el.classList.toggle('pal-peek', PAL.peek);
    PAL.el.classList.toggle('pal-stand', !PAL.peek);
    document.body.classList.toggle('pal-pad', PAL.peek && !PAL.el.hidden);
  }

  /* ---------- what it does ---------- */
  /* a move, and a line in the bubble (none when line is empty); ms is how long the bubble stays; hide adds a Hide me button to
     the bubble, which is how a phone, with no pointer to hover with, puts the buddy away */
  function palDo(act, line, ms, hide) {
    if (!palShown() || !PAL.svg) { return; }
    palWake(true);
    budPlay(PAL.svg, act);
    PAL.busy = Date.now() + (BUD_ACTS[act] ? BUD_ACTS[act].t || 1000 : 1000);
    if (line) { palSay(line, ms, hide); }
  }
  function palSay(line, ms, hide) {
    var b = PAL.el ? $('.pal-say', PAL.el) : null;
    if (!b) { return; }
    $('.pal-line', b).textContent = line; $('.pal-hide', b).hidden = !hide; b.hidden = false;
    clearTimeout(PAL.sayT);
    PAL.sayT = setTimeout(palHush, ms || (hide ? 6500 : 3800));
  }
  function palHush() { clearTimeout(PAL.sayT); var b = PAL.el ? $('.pal-say', PAL.el) : null; if (b) { b.hidden = true; } }
  /* tapped, it pops up for a while if it was peeking; a tap anywhere else sends it back at once */
  function palOut() {
    if (!PAL.el) { return; }
    PAL.el.classList.add('pal-out');
    clearTimeout(PAL.outT);
    PAL.outT = setTimeout(palIn, 6500);
  }
  function palIn() { clearTimeout(PAL.outT); if (PAL.el && PAL.el.classList.contains('pal-out')) { PAL.el.classList.remove('pal-out'); palHush(); } }
  function palTap() {
    var now = Date.now(), W = budWho(palSkin().key);
    palOut();
    PAL.taps = PAL.taps.filter(function (t) { return now - t < 2600; }).concat(now);
    if (PAL.taps.length >= 5) { PAL.taps = []; palDo('dizzy', 'Whoa, whoa… the room is spinning!', 0, true); return; }
    if (PAL.asleep) { palDo('surprise', 'Huh? Oh! I’m awake. Totally awake.', 0, true); return; }
    var list = W.tap.filter(function (t) { return t[0] !== PAL.lastTap; }), t = list[Math.floor(Math.random() * list.length)] || W.tap[0];
    PAL.lastTap = t[0];
    palDo(t[0], t[1], 0, true);
  }
  /* now and then, on its own: one of its skin's idle moves, never while it is busy, asleep or away */
  function palIdle() {
    clearTimeout(PAL.idleT);
    PAL.idleT = setTimeout(function () {
      if (palShown() && !PAL.asleep && Date.now() > PAL.busy + 4000) {
        var W = budWho(palSkin().key);
        palDo(W.idle[Math.floor(Math.random() * W.idle.length)], '');
      }
      palIdle();
    }, 22000 + Math.random() * 20000);
  }
  /* left alone for three minutes it falls asleep; any tap, key or scroll wakes it */
  function palWake(quiet) {
    clearTimeout(PAL.sleepT);
    PAL.sleepT = setTimeout(function () { if (palShown()) { budPlay(PAL.svg, 'sleep'); PAL.asleep = true; } }, 180000);
    if (PAL.asleep && !quiet && PAL.svg) { PAL.asleep = false; budPlay(PAL.svg, 'stretch'); }
    else if (quiet) { PAL.asleep = false; }
  }
  /* a right answer (pzRight) or a miss (noteAnswer): it always reacts, and says something on the first right answer, on 3, 5
     and 10 in a row and every 10 after, and on a miss at most once a minute */
  function palSaw(ok) {
    try {
      if (!palShown()) { return; }
      var W = budWho(palSkin().key), n;
      if (ok) {
        n = PAL.run = PAL.run + 1;
        palDo(W.right[0], n === 1 ? W.right[1] : n === 3 || n === 5 || n % 10 === 0 ? n + ' in a row! ' + W.right[1] : '');
      } else {
        PAL.run = 0;
        var say = Date.now() - PAL.missAt > 60000;
        if (say) { PAL.missAt = Date.now(); }
        palDo(W.miss[0], say ? W.miss[1] : '');
      }
    } catch (e) { /* the buddy never stops the page */ }
  }
  /* it follows the student: on a new page it walks in from the side (not more than once in 20 seconds) */
  function palWalkIn() {
    if (!palShown() || FX_REDUCE || Date.now() - PAL.walkAt < 20000) { return; }
    PAL.walkAt = Date.now();
    PAL.el.classList.remove('pal-walk'); void PAL.el.offsetWidth; PAL.el.classList.add('pal-walk');
    budPlay(PAL.svg, 'walk');
    clearTimeout(PAL.walkT);
    PAL.walkT = setTimeout(function () { if (PAL.el) { PAL.el.classList.remove('pal-walk'); } if (PAL.svg) { budRest(PAL.svg); } }, 1100);
  }

  /* ---------- taps, pages and the window ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t || !PAL.el || !PAL.el.contains(t)) { return; }
    if (t.closest('.pal-x, .pal-hide')) {
      try { window.sessionStorage.setItem(PAL_HIDE, '1'); } catch (er) { PAL.off = true; }
      palDraw();
      pzToast('Your study buddy is hidden', 'It comes back on your next visit. To turn it off for good, open Text size and colors.', 7000);
      return;
    }
    if (t.closest('.pal-me')) { palTap(); }
  });
  /* a tap on the page may start a timed module */
  document.addEventListener('click', function () { if (PAL.el) { setTimeout(palCheck, 80); } });
  /* a tap or a key anywhere but on the buddy wakes it (a tap on it wakes it in its own way), and sends it back down if it popped up */
  ['pointerdown', 'keydown'].forEach(function (k) { document.addEventListener(k, function (e) { if (PAL.el && !(e.target && PAL.el.contains(e.target))) { palWake(false); if (k === 'pointerdown') { palIn(); } } }, { passive: true }); });
  window.addEventListener('scroll', function () { if (PAL.el && PAL.asleep) { palWake(false); } }, { passive: true });
  window.addEventListener('resize', function () { palPlace(); });
  window.addEventListener('hashchange', function () {
    setTimeout(function () {
      palDraw();
      var v = cur.view;
      if (v && v !== PAL.view) { if (PAL.view) { palWalkIn(); } PAL.view = v; }
    }, 60);
  });
  setTimeout(function () { palDraw(); PAL.view = cur.view; }, 0);
