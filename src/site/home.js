  /* =================== Home, navigation, appearance and suggestions =================== */
  var SUBJ = {
    rw: { name: 'Reading & Writing', icon: 'book', items: [
      ['start', 'start', 'Start here', 'The plan for the whole section, and which routine each kind of question needs.'],
      ['reading', 'reading', 'Reading', 'The four-step routine for reading questions, with long sentences taken apart and 17 worked examples.'],
      ['grammar', 'method', 'Grammar', 'The 60-second method for grammar and transition questions, and 19 short lessons covering every rule.'],
      ['drills', 'drills', 'Drills', 'Quick drills on real questions for the slow steps: naming the job, finding the core, spotting the pattern.'],
      ['practice', 'practice', 'Practice', 'Timed sets of real College Board questions, each followed by its fast path or walkthrough.'],
      ['lookup', 'lookup', 'Look up', 'Search any rule, transition word or term, or paste a question ID to see where it is taught.'],
      ['rpat', 'rpat', 'Patterns', 'What reading all 1,845 bank questions showed: how passages are built, where answers sit, and how wrong choices are made, skill by skill.']] },
    math: { name: 'Math', icon: 'calc', items: [
      ['mstart', 'math', 'Start here', 'How to approach every math question, what the test covers, and what the data says.'],
      ['mlearn', 'm-learn', 'Lessons', 'All 19 skills explained from scratch, each with a method, a worked example and its question types.'],
      ['mpat', 'm-patterns', 'Big patterns', 'A dozen ideas that connect the question types, so one idea solves many kinds of question.'],
      ['mdes', 'm-desmos', 'Desmos', MD.desmos.length + ' calculator moves with exactly what to type, checked on real questions.'],
      ['mshort', 'm-short', 'Shortcuts', 'Faster ways to the right answer by hand, and the shortcuts that do not work.'],
      ['mtypes', 'm-types', 'Question finder', 'Type words from a question to see which of the ' + MORDER.length + ' question types it is and how to solve it.'],
      ['mref', 'm-ref', 'Formulas', 'What is on the formula sheet, what is not, and how to type in your own answers.'],
      ['mprac', 'm-practice', 'Practice', mfmt(MQ.length) + ' real College Board questions with official answers and explanations.']] }
  };
  var VIEW_SUBJ = { home: 'home', suggest: 'home' };
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
    pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5z"/></svg>'
  };

  /* ---------- section bar: tabs for the current subject, and an "On this page" line ---------- */
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
    host.setAttribute('data-n', S.items.length);
    host.innerHTML = '<p class="secnav-t"><span class="sec-ico">' + ICON[S.icon] + '</span>' + S.name + '</p><div class="secnav-l">' +
      S.items.map(function (it) { return '<a href="#' + it[1] + '" data-view="' + it[0] + '">' + it[2] + '</a>'; }).join('') + '</div>';
  }
  function markNav(v) {
    var subj = VIEW_SUBJ[v] || 'home';
    renderSecnav(subj);
    $$('#subj a').forEach(function (a) { if (a.getAttribute('data-subj') === subj && v !== 'suggest') { a.setAttribute('aria-current', 'page'); } else { a.removeAttribute('aria-current'); } });
    $$('[data-tool="suggest"]').forEach(function (a) { if (v === 'suggest') { a.setAttribute('aria-current', 'page'); } else { a.removeAttribute('aria-current'); } });
    $$('#tabs a').forEach(function (a) { if (a.getAttribute('data-view') === v) { a.setAttribute('aria-current', 'page'); } else { a.removeAttribute('aria-current'); } });
    var what = document.getElementById('secwhat');
    if (what && subj !== 'home') {
      var it = SUBJ[subj].items.filter(function (x) { return x[0] === v; })[0];
      what.innerHTML = it ? '<span class="sec-i">' + ICON.info + '</span><span><b>On this page:</b> ' + esc(it[3]) + '</span>' : '';
    }
    if (subj !== 'home') { var s0 = isObj(store.s.last) ? store.s.last : {}; s0[subj] = v; s0.subj = subj; store.s.last = s0; save(); }
    if (v !== 'suggest') { lastPage = { v: v, subj: subj }; }
  }
  var lastPage = { v: 'home', subj: 'home' };

  /* ---------- footer ---------- */
  (function () {
    var host = document.getElementById('footcols');
    if (!host) { return; }
    function col(title, items) { return '<nav aria-label="' + esc(title) + '"><p class="foot-h">' + esc(title) + '</p><ul>' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></nav>'; }
    host.innerHTML = '<div class="foot-brand"><a class="brand" href="#home"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6.5 12.5l3.8 3.8 7.2-8.3"/></svg></span><span class="brand-w">SAT Sprint</span></a><p>A free study guide for the digital SAT, built from College Board’s full question bank.</p></div>' +
      col('Reading & Writing', SUBJ.rw.items.map(function (x) { return '<a href="#' + x[1] + '">' + esc(x[2]) + '</a>'; })) +
      col('Math', SUBJ.math.items.map(function (x) { return '<a href="#' + x[1] + '">' + esc(x[2]) + '</a>'; })) +
      col('This site', ['<a href="#home">Home</a>', '<a href="#suggest">Suggest a change</a>', '<a href="#suggest-notes">My notes</a>', '<button class="linkbtn foot-theme" type="button">Appearance</button>']);
  }());

  /* ---------- appearance: saved in this browser under its own key ---------- */
  var THEME_KEY = 'sat-sprint-theme';
  var THEMES = [
    ['auto', 'Match my device', 'Light or dark, whichever your device uses', ['#FFFFFF', '#0B0B10']],
    ['light', 'Light', 'Clean white pages', ['#FFFFFF', '#0A0A0A']],
    ['dark', 'Dark', 'Easy on the eyes at night', ['#0B0B10', '#F4F4F5']],
    ['purple', 'Purple', 'Soft lavender with violet', ['#F7F2FF', '#6D28D9']],
    ['blue', 'Blue', 'Cool blue', ['#F2F7FF', '#1D4ED8']],
    ['pink', 'Pink', 'Warm pink', ['#FFF4F8', '#BE185D']],
    ['green', 'Green', 'Calm green', ['#F1FAF4', '#15803D']]
  ];
  function getTheme() { try { return window.localStorage.getItem(THEME_KEY) || 'auto'; } catch (e) { return 'auto'; } }
  function setTheme(t) {
    if (t === 'auto') { document.documentElement.removeAttribute('data-theme'); } else { document.documentElement.setAttribute('data-theme', t); }
    try { window.localStorage.setItem(THEME_KEY, t); } catch (e) {}
  }
  function themePopHTML() {
    var cur = getTheme();
    return '<fieldset class="theme-list"><legend>Appearance</legend>' + THEMES.map(function (t) {
      return '<label class="theme-opt"><input type="radio" name="theme" value="' + t[0] + '"' + (t[0] === cur ? ' checked' : '') + '><span class="theme-sw" aria-hidden="true" style="background:linear-gradient(135deg,' + t[3][0] + ' 50%,' + t[3][1] + ' 50%)"></span><span class="theme-tx"><b>' + t[1] + '</b><span>' + t[2] + '</span></span></label>';
    }).join('') + '</fieldset><p class="theme-note">Saved on this device.</p>';
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
    themePop.addEventListener('change', function (e) { if (e.target && e.target.name === 'theme') { setTheme(e.target.value); } });
    themePop.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('.foot-theme')) { e.stopPropagation(); window.scrollTo(0, 0); openTheme(true); return; }
      if (!themePop.hidden) { openTheme(false); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !themePop.hidden) { openTheme(false); focusQuiet(themeBtn); } });
  }

  /* ---------- Home ---------- */
  function buildHome() {
    var last = isObj(store.s.last) ? store.s.last : null, cont = '';
    if (last && last.subj && SUBJ[last.subj]) {
      var lv = last[last.subj], it = SUBJ[last.subj].items.filter(function (x) { return x[0] === lv; })[0];
      if (it) { cont = '<a class="hcont" href="#' + it[1] + '"><span class="label">Pick up where you left off</span><b>' + SUBJ[last.subj].name + ' · ' + it[2] + '</b><span class="hcont-go" aria-hidden="true">→</span></a>'; }
    }
    var nRW = 1845, nAll = nRW + MQ.length;
    function card(key, blurb, facts) {
      var S = SUBJ[key];
      return '<section class="hsubj hsubj-' + key + '" aria-labelledby="hs-' + key + '"><div class="hsubj-top"><span class="hsubj-ico">' + ICON[S.icon] + '</span><div><h3 class="hsubj-h" id="hs-' + key + '">' + S.name + '</h3><p>' + blurb + '</p></div></div>' +
        '<ul class="hsubj-facts">' + facts.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>' +
        '<ul class="hsubj-list">' + S.items.map(function (x) { return '<li><a href="#' + x[1] + '"><b>' + x[2] + '</b><span class="hsubj-arrow" aria-hidden="true">→</span></a></li>'; }).join('') + '</ul>' +
        '<a class="btn big hsubj-go" href="#' + S.items[0][1] + '">Start ' + S.name + '</a></section>';
    }
    function feat(subj, icon, title, text, href) {
      return '<a class="hfeat hfeat-' + subj + '" href="#' + href + '"><span class="hfeat-ico">' + ICON[icon] + '</span><b>' + title + '</b><span>' + text + '</span></a>';
    }
    var mt = 0; Object.keys(store.m).forEach(function (k) { if (MQBY[k]) { mt++; } });
    viewEl.home.innerHTML = '<div class="wrap">' +
      '<section class="hh"><div class="hh-text"><p class="hpill">Free · built from the official question bank</p><h1>Study for the SAT, one clear step at a time</h1>' +
      '<p class="lede">Short guides, lessons and ' + mfmt(nAll) + ' real practice questions with College Board’s own answers. Pick a subject to start.</p>' +
      '<p class="row hh-cta"><a class="btn big" href="#math">Start Math</a><a class="btn big ghost" href="#start">Start Reading &amp; Writing</a></p>' + cont + '</div>' +
      '<div class="hh-stats" aria-label="At a glance">' +
        '<div class="hstat"><b>' + mfmt(nAll) + '</b><span>real questions, with official answers</span></div>' +
        '<div class="hstat"><b>' + MORDER.length + '</b><span>math question types, each with a method</span></div>' +
        '<div class="hstat"><b>' + MD.desmos.length + '</b><span>Desmos moves, checked on ' + MD.nver + ' real questions</span></div>' +
        '<div class="hstat"><b>19</b><span>grammar lessons covering every rule tested</span></div>' +
      '</div></section>' +
      '<section class="hsec"><div class="hsec-h"><h2 class="h2">Choose a subject</h2><p class="muted">Each subject starts with a short guide, then lessons, then practice.</p></div><div class="hsubjs">' +
        card('rw', 'Reading passages, grammar and transitions. 54 questions on the test, in two parts of 32 minutes.', [mfmt(nRW) + ' bank questions studied', 'A routine for every question type']) +
        card('math', 'Algebra, advanced math, data and geometry. 44 questions on the test, in two parts of 35 minutes.', [mfmt(MQ.length) + ' real questions to practice', MD.patterns.length + ' big patterns', 'Desmos playbook']) +
      '</div></section>' +
      '<section class="hsec"><div class="hsec-h"><h2 class="h2">Everything in one place</h2><p class="muted">Jump straight to the part you need.</p></div><div class="hfeats">' +
        feat('math', 'target', 'Math practice', 'Real questions by skill, pattern or difficulty, with the method after each one.', 'm-practice') +
        feat('math', 'graph', 'Desmos playbook', MD.desmos.length + ' calculator moves with exactly what to type.', 'm-desmos') +
        feat('math', 'grid', 'Big patterns', 'The ideas that connect math question types.', 'm-patterns') +
        feat('math', 'search', 'Question finder', 'Type words from a question to see how to solve it.', 'm-types') +
        feat('rw', 'bolt', 'Grammar in 60 seconds', 'Look, check, confirm: one check per question.', 'method') +
        feat('rw', 'book', 'Reading routine', 'Job, Chunk, Say, Check, with worked examples.', 'reading') +
        feat('rw', 'pen', 'Drills', 'Short drills on real questions for the slow steps.', 'drills') +
        feat('rw', 'target', 'Timed practice', 'Real reading and grammar questions against the clock.', 'practice') +
      '</div></section>' +
      '<section class="hsec hhow"><div class="hsec-h"><h2 class="h2">How to use this site</h2></div><ol class="hsteps">' +
        '<li><b>Pick a subject.</b><span>Use Home, Reading &amp; Writing and Math at the top of every page.</span></li>' +
        '<li><b>Read “Start here”.</b><span>Five minutes. It tells you what the test asks and the routine to use.</span></li>' +
        '<li><b>Learn one lesson, then practice it.</b><span>Every lesson ends with a button for real questions on just that topic.</span></li>' +
        '<li><b>Come back any time.</b><span>Progress is saved on this device' + (mt ? ': ' + plural(mt, 'math question') + ' practiced so far' : '') + '.</span></li>' +
      '</ol></section>' +
      '<section class="hband"><div><h2 class="h2">Something missing, or a tip to share?</h2><p>Tell us what to add or change, or leave a tip for other students.</p></div><a class="btn big" href="#suggest">Suggest a change</a></section>' +
      '</div>';
  }

  /* ---------- Suggest a change, and private notes ---------- */
  var SUGGEST_REPO = 'https://github.com/rk68193-sys/SAT-Method/issues/new';
  var SG_KINDS = [['add', 'Add something'], ['change', 'Change something'], ['tip', 'A tip for students'], ['wrong', 'Something is wrong']];
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
      '<header class="mhead"><p class="eyebrow">Help improve this site</p><h2 class="vtitle">Suggest a change</h2></header>' +
      '<p class="whatbox"><span class="sec-i">' + ICON.info + '</span><span><b>What is this?</b> Tell us what you would like added or changed, report a mistake, or leave a short tip for other students. Every idea is read.</span></p>' +
      '<form class="sgform" id="sg-form" novalidate>' +
        seg('sg-kind', '1 · What kind of idea?', SG_KINDS, 'add') +
        '<label class="field"><span class="label">2 · Which part of the site?</span><select id="sg-where">' + where.map(function (w) { return '<option value="' + w[0] + '">' + esc(w[1]) + '</option>'; }).join('') + '</select></label>' +
        '<label class="field"><span class="label">3 · Your idea</span><textarea id="sg-text" rows="6" maxlength="2000" required placeholder="For example: a lesson on percent word problems, or a tip that helped you with transitions."></textarea><span class="sg-count muted" id="sg-count" aria-live="polite">0 / 2000</span></label>' +
        '<label class="field"><span class="label">Your name (optional)</span><input type="text" id="sg-name" maxlength="60" autocomplete="nickname"></label>' +
        '<p class="row sg-actions"><button class="btn big" type="submit">Send on GitHub</button><button class="btn big ghost" type="button" id="sg-copy">Copy my suggestion</button></p>' +
        '<p class="fine">“Send on GitHub” opens a ready-filled form on GitHub, the site’s home; posting needs a free GitHub account. No account? Copy your suggestion and send it to whoever shared this site with you.</p>' +
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
    function kindLine(c) { return 'Suggestion: ' + c.kindName; }
    function remember(c) {
      store.g[String(Date.now())] = { k: c.kindName, w: c.where, t: c.text.slice(0, 2000) }; save(); drawMine();
    }
    function check(c) {
      if (c.text.length < 3) { msg.className = 'sg-msg bad'; msg.textContent = 'Please write your idea first.'; focusQuiet(text); return false; }
      return true;
    }
    text.addEventListener('input', function () { $('#sg-count').textContent = text.value.length + ' / 2000'; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = current();
      if (!check(c)) { return; }
      var title = c.kindName + ': ' + c.text.replace(/\s+/g, ' ').slice(0, 60) + (c.text.length > 60 ? '…' : '');
      var url = SUGGEST_REPO + '?title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(asText(c) + '\n\n(Sent from the site’s Suggest page.)');
      remember(c);
      window.open(url, '_blank', 'noopener');
      msg.className = 'sg-msg ok'; msg.textContent = 'GitHub opened in a new tab with your suggestion filled in. Press “Submit new issue” there to send it. A copy is saved below.';
    });
    $('#sg-copy').addEventListener('click', function () {
      var c = current();
      if (!check(c)) { return; }
      var done = function () { remember(c); msg.className = 'sg-msg ok'; msg.textContent = 'Copied. Paste it into a message or email. A copy is saved below.'; };
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
      host.innerHTML = '<h3 class="h2">Your suggestions on this device</h3><ul class="sglist">' + keys.map(function (k) {
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
