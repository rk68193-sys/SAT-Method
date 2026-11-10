  /* =================== Math: the calculator panel, and module mode =================== */
  /* ---------- calculator: College Board's version of Desmos, in a panel beside the question ---------- */
  var MCALC_URL = 'https://www.desmos.com/testing/collegeboard/graphing';
  function mCalcOpen() { var el = document.getElementById('mcalc'); return !!el && !el.hidden; }
  function mCalcBtn() {
    return '<button class="btn ghost sm mcalc-btn" type="button" data-calc aria-pressed="' + (mCalcOpen() ? 'true' : 'false') + '">' + ICON.calc + '<span>Calculator</span></button>';
  }
  function mCalcShow(open) {
    var el = document.getElementById('mcalc');
    if (!el) {
      if (!open) { return; }
      el = document.createElement('aside'); el.id = 'mcalc'; el.className = 'mcalc'; el.setAttribute('aria-label', 'Graphing calculator');
      el.innerHTML = '<div class="mcalc-bar"><b>Calculator</b><span class="muted">Desmos, as on the test</span><a class="linkbtn" href="' + MCALC_URL + '" target="_blank" rel="noopener">Open in a new tab</a><button class="btn sm" type="button" data-calc-close>Close</button></div>' +
        '<iframe title="Desmos graphing calculator, College Board version" src="' + MCALC_URL + '"></iframe>';
      document.body.appendChild(el);
    }
    el.hidden = !open;
    document.body.classList.toggle('calc-open', !!open);
    $$('[data-calc]').forEach(function (b) { b.setAttribute('aria-pressed', open ? 'true' : 'false'); });
    /* on a phone the panel covers the lower part of the screen, so bring the question to the top */
    var card = open && narrow() ? $('#v-mprac .mpcard') : null;
    if (card) { try { card.scrollIntoView({ block: 'start' }); } catch (e) {} }
  }
  function mCalcReset() { var el = document.getElementById('mcalc'); if (el) { mCalcShow(false); el.parentNode.removeChild(el); } }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-calc],[data-calc-close]') : null;
    if (!b) { return; }
    if (b.hasAttribute('data-calc-close')) { mCalcShow(false); focusQuiet($('[data-calc]')); return; }
    mCalcShow(!mCalcOpen());
  });

  /* ---------- module mode: one clock for the whole set, answers at the end ---------- */
  var MM_N = 22, MM_SECS = 35 * 60;
  var MM_MIX = { alg: 8, adv: 8, psda: 3, geo: 3 };   /* the test plan's shares of a 22-question module */
  var MM_ORD = { E: 0, M: 1, H: 2 };
  function mmLimit(n) { return Math.round(n * MM_SECS / MM_N); }
  function mmPick(st) {
    var pool = shuffle(mpPool(st).slice()), out;
    if (st.topic === 'all' && st.diff === 'all' && pool.length >= MM_N) {
      var need = {}, rest = [];
      Object.keys(MM_MIX).forEach(function (k) { need[k] = MM_MIX[k]; });
      out = [];
      pool.forEach(function (q) { var d = MDOM[q.k].id; if (need[d] > 0) { need[d] -= 1; out.push(q); } else { rest.push(q); } });
      out = out.concat(rest.slice(0, MM_N - out.length));
    } else { out = pool.slice(0, MM_N); }
    /* easier questions first, as on the test; the shuffle decides the order inside each difficulty */
    return out.map(function (q, i) { return [q, i]; }).sort(function (a, b) { return MM_ORD[a[0].d] - MM_ORD[b[0].d] || a[1] - b[1]; }).map(function (x) { return x[0]; });
  }
  function mmStart(st) {
    var qs = mmPick(st);
    if (!qs.length) { return; }
    clearInterval(mpInterval);
    mCalcReset();
    MP = { module: true, qs: qs, i: 0, ans: qs.map(function () { return ''; }), flag: qs.map(function () { return false; }), cross: qs.map(function () { return {}; }),
      spent: qs.map(function () { return 0; }), limit: mmLimit(qs.length), acc: 0, t0: 0, over: false, hide: false, warned: false, res: [], timer: true, settings: st };
    mmShell(); mmShow(0);
    MP.t0 = now();
    mpInterval = setInterval(mmTick, 500); mmTick();
  }
  function mmUsed() { return (MP.acc + (MP.t0 ? now() - MP.t0 : 0)) / 1000; }
  /* stop both clocks: the module's, and the time spent on the question in view */
  function mmBank() { if (MP.t0) { var d = now() - MP.t0; MP.acc += d; MP.spent[MP.i] += d; MP.t0 = 0; } }
  function mmPause() { if (MP && MP.module && !MP.over) { mmBank(); } }
  function mmResume() { if (MP && MP.module && !MP.over && !MP.t0) { MP.t0 = now(); } }
  function mmTick() {
    if (!MP || !MP.module || MP.over) { clearInterval(mpInterval); return; }
    var left = MP.limit - mmUsed(), el = document.getElementById('mm-clock');
    if (left <= 0) { mmFinish(true); return; }
    var late = left <= 300 && MP.limit > 600;
    if (el) {
      el.textContent = MP.hide && !late ? '–:––' : clock(Math.ceil(left));
      el.classList.toggle('late', late);
    }
    if (late && !MP.warned) { MP.warned = true; var live = document.getElementById('mm-live'); if (live) { live.textContent = '5 minutes left in this module.'; } var hb = document.getElementById('mm-hide'); if (hb) { hb.hidden = true; } }
  }
  function mmAnswered(i) { return String(MP.ans[i]).trim() !== ''; }
  function mmShell() {
    viewEl.mprac.innerHTML = '<div class="wrap mpwrap mmwrap">' +
      '<div class="mpbar mmbar"><span class="mpbar-pos" id="mm-pos"></span>' +
        '<span class="mm-clockbox"><span class="mpclock" id="mm-clock" role="timer" aria-label="Time left in this module">' + clock(MP.limit) + '</span><button class="linkbtn" type="button" id="mm-hide" aria-pressed="false">Hide clock</button></span>' +
        '<span class="mmbar-tools">' + mCalcBtn() + '<button class="btn ghost sm" type="button" id="mm-open-nav" aria-expanded="false" aria-controls="mm-nav">All questions</button><button class="linkbtn" type="button" id="mm-finish">Finish</button></span>' +
        '<span class="sr" id="mm-live" aria-live="polite"></span></div>' +
      '<section class="mm-nav" id="mm-nav" aria-label="All questions in this module" tabindex="-1" hidden></section>' +
      '<article class="mpcard" id="mm-card"></article></div>';
    $('#mm-hide').addEventListener('click', function () {
      MP.hide = !MP.hide;
      this.setAttribute('aria-pressed', MP.hide ? 'true' : 'false'); this.textContent = MP.hide ? 'Show clock' : 'Hide clock';
      mmTick();
    });
    $('#mm-open-nav').addEventListener('click', function () { mmNav($('#mm-nav').hidden, false); });
    $('#mm-finish').addEventListener('click', function () { mmNav(true, true); });
    $('#mm-nav').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-go],[data-mm-do]') : null;
      if (!b) { return; }
      if (b.hasAttribute('data-go')) { mmNav(false, false); mmGo(Number(b.getAttribute('data-go'))); return; }
      if (b.getAttribute('data-mm-do') === 'finish') { mmFinish(false); } else { mmNav(false, false); }
    });
  }
  /* the list of every question; with confirm, it is also the last check before finishing */
  function mmNav(open, confirm) {
    var host = $('#mm-nav'), btn = $('#mm-open-nav');
    if (!host) { return; }
    host.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) { return; }
    var blank = 0, flags = 0;
    MP.qs.forEach(function (q, i) { if (!mmAnswered(i)) { blank += 1; } if (MP.flag[i]) { flags += 1; } });
    host.innerHTML = (confirm
      ? '<div class="mm-confirm"><p><b>Finish the module now?</b> ' + (blank ? plural(blank, 'question') + ' ' + (blank === 1 ? 'has' : 'have') + ' no answer' : 'Every question has an answer') + (flags ? ', and ' + flags + ' ' + (flags === 1 ? 'is' : 'are') + ' marked for review' : '') + '. You cannot change answers after this.</p>' +
        '<p class="row"><button class="btn" type="button" data-mm-do="finish">Finish and see my results</button><button class="btn ghost" type="button" data-mm-do="stay">Keep working</button></p></div>'
      : '') +
      '<p class="mm-nav-h"><b>All questions</b> <span class="muted">Tap a number to go to it.</span></p><div class="mm-nav-grid">' +
      MP.qs.map(function (q, i) {
        var a = mmAnswered(i);
        return '<button type="button" class="mm-n' + (a ? ' ans' : '') + (MP.flag[i] ? ' flag' : '') + (i === MP.i ? ' cur' : '') + '" data-go="' + i + '" aria-label="Question ' + (i + 1) + ', ' + (a ? 'answered' : 'no answer') + (MP.flag[i] ? ', marked for review' : '') + (i === MP.i ? ', the one you are on' : '') + '">' + (i + 1) + '</button>';
      }).join('') + '</div>' +
      '<p class="mm-key"><span><i class="mm-n ans" aria-hidden="true"></i>Answered</span><span><i class="mm-n" aria-hidden="true"></i>No answer</span><span><i class="mm-n flag" aria-hidden="true"></i>Marked for review</span></p>';
    if (narrow() || confirm) { try { host.scrollIntoView({ block: 'start' }); } catch (e) {} }
    focusQuiet(confirm ? $('[data-mm-do="finish"]', host) : host);
  }
  function mmGo(i) {
    if (!MP || !MP.module || MP.over || i < 0 || i >= MP.qs.length) { return; }
    var run = !!MP.t0;
    mmBank(); mmShow(i);
    if (run) { MP.t0 = now(); }
  }
  function mmShow(i) {
    MP.i = i;
    var q = MP.qs[i], last = i === MP.qs.length - 1, given = MP.ans[i], X = MP.cross[i];
    MP.cur = { q: q, t0: 0, acc: 0, done: false };          /* for the full-size viewer */
    $('#mm-pos').innerHTML = '<b>Question ' + (i + 1) + '</b> of ' + MP.qs.length;
    var ans = q.mc
      ? '<div class="mpchoices mmchoices" role="group" aria-label="Your answer">' + ['A', 'B', 'C', 'D'].map(function (L, n) {
          return '<div class="mmch"><button class="mpch' + (given === L ? ' sel' : '') + (X[L] ? ' crossed' : '') + '" type="button" data-k="' + L + '" aria-pressed="' + (given === L ? 'true' : 'false') + '"><span class="mpch-l">' + L + '</span><span class="kbd">' + (n + 1) + '</span></button>' +
            '<button class="mmx" type="button" data-x="' + L + '" aria-pressed="' + (X[L] ? 'true' : 'false') + '" aria-label="Cross out choice ' + L + '">' + (X[L] ? 'Undo' : 'Cross out') + '</button></div>';
        }).join('') + '</div><p class="fine">Choose the letter of your answer. You can change it until you finish. “Cross out” marks a choice you have ruled out.</p>'
      : '<div class="mpgrid"><label class="field"><span class="label">Type your answer</span><input type="text" id="mm-gin" inputmode="decimal" autocomplete="off" placeholder="e.g. 12, −3, 7/6 or 2.5" value="' + esc(given) + '"></label></div><p class="fine" id="mm-ghint">Numbers only. Fractions like 7/6 are fine; leave out units. Saved as you type.</p>';
    var card = $('#mm-card');
    card.innerHTML = '<header class="mpcard-h"><b class="mm-qn">Question ' + (i + 1) + '</b><span class="muted">' + (q.mc ? 'Multiple choice' : 'Type in your answer') + '</span>' +
        '<label class="checkline mm-flag"><input type="checkbox" id="mm-flag"' + (MP.flag[i] ? ' checked' : '') + '> Mark for review</label></header>' +
      '<div class="mpq">' + mImg('q', q) + '</div><p class="mpzoom"><button class="linkbtn" type="button" data-zoom="q">See the question larger</button></p>' + ans +
      '<p class="row mm-step"><button class="btn ghost" type="button" id="mm-back"' + (i ? '' : ' disabled') + '>Back</button><button class="btn" type="button" id="mm-next">' + (last ? 'Review and finish' : 'Next') + '</button></p>';
    $('#mm-flag').addEventListener('change', function () { MP.flag[MP.i] = this.checked; });
    $('#mm-back').addEventListener('click', function () { mmGo(MP.i - 1); });
    $('#mm-next').addEventListener('click', mmNext);
    if (q.mc) {
      $$('.mpch', card).forEach(function (b) { b.addEventListener('click', function () { mmChoose(b.getAttribute('data-k')); }); });
      $$('.mmx', card).forEach(function (b) { b.addEventListener('click', function () { mmCross(b.getAttribute('data-x')); }); });
    } else {
      $('#mm-gin').addEventListener('input', function () {
        MP.ans[MP.i] = this.value;
        var bad = this.value.trim() && isNaN(mpNum(this.value));
        $('#mm-ghint').textContent = bad ? 'That is not a number yet. Use digits, a minus sign, a decimal point or a fraction such as 7/6.' : 'Numbers only. Fractions like 7/6 are fine; leave out units. Saved as you type.';
      });
      $('#mm-gin').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); mmNext(); } });
    }
    window.scrollTo(0, 0);
    var first = q.mc ? $('.mpch.sel', card) || $('.mpch', card) : $('#mm-gin');
    if (first && !narrow()) { focusQuiet(first); }
  }
  function mmNext() { if (MP.i < MP.qs.length - 1) { mmGo(MP.i + 1); } else { mmNav(true, true); } }
  function mmPaintChoices() {
    var given = MP.ans[MP.i], X = MP.cross[MP.i];
    $$('#mm-card .mmch').forEach(function (row) {
      var b = $('.mpch', row), x = $('.mmx', row), L = b.getAttribute('data-k');
      b.classList.toggle('sel', given === L); b.setAttribute('aria-pressed', given === L ? 'true' : 'false');
      b.classList.toggle('crossed', !!X[L]);
      x.setAttribute('aria-pressed', X[L] ? 'true' : 'false'); x.textContent = X[L] ? 'Undo' : 'Cross out';
    });
  }
  function mmChoose(L) {
    if (!MP.qs[MP.i].mc || 'ABCD'.indexOf(L) === -1) { return; }
    MP.ans[MP.i] = MP.ans[MP.i] === L ? '' : L;
    if (MP.ans[MP.i]) { delete MP.cross[MP.i][L]; }
    mmPaintChoices();
  }
  function mmCross(L) {
    var X = MP.cross[MP.i];
    if (X[L]) { delete X[L]; } else { X[L] = 1; if (MP.ans[MP.i] === L) { MP.ans[MP.i] = ''; } }
    mmPaintChoices();
  }
  function mmKey(e, key, tag) {
    if (!MP || !MP.module) { return; }
    if (MP.over) {
      if (MP.rev != null && key === 'Enter' && tag !== 'BUTTON' && tag !== 'A' && tag !== 'SUMMARY') { e.preventDefault(); mmReview(Math.min(MP.rev + 1, MP.qs.length - 1)); }
      return;
    }
    if (!$('#mm-nav').hidden) { return; }
    var k = key.toUpperCase(), n = ['1', '2', '3', '4'].indexOf(key);
    if (n !== -1) { k = 'ABCD'[n]; }
    if (MP.qs[MP.i].mc && k.length === 1 && 'ABCD'.indexOf(k) !== -1) { e.preventDefault(); if (MP.ans[MP.i] !== k) { mmChoose(k); } }
    else if (key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') { e.preventDefault(); mmNext(); }
  }

  /* ---------- finishing: grade, save, results ---------- */
  function mmFinish(timeUp) {
    if (!MP || !MP.module || MP.over) { return; }
    mmBank(); clearInterval(mpInterval); mCalcShow(false);
    MP.over = true; MP.timeUp = !!timeUp; MP.used = Math.min(MP.limit, Math.round(MP.acc / 1000)); MP.rev = null;
    var ts = Date.now(), right = 0;
    MP.res = MP.qs.map(function (q, i) {
      var given = String(MP.ans[i]).trim(), ok = null;
      if (given) { ok = q.mc ? given === q.a : mpGridOK(given, q.a) === true; }
      var secs = Math.round(MP.spent[i] / 1000);
      /* a question left blank counts against the module, but is not saved as a miss */
      if (ok !== null) { store.m[q.id] = [ok ? 1 : 0, secs, ts]; }
      if (ok) { right += 1; }
      return { id: q.id, ok: ok, secs: secs, given: given, flag: !!MP.flag[i] };
    });
    var hist = Array.isArray(store.s.modules) ? store.s.modules.filter(isObj) : [];
    hist.push({ t: ts, n: MP.qs.length, r: right, s: MP.used, l: MP.limit });
    store.s.modules = hist.slice(-20);
    save();
    mmResults();
  }
  function mmResults() {
    MP.rev = null;
    var res = MP.res, n = res.length;
    var right = res.filter(function (r) { return r.ok === true; }).length, wrong = res.filter(function (r) { return r.ok === false; }).length, blank = n - right - wrong;
    var answered = right + wrong, avg = answered ? Math.round(res.reduce(function (a, r) { return a + (r.ok === null ? 0 : r.secs); }, 0) / answered) : 0;
    var areas = MD.domains.map(function (d) {
      var L = res.filter(function (r) { return MDOM[MQBY[r.id].k].id === d.id; }), ok = L.filter(function (r) { return r.ok === true; }).length;
      return L.length ? '<div class="mprog-row"><span>' + esc(d.name) + '</span><span class="mbar"><i style="width:' + mpc(ok, L.length) + '%"></i></span><span class="num">' + ok + ' of ' + L.length + ' right</span></div>' : '';
    }).join('');
    var seen = {}, review = [];
    res.forEach(function (r) { if (r.ok === true) { return; } var m = MSTBY[MST.questions[r.id].method]; if (!seen[m.id]) { seen[m.id] = 1; review.push(m); } });
    var missedIds = res.filter(function (r) { return r.ok === false; }).map(function (r) { return r.id; });
    var notRight = res.filter(function (r) { return r.ok !== true; });
    viewEl.mprac.innerHTML = '<div class="wrap">' +
      mHead('Math · Timed module', 'You got ' + right + ' of ' + n + ' right', (MP.timeUp ? 'Time ran out. ' : '') + 'You used ' + clock(MP.used) + ' of ' + clock(MP.limit) + (answered ? ', about ' + avg + ' seconds for each question you answered. The real test allows about 95.' : '.')) +
      '<div class="mst-stats mm-stats"><div><b>' + right + '</b><span>right</span></div><div><b>' + wrong + '</b><span>wrong</span></div><div><b>' + blank + '</b><span>no answer</span></div><div><b>' + clock(MP.used) + '</b><span>of ' + clock(MP.limit) + ' used</span></div></div>' +
      '<section class="msec"><h3 class="h3">By area</h3><div class="mprog">' + areas + '</div></section>' +
      (review.length ? '<section class="msec"><h3 class="h3">Question types to review</h3><div class="mm-nexts">' + review.slice(0, 6).map(function (m) { return mmCardHTML(m, mTypeStat(m)); }).join('') + '</div>' + (review.length > 6 ? '<p class="fine" style="margin-top:.8rem">And ' + (review.length - 6) + ' more. They are all on <a href="#m-map">your map</a>.</p>' : '') + '</section>' : '<p class="mpraise">Every one right. Try a module of Hard questions.</p>') +
      '<section class="msec"><h3 class="h3">Your answers</h3><p class="muted">Open any question to see College Board’s explanation and the method. On a miss, tap what went wrong.</p><ol class="mpsum mmsum">' + res.map(function (r, i) {
        var q = MQBY[r.id];
        return '<li class="' + (r.ok ? 'ok' : (r.ok === null ? 'mm-blank' : 'no')) + '"><span class="mpsum-v">' + (r.ok ? '✓' : (r.ok === null ? '–' : '✗')) + '</span><span><b>' + (i + 1) + '.</b> ' + esc(MTY[q.t].name) + ' <span class="muted">· ' + MDIFF[q.d] + ' · ' + (r.ok === null ? 'no answer' : r.secs + ' s') + (r.flag ? ' · marked for review' : '') + '</span></span><button class="linkbtn" type="button" data-rev="' + i + '">Review</button></li>';
      }).join('') + '</ol></section>' +
      mWhySetHTML(missedIds) +
      '<p class="row" style="margin-top:1.5rem">' + (notRight.length ? '<button class="btn big" type="button" id="mm-rev-miss">Review what I missed</button>' : '') + '<button class="btn' + (notRight.length ? ' ghost' : ' big') + '" type="button" id="mm-new">New module</button>' + (notRight.length ? '<button class="btn ghost" type="button" id="mm-retry">Retry them, one at a time</button>' : '') + '<a class="btn ghost" href="#m-map">See my map</a></p></div>';
    $$('[data-rev]', viewEl.mprac).forEach(function (b) { b.addEventListener('click', function () { mmReview(Number(b.getAttribute('data-rev'))); }); });
    $('#mm-new').addEventListener('click', function () { mpModePreset = 'module'; mpSetup(); window.scrollTo(0, 0); });
    var rm = $('#mm-rev-miss'), rt = $('#mm-retry');
    if (rm) { rm.addEventListener('click', function () { mmReview(res.indexOf(notRight[0])); }); }
    if (rt) { rt.addEventListener('click', function () { MP = { qs: notRight.map(function (r) { return MQBY[r.id]; }), i: 0, res: [], timer: false, over: false }; mpShow(); }); }
    window.scrollTo(0, 0);
  }
  /* one question of a finished module, with the answer you gave, the method and the explanation */
  function mmReview(i) {
    if (!MP || !MP.module || !MP.over || !MP.res[i]) { return; }
    MP.rev = i;
    var r = MP.res[i], q = MQBY[r.id], n = MP.res.length;
    MP.cur = { q: q, t0: 0, acc: 0, done: true };
    var yours = q.mc
      ? '<div class="mpchoices" role="group" aria-label="Your answer and the right answer">' + ['A', 'B', 'C', 'D'].map(function (L) { return '<button class="mpch' + (L === q.a ? ' right' : (L === r.given ? ' wrong' : '')) + '" type="button" disabled><span class="mpch-l">' + L + '</span></button>'; }).join('') + '</div>'
      : '';
    viewEl.mprac.innerHTML = '<div class="wrap mpwrap">' +
      '<div class="mpbar"><span class="mpbar-pos"><b>Review · question ' + (i + 1) + '</b> of ' + n + '</span><span class="mpbar-dots" aria-hidden="true">' + MP.res.map(function (x, j) { return '<i class="' + (x.ok ? 'ok' : (x.ok === null ? '' : 'no')) + (j === i ? ' at' : '') + '"></i>'; }).join('') + '</span><button class="linkbtn" type="button" id="mm-rev-back">Back to results</button></div>' +
      '<article class="mpcard"><header class="mpcard-h"><span class="mtag">' + esc(MSK[q.k].name) + '</span><span class="mdiff d' + q.d + '">' + MDIFF[q.d] + '</span><span class="muted">' + (q.mc ? 'Multiple choice' : 'Type in your answer') + (r.flag ? ' · you marked this for review' : '') + '</span></header>' +
        '<div class="mpq">' + mImg('q', q) + '</div><p class="mpzoom"><button class="linkbtn" type="button" data-zoom="q">See the question larger</button></p>' + yours +
        '<p class="mm-yours">' + (r.ok === null ? 'You left this one blank.' : 'Your answer: <b>' + esc(r.given) + '</b>') + '</p>' +
        '<div class="mpfb ' + (r.ok ? 'ok' : 'no') + '" id="mp-fb" tabindex="-1">' + mFeedbackHTML(q, r.ok, r.ok === null ? null : r.secs) + '</div>' +
        '<p class="row mm-step"><button class="btn ghost" type="button" id="mm-rev-prev"' + (i ? '' : ' disabled') + '>Previous</button><button class="btn" type="button" id="mm-rev-next">' + (i < n - 1 ? 'Next question' : 'Back to results') + '</button></p></article></div>';
    $('#mm-rev-back').addEventListener('click', mmResults);
    $('#mm-rev-prev').addEventListener('click', function () { mmReview(i - 1); });
    $('#mm-rev-next').addEventListener('click', function () { if (i < n - 1) { mmReview(i + 1); } else { mmResults(); } });
    window.scrollTo(0, 0);
  }

