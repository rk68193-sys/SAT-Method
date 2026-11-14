  /* =================== Home, navigation, appearance and suggestions =================== */
  /* each page: [view, address, name, what is on it, group]. Inside a subject the step bar shows the four groups in
     order (1 Start here, 2 Learn, 3 Practice, 4 My progress). The guide bar under it says where you are and holds
     Back (and Home on a phone), and the foot of every page offers one next step. */
  var GROUPS = [['start', 'Start here'], ['learn', 'Learn'], ['practice', 'Practice'], ['map', 'My progress']];
  var SUBJ = {
    rw: { name: 'Reading & Writing', icon: 'book', items: [
      ['start', 'start', 'Start here', 'What the Reading and Writing test asks, and the order to study in.', 'start'],
      ['rwhub', 'rw-hub', 'All topics', 'Every Reading and Writing topic in the order to learn it, with a search box.', 'learn'],
      ['reading', 'reading', 'Reading lessons', 'Four steps for any reading question, shown on 17 real questions.', 'learn'],
      ['grammar', 'lessons', 'Grammar lessons', 'A one-minute method for grammar questions, and 19 short lessons on the rules.', 'learn'],
      ['lookup', 'lookup', 'Look up a rule', 'Search for a grammar rule, a linking word such as “however”, or a term.', 'learn'],
      ['practice', 'practice', 'Practice questions', 'Real test questions with the answers explained. Go at your own pace, or time yourself.', 'practice'],
      ['drills', 'drills', 'Short exercises', 'Quick exercises that each train one small step.', 'practice'],
      ['rwmap', 'rw-map', 'My progress', 'How you are doing on each kind of question, and what to practice next.', 'map']] },
    math: { name: 'Math', icon: 'calc', items: [
      ['mstart', 'math', 'Start here', 'What the Math test asks, and the order to study in.', 'start'],
      ['mhub', 'm-hub', 'All topics', 'Every Math topic in the order to learn it, with a search box.', 'learn'],
      ['mlearn', 'm-learn', 'Lessons', '19 lessons, one for each kind of math on the test.', 'learn'],
      ['mfound', 'm-found', 'Algebra basics', 'Six basic algebra steps, for when math feels rusty.', 'learn'],
      ['mref', 'm-ref', 'Formula sheet', 'The formulas the test gives you, and how to type in your own answers.', 'learn'],
      ['mdes', 'm-desmos', 'Calculator tips', MD.desmos.length + ' ways to use the calculator built into the test, with exactly what to type.', 'learn'],
      ['mfirst', 'm-first', 'Look for a shortcut', 'Questions where one quick step gets the answer, and how to spot them.', 'learn'],
      ['mshort', 'm-short', 'Shortcut list', 'Faster ways to the answer by hand, and the shortcuts that do not work.', 'learn'],
      ['mpat', 'm-patterns', 'Big ideas', 'A dozen ideas that each solve many kinds of question.', 'learn'],
      ['mstudy', 'm-study', 'All question types', 'All ' + MST.methods.length + ' kinds of math question, each with the steps to solve it.', 'learn'],
      ['mtypes', 'm-types', 'Find a question type', 'Type words from a question to see what kind it is and how to solve it.', 'learn'],
      ['mprac', 'm-practice', 'Practice questions', mfmt(MQ.length) + ' real test questions with the answers explained. Go at your own pace, or time yourself.', 'practice'],
      ['mdrills', 'm-drills', 'Short exercises', 'Quick exercises that each train one small step.', 'practice'],
      ['mmap', 'm-map', 'My progress', 'How you are doing on each kind of question, and what to practice next.', 'map']] }
  };
  function navList(subj) { return SUBJ[subj].items; }
  var VIEW_SUBJ = { home: 'home', suggest: 'home', plan: 'home', data: 'home', account: 'home' };
  Object.keys(SUBJ).forEach(function (s) { SUBJ[s].items.forEach(function (it) { VIEW_SUBJ[it[0]] = s; }); });
  var ICON = {
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5.7 1.5 1.5z"/></svg>',
    calc: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8M8.5 12h1M12 12h0M15.5 12h0M8.5 16h1M12 16h0M15.5 16h0"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h0"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.2 5.3 5.3 2.2-5.3 2.2L12 18.5l-2.2-5.3L4.5 11l5.3-2.2z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
    graph: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4v16h16"/><path d="M7 15c2.5-6 6-6 10-8"/></svg>',
    target: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/></svg>',
    sheet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5h7.5l3.5 3.5v13a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5v-16a.5.5 0 0 1 .5-.5z"/><path d="M14 3.5V7h3.5"/><path d="M9 12h6M9 15.5h6"/></svg>',
    pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5z"/></svg>'
  };

  /* ---------- the step bar: the four steps of the subject you are in ---------- */
  var curSubj = '';
  function renderSecnav(subj) {
    var host = document.getElementById('secin');
    if (!host || subj === curSubj) { return; }
    curSubj = subj;
    var bar = document.getElementById('tabs');
    if (subj === 'home') { host.innerHTML = ''; bar.hidden = true; return; }
    bar.hidden = false;
    var S = SUBJ[subj];
    host.innerHTML = '<p class="secnav-t"><span class="sec-ico">' + ICON[S.icon] + '</span>' + S.name + '</p><div class="secnav-l">' +
      GROUPS.map(function (g, i) {
        var first = S.items.filter(function (it) { return it[4] === g[0]; })[0];
        return '<a href="#' + first[1] + '" data-group="' + g[0] + '"><span class="secn" aria-hidden="true">' + (i + 1) + '</span><span class="secw">' + g[1] + '</span></a>';
      }).join('') + '</div>';
  }
  function markNav(v) {
    var subj = VIEW_SUBJ[v] || 'home';
    var it = subj !== 'home' ? SUBJ[subj].items.filter(function (x) { return x[0] === v; })[0] : null;
    renderSecnav(subj);
    /* Home is lit only on Home itself, not on My study plan and the other pages that belong to no subject */
    $$('#subj a').forEach(function (a) { if (a.getAttribute('data-subj') === subj && (subj !== 'home' || v === 'home')) { a.setAttribute('aria-current', 'page'); } else { a.removeAttribute('aria-current'); } });
    $$('a[data-tool]').forEach(function (a) { if (v === a.getAttribute('data-tool')) { a.setAttribute('aria-current', 'page'); } else { a.removeAttribute('aria-current'); } });
    $$('#secin a').forEach(function (a) { if (it && a.getAttribute('data-group') === it[4]) { a.setAttribute('aria-current', 'page'); } else { a.removeAttribute('aria-current'); } });
    if (subj !== 'home') { var s0 = isObj(store.s.last) ? store.s.last : {}; s0[subj] = v; s0.subj = subj; store.s.last = s0; save(); }
    if (v !== 'suggest' && v !== 'account') { lastPage = { v: v, subj: subj }; }
  }
  var lastPage = { v: 'home', subj: 'home' };

  /* ---------- the guide bar: where you are and the way back; and the next step at the foot of the page ---------- */
  var GLOBAL_PAGE = { plan: ['My study plan', 'plan'], data: ['Backup and offline use', 'my-data'], account: ['My account', 'account'], suggest: ['Ask or suggest', 'suggest'] };
  function groupName(g) { return GROUPS.filter(function (x) { return x[0] === g; })[0][1]; }
  /* the page you are inside a page with its own contents: a lesson, a reading step, a worked example */
  function deepName(v, tok) {
    var m;
    if (v === 'mlearn') {
      if ((m = /^m-([a-z0-9]+)$/.exec(tok)) && MSK[m[1]]) { return MSK[m[1]].name; }
      if ((m = /^mt-(.+)$/.exec(tok)) && MTY[m[1]]) { return MSK[MTY[m[1]].skill].name; }
      return '';
    }
    if (v === 'grammar') { return grammarView.label(); }
    if (v === 'reading') { return readingView.label(); }
    return '';
  }
  /* [name, address] pairs from Home down to the page you are on */
  function crumbsFor(v, tok) {
    var c = [['Home', 'home']];
    if (v === 'home') { return c; }
    if (GLOBAL_PAGE[v]) { c.push(GLOBAL_PAGE[v]); return c; }
    var S = SUBJ[VIEW_SUBJ[v]], it = S ? S.items.filter(function (x) { return x[0] === v; })[0] : null;
    if (!it) { return c; }
    var lead = S.items.filter(function (x) { return x[4] === it[4]; })[0];
    c.push([S.name, S.items[0][1]]);
    c.push([groupName(it[4]), lead[1]]);
    if (lead[0] !== v) { c.push([it[2], it[1]]); }
    var d = deepName(v, tok);
    if (d) { c.push([d, tok]); }
    return c;
  }
  /* the pages you went through in this tab, so Back can say where it goes */
  var gHist = [], gIdx = -1;
  try { var gh0 = JSON.parse(window.sessionStorage.getItem('sat-sprint-trail') || 'null'); if (gh0 && Array.isArray(gh0.h)) { gHist = gh0.h; } } catch (e) {}
  function trailHTML(c) {
    return '<span class="gyou">You are here:</span> ' + c.map(function (x, i) {
      var nw = x[0].length <= 22 ? ' class="gnw"' : '';   /* a short name such as "Reading & Writing" stays on one line */
      return '<span class="gc">' + (i ? '<span class="gsep" aria-hidden="true">›</span>' : '') + (i === c.length - 1 ? '<b aria-current="page"' + nw + '>' + esc(x[0]) + '</b>' : '<a href="#' + x[1] + '"' + nw + '>' + esc(x[0]) + '</a>') + '</span>';
    }).join('<wbr>');   /* the line may break between two names */
  }
  var NEXT = {
    start: [['reading', 'Start the reading lessons', 'Four steps that work on any reading question.'], ['lessons', 'start with the grammar lessons']],
    rwhub: [['reading', 'Start the reading lessons', 'Four steps that work on any reading question.'], ['lessons', 'go to the grammar lessons']],
    reading: [['practice', 'Practice real questions', 'Try what you learned on real test questions.'], ['lessons', 'go on to the grammar lessons']],
    grammar: [['practice', 'Practice real questions', 'Try what you learned on real test questions.'], ['drills', 'try a short exercise']],
    lookup: [['practice', 'Practice real questions', 'Use what you looked up on real test questions.'], ['rw-hub', 'go back to all topics']],
    practice: [['rw-map', 'See my progress', 'See which kinds of question need more work.'], ['drills', 'try a short exercise']],
    drills: [['practice', 'Practice real questions', 'Use what you trained on real test questions.'], ['rw-map', 'see my progress']],
    rwmap: [['practice', 'Practice real questions', 'Work on the kinds of question that need it.'], ['rw-hub', 'go back to the lessons']],
    mstart: [['m-learn', 'Start the lessons', 'One lesson for each kind of math on the test.'], ['m-found', 'start with Algebra basics if math feels rusty']],
    mhub: [['m-learn', 'Open the lessons', 'One lesson for each kind of math on the test.'], ['m-found', 'start with Algebra basics']],
    mlearn: [['m-le1', 'Start the first lesson', 'Linear equations in one variable. Then go through the rest in order.'], ['m-practice', 'practice real questions']],
    mfound: [['m-learn', 'Go on to the lessons', 'One lesson for each kind of math on the test.'], ['m-found-practice', 'practice easy algebra questions']],
    mref: [['m-practice', 'Practice real questions', 'The formula sheet opens from the “Formula sheet” button above each question.'], ['m-desmos', 'see the calculator tips']],
    mdes: [['m-practice', 'Practice real questions', 'The calculator opens from the button above each question.'], ['m-patterns', 'see the big ideas']],
    mfirst: [['m-first-practice', 'Practice these questions', 'Real questions where the short way works.'], ['m-short', 'see the full shortcut list']],
    mshort: [['m-practice', 'Practice real questions', 'Try the shortcuts on real test questions.'], ['m-patterns', 'see the big ideas']],
    mpat: [['m-practice', 'Practice real questions', 'Try the ideas on real test questions.'], ['m-learn', 'go back to the lessons']],
    mstudy: [['m-practice', 'Practice real questions', 'Try what you looked up on real test questions.'], ['m-learn', 'go back to the lessons']],
    mtypes: [['m-practice', 'Practice real questions', 'Try what you looked up on real test questions.'], ['m-learn', 'go back to the lessons']],
    mprac: [['m-map', 'See my progress', 'See which kinds of question need more work.'], ['m-drills', 'try a short exercise']],
    mdrills: [['m-practice', 'Practice real questions', 'Use what you trained on real test questions.'], ['m-map', 'see my progress']],
    mmap: [['m-practice', 'Practice real questions', 'Work on the kinds of question that need it.'], ['m-learn', 'go back to the lessons']]
  };
  function nextFor(v, tok) {
    var m;
    if (v === 'mlearn' && (m = /^m(?:t)?-(.+)$/.exec(tok))) {
      var k = MSK[m[1]] ? m[1] : (MTY[m[1]] ? MTY[m[1]].skill : '');
      if (k) {
        var order = [];
        MD.domains.forEach(function (d) { order = order.concat(d.skills); });
        var nk = order[order.indexOf(k) + 1];
        return [['mp-' + k, 'Practice ' + MSK[k].n + ' real questions on this lesson', 'College Board’s own questions, one at a time, with the answer explained.'], nk ? ['m-' + nk, 'go on to the next lesson: ' + esc(MSK[nk].name)] : ['m-learn', 'go back to the list of lessons']];
      }
    }
    return NEXT[v] || null;
  }
  function guide() {
    var v = cur.view, tok = lastToken || 'home', c = crumbsFor(v, tok), here = c[c.length - 1];
    var st = null;
    try { st = window.history.state; } catch (e) {}
    if (st && typeof st.gi === 'number') { gIdx = st.gi; }
    else { gIdx += 1; try { window.history.replaceState({ gi: gIdx }, ''); } catch (e) {} gHist.length = Math.min(gHist.length, gIdx); }
    gHist[gIdx] = { t: tok, n: here[0], v: v };
    try { window.sessionStorage.setItem('sat-sprint-trail', JSON.stringify({ h: gHist })); } catch (e) {}
    var bar = document.getElementById('guide'), box = document.getElementById('nextbox');
    if (!bar) { return; }
    if (v === 'home') { bar.hidden = true; box.hidden = true; box.innerHTML = ''; measure(); return; }
    /* Back goes to the last different page you were on in this tab, or else one level up */
    var j = gIdx - 1;
    while (j >= 0 && gHist[j] && gHist[j].n === here[0] && gHist[j].v === v) { j--; }
    var b = document.getElementById('gback'), back = j >= 0 && gHist[j] ? gHist[j] : null, up = c[c.length - 2] || c[0];
    b.setAttribute('href', '#' + (back ? back.t : up[1]));
    if (back) { b.setAttribute('data-go', String(j - gIdx)); } else { b.removeAttribute('data-go'); }
    b.innerHTML = '<span aria-hidden="true">←</span><span>Back<span class="gback-to"> to ' + esc(back ? back.n : up[0]) + '</span></span>';
    document.getElementById('gtrail').innerHTML = trailHTML(c);
    var st2 = document.getElementById('strail');
    if (st2) { st2.innerHTML = trailHTML(c); }
    bar.hidden = false;
    var own = viewEl[v] && $('.nextstep', viewEl[v]), nx = own ? null : nextFor(v, tok);
    if (nx) { box.innerHTML = nextInner(nx[0], nx[1]); box.hidden = false; } else { box.hidden = true; box.innerHTML = ''; }
    measure();
  }

  /* ---------- footer ---------- */
  (function () {
    var host = document.getElementById('footcols');
    if (!host) { return; }
    function col(title, items) { return '<nav aria-label="' + esc(title) + '"><p class="foot-h">' + esc(title) + '</p><ul>' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></nav>'; }
    host.innerHTML = '<div class="foot-brand"><a class="brand" href="#home"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6.5 12.5l3.8 3.8 7.2-8.3"/></svg></span><span class="brand-w">SAT Sprint</span></a><p>A free study guide for the digital SAT, built from College Board’s own practice questions.</p></div>' +
      col('Reading & Writing', navList('rw').map(function (x) { return '<a href="#' + x[1] + '">' + esc(x[2]) + '</a>'; })) +
      col('Math', navList('math').map(function (x) { return '<a href="#' + x[1] + '">' + esc(x[2]) + '</a>'; })) +
      col('This site', ['<a href="#home">Home</a>', '<a href="#plan">My study plan</a>', '<a href="#my-data">Backup and offline use</a>'].concat(acctOn ? ['<a href="#account">My account</a>'] : []).concat(['<a href="#suggest">Ask a question or suggest a change</a>', '<a href="#suggest-notes">My notes</a>', '<button class="linkbtn foot-theme" type="button">Text size and colors</button>']));
  }());

  /* ---------- appearance: saved in this browser under its own key ---------- */
  var THEME_KEY = 'sat-sprint-theme';
  var THEMES = [
    ['auto', 'Same as my device', 'Light or dark, the same as your phone or computer', ['#FFFFFF', '#0B0B10']],
    ['light', 'White background', 'Dark letters on white', ['#FFFFFF', '#0A0A0A']],
    ['dark', 'Black background', 'Light letters on black, easier at night', ['#0B0B10', '#F4F4F5']],
    ['purple', 'Soft purple', 'A pale purple background', ['#F7F2FF', '#6D28D9']],
    ['blue', 'Soft blue', 'A pale blue background', ['#F2F7FF', '#1D4ED8']],
    ['pink', 'Soft pink', 'A pale pink background', ['#FFF4F8', '#BE185D']],
    ['green', 'Soft green', 'A pale green background', ['#F1FAF4', '#15803D']]
  ];
  /* text size: the whole site is measured in rem, so one setting on the page root scales every word */
  var SIZE_KEY = 'sat-sprint-size';
  var SIZES = [['', 'Normal'], ['l', 'Large'], ['xl', 'Largest']];
  function getSize() { try { var z = window.localStorage.getItem(SIZE_KEY) || ''; return z === 'l' || z === 'xl' ? z : ''; } catch (e) { return ''; } }
  function setSize(z) {
    if (z) { document.documentElement.setAttribute('data-size', z); } else { document.documentElement.removeAttribute('data-size'); }
    try { if (z) { window.localStorage.setItem(SIZE_KEY, z); } else { window.localStorage.removeItem(SIZE_KEY); } } catch (e) {}
    measure();
  }
  function getTheme() { try { return window.localStorage.getItem(THEME_KEY) || 'auto'; } catch (e) { return 'auto'; } }
  function setTheme(t) {
    if (t === 'auto') { document.documentElement.removeAttribute('data-theme'); } else { document.documentElement.setAttribute('data-theme', t); }
    try { window.localStorage.setItem(THEME_KEY, t); } catch (e) {}
    themeBar();
  }
  /* the browser's own bar, and the installed app's title bar, take the page color */
  function themeBar() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) { try { var c = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim(); if (c) { m.setAttribute('content', c); } } catch (e) {} }
  }
  themeBar();
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeBar); } catch (e) {}
  function themePopHTML() {
    var cur = getTheme(), z = getSize();
    return '<fieldset class="size-list"><legend>Text size</legend><div class="size-opts">' + SIZES.map(function (o, i) {
        return '<label class="size-opt"><input type="radio" name="tsize" value="' + o[0] + '"' + (o[0] === z ? ' checked' : '') + '><span class="size-a size-a' + i + '" aria-hidden="true">A</span><span class="size-n">' + o[1] + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<fieldset class="theme-list"><legend>Colors</legend>' + THEMES.map(function (t) {
        return '<label class="theme-opt"><input type="radio" name="theme" value="' + t[0] + '"' + (t[0] === cur ? ' checked' : '') + '><span class="theme-sw" aria-hidden="true" style="background:linear-gradient(135deg,' + t[3][0] + ' 50%,' + t[3][1] + ' 50%)"></span><span class="theme-tx"><b>' + t[1] + '</b><span>' + t[2] + '</span></span></label>';
      }).join('') + '</fieldset><p class="theme-foot"><span class="theme-note">Saved on this device.</span><button class="btn sm" type="button" id="theme-done">Done</button></p>';
  }
  var themeBtn = document.getElementById('theme-btn'), themePop = document.getElementById('theme-pop');
  function openTheme(open) {
    if (!themePop) { return; }
    if (open) { themePop.innerHTML = themePopHTML(); }
    themePop.hidden = !open; themeBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { var c = $('input:checked', themePop); focusQuiet(c); }
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function (e) { e.stopPropagation(); openTheme(themePop.hidden); });
    themePop.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'theme') { setTheme(e.target.value); }
      if (e.target && e.target.name === 'tsize') { setSize(e.target.value); }
    });
    themePop.addEventListener('click', function (e) { e.stopPropagation(); if (e.target && e.target.id === 'theme-done') { openTheme(false); focusQuiet(themeBtn); } });
    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('.foot-theme')) { e.stopPropagation(); openTheme(true); return; }
      if (!themePop.hidden) { openTheme(false); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !themePop.hidden) { openTheme(false); focusQuiet(themeBtn); } });
  }

  /* ---------- Home: what this is, the two subjects, how it works, and one easy question ---------- */
  function buildHome() {
    var last = isObj(store.s.last) ? store.s.last : null, cont = '';
    if (last && last.subj && SUBJ[last.subj]) {
      var lv = last[last.subj], it = SUBJ[last.subj].items.filter(function (x) { return x[0] === lv; })[0];
      if (it) { cont = '<a class="hcont" href="#' + it[1] + '"><span class="label">Pick up where you left off</span><b>' + SUBJ[last.subj].name + ' · ' + it[2] + '</b><span class="hcont-go" aria-hidden="true">→</span></a>'; }
    }
    var nAll = 1845 + MQ.length;
    var mt = 0; Object.keys(store.m).forEach(function (k) { if (MQBY[k]) { mt++; } });
    function pick(key, what) {
      var S = SUBJ[key];
      return '<a class="hpick hpick-' + key + '" href="#' + S.items[0][1] + '"><span class="hpick-ico">' + ICON[S.icon] + '</span><span class="hpick-t"><b>' + S.name + '</b><span>' + what + '</span></span><span class="hpick-go">Start <span aria-hidden="true">→</span></span></a>';
    }
    viewEl.home.innerHTML = '<div class="wrap">' +
      '<section class="hh hh-simple"><div class="hh-text"><p class="hpill">Free · no sign-up needed</p><h1>Get ready for the SAT, one step at a time</h1>' +
      '<p class="lede">Free lessons and ' + mfmt(nAll) + ' real practice questions, with the official answers explained.</p>' + cont +
      '<h2 class="hq">What do you want to study?</h2><div class="hpicks">' + pick('rw', 'Reading short passages, and grammar') + pick('math', 'Algebra, geometry and data') + '</div>' +
      '<p class="hnot">Not sure yet? <a href="#htry-sec" data-scroll>Try one easy question first</a>.</p></div></section>' +
      '<section class="hsec hhow" id="hhow"><div class="hsec-h"><h2 class="h2">How this site works</h2></div><ol class="hsteps">' +
        '<li><b>Pick a subject.</b><span>Reading &amp; Writing or Math, with the big buttons above.</span></li>' +
        '<li><b>Read “Start here”.</b><span>It takes five minutes and tells you what to do first.</span></li>' +
        '<li><b>Follow the “Next step” button.</b><span>The bottom of every page has one, so you always know where to go. “Back” at the top of the page takes you back.</span></li>' +
        '<li><b>Come back any time.</b><span>Your progress is saved ' + (acctIn() ? 'in your account' : 'on this device') + (mt ? ': ' + plural(mt, 'math question') + ' so far' : '') + '. ' + (acctOn && !acctIn() ? '<a href="#account">Make a free account</a> to keep it on every device, or <a href="#my-data">save a copy</a>.' : '<a href="#my-data">Save a copy, or use the site offline</a>.') + '</span></li>' +
      '</ol></section>' +
      '<section class="hsec" id="htry-sec"><div class="hsec-h"><h2 class="h2">Try one easy question</h2><p class="muted">A real question from the test. Answer it to see how this kind of question works. Nothing is saved.</p></div>' + htryHTML() + '</section>' +
      '<section class="hsec"><div class="hsec-h"><h2 class="h2">Plan ahead</h2></div><div class="hplanrow">' + planHomeHTML() + '</div></section>' +
      (habitStreak().days ? habitHomeHTML() : '') +
      '<section class="hband"><div><h2 class="h2">A question, or an idea?</h2><p>Ask a question, tell us what to add or change, or leave a tip for other students.</p></div><a class="btn big" href="#suggest">Ask or suggest</a></section>' +
      '</div>';
    htryShow(store.s.htry === 'rw' ? 'rw' : 'math');
  }

  /* ---------- Suggest a change, and private notes ---------- */
  var SUGGEST_REPO = 'https://github.com/rk68193-sys/SAT-Method/issues/new';
  var SG_KINDS = [['ask', 'A question'], ['add', 'Add something'], ['change', 'Change something'], ['wrong', 'Something is wrong'], ['tip', 'A tip for students']];
  function pageName(p) {
    if (!p || p.subj === 'home' || !SUBJ[p.subj]) { return 'Home'; }
    var it = SUBJ[p.subj].items.filter(function (x) { return x[0] === p.v; })[0];
    return SUBJ[p.subj].name + (it ? ' · ' + it[2] : '');
  }
  function buildSuggest(focusNotes) {
    var from = pageName(lastPage);
    var w0 = document.getElementById('sg-where');
    if (w0) {
      /* keep a half-written idea; only the page you came from changes */
      w0.options[0].text = 'The page I was on: ' + from;
      if (focusNotes) { scrollToEl(document.getElementById('suggest-notes')); }
      return;
    }
    var where = [['page', 'The page I was on: ' + from], ['site', 'The whole site'], ['rw', 'Reading & Writing'], ['math', 'Math']];
    viewEl.suggest.innerHTML = '<div class="wrap sgwrap">' +
      '<header class="mhead"><p class="eyebrow">Ask or suggest</p><h2 class="vtitle">Ask a question or suggest a change</h2></header>' +
      '<p class="whatbox"><span class="sec-i">' + ICON.info + '</span><span><b>What is this?</b> Ask a question about the site, tell us what you would like added or changed, report a mistake, or leave a short tip for other students. Every message is read.</span></p>' +
      '<form class="sgform" id="sg-form" novalidate>' +
        seg('sg-kind', '1 · What kind of message?', SG_KINDS, 'ask') +
        '<label class="field"><span class="label">2 · Which part of the site is it about?</span><select id="sg-where">' + where.map(function (w) { return '<option value="' + w[0] + '">' + esc(w[1]) + '</option>'; }).join('') + '</select></label>' +
        '<label class="field"><span class="label">3 · Your message</span><textarea id="sg-text" rows="6" maxlength="2000" required placeholder="For example: how do I see my answers again? Or: please add a lesson on percent word problems."></textarea><span class="sg-count muted" id="sg-count" aria-live="polite">0 / 2000</span></label>' +
        '<label class="field"><span class="label">Your name (optional)</span><input type="text" id="sg-name" maxlength="60" autocomplete="nickname"></label>' +
        '<p class="label sg-how-h">4 · Send it, one of two ways</p>' +
        '<p class="row sg-actions"><button class="btn big" type="submit">Send it on GitHub</button><button class="btn big ghost" type="button" id="sg-copy">Copy it instead</button></p>' +
        '<ul class="plainlist fine sg-how"><li><b>Send it on GitHub.</b> GitHub is the free website where this site is kept. It opens in a new tab with your message already filled in. To post it there you need a free GitHub account.</li>' +
          '<li><b>Copy it instead.</b> No account needed: your message is copied, and you paste it into an email or a text to whoever shared this site with you.</li></ul>' +
        '<p class="sg-msg" id="sg-msg" role="status" aria-live="polite"></p>' +
      '</form>' +
      '<section class="sec" id="sg-mine"></section>' +
      '<section class="sec" id="suggest-notes"><h3 class="h2">My notes</h3><p class="lede">A private scratchpad for tips you want to remember: tricks that worked, mistakes to avoid. Saved on this device only; nobody else sees it.</p>' +
        '<label class="field"><span class="sr">My notes</span><textarea id="sg-notes" rows="8" maxlength="10000" placeholder="For example: “positive solution” means two answers, keep the positive one."></textarea></label>' +
        '<p class="row"><span class="muted" id="sg-notes-st" aria-live="polite"></span><button class="linkbtn" type="button" id="sg-notes-clear">Clear my notes</button></p></section>' +
      '</div>';
    var form = $('#sg-form'), text = $('#sg-text'), msg = $('#sg-msg');
    function current() {
      var k = $('input[name="sg-kind"]:checked', form), kind = k ? k.value : 'add';
      var kindName = SG_KINDS.filter(function (x) { return x[0] === kind; })[0][1];
      var w = $('#sg-where'), whereTx = w.options[w.selectedIndex].text;
      return { kind: kind, kindName: kindName, where: whereTx, text: text.value.trim(), name: $('#sg-name').value.trim() };
    }
    function asText(c) { return kindLine(c) + '\nPart of the site: ' + c.where + '\n\n' + c.text + (c.name ? '\n\nFrom: ' + c.name : ''); }
    function kindLine(c) { return c.kind === 'ask' ? 'A question' : 'Suggestion: ' + c.kindName; }
    /* sending the same message both ways keeps one copy */
    function remember(c) {
      var t = c.text.slice(0, 2000), same = Object.keys(store.g).some(function (k) { var r = store.g[k]; return isObj(r) && r.t === t && r.k === c.kindName && r.w === c.where; });
      if (!same) { store.g[String(Date.now())] = { k: c.kindName, w: c.where, t: t }; save(); }
      drawMine();
    }
    function check(c) {
      if (c.text.length < 3) { msg.className = 'sg-msg bad'; msg.textContent = 'Please write your message first.'; focusQuiet(text); return false; }
      return true;
    }
    text.addEventListener('input', function () { $('#sg-count').textContent = text.value.length + ' / 2000'; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = current();
      if (!check(c)) { return; }
      var title = c.kindName + ': ' + c.text.replace(/\s+/g, ' ').slice(0, 60) + (c.text.length > 60 ? '…' : '');
      var url = SUGGEST_REPO + '?title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(asText(c) + '\n\n(Sent from the site’s Ask or suggest page.)');
      remember(c);
      window.open(url, '_blank', 'noopener');
      msg.className = 'sg-msg ok'; msg.textContent = 'GitHub opened in a new tab with your message filled in. Press the green “Submit new issue” button there to send it. A copy is saved below.';
    });
    $('#sg-copy').addEventListener('click', function () {
      var c = current();
      if (!check(c)) { return; }
      var done = function () { remember(c); msg.className = 'sg-msg ok'; msg.textContent = 'Copied. Now paste it into an email or a text message and send it. A copy is saved below.'; };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(asText(c)).then(done, function () { fallbackCopy(asText(c)); done(); }); }
        else { fallbackCopy(asText(c)); done(); }
      } catch (err) { fallbackCopy(asText(c)); done(); }
    });
    function fallbackCopy(s) {
      var ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta);
    }
    function drawMine() {
      var keys = Object.keys(store.g).sort().reverse(), host = $('#sg-mine');
      if (!keys.length) { host.innerHTML = ''; return; }
      host.innerHTML = '<h3 class="h2">Your messages on this device</h3><ul class="sglist">' + keys.map(function (k) {
        var r = isObj(store.g[k]) ? store.g[k] : {}, d = new Date(Number(k));
        return '<li><div><p class="sglist-h"><b>' + esc(r.k) + '</b> <span class="muted">· ' + esc(r.w) + ' · ' + d.toLocaleDateString() + '</span></p><p>' + esc(r.t) + '</p></div><button class="linkbtn" type="button" data-sgdel="' + k + '">Remove</button></li>';
      }).join('') + '</ul>';
      $$('[data-sgdel]', host).forEach(function (b) { b.addEventListener('click', function () { delete store.g[b.getAttribute('data-sgdel')]; save(); drawMine(); }); });
    }
    drawMine();
    var notes = $('#sg-notes'), st = $('#sg-notes-st'), tmr = null;
    notes.value = typeof store.s.notes === 'string' ? store.s.notes : '';
    st.textContent = canStore ? (notes.value ? 'Saved on this device.' : '') : 'This browser is not saving data, so notes will be lost when you leave.';
    notes.addEventListener('input', function () {
      clearTimeout(tmr); st.textContent = 'Saving…';
      tmr = setTimeout(function () { store.s.notes = notes.value; save(); st.textContent = canStore ? 'Saved on this device.' : 'Not saved: this browser is not storing data.'; }, 400);
    });
    $('#sg-notes-clear').addEventListener('click', function () { if (!notes.value || window.confirm('Clear all your notes?')) { notes.value = ''; store.s.notes = ''; save(); st.textContent = 'Cleared.'; } });
    if (focusNotes) { scrollToEl(document.getElementById('suggest-notes')); }
  }

