  /* =================== Reading and Writing: the timed module =================== */
  /* One part of the real section: 27 questions on a single 32-minute clock, in the order the test asks them
     (Craft and Structure, Information and Ideas, Standard English Conventions, Expression of Ideas), easier first inside each. */
  var RM = null;                         /* the module in progress, or the one just finished */
  var rmModePreset = null;               /* 'module' from a link such as #rw-module */
  var RM_N = 27, RM_SECS = 32 * 60, RM_PACE = 71;
  var RM_MIX = { cs: 8, ii: 7, sec: 7, eoi: 5 };
  var RM_ORD = { Easy: 0, Medium: 1, Hard: 2 };
  var RM_KIND = { g: 'Grammar', a: 'Grammar', r: 'Reading', q: 'Reading', v: 'Table or graph', n: 'Notes', x: 'Transition' };
  /* the short label beside the question number; it comes from the question's type, so a notes question that is also a
     worked example still says Notes */
  function rmKind(it) {
    var t = RWTBY[rwTypeOf(it)];
    if (!t) { return RM_KIND[it.t]; }
    if (t.kind === 'g') { return t.part === 'C' ? 'Transition' : 'Grammar'; }
    return t.group === 'Rhetorical Synthesis' ? 'Notes' : /^(Table|Graph)/.test(t.name) ? 'Table or graph' : 'Reading';
  }
  function rmLimit(n) { return Math.round(n * RM_SECS / RM_N); }
  function rmPool(st) { rwItems(); return matching({ src: 'both', part: 'all', diff: st.diff, which: st.which }); }
  function rmPick(st) {
    var pool = shuffle(rmPool(st).slice()), need = {}, out = [], rest = [], D4 = RW_DOMS.map(function (d) { return d[0]; });
    D4.forEach(function (k) { need[k] = RM_MIX[k]; });
    pool.forEach(function (it) { var d = rwDomain(it); if (need[d] > 0) { need[d] -= 1; out.push(it); } else { rest.push(it); } });
    return rmOrder(out.concat(rest.slice(0, RM_N - out.length)));
  }
  /* the test's order: the four areas; inside an area the kinds of question stay together (words, then structure, then
     paired texts; ideas, then evidence, then inference; transitions, then notes); easier first inside each kind */
  function rmOrder(out) {
    var D4 = RW_DOMS.map(function (d) { return d[0]; });
    function grp(it) {
      var t = RWTBY[rwTypeOf(it)], d = rwDomain(it);
      if (!t) { return 0; }
      if (d === 'cs') { return t.gi; }
      if (d === 'ii') { return t.si <= 2 ? 0 : t.si === 3 ? 2 : 1; }
      if (d === 'eoi') { return t.kind === 'r' ? 1 : 0; }
      return 0;
    }
    return out.map(function (it, i) { return [it, i]; }).sort(function (a, b) {
      return D4.indexOf(rwDomain(a[0])) - D4.indexOf(rwDomain(b[0])) || grp(a[0]) - grp(b[0]) || RM_ORD[a[0].d] - RM_ORD[b[0].d] || a[1] - b[1];
    }).map(function (x) { return x[0]; });
  }
  function rmCard(it, o) {
    return it.t === 'g' ? QCard(it.ex, { split: true, meta: o.meta, onAnswer: o.onAnswer, after: o.after })
      : it.t === 'r' ? RCard(it.x, o) : it.t === 'n' || it.t === 'x' ? BCard(it.b, it.t, o) : QBCard(it.b, o);
  }
  function rmDrop() { if (RM) { if (!RM.over) { modStop(RM); } RM = null; } }
  function rmStart(st) { rmRun(rmPick(st), { settings: st }); }
  /* the starting check: ten questions, one at each difficulty from every area (Easy, Medium and Hard from the two reading
     areas; two each from grammar and from transitions and notes), ones you have not tried when there are any */
  var RD_PLAN = [['cs', ['Easy', 'Medium', 'Hard']], ['ii', ['Easy', 'Medium', 'Hard']], ['sec', ['Easy', 'Medium']], ['eoi', ['Medium', 'Hard']]];
  function rdPick() {
    var all = rwItems(), used = {}, out = [];
    RD_PLAN.forEach(function (row) {
      row[1].forEach(function (d) {
        var pool = all.filter(function (it) { return it.d === d && !used[it.id] && rwDomain(it) === row[0]; });
        var fresh = pool.filter(function (it) { return !result(it); }), it = shuffle(fresh.length ? fresh : pool)[0];
        if (it) { used[it.id] = 1; out.push(it); }
      });
    });
    return rmOrder(out);
  }
  var rdIntroOn = false;                 /* the check's first screen is showing where the practice setup usually is */
  function rdIntro() {
    if (tclock) { tclock.halt(); }
    TS = null; tclock = null;
    rmDrop();
    rdIntroOn = true;
    var host = document.getElementById('thost');
    host.innerHTML = diagIntroHTML('rw');
    $('#diag-go-rw', host).addEventListener('click', function () { rmRun(rdPick(), { diag: true }); });
  }
  function rmRun(items, o) {
    if (!items.length) { return; }
    rdIntroOn = false;
    if (tclock) { tclock.halt(); }
    TS = null; tclock = null;
    rmDrop();
    var R = modNew({ p: 'rm', host: document.getElementById('thost'), wrap: 'mmwrap rmwrap', n: items.length, limit: rmLimit(items.length),
      kind: function (i) { return rmKind(items[i]); },
      answered: function (i) { return !!R.ans[i]; },
      draw: rmDraw, finish: rmFinish, alive: function () { return RM === R; } });
    R.items = items; R.ans = items.map(function () { return ''; }); R.cross = items.map(function () { return {}; }); R.settings = o.settings; R.diag = !!o.diag; R.res = []; R.rev = null;
    RM = R;
    modStart(R);
  }
  function rmPause() { if (RM) { modPause(RM); } }
  function rmResume() { if (RM && !document.hidden) { modResume(RM); } }
  function rmDraw(i, body) {
    var card = rmCard(RM.items[i], {});
    body.appendChild(card.el);
    $$('.opts li', body).forEach(function (li) {
      var k = $('.opt', li).getAttribute('data-k'), x = document.createElement('button');
      x.type = 'button'; x.className = 'mmx rmx'; x.setAttribute('data-x', k); x.setAttribute('aria-label', 'Cross out choice ' + k);
      li.classList.add('rmli'); li.appendChild(x);
    });
    /* the card would show the answer on a click; in a module a click only selects */
    body.addEventListener('click', function (e) {
      var x = e.target.closest ? e.target.closest('.rmx') : null, opt = e.target.closest ? e.target.closest('.opt') : null;
      if (!x && !opt) { return; }
      e.stopPropagation(); e.preventDefault();
      if (x) { rmCross(x.getAttribute('data-x')); } else { rmChoose(opt.getAttribute('data-k')); }
    }, true);
    rmPaint();
    var first = $('.opt.sel', body) || $('.opt', body);
    if (first && !narrow()) { focusQuiet(first); }
  }
  function rmPaint() {
    var given = RM.ans[RM.i], X = RM.cross[RM.i];
    $$('#rm-body .rmli').forEach(function (li) {
      var b = $('.opt', li), x = $('.rmx', li), k = b.getAttribute('data-k');
      b.classList.toggle('sel', given === k); b.setAttribute('aria-pressed', given === k ? 'true' : 'false');
      b.classList.toggle('crossed', !!X[k]);
      x.setAttribute('aria-pressed', X[k] ? 'true' : 'false'); x.textContent = X[k] ? 'Undo' : 'Cross out';
    });
  }
  function rmChoose(k) {
    if ('ABCD'.indexOf(k) === -1) { return; }
    RM.ans[RM.i] = RM.ans[RM.i] === k ? '' : k;
    if (RM.ans[RM.i]) { delete RM.cross[RM.i][k]; }
    rmPaint();
  }
  function rmCross(k) {
    var X = RM.cross[RM.i];
    if (X[k]) { delete X[k]; } else { X[k] = 1; if (RM.ans[RM.i] === k) { RM.ans[RM.i] = ''; } }
    rmPaint();
  }
  function rmKey(e, key, tag) {
    if (!RM) { return; }
    if (RM.over) {
      if (RM.rev != null && key === 'Enter' && tag !== 'BUTTON' && tag !== 'A' && tag !== 'SUMMARY' && tag !== 'TEXTAREA') { e.preventDefault(); rmReview(Math.min(RM.rev + 1, RM.n - 1)); }
      return;
    }
    if (modNavOpen(RM)) { return; }
    var k = key.toUpperCase(), n = ['1', '2', '3', '4'].indexOf(key);
    if (n !== -1) { k = 'ABCD'[n]; }
    if (k.length === 1 && 'ABCD'.indexOf(k) !== -1) { e.preventDefault(); if (RM.ans[RM.i] !== k) { rmChoose(k); } }
    else if (key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') { e.preventDefault(); modNext(RM); }
  }

  /* ---------- finishing: grade, save, results ---------- */
  function rmFinish(timeUp) {
    if (!RM || RM.over) { return; }
    RM.used = modStop(RM); RM.timeUp = !!timeUp; RM.rev = null;
    var right = 0;
    RM.res = RM.items.map(function (it, i) {
      var given = RM.ans[i], ok = given ? given === rwAns(it) : null, secs = Math.round(RM.spent[i] / 1000);
      /* a question left blank counts against the module, but is not saved as a miss; one marked for review is saved as unsure */
      if (ok !== null) {
        var a = practiceAttempt(result(it), ok, secs, RM_PACE, RM.flag[i] ? 'unsure' : 'skip');
        a.mode = 'module';
        store[bucketOf(it)][it.id] = a;
        srNote('rw', it.id, ok);
      }
      if (ok) { right += 1; }
      return { it: it, ok: ok, secs: secs, given: given, flag: !!RM.flag[i] };
    });
    if (RM.diag) { diagSave('rw', RM.res.map(function (r) { return { d: r.it.d.charAt(0), ok: r.ok === true }; })); }
    else {
      var hist = Array.isArray(store.s.rwmodules) ? store.s.rwmodules.filter(isObj) : [];
      hist.push({ t: Date.now(), n: RM.n, r: right, s: RM.used, l: RM.limit });
      store.s.rwmodules = hist.slice(-20);
    }
    save();
    rmResults();
  }
  function rmResults() {
    RM.rev = null;
    var res = RM.res, n = res.length;
    var right = res.filter(function (r) { return r.ok === true; }).length, wrong = res.filter(function (r) { return r.ok === false; }).length, blank = n - right - wrong;
    var answered = right + wrong, avg = answered ? Math.round(res.reduce(function (a, r) { return a + (r.ok === null ? 0 : r.secs); }, 0) / answered) : 0;
    var areas = RW_DOMS.map(function (d) {
      var L = res.filter(function (r) { return rwDomain(r.it) === d[0]; }), ok = L.filter(function (r) { return r.ok === true; }).length;
      return L.length ? '<div class="mprog-row"><span>' + d[1] + '</span><span class="mbar"><i style="width:' + pct(ok, L.length) + '%"></i></span><span class="num">' + ok + ' of ' + L.length + ' right</span></div>' : '';
    }).join('');
    var seen = {}, review = [];
    res.forEach(function (r) { if (r.ok === true) { return; } var t = RWTBY[RWQT[r.it.id]]; if (t && !seen[t.id]) { seen[t.id] = 1; review.push(t); } });
    var notRight = res.filter(function (r) { return r.ok !== true; });
    document.getElementById('thost').innerHTML =
      '<header class="read"><p class="eyebrow">' + (RM.diag ? 'Starting check finished' : 'Timed module finished') + '</p><h2 class="vtitle">You got ' + right + ' of ' + n + ' right</h2><p class="lede">' + (RM.timeUp ? 'Time ran out. ' : '') + 'You used ' + clock(RM.used) + ' of ' + clock(RM.limit) + (answered ? ', about ' + avg + ' seconds for each question you answered. The real test allows about 71.' : '.') + '</p></header>' +
      (RM.diag ? diagPanelHTML('rw') : '') +
      '<div class="mst-stats mm-stats rw"><div><b>' + right + '</b><span>right</span></div><div><b>' + wrong + '</b><span>wrong</span></div><div><b>' + blank + '</b><span>no answer</span></div><div><b>' + clock(RM.used) + '</b><span>of ' + clock(RM.limit) + ' used</span></div></div>' +
      '<h3 class="subh">By area</h3><div class="mprog">' + areas + '</div>' +
      (review.length ? '<h3 class="subh">Types to review</h3><div class="mm-nexts">' + review.slice(0, 6).map(function (t) { return rwCardHTML(t, rwStat(t)); }).join('') + '</div>' + (review.length > 6 ? '<p class="fine" style="margin-top:.8rem">And ' + (review.length - 6) + ' more. They are all on <a href="#rw-map">your map</a>.</p>' : '') : '<p class="subh">Every answer right.</p>') +
      '<h3 class="subh">Your answers</h3><p class="muted">Open any question to see the explanation. On a miss, tap what caused the difficulty.</p><ol class="mpsum mmsum">' + res.map(function (r, i) {
        var t = RWTBY[RWQT[r.it.id]];
        return '<li class="' + (r.ok ? 'ok' : (r.ok === null ? 'mm-blank' : 'no')) + '"><span class="mpsum-v">' + (r.ok ? '✓' : (r.ok === null ? '–' : '✗')) + '</span><span><b>' + (i + 1) + '.</b> ' + esc(t ? t.name : rmKind(r.it)) + ' <span class="muted">· ' + esc(r.it.d) + ' · ' + (r.ok === null ? 'no answer' : r.secs + ' s') + (r.flag ? ' · marked for review' : '') + '</span></span><button class="linkbtn" type="button" data-rm-rev="' + i + '">Review</button></li>';
      }).join('') + '</ol>' +
      rwCauseSetHTML(res.filter(function (r) { return r.ok === false; }).map(function (r) { return r.it; })) +
      '<p class="row" style="margin-top:1.5rem">' + (notRight.length ? '<button class="btn" type="button" id="rm-rev-miss">Review what I missed</button>' : '') + (RM.diag ? '<a class="btn' + (notRight.length ? ' ghost' : '') + '" href="#plan">Make my study plan</a>' : '<button class="btn' + (notRight.length ? ' ghost' : '') + '" type="button" id="rm-new">New module</button>') + (notRight.length ? '<button class="btn ghost" type="button" id="rm-retry">Retry them, one at a time</button>' : '') + '<a class="btn ghost" href="#rw-map">See my map</a></p>';
    var host = document.getElementById('thost');
    $$('[data-rm-rev]', host).forEach(function (b) { b.addEventListener('click', function () { rmReview(Number(b.getAttribute('data-rm-rev'))); }); });
    var nw = $('#rm-new'), rm = $('#rm-rev-miss'), rt = $('#rm-retry');
    if (nw) { nw.addEventListener('click', function () { rmModePreset = 'module'; timedSetup(); toTop(); }); }
    if (rm) { rm.addEventListener('click', function () { rmReview(res.indexOf(notRight[0])); }); }
    if (rt) { rt.addEventListener('click', function () { timedStart(notRight.map(function (r) { return r.it; }), tset()); }); }
    toTop();
  }
  /* one question of a finished module: the answer you gave, the explanation, and the cause */
  function rmReview(i) {
    if (!RM || !RM.over || !RM.res[i]) { return; }
    RM.rev = i;
    var r = RM.res[i], n = RM.res.length, host = document.getElementById('thost'), t = RWTBY[RWQT[r.it.id]];
    host.innerHTML = '<div class="mmwrap rmwrap">' +
      '<div class="mpbar"><span class="mpbar-pos"><b>Review · question ' + (i + 1) + '</b> of ' + n + '</span><span class="mpbar-dots" aria-hidden="true">' + RM.res.map(function (x, j) { return '<i class="' + (x.ok ? 'ok' : (x.ok === null ? '' : 'no')) + (j === i ? ' at' : '') + '"></i>'; }).join('') + '</span><button class="linkbtn" type="button" id="rm-rev-back">Back to results</button></div>' +
      '<article class="mpcard">' + (r.ok === null ? '<p class="mm-yours"><b>You left this one blank.</b> Try it now; this answer is not saved.</p>' : (r.flag ? '<p class="mm-yours muted">You marked this one for review.</p>' : '')) +
      '<div id="rm-revcard"></div><div id="rm-revcause"></div>' +
      '<p class="row mm-step"><button class="btn ghost" type="button" id="rm-rev-prev"' + (i ? '' : ' disabled') + '>Previous</button><button class="btn" type="button" id="rm-rev-next">' + (i < n - 1 ? 'Next question' : 'Back to results') + '</button></p></article></div>';
    var card = rmCard(r.it, { meta: 'Question ' + r.it.id + (t ? ' · ' + esc(t.name) : '') + ' · ' + esc(r.it.d), onAnswer: function () { return null; } });
    $('#rm-revcard').appendChild(card.el);
    toTop();
    if (r.given) { card.pick(r.given); }
    if (r.ok !== null) { reflectionBlock($('#rm-revcause'), r.it, null); }
    $('#rm-rev-back').addEventListener('click', rmResults);
    $('#rm-rev-prev').addEventListener('click', function () { rmReview(i - 1); });
    $('#rm-rev-next').addEventListener('click', function () { if (i < n - 1) { rmReview(i + 1); } else { rmResults(); } });
  }

