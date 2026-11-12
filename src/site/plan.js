  /* =================== Both subjects: the starting check, spaced repeats, and the study plan =================== */
  var DAY = 86400000;
  function dayStart(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function dayKey(t) { var d = new Date(t); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function parseDay(s) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(String(s || '')); return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() : NaN; }
  /* a count of calendar days that does not slip when the clocks change */
  function dayNo(t) { var d = new Date(t); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY); }

  /* ---------- what the plan needs to know about each subject ---------- */
  var PSUB = {
    m: {
      name: 'Math', cls: 'math', perQ: 2.5, modMins: 35, modN: 22, qs: 44, checkMins: 16, hCheck: 'm-check', hModule: 'm-module', hMap: 'm-map', hPractice: 'm-practice',
      tried: function () { return Object.keys(store.m).filter(function (k) { return MQBY[k] && mDone(k); }).length; },
      missed: function () { return mStillMissed(); },
      valid: function (id) { return !!MQBY[id]; },
      doneSince: function (id, t) { var r = mDone(id); return !!r && r[2] >= t; },
      types: function () {
        return MST.methods.map(function (m) { var a = MDOM[m.skill].id; return { id: m.id, name: m.title, s: mTypeStat(m), size: m.question_count, w: a === 'alg' || a === 'adv' ? 1 : 0.7 }; });
      },
      typeIds: function (id, n) {
        var fresh = [], miss = [], rest = [];
        MSTBY[id].question_ids.forEach(function (q) { var r = mDone(q); if (!MQBY[q]) { return; } if (!r) { fresh.push(q); } else if (!r[0]) { miss.push(q); } else { rest.push(q); } });
        return shuffle(fresh).concat(shuffle(miss), shuffle(rest)).slice(0, n);
      },
      start: function (ids) { mRetrySet(ids); },
      mods: function () { return Array.isArray(store.s.modules) ? store.s.modules.filter(isObj) : []; }
    },
    rw: {
      name: 'Reading & Writing', cls: 'rw', perQ: 2, modMins: 32, modN: 27, qs: 54, checkMins: 12, hCheck: 'rw-check', hModule: 'rw-module', hMap: 'rw-map', hPractice: 'practice',
      tried: function () { return rwItems().filter(function (it) { return result(it); }).length; },
      missed: function () { return rwStillMissed().map(function (it) { return it.id; }); },
      valid: function (id) { rwItems(); return !!RWIT[id]; },
      doneSince: function (id, t) { rwItems(); var r = RWIT[id] ? result(RWIT[id]) : null; return !!r && (r.at || 0) >= t; },
      types: function () { rwItems(); return RWT.map(function (t) { return { id: t.id, name: t.name, s: rwStat(t), size: t.items.length, w: 1 }; }); },
      typeIds: function (id, n) { return rwTypeSet(RWTBY[id]).slice(0, n).map(function (it) { return it.id; }); },
      start: function (ids) { rwItems(); rwStartSet(ids.map(function (id) { return RWIT[id]; }).filter(Boolean)); },
      mods: function () { return Array.isArray(store.s.rwmodules) ? store.s.rwmodules.filter(isObj) : []; }
    }
  };

  /* ---------- the starting check: ten questions, a rough range, where to begin ---------- */
  /* rows: [{ d: 'E' | 'M' | 'H', ok }]. The share right at each difficulty counts equally, which stands for a whole section
     (the bank has about a third of its questions at each level). That share is placed on the 200 to 800 scale. The range is
     one standard error either way, never narrower than 60 points: ten questions cannot do better, and the page says so. */
  function diagEstimate(rows) {
    var by = { E: [0, 0], M: [0, 0], H: [0, 0] }, k = 0, share = 0, v = 0;
    rows.forEach(function (r) { if (by[r.d]) { by[r.d][1] += 1; if (r.ok) { by[r.d][0] += 1; } } });
    ['E', 'M', 'H'].forEach(function (d) {
      var n = by[d][1];
      if (!n) { return; }
      var soft = (by[d][0] + 1) / (n + 2);
      k += 1; share += by[d][0] / n; v += soft * (1 - soft) / n;
    });
    if (!k) { return { by: by, share: 0, mid: 200, lo: 200, hi: 260, half: 60 }; }
    share /= k;
    var mid = 200 + 600 * share, half = Math.max(60, 600 * Math.sqrt(v) / k);
    return { by: by, share: share, mid: Math.round(mid / 10) * 10, half: Math.round(half / 10) * 10,
      lo: Math.max(200, Math.round((mid - half) / 10) * 10), hi: Math.min(800, Math.round((mid + half) / 10) * 10) };
  }
  function diagAll() { if (!isObj(store.s.diag)) { store.s.diag = {}; } return store.s.diag; }
  function diagGet(subj) { var d = diagAll()[subj]; return isObj(d) && typeof d.lo === 'number' ? d : null; }
  function diagSave(subj, rows) {
    var e = diagEstimate(rows);
    diagAll()[subj] = { t: Date.now(), n: rows.length, r: rows.filter(function (r) { return r.ok; }).length, lo: e.lo, hi: e.hi, mid: e.mid, half: e.half, share: Math.round(100 * e.share), by: e.by };
  }
  function diagPanelHTML(subj) {
    var d = diagGet(subj), S = PSUB[subj];
    if (!d) { return ''; }
    var by = isObj(d.by) ? d.by : {}, parts = [['E', 'Easy'], ['M', 'Medium'], ['H', 'Hard']].filter(function (x) { return Array.isArray(by[x[0]]) && by[x[0]][1]; }).map(function (x) { return x[1] + ' ' + by[x[0]][0] + ' of ' + by[x[0]][1]; }).join(', ');
    return '<section class="diag-range" aria-label="Rough starting range"><p class="diag-l">Rough starting range · ' + S.name + '</p><p class="diag-n">' + d.lo + '–' + d.hi + '</p>' +
      '<p>A section score runs from 200 to 800. This is a place to start from, not a prediction.</p>' +
      '<details><summary>How this is worked out, and what it cannot tell you</summary>' +
      '<p>Your share right at each difficulty (' + parts + '), counted equally, is about ' + d.share + '% of a whole section. On the 200 to 800 scale that is near ' + d.mid + '.</p>' +
      '<p>Ten questions leave a lot to chance: about ' + d.half + ' points either way, so the range is wide on purpose. The real test has ' + S.qs + ' questions and gives you harder or easier ones depending on how you are doing, which this check does not copy.</p>' +
      '<p>For a real score, take a full practice test in College Board’s Bluebook app.</p></details></section>';
  }
  function diagLineHTML(subj) {
    var d = diagGet(subj), S = PSUB[subj];
    return d
      ? '<p class="diag-line"><b>Starting check:</b> ' + d.r + ' of ' + d.n + ' right · rough range ' + d.lo + '–' + d.hi + ' <span class="muted">· ' + new Date(d.t).toLocaleDateString() + '</span> · <a href="#' + S.hCheck + '">Take it again</a></p>'
      : '<p class="diag-line"><b>New here?</b> <a href="#' + S.hCheck + '">Take the 10-question starting check</a> for a rough score range and the types to begin with.</p>';
  }
  function diagIntroHTML(subj) {
    var S = PSUB[subj], d = diagGet(subj);
    return '<header class="' + (subj === 'm' ? 'mhead' : 'read') + '"><p class="eyebrow">' + S.name + ' · Starting check</p><h2 class="vtitle">Find your starting point in 10 questions</h2>' +
      '<p class="lede">About ' + S.checkMins + ' minutes on one clock, like the test, with the answers at the end.</p></header>' +
      '<ul class="mfacts diag-facts">' +
        '<li><b>What you answer.</b> Ten real questions: Easy, Medium and Hard, from every part of the section.</li>' +
        '<li><b>What you get.</b> A rough score range, the question types to start with, and a map that already knows what you missed.</li>' +
        '<li><b>What it is not.</b> A prediction. Ten questions leave a lot to chance, so the range is wide on purpose.</li>' +
      '</ul>' +
      (d ? '<p class="diag-line">Your last check: ' + d.r + ' of ' + d.n + ' right, rough range ' + d.lo + '–' + d.hi + ', on ' + new Date(d.t).toLocaleDateString() + '. A new one replaces it.</p>' : '') +
      '<p class="row" style="margin-top:1.4rem"><button class="btn big" type="button" id="diag-go-' + subj + '">Start the check</button><a class="linkbtn" href="#' + S.hPractice + '">Skip to practice</a></p>';
  }

  /* ---------- spaced repeats: a missed question comes back after 1 day, then 3, then 7 ---------- */
  /* store.s.sr[subj][id] = [step, due]. A miss puts the question at step 0, due tomorrow. Each right answer after that moves
     it one step on; a right answer at the last step lets it go. */
  var SR_GAP = [1, 3, 7];
  function srAll() {
    if (!isObj(store.s.sr)) { store.s.sr = {}; }
    if (!isObj(store.s.sr.m)) { store.s.sr.m = {}; }
    if (!isObj(store.s.sr.rw)) { store.s.sr.rw = {}; }
    return store.s.sr;
  }
  function srNote(subj, id, ok) {
    var S = srAll()[subj], r = Array.isArray(S[id]) ? S[id] : null, today = dayStart(Date.now());
    if (!ok) { S[id] = [0, today + SR_GAP[0] * DAY]; return; }
    if (!r) { return; }
    if (r[0] >= SR_GAP.length - 1) { delete S[id]; } else { S[id] = [r[0] + 1, today + SR_GAP[r[0] + 1] * DAY]; }
  }
  /* due today or earlier, oldest first; questions missed before any of this existed count as due now */
  function srDue(subj) {
    var S = srAll()[subj], A = PSUB[subj], end = dayStart(Date.now()) + DAY, out = [];
    Object.keys(S).forEach(function (id) { if (Array.isArray(S[id]) && S[id][1] < end && A.valid(id)) { out.push([id, S[id][1]]); } });
    A.missed().forEach(function (id) { if (!S[id]) { out.push([id, 0]); } });
    return out.sort(function (a, b) { return a[1] - b[1]; }).map(function (x) { return x[0]; });
  }

  /* ---------- the plan ---------- */
  var PLAN_Q = { 15: 6, 30: 12, 45: 18 };          /* questions a day, at about two and a half minutes each with the review */
  var PLAN_WHY = { weak: 'Needs work', mid: 'Getting there', 'new': 'New to you', strong: 'Keep it fresh' };
  function planGet() { var P = store.s.plan; return isObj(P) && !isNaN(parseDay(P.date)) ? P : null; }
  function planSubs(P) { return P.subj === 'm' ? ['m'] : P.subj === 'rw' ? ['rw'] : ['m', 'rw']; }
  function planLeft(P) { return dayNo(parseDay(P.date)) - dayNo(Date.now()); }
  function planFocus(P, dn) { var subs = planSubs(P); return subs[dn % subs.length]; }
  /* types in the order to work on them: the weakest first, then the ones getting there, then new ones (the most common
     first), and the strong ones last */
  function planTypeOrder(subj) {
    var lv = { weak: 0, mid: 1, 'new': 2, strong: 3 };
    return PSUB[subj].types().filter(function (t) { return t.size; }).sort(function (a, b) {
      if (lv[a.s.lvl] !== lv[b.s.lvl]) { return lv[a.s.lvl] - lv[b.s.lvl]; }
      if (a.s.lvl === 'new') { return b.size * b.w - a.size * a.w; }
      if (a.s.lvl === 'strong') { return a.s.last - b.s.last; }
      return a.s.pct - b.s.pct || b.s.tried - a.s.tried;
    });
  }
  /* one practice task: enough questions from the next type or types on the list */
  function planTypeTask(subj, list, skip, need) {
    var ids = [], names = [], tids = [], why = '', guard = 0;
    while (ids.length < need && guard < 4 && list.length) {
      var t = list.shift();
      if (skip[subj + ':' + t.id]) { continue; }
      skip[subj + ':' + t.id] = 1; guard += 1;
      var got = PSUB[subj].typeIds(t.id, need - ids.length);
      if (!got.length) { continue; }
      ids = ids.concat(got); names.push(t.name); tids.push(t.id);
      if (!why) { why = PLAN_WHY[t.s.lvl] + (t.s.tried ? ': ' + t.s.right + ' of ' + t.s.tried + ' right so far.' : '.'); }
    }
    return ids.length ? { k: 'type', s: subj, names: names, tids: tids, why: why, ids: ids } : null;
  }
  function planBuild(P) {
    var subs = planSubs(P), dn = dayNo(Date.now()), left = planLeft(P), room = PLAN_Q[P.mins] || 6;
    var focus = planFocus(P, dn), order = [focus].concat(subs.filter(function (s) { return s !== focus; }));
    var tasks = [], lists = {}, skip = {};
    /* 1. the starting check, for a section that has neither a check nor much history */
    var checks = order.filter(function (s) { return !diagGet(s) && PSUB[s].tried() < 10; });
    if (P.mins < 30) { checks = checks.slice(0, 1); }
    checks.forEach(function (s) { tasks.push({ k: 'check', s: s }); room -= 10; });
    if (checks.length && room < 4) { return tasks; }
    /* 2. questions that are due again: a third of the day, half of it in the last week */
    var rev = P.mins >= 30 ? order : [focus], dues = {}, waiting = 0;
    rev.forEach(function (s) { dues[s] = srDue(s); waiting += dues[s].length; });
    var cap = Math.max(2, Math.round(room * (left <= 7 || waiting > room ? 0.5 : 0.34)));
    rev.forEach(function (s) {
      var due = dues[s].slice(0, Math.ceil(cap / rev.length));
      if (due.length) { tasks.push({ k: 'review', s: s, ids: due }); room -= due.length; }
    });
    /* 3. practice by type, the weakest first */
    var slots = P.mins >= 45 ? [focus, order[1] || focus, focus] : P.mins >= 30 ? [focus, order[1] || focus] : [focus];
    var per = Math.max(3, Math.floor(room / slots.length));
    slots.forEach(function (s) {
      if (!lists[s]) { lists[s] = planTypeOrder(s); }
      var t = planTypeTask(s, lists[s], skip, per);
      if (t) { tasks.push(t); }
    });
    /* 4. a timed module on Saturdays, and every other day in the last week */
    if (new Date().getDay() === 6 || (left > 0 && left <= 7 && dn % 2 === 0)) { tasks.push({ k: 'module', s: focus }); }
    return tasks;
  }
  function planToday(P) {
    var key = dayKey(Date.now());
    if (!isObj(P.day) || P.day.date !== key || !Array.isArray(P.day.tasks)) { P.day = { date: key, made: Date.now(), tasks: planBuild(P) }; save(); }
    return P.day;
  }
  function planTaskState(t, day) {
    var S = PSUB[t.s];
    if (t.k === 'check') { var d = diagGet(t.s); return { done: !!d && d.t >= dayStart(day.made), n: 0, of: 0 }; }
    if (t.k === 'module') { var m = S.mods(), last = m[m.length - 1]; return { done: !!last && last.t >= dayStart(day.made), n: 0, of: 0 }; }
    var ids = Array.isArray(t.ids) ? t.ids : [], n = ids.filter(function (id) { return S.doneSince(id, day.made); }).length;
    return { done: n >= ids.length, n: n, of: ids.length };
  }
  function planTaskText(t) {
    var S = PSUB[t.s], n = Array.isArray(t.ids) ? t.ids.length : 0, mins = Math.max(1, Math.round(n * S.perQ));
    if (t.k === 'check') { return { h: 'Take the 10-question starting check', sub: 'about ' + S.checkMins + ' min', why: 'A rough score range and the question types to begin with.' }; }
    if (t.k === 'module') { return { h: 'Sit a timed module', sub: S.modMins + ' min', why: S.modN + ' questions on one clock, like one part of the real section. This is the long session of the week, on top of your daily minutes.' }; }
    if (t.k === 'review') { return { h: 'Redo ' + plural(n, 'question') + ' you missed', sub: 'about ' + mins + ' min', why: 'Spaced repeats: a miss comes back after 1 day, then 3, then 7, until it sticks.' }; }
    var names = Array.isArray(t.names) ? t.names : [];
    return { h: names.length === 1 ? names[0] : plural(names.length, 'question type'), sub: plural(n, 'question') + ' · about ' + mins + ' min', why: (t.why || '') + (names.length > 1 ? ' ' + names.join(' · ') : '') };
  }
  function planGo(i) {
    var P = planGet(), day = P ? planToday(P) : null, t = day ? day.tasks[i] : null;
    if (!t || !PSUB[t.s]) { return; }
    var S = PSUB[t.s];
    if (t.k === 'check') { nav(S.hCheck); return; }
    if (t.k === 'module') { nav(S.hModule); return; }
    var left = t.ids.filter(function (id) { return !S.doneSince(id, day.made) && S.valid(id); });
    S.start(left.length ? left : t.ids);
  }
  function planPhase(left) {
    if (left < 0) { return 'Your test date has passed. Set a new date below to keep the plan going.'; }
    if (left === 0) { return 'It is test day. Nothing to study: read each last sentence twice, and good luck.'; }
    if (left <= 7) { return 'Final week: repeats of what you missed and timed modules. Take one full practice test in Bluebook early in the week, and rest the day before.'; }
    if (left <= 28) { return 'Fix and pace: your weakest types, repeats of what you missed, and a timed module each Saturday.'; }
    return 'Build: new question types and the ones you miss, a little every day, and a timed module each Saturday.';
  }
  function planProgress(P) {
    var day = planToday(P), done = 0;
    day.tasks.forEach(function (t) { if (planTaskState(t, day).done) { done += 1; } });
    return { done: done, of: day.tasks.length };
  }
  function planFormHTML(P) {
    var today = dayKey(Date.now());
    return '<form class="mpset plan-form" id="plan-form" novalidate><div class="mpset-grid">' +
      '<label class="field"><span class="label">Your test date</span><input type="date" id="plan-date" min="' + today + '" value="' + (P ? esc(P.date) : '') + '" required></label>' +
      '<p class="fine" style="margin-top:-.7rem">No date yet? Pick the one you are aiming for. You can change it at any time.</p>' +
      seg('plan-mins', 'Minutes a day', [[15, '15'], [30, '30'], [45, '45']], P ? P.mins : 15) +
      seg('plan-subj', 'Sections', [['both', 'Both'], ['m', 'Math'], ['rw', 'Reading & Writing']], P ? P.subj : 'both') +
      '</div><p class="sg-msg bad" id="plan-msg" role="status"></p>' +
      '<p class="row"><button class="btn big" type="submit">' + (P ? 'Save my plan' : 'Make my plan') + '</button>' + (P ? '<button class="linkbtn" type="button" id="plan-del">Delete my plan</button>' : '') + '</p></form>';
  }
  function planWire() {
    var form = document.getElementById('plan-form');
    if (!form) { return; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var date = document.getElementById('plan-date').value, t = parseDay(date), msg = document.getElementById('plan-msg');
      var pick = function (n) { var x = $('input[name="' + n + '"]:checked', form); return x ? x.value : ''; };
      if (isNaN(t)) { msg.textContent = 'Choose your test date first.'; focusQuiet(document.getElementById('plan-date')); return; }
      if (dayNo(t) < dayNo(Date.now())) { msg.textContent = 'That date has passed. Choose a date from today on.'; focusQuiet(document.getElementById('plan-date')); return; }
      store.s.plan = { date: date, mins: [15, 30, 45].indexOf(Number(pick('plan-mins'))) !== -1 ? Number(pick('plan-mins')) : 15, subj: ['both', 'm', 'rw'].indexOf(pick('plan-subj')) !== -1 ? pick('plan-subj') : 'both' };
      save();
      buildPlan(); toTop();
      focusQuiet($('#v-plan .vtitle'));
    });
    var del = document.getElementById('plan-del');
    if (del) { del.addEventListener('click', function () { if (window.confirm('Delete your study plan? Your practice results stay.')) { delete store.s.plan; save(); buildPlan(); toTop(); } }); }
  }
  function planStandHTML(subj) {
    var S = PSUB[subj], d = diagGet(subj), T = S.types(), cnt = { 'new': 0, weak: 0, mid: 0, strong: 0 }, mods = S.mods(), last = mods[mods.length - 1];
    T.forEach(function (t) { cnt[t.s.lvl] += 1; });
    return '<article class="mm-next-c"><p class="mm-next-top"><i class="sdot ' + S.cls + '" aria-hidden="true"></i><b>' + S.name + '</b></p>' +
      '<p>' + (d ? 'Starting check: ' + d.r + ' of ' + d.n + ' right, rough range <b>' + d.lo + '–' + d.hi + '</b>.' : 'No starting check yet.') + '</p>' +
      '<p class="fine">' + (T.length - cnt['new']) + ' of ' + T.length + ' question types tried · ' + cnt.strong + ' strong · ' + cnt.weak + ' need work' + (last ? ' · last timed module ' + last.r + ' of ' + last.n : '') + '</p>' +
      '<p class="row"><a class="btn ghost sm" href="#' + S.hMap + '">My map</a><a class="linkbtn" href="#' + S.hCheck + '">' + (d ? 'Take the check again' : 'Take the 10-question check') + '</a></p></article>';
  }
  function buildPlan() {
    var P = planGet(), host = viewEl.plan;
    if (!P) {
      host.innerHTML = '<div class="wrap">' +
        '<header class="mhead"><p class="eyebrow">My study plan</p><h2 class="vtitle">A short plan for every day until your test</h2>' +
        '<p class="lede">Tell us your test date and how long you have each day. Each day you get a few short sets, chosen from what you miss.</p></header>' +
        '<ul class="mfacts diag-facts"><li><b>Built from your results.</b> Your weakest question types come first, then new ones, the most common first.</li>' +
        '<li><b>Misses come back.</b> A question you miss returns after 1 day, then 3, then 7, until it sticks.</li>' +
        '<li><b>No account.</b> The plan and your results are saved in this browser only.</li></ul>' +
        planFormHTML(null) + dataLineHTML() +
        '<section class="sec"><h3 class="h2">Not sure where you stand?</h3><p class="lede">A 10-question check for each section gives a rough score range and the question types to begin with.</p>' +
        '<div class="mm-nexts">' + planStandHTML('m') + planStandHTML('rw') + '</div></section></div>';
      planWire();
      return;
    }
    var day = planToday(P), left = planLeft(P), subs = planSubs(P), dn = dayNo(Date.now()), testDn = dayNo(parseDay(P.date));
    var when = new Date(parseDay(P.date)).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    var title = left < 0 ? 'Set a new test date' : left === 0 ? 'Test day' : left === 1 ? 'Your test is tomorrow' : left + ' days to your test';
    var done = 0, tasks = day.tasks.map(function (t, i) {
      var st = planTaskState(t, day), x = planTaskText(t), S = PSUB[t.s];
      if (st.done) { done += 1; }
      return '<li class="plan-task' + (st.done ? ' done' : '') + '"><span class="plan-check" aria-hidden="true">✓</span><div><p class="plan-task-h"><b>' + esc(x.h) + '</b><span class="plan-sub"><i class="sdot ' + S.cls + '" aria-hidden="true"></i>' + S.name + ' · ' + x.sub + '</span></p><p class="fine">' + esc(x.why) + '</p></div>' +
        (st.done ? '<span class="plan-state">Done</span>' : '<button class="btn sm" type="button" data-plan-go="' + i + '">' + (st.n ? 'Continue · ' + st.n + ' of ' + st.of : 'Start') + '</button>') + '</li>';
    }).join('');
    var week = '';
    for (var i = 0; i < 7 && dn + i <= testDn; i += 1) {
      var d = new Date(dayStart(Date.now())); d.setDate(d.getDate() + i);
      var isTest = dn + i === testDn, f = PSUB[planFocus(P, dn + i)], sat = d.getDay() === 6 || (testDn - dn - i <= 7 && testDn - dn - i > 0 && (dn + i) % 2 === 0);
      week += '<li class="plan-day' + (i === 0 ? ' today' : '') + (isTest ? ' test' : '') + '"><span class="muted">' + (i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })) + ' ' + d.getDate() + '</span>' +
        (isTest ? '<b>Test day</b>' : '<b><i class="sdot ' + f.cls + '" aria-hidden="true"></i> ' + f.name + '</b>' + (sat ? '<span>+ timed module</span>' : '')) + '</li>';
    }
    host.innerHTML = '<div class="wrap">' +
      '<header class="mhead"><p class="eyebrow">My study plan</p><h2 class="vtitle">' + title + '</h2>' +
      '<p class="lede">' + esc(when) + ' · ' + P.mins + ' minutes a day · ' + (subs.length === 2 ? 'both sections' : PSUB[subs[0]].name) + '. ' + planPhase(left) + '</p></header>' +
      (left >= 0 ? '<section class="sec first" id="plan-today"><h3 class="h2">Today</h3>' +
        (day.tasks.length ? '<p class="lede">' + (done === day.tasks.length ? 'All done for today. Come back tomorrow, or add one more set.' : done + ' of ' + plural(day.tasks.length, 'task') + ' done. Each one opens a short set; come back here when it ends.') + '</p><ol class="plan-tasks">' + tasks + '</ol>'
          : '<p class="lede">Nothing is due today.</p>') +
        '<p class="row" style="margin-top:1rem"><button class="linkbtn" type="button" id="plan-more">Add one more set</button></p></section>' : '') +
      (week ? '<section class="sec" id="plan-week"><h3 class="h2">The week ahead</h3><p class="lede">' + (subs.length === 2 ? 'The two sections take turns, so each gets a full session every other day.' : 'One session a day.') + ' Each day’s sets are chosen that morning from your latest results.</p><ol class="plan-week">' + week + '</ol></section>' : '') +
      '<section class="sec" id="plan-stand"><h3 class="h2">Where you stand</h3><div class="mm-nexts">' + subs.map(planStandHTML).join('') + '</div></section>' +
      '<section class="sec" id="plan-days"><h3 class="h2">Days you practiced</h3><p class="lede">' + habitLine() + '</p>' + habitCalHTML(13) + '</section>' +
      '<section class="sec" id="plan-setup"><h3 class="h2">Change my plan</h3>' + planFormHTML(P) + dataLineHTML() + '</section>' +
      '</div>';
    planWire();
    var more = document.getElementById('plan-more');
    if (more) {
      more.addEventListener('click', function () {
        var skip = {}, s = planFocus(P, dn);
        day.tasks.forEach(function (t) { if (t.k === 'type') { s = t.s; (t.tids || []).forEach(function (id) { skip[t.s + ':' + id] = 1; }); } });
        /* the other section, when the plan has both, so an extra set is a change */
        if (subs.length === 2) { s = s === 'm' ? 'rw' : 'm'; }
        var t = planTypeTask(s, planTypeOrder(s), skip, Math.max(4, Math.round((PLAN_Q[P.mins] || 6) / 2)));
        if (t) { day.tasks.push(t); save(); buildPlan(); focusQuiet($('#plan-today .plan-task:last-child .btn')); }
      });
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-plan-go]') : null;
    if (b) { planGo(Number(b.getAttribute('data-plan-go'))); }
  });
  /* on Home: today's plan, or the way in to one; and the starting check for someone new */
  function planHomeHTML() {
    var P = planGet(), fresh = !diagGet('m') && !diagGet('rw') && PSUB.m.tried() + PSUB.rw.tried() === 0, h = '';
    if (P) {
      var left = planLeft(P), pr = left >= 0 ? planProgress(P) : null;
      h += '<a class="hcont hplan" href="#plan"><span class="label">My study plan</span><b>' + (left < 0 ? 'Set a new test date' : left === 0 ? 'Test day' : plural(left, 'day') + ' to your test') + (pr && pr.of ? ' · today ' + pr.done + ' of ' + pr.of + ' done' : '') + '</b><span class="hcont-go" aria-hidden="true">→</span></a>';
    } else {
      h += '<a class="hcont hplan" href="#plan"><span class="label">Have a test date?</span><b>Get a short plan for every day</b><span class="hcont-go" aria-hidden="true">→</span></a>';
    }
    if (fresh) {
      h += '<div class="hcheck"><p><b>New here?</b> Find your starting point: 10 questions, a rough score range, and what to study first.</p><p class="row"><a class="btn sm ghost" href="#m-check">Math check</a><a class="btn sm ghost" href="#rw-check">Reading &amp; Writing check</a></p></div>';
    }
    return h;
  }

