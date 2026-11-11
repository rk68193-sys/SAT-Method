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
  function mmStart(st) { mmRun(mmPick(st), { settings: st }); }
  /* the starting check: ten questions, one at each difficulty from every area (Easy, Medium and Hard from Algebra and from
     Advanced Math; two each from the smaller areas), ones you have not tried when there are any */
  var MD_PLAN = [['alg', 'EMH'], ['adv', 'EMH'], ['psda', 'EM'], ['geo', 'MH']];
  function mdPick() {
    var used = {}, out = [];
    MD_PLAN.forEach(function (row) {
      row[1].split('').forEach(function (d) {
        var pool = MQ.filter(function (q) { return MDOM[q.k].id === row[0] && q.d === d && !used[q.id]; });
        var fresh = pool.filter(function (q) { return !mDone(q.id); }), q = shuffle(fresh.length ? fresh : pool)[0];
        if (q) { used[q.id] = 1; out.push(q); }
      });
    });
    return out.map(function (q, i) { return [q, i]; }).sort(function (a, b) { return MM_ORD[a[0].d] - MM_ORD[b[0].d] || a[1] - b[1]; }).map(function (x) { return x[0]; });
  }
  function mdIntro() {
    clearInterval(mpInterval);
    MP = null;
    viewEl.mprac.innerHTML = '<div class="wrap">' + diagIntroHTML('m') + '</div>';
    $('#diag-go-m', viewEl.mprac).addEventListener('click', function () { mmRun(mdPick(), { diag: true }); });
  }
  function mmRun(qs, o) {
    if (!qs.length) { return; }
    clearInterval(mpInterval);
    mCalcReset();
    var R = modNew({ p: 'mm', host: viewEl.mprac, wrap: 'wrap mpwrap mmwrap', n: qs.length, limit: mmLimit(qs.length), tools: mCalcBtn(),
      kind: function (i) { return qs[i].mc ? 'Multiple choice' : 'Type in your answer'; },
      answered: function (i) { return String(R.ans[i]).trim() !== ''; },
      draw: mmDraw, finish: mmFinish, alive: function () { return MP === R; } });
    R.module = true; R.qs = qs; R.res = []; R.settings = o.settings; R.diag = !!o.diag; R.timer = true;
    R.ans = qs.map(function () { return ''; }); R.cross = qs.map(function () { return {}; });
    MP = R;
    modStart(R);
  }
  function mmPause() { if (MP && MP.module) { modPause(MP); } }
  function mmResume() { if (MP && MP.module) { modResume(MP); } }
  function mmDraw(i, body) {
    var q = MP.qs[i], given = MP.ans[i], X = MP.cross[i];
    MP.cur = { q: q, t0: 0, acc: 0, done: false };          /* for the full-size viewer */
    var ans = q.mc
      ? '<div class="mpchoices mmchoices" role="group" aria-label="Your answer">' + ['A', 'B', 'C', 'D'].map(function (L, n) {
          return '<div class="mmch"><button class="mpch' + (given === L ? ' sel' : '') + (X[L] ? ' crossed' : '') + '" type="button" data-k="' + L + '" aria-pressed="' + (given === L ? 'true' : 'false') + '"><span class="mpch-l">' + L + '</span><span class="kbd">' + (n + 1) + '</span></button>' +
            '<button class="mmx" type="button" data-x="' + L + '" aria-pressed="' + (X[L] ? 'true' : 'false') + '" aria-label="Cross out choice ' + L + '">' + (X[L] ? 'Undo' : 'Cross out') + '</button></div>';
        }).join('') + '</div><p class="fine mpch-note" data-txt="Choose your answer. You can change it until you finish. “Cross out” marks a choice you have ruled out.">Choose the letter of your answer. You can change it until you finish. “Cross out” marks a choice you have ruled out.</p>'
      : '<div class="mpgrid"><label class="field"><span class="label">Type your answer</span><input type="text" id="mm-gin" inputmode="decimal" autocomplete="off" placeholder="e.g. 12, −3, 7/6 or 2.5" value="' + esc(given) + '"></label></div><p class="fine" id="mm-ghint">Numbers only. Fractions like 7/6 are fine; leave out units. Saved as you type.</p>';
    body.innerHTML = '<div class="mpq">' + mImg('q', q, true) + '</div><p class="mpzoom"><button class="linkbtn" type="button" data-zoom="q">See the question larger</button></p>' + ans;
    if (q.mc) {
      $$('.mpch', body).forEach(function (b) { b.addEventListener('click', function () { mmChoose(b.getAttribute('data-k')); }); });
      $$('.mmx', body).forEach(function (b) { b.addEventListener('click', function () { mmCross(b.getAttribute('data-x')); }); });
    } else {
      $('#mm-gin').addEventListener('input', function () {
        MP.ans[MP.i] = this.value;
        var bad = this.value.trim() && isNaN(mpNum(this.value));
        $('#mm-ghint').textContent = bad ? 'That is not a number yet. Use digits, a minus sign, a decimal point or a fraction such as 7/6.' : 'Numbers only. Fractions like 7/6 are fine; leave out units. Saved as you type.';
      });
      $('#mm-gin').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); modNext(MP); } });
    }
    var first = q.mc ? $('.mpch.sel', body) || $('.mpch', body) : $('#mm-gin');
    if (first && !narrow()) { focusQuiet(first); }
  }
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
    if (modNavOpen(MP)) { return; }
    var k = key.toUpperCase(), n = ['1', '2', '3', '4'].indexOf(key);
    if (n !== -1) { k = 'ABCD'[n]; }
    if (MP.qs[MP.i].mc && k.length === 1 && 'ABCD'.indexOf(k) !== -1) { e.preventDefault(); if (MP.ans[MP.i] !== k) { mmChoose(k); } }
    else if (key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') { e.preventDefault(); modNext(MP); }
  }

  /* ---------- finishing: grade, save, results ---------- */
  function mmFinish(timeUp) {
    if (!MP || !MP.module || MP.over) { return; }
    mCalcShow(false);
    MP.used = modStop(MP); MP.timeUp = !!timeUp; MP.rev = null;
    var ts = Date.now(), right = 0;
    MP.res = MP.qs.map(function (q, i) {
      var given = String(MP.ans[i]).trim(), ok = null;
      if (given) { ok = q.mc ? given === q.a : mpGridOK(given, q.a) === true; }
      var secs = Math.round(MP.spent[i] / 1000);
      /* a question left blank counts against the module, but is not saved as a miss */
      if (ok !== null) { store.m[q.id] = [ok ? 1 : 0, secs, ts]; srNote('m', q.id, ok); }
      if (ok) { right += 1; }
      return { id: q.id, ok: ok, secs: secs, given: given, flag: !!MP.flag[i] };
    });
    if (MP.diag) { diagSave('m', MP.res.map(function (r) { return { d: MQBY[r.id].d, ok: r.ok === true }; })); }
    else {
      var hist = Array.isArray(store.s.modules) ? store.s.modules.filter(isObj) : [];
      hist.push({ t: ts, n: MP.qs.length, r: right, s: MP.used, l: MP.limit });
      store.s.modules = hist.slice(-20);
    }
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
      mHead(MP.diag ? 'Math · Starting check' : 'Math · Timed module', 'You got ' + right + ' of ' + n + ' right', (MP.timeUp ? 'Time ran out. ' : '') + 'You used ' + clock(MP.used) + ' of ' + clock(MP.limit) + (answered ? ', about ' + avg + ' seconds for each question you answered. The real test allows about 95.' : '.')) +
      (MP.diag ? diagPanelHTML('m') : '') +
      '<div class="mst-stats mm-stats"><div><b>' + right + '</b><span>right</span></div><div><b>' + wrong + '</b><span>wrong</span></div><div><b>' + blank + '</b><span>no answer</span></div><div><b>' + clock(MP.used) + '</b><span>of ' + clock(MP.limit) + ' used</span></div></div>' +
      '<section class="msec"><h3 class="h3">By area</h3><div class="mprog">' + areas + '</div></section>' +
      (review.length ? '<section class="msec"><h3 class="h3">Question types to review</h3><div class="mm-nexts">' + review.slice(0, 6).map(function (m) { return mmCardHTML(m, mTypeStat(m)); }).join('') + '</div>' + (review.length > 6 ? '<p class="fine" style="margin-top:.8rem">And ' + (review.length - 6) + ' more. They are all on <a href="#m-map">your map</a>.</p>' : '') + '</section>' : '<p class="mpraise">Every one right. Try a module of Hard questions.</p>') +
      '<section class="msec"><h3 class="h3">Your answers</h3><p class="muted">Open any question to see College Board’s explanation and the method. On a miss, tap what went wrong.</p><ol class="mpsum mmsum">' + res.map(function (r, i) {
        var q = MQBY[r.id];
        return '<li class="' + (r.ok ? 'ok' : (r.ok === null ? 'mm-blank' : 'no')) + '"><span class="mpsum-v">' + (r.ok ? '✓' : (r.ok === null ? '–' : '✗')) + '</span><span><b>' + (i + 1) + '.</b> ' + esc(MTY[q.t].name) + ' <span class="muted">· ' + MDIFF[q.d] + ' · ' + (r.ok === null ? 'no answer' : r.secs + ' s') + (r.flag ? ' · marked for review' : '') + '</span></span><button class="linkbtn" type="button" data-rev="' + i + '">Review</button></li>';
      }).join('') + '</ol></section>' +
      mWhySetHTML(missedIds) +
      '<p class="row" style="margin-top:1.5rem">' + (notRight.length ? '<button class="btn big" type="button" id="mm-rev-miss">Review what I missed</button>' : '') + (MP.diag ? '<a class="btn' + (notRight.length ? ' ghost' : ' big') + '" href="#plan">Make my study plan</a>' : '<button class="btn' + (notRight.length ? ' ghost' : ' big') + '" type="button" id="mm-new">New module</button>') + (notRight.length ? '<button class="btn ghost" type="button" id="mm-retry">Retry them, one at a time</button>' : '') + '<a class="btn ghost" href="#m-map">See my map</a></p></div>';
    $$('[data-rev]', viewEl.mprac).forEach(function (b) { b.addEventListener('click', function () { mmReview(Number(b.getAttribute('data-rev'))); }); });
    var nw = $('#mm-new'), rm = $('#mm-rev-miss'), rt = $('#mm-retry');
    if (nw) { nw.addEventListener('click', function () { mpModePreset = 'module'; mpSetup(); window.scrollTo(0, 0); }); }
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
      ? '<div class="mpchoices" role="group" aria-label="Your answer and the right answer">' + ['A', 'B', 'C', 'D'].map(function (L) { return '<button class="mpch' + (L === q.a ? ' right' : (L === r.given ? ' wrong' : '')) + '" type="button" data-k="' + L + '" disabled><span class="mpch-l">' + L + '</span></button>'; }).join('') + '</div>'
      : '';
    viewEl.mprac.innerHTML = '<div class="wrap mpwrap">' +
      '<div class="mpbar"><span class="mpbar-pos"><b>Review · question ' + (i + 1) + '</b> of ' + n + '</span><span class="mpbar-dots" aria-hidden="true">' + MP.res.map(function (x, j) { return '<i class="' + (x.ok ? 'ok' : (x.ok === null ? '' : 'no')) + (j === i ? ' at' : '') + '"></i>'; }).join('') + '</span><button class="linkbtn" type="button" id="mm-rev-back">Back to results</button></div>' +
      '<article class="mpcard"><header class="mpcard-h"><span class="mtag">' + esc(MSK[q.k].name) + '</span><span class="mdiff d' + q.d + '">' + MDIFF[q.d] + '</span><span class="muted">' + (q.mc ? 'Multiple choice' : 'Type in your answer') + (r.flag ? ' · you marked this for review' : '') + '</span></header>' +
        '<div class="mpq">' + mImg('q', q, !!q.mc) + '</div><p class="mpzoom"><button class="linkbtn" type="button" data-zoom="q">See the question larger</button></p>' + yours +
        '<p class="mm-yours">' + (r.ok === null ? 'You left this one blank.' : 'Your answer: <b>' + esc(r.given) + '</b>') + '</p>' +
        '<div class="mpfb ' + (r.ok ? 'ok' : 'no') + '" id="mp-fb" tabindex="-1">' + mFeedbackHTML(q, r.ok, r.ok === null ? null : r.secs) + '</div>' +
        '<p class="row mm-step"><button class="btn ghost" type="button" id="mm-rev-prev"' + (i ? '' : ' disabled') + '>Previous</button><button class="btn" type="button" id="mm-rev-next">' + (i < n - 1 ? 'Next question' : 'Back to results') + '</button></p></article></div>';
    $('#mm-rev-back').addEventListener('click', mmResults);
    $('#mm-rev-prev').addEventListener('click', function () { mmReview(i - 1); });
    $('#mm-rev-next').addEventListener('click', function () { if (i < n - 1) { mmReview(i + 1); } else { mmResults(); } });
    window.scrollTo(0, 0);
  }

