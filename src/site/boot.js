  /* =================== views, router, keyboard =================== */
  var VIEWS = ['home', 'start', 'reading', 'grammar', 'drills', 'practice', 'lookup', 'mstart', 'mlearn', 'mpat', 'mdes', 'mtypes', 'mshort', 'mref', 'mprac'];
  var viewEl = {};
  VIEWS.forEach(function (v) { viewEl[v] = document.getElementById('v-' + v); });
  var cur = { view: '' }, built = {}, lastToken = 'start', viewY = {}, viewTok = {};

  var topEl = document.getElementById('top');
  function measure() { document.documentElement.style.setProperty('--top-h', topEl.offsetHeight + 'px'); }
  measure();
  window.addEventListener('resize', measure);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(measure); }

  function showView(v) {
    if (cur.view === v) { return; }
    if (cur.view) { viewY[cur.view] = window.scrollY; }
    if (cur.view === 'practice') { timedPause(); }
    if (cur.view === 'grammar') { demoPause(); }
    if (cur.view === 'drills') { drillAway(); }
    if (cur.view === 'mprac') { mpPause(); }
    VIEWS.forEach(function (k) { viewEl[k].hidden = k !== v; });
    markNav(v);
    cur.view = v;
    document.body.setAttribute('data-subj', VIEW_SUBJ[v] || 'home');
    if (v === 'practice') { timedResume(); }
    if (v === 'grammar') { demoResume(); }
    if (v === 'drills' && !document.hidden) { drillBack(); }
    if (v === 'mprac' && !document.hidden) { mpResume(); }
    var cur_a = $('#tabs a[aria-current]');
    if (cur_a && cur_a.scrollIntoView) { try { cur_a.scrollIntoView({ inline: 'nearest', block: 'nearest' }); } catch (e) {} }
  }
  function toTop() { window.scrollTo(0, 0); }
  function scrollToEl(el) {
    if (!el) { toTop(); return; }
    el.scrollIntoView({ block: 'start' });
    if (!el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '-1'); }
    focusQuiet(el);
  }
  function landed(changed) {
    if (!changed) { return; }
    var h = $('.lpage h2, .lpage h1', viewEl[cur.view]);
    if (h) { if (!h.hasAttribute('tabindex')) { h.setAttribute('tabindex', '-1'); } focusQuiet(h); }
  }
  var hitChip = null;
  function markHit(el) {
    if (hitChip) { hitChip.classList.remove('hit'); }
    hitChip = el || null;
    if (hitChip) { hitChip.classList.add('hit'); }
  }
  /* token -> [page, anchor] inside the Reading view */
  var READ_AT = {
    reading: ['routine'], routine: ['routine'], shape: ['shape'], job: ['job'], leadin: ['job', 'leadin'], chunk: ['chunk'], tags: ['chunk', 'tags'],
    turns: ['chunk', 'turns'], names: ['chunk', 'names'], long: ['long'], apart: ['long', 'apart'], para: ['para'], say: ['say'], check: ['check'],
    traps: ['check', 'traps'], notesfirst: ['notes'], pturn: ['para', 'pturn'], pmethod: ['para', 'pmethod'], goalfirst: ['notes'], partly: ['check', 'partly'], myths: ['check', 'myths'], others: ['others'], train: ['others', 'train'], sets: ['sets'], measured: ['measured']
  };
  var GRAM_AT = { grammar: ['method'], method: ['method'], try: ['method', 'try'], patterns: ['method', 'patterns'], first: ['method', 'patterns'], steps: ['method', 'steps'],
    shortcuts: ['shortcuts'], gives: ['shortcuts'], hard: ['hard'], lessons: ['home'], glance: ['home'], structure: ['partA'], verbpath: ['partB'] };
  var LOOKUP_AT = { lookup: '', find: 'find', transitions: 'transitions', alltrans: 'transitions', verbforms: 'verbforms', glossary: 'glossary', words: 'glossary', absent: 'nottested', nottested: 'nottested', about: 'about' };
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function nav(token) {
    var h = '#' + String(token || '').replace(/^#/, '');
    if (location.hash !== h) { try { history.pushState(null, '', h); } catch (e) {} }
    go(token);
  }

  function go(token) { route(token); if (cur.view) { viewTok[cur.view] = lastToken; } }
  function route(token) {
    token = String(token || '').replace(/^#/, '');
    var m, r;
    lastToken = token || 'home';
    if (!token || token === 'home') { showView('home'); buildHome(); toTop(); return; }
    if (routeMath(token)) { return; }
    if (token === 'start' || token === 'top' || token === 'which') {
      showView('start'); buildStart(); refreshPath();
      if (token === 'which') { scrollToEl(document.getElementById('which')); } else { toTop(); }
      return;
    }
    if (has(READ_AT, token)) { r = READ_AT[token]; showView('reading'); var ch = readingView.show(r[0]); if (r[1]) { scrollToEl(document.getElementById(r[1])); } else { toTop(); landed(ch); } return; }
    if ((m = /^ex-(\d+)$/.exec(token)) && REX[m[1]]) { showView('reading'); landed(readingView.show(token)); toTop(); return; }
    if (/^apart-\d+$/.test(token)) { showView('reading'); readingView.show('long'); scrollToEl(document.getElementById(token)); return; }
    if (/^job-[a-z]+$/.test(token)) { showView('reading'); readingView.show('job'); scrollToEl(document.getElementById(token)); return; }
    if (/^o-[a-z]+$/.test(token)) { showView('reading'); readingView.show('others'); scrollToEl(document.getElementById(token)); return; }
    if (has(GRAM_AT, token)) { r = GRAM_AT[token]; showView('grammar'); var cg = grammarView.show(r[0]); if (r[1]) { scrollToEl(document.getElementById(r[1])); } else { toTop(); landed(cg); } return; }
    if ((m = /^part-?([abc])$/i.exec(token))) { showView('grammar'); landed(grammarView.show('part' + m[1].toUpperCase())); toTop(); return; }
    if (has(CBY, token)) { showView('grammar'); landed(grammarView.show(token)); toTop(); return; }
    if (has(U, token)) { showView('grammar'); grammarView.show(U[token].c); scrollToEl(document.getElementById(token)); return; }
    if ((m = /^i-([0-9a-f]{8})$/.exec(token)) && QI[m[1]]) {
      showView('grammar'); grammarView.show(U[QI[m[1]][0]].c);
      var chip = document.getElementById(token);
      markHit(chip); scrollToEl(chip ? chip.closest('.ver') : null); return;
    }
    if ((m = /^q-([0-9a-f]{8})$/.exec(token)) && EX[m[1]]) { showView('grammar'); grammarView.show(U[EX[m[1]].u].c); scrollToEl(document.getElementById(token)); return; }
    if (/^g-/.test(token)) { showView('grammar'); grammarView.show('shortcuts'); scrollToEl(document.getElementById(token)); return; }
    if (token === 'drills' || /^drill-/.test(token)) {
      showView('drills'); buildDrills();
      var dk = token.replace(/^drill-/, '');
      if (has(DR, dk) && !drillRun) { startDrill(dk); }
      toTop(); return;
    }
    if (token === 'practice' || token === 'timed' || token === 'test') { showView('practice'); buildPractice(); toTop(); return; }
    if (has(LOOKUP_AT, token)) {
      showView('lookup'); buildLookup();
      if (LOOKUP_AT[token]) { scrollToEl(document.getElementById(LOOKUP_AT[token])); } else { toTop(); }
      return;
    }
    route('home');
  }
  function openTo(id) {
    var el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS') { el.open = true; }
    scrollToEl(el);
  }
  function routeMath(token) {
    var m;
    if (token === 'math') { showView('mstart'); buildMStart(); toTop(); return true; }
    if (token === 'm-learn') { showView('mlearn'); landed(mlearnView.show('home')); toTop(); return true; }
    if ((m = /^m-learn-([a-z]+)$/.exec(token))) { showView('mlearn'); mlearnView.show('home'); scrollToEl(document.getElementById(token)); return true; }
    if ((m = /^m-([a-z0-9]+)$/.exec(token)) && has(MSK, m[1])) { showView('mlearn'); landed(mlearnView.show(m[1])); toTop(); return true; }
    if ((m = /^mt-(.+)$/.exec(token)) && has(MTY, m[1])) { showView('mlearn'); mlearnView.show(MTY[m[1]].skill); scrollToEl($('#' + token, viewEl.mlearn)); return true; }
    if (token === 'm-types') { showView('mtypes'); buildMTypes(); toTop(); return true; }
    if (token === 'm-patterns') { showView('mpat'); buildMPat(); toTop(); return true; }
    if ((m = /^mpat-(.+)$/.exec(token)) || token === 'mrare') { showView('mpat'); buildMPat(); openTo(token); return true; }
    if (token === 'm-desmos') { showView('mdes'); buildMDes(); toTop(); return true; }
    if (/^md-/.test(token)) { showView('mdes'); buildMDes(); openTo(token); return true; }
    if ((m = /^mpp-(.+)$/.exec(token)) && has(MPAT, m[1])) { mpPreset = 'p:' + m[1]; clearInterval(mpInterval); showView('mprac'); mpSetup(); toTop(); return true; }
    if ((m = /^mq-([0-9a-f]{8})$/.exec(token)) && has(MQBY, m[1])) { showView('mprac'); mpOne(m[1]); return true; }
    if (token === 'm-short') { showView('mshort'); buildMShort(); toTop(); return true; }
    if (/^ms-/.test(token)) { showView('mshort'); buildMShort(); scrollToEl(document.getElementById(token)); return true; }
    if (token === 'm-ref') { showView('mref'); buildMRef(); toTop(); return true; }
    if (token === 'm-practice') { showView('mprac'); buildMPrac(); toTop(); return true; }
    if ((m = /^mp-(.+)$/.exec(token))) {
      var x = m[1];
      if (has(MTY, x)) { mpPreset = 't:' + x; } else if (has(MSK, x)) { mpPreset = 'k:' + x; } else { mpPreset = 'd:' + x; }
      if (MP && !MP.over) { clearInterval(mpInterval); }
      showView('mprac'); mpSetup(); toTop(); return true;
    }
    return false;
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) { return; }
    e.preventDefault();
    var href = a.getAttribute('href').slice(1);
    var dk = a.getAttribute('data-drill');
    if (dk && has(DR, dk)) { try { history.pushState(null, '', '#drills'); } catch (err) {} showView('drills'); buildDrills(); startDrill(dk); return; }
    var tp = a.getAttribute('data-tpart');
    if (tp) { var s0 = isObj(store.s.timed) ? store.s.timed : {}; s0.src = 'g'; s0.part = tp; s0.which = 'all'; store.s.timed = s0; save(); if (built.practice && !TS) { timedSetup(); } }
    /* a tab for a view you have already visited takes you back to where you were */
    var tv = a.closest('#tabs') ? a.getAttribute('data-view') : '';
    if (tv && tv !== cur.view && viewTok[tv] && (tv === 'reading' || tv === 'grammar' || tv === 'lookup')) {
      try { history.pushState(null, '', '#' + viewTok[tv]); } catch (err) {}
      lastToken = viewTok[tv]; showView(tv); window.scrollTo(0, viewY[tv] || 0); return;
    }
    nav(href);
    if (!a.isConnected && document.activeElement === document.body) { var hd = $('#v-' + cur.view + ' .vtitle'); if (hd) { hd.setAttribute('tabindex', '-1'); focusQuiet(hd); } }
  });
  window.addEventListener('hashchange', function () { go(location.hash); });
  window.addEventListener('popstate', function () { go(location.hash); });

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) { return; }
    var t = e.target, tag = t && t.tagName ? t.tagName : '';
    if (/^(INPUT|TEXTAREA|SELECT|SUMMARY)$/.test(tag)) { return; }
    var key = e.key || '';
    if (cur.view === 'practice' && TS && TS.card) {
      if (!TS.card.done()) {
        var k = key.toUpperCase(), n = ['1', '2', '3', '4'].indexOf(key);
        if (n !== -1) { k = 'ABCD'[n]; }
        if (k.length === 1 && 'ABCD'.indexOf(k) !== -1) { e.preventDefault(); TS.card.pick(k); }
      } else if (key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') { e.preventDefault(); timedNext(); }
    } else if (cur.view === 'mprac') { mpKey(e, key, tag);
    } else if (cur.view === 'drills' && drillRun) {
      var it = drillRun.items[drillRun.i], i = KEYS.indexOf(key);
      if (!drillRun.answered) {
        if (it.type === 'pieces') {
          if (i !== -1 && i < it.pieces.length) { e.preventDefault(); togglePiece(i); }
          else if (key === 'Enter' && tag !== 'BUTTON') { e.preventDefault(); drillAnswer(null); }
        } else if (i !== -1 && i < it.opts.length) { e.preventDefault(); drillAnswer(it.opts[i].k); }
      } else if (key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') { e.preventDefault(); drillNext(); }
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { timedPause(); demoPause(); drillAway(); mpPause(); }
    else if (cur.view === 'mprac') { mpResume(); }
    else if (cur.view === 'practice') { timedResume(); }
    else if (cur.view === 'grammar') { demoResume(); }
    else if (cur.view === 'drills') { drillBack(); }
  });

  /* ---------- start ---------- */
  go(location.hash || 'home');
  var hot = window.claude && window.claude.hot;
  if (hot) {
    try { if (typeof hot.snapshot === 'function') { hot.snapshot(function () { return { route: lastToken }; }); } } catch (e) {}
    try {
      if (typeof hot.ready === 'function') {
        hot.ready(function (data) { if (data && data.route && data.route !== lastToken) { go(data.route); } });
      } else if (hot.data && hot.data.route && hot.data.route !== lastToken) { go(hot.data.route); }
    } catch (e) {}
  }
