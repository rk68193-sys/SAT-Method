  /* =================== Home and the two-level navigation =================== */
  var SUBJ = {
    rw: { name: 'Reading & Writing', icon: 'book', items: [
      ['start', 'start', 'Start here', 'The plan, and which routine each question needs'],
      ['reading', 'reading', 'Reading', 'The four-step routine for reading questions'],
      ['grammar', 'method', 'Grammar', 'The 60-second method and 19 lessons'],
      ['drills', 'drills', 'Drills', 'Quick drills for the slow steps'],
      ['practice', 'practice', 'Practice', 'Timed sets of real questions'],
      ['lookup', 'lookup', 'Look up', 'Search rules, transitions and terms']] },
    math: { name: 'Math', icon: 'calc', items: [
      ['mstart', 'math', 'Start here', 'How to approach every math question'],
      ['mlearn', 'm-learn', 'Lessons', '19 skills explained from scratch'],
      ['mtypes', 'm-types', 'Question finder', 'Which kind of question is this?'],
      ['mshort', 'm-short', 'Shortcuts', 'Faster ways to the right answer'],
      ['mref', 'm-ref', 'Formulas & Desmos', 'What to learn, when to use the calculator'],
      ['mprac', 'm-practice', 'Practice', mfmt(MQ.length) + ' real questions with answers']] }
  };
  var VIEW_SUBJ = { home: 'home' };
  Object.keys(SUBJ).forEach(function (s) { SUBJ[s].items.forEach(function (it) { VIEW_SUBJ[it[0]] = s; }); });
  var ICON = {
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5.7 1.5 1.5z"/></svg>',
    calc: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8M8.5 12h1M12 12h0M15.5 12h0M8.5 16h1M12 16h0M15.5 16h0"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 12 4l8 7"/><path d="M6.5 9.5V20h11V9.5"/></svg>'
  };
  var curSubj = '';
  function renderSecnav(subj) {
    var host = document.getElementById('secin');
    if (!host) { return; }
    if (subj === curSubj) { return; }
    curSubj = subj;
    var bar = document.getElementById('tabs');
    if (subj === 'home') { host.innerHTML = ''; bar.hidden = true; return; }
    bar.hidden = false;
    var S = SUBJ[subj];
    host.innerHTML = '<p class="secnav-t"><span class="ico">' + ICON[S.icon] + '</span>' + S.name + '</p><div class="secnav-l">' +
      S.items.map(function (it) { return '<a href="#' + it[1] + '" data-view="' + it[0] + '"><b>' + it[2] + '</b><span>' + it[3] + '</span></a>'; }).join('') + '</div>';
  }
  function markNav(v) {
    var subj = VIEW_SUBJ[v] || 'home';
    renderSecnav(subj);
    $$('#subj a').forEach(function (a) { if (a.getAttribute('data-subj') === subj) { a.setAttribute('aria-current', 'page'); } else { a.removeAttribute('aria-current'); } });
    $$('#tabs a').forEach(function (a) { if (a.getAttribute('data-view') === v) { a.setAttribute('aria-current', 'page'); } else { a.removeAttribute('aria-current'); } });
    if (subj !== 'home') { var s0 = isObj(store.s.last) ? store.s.last : {}; s0[subj] = v; s0.subj = subj; store.s.last = s0; save(); }
  }
  function buildHome() {
    var last = isObj(store.s.last) ? store.s.last : null, cont = '';
    if (last && last.subj && SUBJ[last.subj]) {
      var lv = last[last.subj], it = SUBJ[last.subj].items.filter(function (x) { return x[0] === lv; })[0];
      if (it) { cont = '<a class="hcont" href="#' + it[1] + '"><span class="label">Pick up where you left off</span><b>' + SUBJ[last.subj].name + ' · ' + it[2] + '</b><span class="hcont-go" aria-hidden="true">→</span></a>'; }
    }
    function card(key, blurb, facts) {
      var S = SUBJ[key];
      return '<section class="hsubj hsubj-' + key + '" aria-labelledby="hs-' + key + '"><div class="hsubj-top"><span class="hsubj-ico">' + ICON[S.icon] + '</span><div><h2 class="hsubj-h" id="hs-' + key + '">' + S.name + '</h2><p>' + blurb + '</p></div></div>' +
        '<ul class="hsubj-facts">' + facts.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>' +
        '<ol class="hsubj-list">' + S.items.map(function (x, i) { return '<li><a href="#' + x[1] + '"><span class="hsubj-n">' + (i + 1) + '</span><span><b>' + x[2] + '</b><span>' + x[3] + '</span></span></a></li>'; }).join('') + '</ol>' +
        '<a class="btn big hsubj-go" href="#' + S.items[0][1] + '">Start ' + S.name + '</a></section>';
    }
    var mt = 0; Object.keys(store.m).forEach(function (k) { if (MQBY[k]) { mt++; } });
    viewEl.home.innerHTML = '<div class="wrap">' +
      '<header class="hhero"><p class="eyebrow">A free study guide for the digital SAT</p><h1>Study for the SAT one clear step at a time</h1>' +
      '<p class="lede">Choose a subject below. Each one starts with a short guide, then lessons, then real practice questions from College Board with College Board’s own answers. Everything is counted from College Board’s full question bank.</p></header>' +
      cont +
      '<div class="hsubjs">' +
        card('rw', 'Reading passages, grammar and transitions. 54 questions on the test, in two parts.', ['1,845 bank questions studied', 'A routine for every question type']) +
        card('math', 'Algebra, advanced math, data and geometry. 44 questions on the test, in two parts.', [mfmt(MQ.length) + ' real questions to practise', MORDER.length + ' question types, each with a method']) +
      '</div>' +
      '<section class="hhow"><h2 class="h2">How to use this site</h2><ol class="hsteps">' +
        '<li><b>Pick a subject.</b><span>Use the big buttons at the top of every page to switch between Home, Reading & Writing and Math.</span></li>' +
        '<li><b>Read “Start here”.</b><span>Five minutes. It tells you what the test asks and the routine to use.</span></li>' +
        '<li><b>Learn one lesson, then practise it.</b><span>Every lesson ends with a button that gives you real questions on just that topic.</span></li>' +
        '<li><b>Come back any time.</b><span>Your progress is saved on this device, in this browser' + (mt ? ': ' + plural(mt, 'math question') + ' practised so far' : '') + '.</span></li>' +
      '</ol></section></div>';
  }
