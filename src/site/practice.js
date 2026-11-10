  /* =================== Practice: learning and paced sets =================== */
  var TIERS = { learn: { g: null, r: null, label: 'Learn · untimed' }, std: { g: 60, r: 70, label: 'Standard · 1:00 grammar, 1:10 reading' }, fast: { g: 45, r: 55, label: 'Fast · 0:45 and 0:55' }, easy: { g: 80, r: 90, label: 'Relaxed · 1:20 and 1:30' } };
  var TS = null, tclock = null;
  var REVIEW_CAUSES = [['', 'Choose a cause'], ['meaning', 'Misread meaning, reference or viewpoint'], ['scope', 'Missed a qualification or comparison'], ['evidence', 'Used unsupported evidence or prior knowledge'], ['data', 'Misread data, units or direction'], ['goal', 'Missed the question’s goal or relationship'], ['grammar', 'Misidentified sentence structure or a grammar rule'], ['pace', 'Rushed or ran out of time'], ['slip', 'Selection slip'], ['other', 'Other / still investigating']];
  function causeLabel(key) {
    var cause = REVIEW_CAUSES.filter(function (c) { return c[0] === key; })[0];
    return cause && key ? cause[1] : '';
  }
  function tset() {
    var s = isObj(store.s.timed) ? store.s.timed : {};
    return {
      src: ['g', 'a', 'r', 'q', 'v', 'n', 'x', 'both'].indexOf(s.src) !== -1 ? s.src : 'g',
      part: ['all', 'A', 'B', 'C'].indexOf(s.part) !== -1 ? s.part : 'all',
      diff: ['all', 'Easy', 'Medium', 'Hard'].indexOf(s.diff) !== -1 ? s.diff : 'all',
      which: ['all', 'new', 'missed', 'uncertain', 'slow'].indexOf(s.which) !== -1 ? s.which : 'all',
      len: [10, 20, 0].indexOf(s.len) !== -1 ? s.len : 10,
      tier: TIERS[s.tier] ? s.tier : 'learn',
      hints: s.hints === true,
      mode: s.mode === 'module' ? 'module' : 'set'
    };
  }
  // n: notes questions and x: transition questions, both with College Board's own answers
  var BANK = D.bank || {};
  BANK.notes = BANK.notes || []; BANK.trans = BANK.trans || []; BANK.reading = BANK.reading || [];
  BANK.figures = BANK.figures || []; BANK.grammarSources = BANK.grammarSources || [];
  var NOTES_PHASES = [[10 / 60, 'Goal', 'Read the goal first'], [0.75, 'Match', 'Find the choice that does it'], [1, 'Confirm', 'Check it against the notes']];
  function itemsAll() {
    return EXLIST.map(function (ex) { return { t: 'g', id: ex.q, d: ex.d, p: ex.p, ex: ex }; })
      .concat(RLIST.map(function (x) { return { t: 'r', id: x.qid, d: x.diff, p: 'R', x: x }; }))
      .concat(BANK.reading.map(function (b) { return { t: 'q', id: b.id, d: b.d, p: 'R', b: b }; }))
      .concat(BANK.figures.map(function (b) { return { t: 'v', id: b.id, d: b.d, p: 'R', b: b }; }))
      .concat(BANK.grammarSources.map(function (b) { return { t: 'a', id: b.id, d: b.d, p: b.p, b: b }; }))
      .concat(BANK.notes.map(function (b) { return { t: 'n', id: b.id, d: b.d, p: 'N', b: b }; }))
      .concat(BANK.trans.map(function (b) { return { t: 'x', id: b.id, d: b.d, p: 'C', b: b }; }));
  }
  function bucketOf(it) { return it.t === 'g' ? 't' : it.t === 'r' ? 'r' : 'b'; }
  // One question can appear in a lesson and the bank. Treat both as the same attempt history.
  function result(it) {
    var best = rec(bucketOf(it), it.id);
    ['t', 'r', 'b'].forEach(function (bucket) {
      var r = rec(bucket, it.id);
      if (r && (!best || (r.at || 0) > (best.at || 0))) { best = r; }
    });
    return best;
  }
  function overPace(r) { return !!r && typeof r.t === 'number' && r.t > (r.l || 60); }
  function practiceAttempt(prev, ok, time, limit, confidence) {
    return { c: ok ? 1 : 0, t: typeof time === 'number' ? Math.round(time * 10) / 10 : null,
      l: limit, mode: limit == null ? 'learn' : 'paced', confidence: confidence,
      cause: prev && typeof prev.cause === 'string' ? prev.cause : '', evidence: prev && typeof prev.evidence === 'string' ? prev.evidence : '',
      n: (prev && typeof prev.n === 'number' ? prev.n : prev ? 1 : 0) + 1, at: Date.now() };
  }
  function practiceSummary(rows) {
    var first = rows.filter(function (r) { return r.fresh; }), repeat = rows.filter(function (r) { return !r.fresh; });
    var correct = function (list) { return list.filter(function (r) { return r.ok; }).length; };
    return { first: first.length, firstRight: correct(first), repeat: repeat.length, repeatRight: correct(repeat),
      review: rows.filter(function (r) { return !r.ok || r.confidence === 'unsure' || r.confidence === 'guess'; }) };
  }
  function matching(s) {
    var seen = {};
    return itemsAll().filter(function (it) {
      var r = result(it);
      if (s.src !== 'both' && it.t !== s.src) { return false; }
      if ((it.t === 'g' || it.t === 'a') && s.part !== 'all' && it.p !== s.part) { return false; }
      if (s.src === 'both' && seen[it.id]) { return false; }
      seen[it.id] = true;
      if (s.diff !== 'all' && it.d !== s.diff) { return false; }
      if (s.which === 'new' && r) { return false; }
      if (s.which === 'missed' && !(r && r.c === 0)) { return false; }
      if (s.which === 'uncertain' && !(r && (r.confidence === 'unsure' || r.confidence === 'guess'))) { return false; }
      if (s.which === 'slow' && !overPace(r)) { return false; }
      return true;
    });
  }
  function practiceRecord(bucket, list) {
    var tried = 0, right = 0, under = 0, times = [];
    list.forEach(function (id) {
      var r = result({ t: bucket === 't' ? 'g' : bucket === 'r' ? 'r' : 'q', id: id });
      if (!r) { return; }
      tried += 1; if (r.c === 1) { right += 1; }
      if (typeof r.t === 'number') { if (r.t <= (r.l || 60)) { under += 1; } times.push(r.t); }
    });
    return { tried: tried, right: right, under: under, timed: times.length, med: median(times) };
  }
  function buildPractice() {
    if (built.practice) { return; }
    built.practice = true;
    viewEl.practice.innerHTML = '<div class="wrap"><div id="thost"></div></div>';
    timedSetup();
  }
  function timedSetup(prefix) {
    if (tclock) { tclock.halt(); }
    TS = null; tclock = null;
    rmDrop();
    rdIntroOn = false;
    var s = tset();
    if (rmModePreset) { s.mode = rmModePreset; rmModePreset = null; }
    var g = practiceRecord('t', EXLIST.map(function (e) { return e.q; })), r = practiceRecord('r', RLIST.map(function (x) { return x.qid; }));
    var nb = practiceRecord('b', BANK.notes.map(function (x) { return x.id; })), xb = practiceRecord('b', BANK.trans.map(function (x) { return x.id; })), qb = practiceRecord('b', BANK.reading.map(function (x) { return x.id; }));
    var seen = {};
    var all = itemsAll().filter(function (it) { if (seen[it.id]) { return false; } seen[it.id] = true; return true; });
    var nNew = all.filter(function (it) { return !result(it); }).length;
    var nMiss = all.filter(function (it) { var x = result(it); return x && x.c === 0; }).length;
    var nUncertain = all.filter(function (it) { var x = result(it); return x && (x.confidence === 'unsure' || x.confidence === 'guess'); }).length;
    var nSlow = all.filter(function (it) { return overPace(result(it)); }).length;
    var reviews = all.map(function (it) { return { it: it, r: result(it) }; }).filter(function (x) { return x.r && (x.r.evidence || x.r.cause); }).sort(function (a, b) { return (b.r.at || 0) - (a.r.at || 0); });
    var h = (prefix || '') + '<header class="read"><p class="eyebrow">Practice</p><h2 class="vtitle">Learn first. Then build your pace.</h2>' +
      '<p class="lede">All 1,845 Reading and Writing questions are available, including ' + BANK.figures.length + ' restored figure questions and ' + BANK.grammarSources.length + ' additional grammar questions with their full official explanations. Mixed sets include each question once. Start untimed while learning a skill; use unfamiliar mixed questions to check your pace.</p></header>' +
      '<div class="record"><div><b>' + g.tried + '</b><span>of ' + EXLIST.length + ' grammar tried</span></div><div><b>' + g.right + '</b><span>right last time</span></div>' +
      '<div><b>' + r.tried + '</b><span>of ' + RLIST.length + ' reading tried</span></div><div><b>' + r.right + '</b><span>right last time</span></div>' +
      '<div><b>' + qb.tried + '</b><span>of ' + BANK.reading.length + ' bank reading tried</span></div><div><b>' + nb.tried + '</b><span>of ' + BANK.notes.length + ' notes tried</span></div><div><b>' + xb.tried + '</b><span>of ' + BANK.trans.length + ' transitions tried</span></div></div>' +
      '<div class="tsetup" id="tsetup" data-mode="' + s.mode + '">' +
      seg('tmode', 'How to practice', [['set', 'Learn or pace'], ['module', 'Timed module']], s.mode) +
      '<p class="mpmode-note" id="tmodenote"></p>' +
      '<div class="t-setonly">' + seg('tsrc', 'Questions from', [['g', 'Grammar and transition lessons'], ['a', 'Additional grammar (' + BANK.grammarSources.length + ')'], ['r', 'Reading worked examples'], ['q', BANK.reading.length + ' text reading questions'], ['v', 'Tables and graphs (' + BANK.figures.length + ')'], ['n', 'All ' + BANK.notes.length + ' notes questions'], ['x', 'All ' + BANK.trans.length + ' transition questions'], ['both', 'Mixed: all 1,845 questions']], s.src) + '</div>' +
      '<div id="tpartwrap" class="t-setonly">' + seg('tpart', 'Grammar part', [['all', 'All parts'], ['A', 'A · Boundaries'], ['B', 'B · Form, Structure, and Sense'], ['C', 'C · Transitions']], s.part) + '</div>' +
      seg('tdiff', 'Difficulty', [['all', 'Any'], ['Easy', 'Easy'], ['Medium', 'Medium'], ['Hard', 'Hard']], s.diff) +
      seg('twhich', 'Which questions', [['all', 'All'], ['new', 'Not tried yet (' + nNew + ')'], ['missed', 'Missed last time (' + nMiss + ')'], ['uncertain', 'Unsure or guessed (' + nUncertain + ')'], ['slow', 'Over the clock last time (' + nSlow + ')']], s.which) +
      '<div class="t-setonly">' + seg('tlen', 'Questions per set', [[10, '10'], [20, '20'], [0, 'All that match']], s.len) + '</div>' +
      '<div class="t-setonly">' + seg('ttier', 'Clock', Object.keys(TIERS).map(function (k) { return [k, TIERS[k].label]; }), s.tier) + '</div>' +
      '<p class="fine t-setonly">Untimed mode has no clock or speed rating. The other modes use adjustable practice targets, and continue past zero. On the SAT, time belongs to the whole module: 32 minutes for 27 questions, with review within that module. A set here gives feedback after each answer; choose <b>Timed module</b> above to practice one whole module, and use <a href="https://satsuite.collegeboard.org/practice/practice-tests/bluebook" target="_blank" rel="noopener">official Bluebook practice</a> to rehearse a full test.</p>' +
      '<label class="checkline t-setonly" for="thints"><input type="checkbox" id="thints"' + (s.hints ? ' checked' : '') + '>Highlight what changes in grammar choices</label>' +
      '<p class="h3" id="tcount" role="status"></p>' +
      '<div class="row"><button type="button" class="btn" id="tstart">Start the set</button>' +
      '<button type="button" class="linkbtn" id="tforget"' + (nNew < all.length ? '' : ' hidden') + '>Clear my saved results</button></div>' +
      '<div id="tconfirm" hidden><p class="verdict miss">Clear every saved Reading and Writing practice result in this browser?</p><div class="row"><button type="button" class="btn" id="tyes">Clear them</button><button type="button" class="btn ghost" id="tno">Keep them</button></div></div>' +
      '<p class="fine">Answer with A, B, C or D, or 1 to 4, and press Enter for the next question. ' + (canStore ? 'Results are saved in this browser only.' : 'Results last until you close this page.') + '</p></div>' +
      (reviews.length ? '<details class="ctx"><summary>My saved reviews (' + reviews.length + ')</summary><div class="ctxbody"><p class="fine">Latest review for each question. Showing the most recent ' + Math.min(20, reviews.length) + '.</p><ul class="plainlist">' + reviews.slice(0, 20).map(function (x) {
        return '<li><a href="#rq-' + x.it.id + '">Question ' + x.it.id + '</a>' + (x.r.cause ? '<p class="fine">' + esc(causeLabel(x.r.cause)) + '</p>' : '') + (x.r.evidence ? '<p class="fine">' + esc(x.r.evidence) + '</p>' : '') + '</li>';
      }).join('') + '</ul></div></details>' : '') +
      '<h3 class="subh">Original questions and explanations</h3><p class="pretty">The restored source images include printed choices and complete official explanations. Open an image to enlarge it. Two further figure questions are already in Reading worked examples. <a href="#data-patterns">Study the deeper data patterns</a>.</p>';
    var host = document.getElementById('thost');
    host.innerHTML = h;
    function readSettings() {
      var gv = function (n) { var x = $('input[name="' + n + '"]:checked', host); return x ? x.value : ''; };
      store.s.timed = { src: gv('tsrc'), part: gv('tpart'), diff: gv('tdiff'), which: gv('twhich'), len: Number(gv('tlen')), tier: gv('ttier'), hints: document.getElementById('thints').checked, mode: gv('tmode') };
      save();
      return tset();
    }
    function refresh() {
      var st = readSettings(), mod = st.mode === 'module', n = mod ? rmPool(st).length : matching(st).length, get = Math.min(n, RM_N);
      document.getElementById('tsetup').setAttribute('data-mode', st.mode);
      document.getElementById('tmodenote').innerHTML = mod
        ? '<b>One part of the real section:</b> ' + RM_N + ' questions on a single ' + clock(rmLimit(RM_N)) + ' clock, in the order the test asks them: words and structure, then evidence and inference, then grammar, then transitions and notes. Move back and forth, mark questions for review and cross out choices. Answers and explanations come at the end.'
        : '<b>One question at a time:</b> the answer and the explanation appear straight after each question, with no clock or with a clock for each question.';
      document.getElementById('tpartwrap').hidden = st.src !== 'g' && st.src !== 'a' && st.src !== 'both';
      document.getElementById('tcount').textContent = n === 0 ? 'No question matches these settings.'
        : mod ? plural(n, 'question') + ' match. Your module: ' + plural(get, 'question') + ', ' + clock(rmLimit(get)) + ' on the clock.'
        : plural(n, 'question') + ' match.';
      document.getElementById('tstart').textContent = mod ? 'Start the module' : 'Start the set';
      document.getElementById('tstart').disabled = n === 0;
    }
    $$('input', host).forEach(function (i) { i.addEventListener('change', refresh); });
    document.getElementById('tstart').addEventListener('click', function () {
      var st = readSettings(), list;
      if (st.mode === 'module') { rmStart(st); return; }
      list = shuffle(matching(st).slice());
      if (st.len) { list = list.slice(0, st.len); }
      if (list.length) { timedStart(list, st); }
    });
    document.getElementById('tforget').addEventListener('click', function () { document.getElementById('tconfirm').hidden = false; this.hidden = true; });
    document.getElementById('tno').addEventListener('click', function () { document.getElementById('tconfirm').hidden = true; document.getElementById('tforget').hidden = false; });
    document.getElementById('tyes').addEventListener('click', function () {
      store.t = {}; store.r = {}; store.b = {}; save();
      timedSetup('<p class="verdict good" role="status">Saved results cleared.</p>');
    });
    refresh();
  }
  function timedStart(list, st) {
    rmDrop();
    rdIntroOn = false;
    TS = { items: list, i: 0, res: [], tier: TIERS[st.tier] || TIERS.learn, settings: st, hints: st.hints, card: null, paused: false };
    document.getElementById('thost').innerHTML = '<div class="tplay"><div class="tbar"><span class="tpos" id="tpos"></span><div class="clockbox" id="tclock"></div>' +
      '<div class="row"><button type="button" class="btn sm" id="tnext2" hidden>Next</button><button type="button" class="linkbtn" id="tend">End set</button></div></div>' +
      '<div id="tconfidence"></div><div id="tcard"></div><div id="treview"></div><div class="tnav" id="tnav"></div></div>';
    tclock = TS.tier.g == null ? null : Clock(document.getElementById('tclock'), TS.tier.g, GRAMMAR_PHASES);
    if (!tclock) { document.getElementById('tclock').innerHTML = '<p class="fine"><b>Untimed learning</b><br>Find the evidence or rule. Take the time you need.</p>'; }
    document.getElementById('tend').addEventListener('click', timedFinish);
    document.getElementById('tnext2').addEventListener('click', timedNext);
    timedDraw();
    toTop();
  }
  function timedDraw() {
    var it = TS.items[TS.i], lim = it.t === 'r' || it.t === 'q' || it.t === 'v' ? TS.tier.r : TS.tier.g;
    document.getElementById('tpos').textContent = 'Question ' + (TS.i + 1) + ' of ' + TS.items.length + ' · ' + { g: 'grammar', a: 'grammar', r: 'reading', q: 'reading', v: 'table or graph', n: 'notes', x: 'transition' }[it.t];
    document.getElementById('tnav').innerHTML = '';
    document.getElementById('tnext2').hidden = true;
    if (tclock) { tclock.reset(lim, it.t === 'r' || it.t === 'q' || it.t === 'v' ? READING_PHASES : it.t === 'n' ? NOTES_PHASES : GRAMMAR_PHASES); }
    document.getElementById('tconfidence').innerHTML = seg('tconfidence', 'Before answering: how sure are you? (optional)', [['skip', 'Not recorded'], ['sure', 'Confident'], ['unsure', 'Unsure'], ['guess', 'Guessing']], 'skip');
    document.getElementById('treview').innerHTML = '';
    TS.paused = false;
    var onAnswer = function (k, ok) {
      var t = tclock ? tclock.stop() : null, bucket = bucketOf(it), prev = result(it);
      var confidence = $('input[name="tconfidence"]:checked', document.getElementById('tconfidence')).value;
      $$('input', document.getElementById('tconfidence')).forEach(function (input) { input.disabled = true; });
      var attempt = practiceAttempt(prev, ok, t, lim, confidence);
      TS.res.push({ it: it, k: k, ok: ok, t: t, l: lim, fresh: !prev, confidence: confidence, cause: attempt.cause, evidence: attempt.evidence });
      store[bucket][it.id] = attempt;
      srNote('rw', it.id, ok);
      save();
      return t == null ? null : { time: t, limit: lim };
    };
    var after = function () {
      practiceReflection(it);
      var last = TS.i + 1 >= TS.items.length;
      document.getElementById('tnav').innerHTML = '<button type="button" class="btn" id="tnext">' + (last ? 'See the results' : 'Next question') + '</button><span class="kbd">Enter</span>';
      document.getElementById('tnext').addEventListener('click', timedNext);
      var n2 = document.getElementById('tnext2');
      n2.textContent = last ? 'Results' : 'Next';
      n2.hidden = false;
      focusQuiet(n2);
    };
    TS.card = it.t === 'g'
      ? QCard(it.ex, { split: true, hints: TS.hints, metaAfter: 'Question ' + it.id + ' · ' + it.d + ' · rule ' + U[it.ex.u].num, onAnswer: onAnswer, after: after })
      : it.t === 'r' ? RCard(it.x, { meta: 'Question ' + it.id, onAnswer: onAnswer, after: after })
      : it.t === 'q' || it.t === 'v' || it.t === 'a' ? QBCard(it.b, { meta: 'Question ' + it.id + ' · ' + it.b.jn + ' · ' + it.d, onAnswer: onAnswer, after: after })
      : BCard(it.b, it.t, { meta: 'Question ' + it.id + ' · ' + it.d, onAnswer: onAnswer, after: after });
    var host = document.getElementById('tcard');
    host.textContent = '';
    host.appendChild(TS.card.el);
    if (tclock) {
      if (cur.view === 'practice' && !document.hidden) { tclock.start(); } else { TS.paused = true; }
    }
  }
  /* "Review the reasoning": what caused the difficulty (one tap; the trap report adds these up) and the evidence or rule to
     remember. row is this question's entry in the running set's results, when there is one. */
  function reflectionBlock(host, it, row) {
    var saved = rec(bucketOf(it), it.id);
    if (!host || !saved) { if (host) { host.innerHTML = ''; } return; }
    var missed = saved.c === 0;
    host.innerHTML = '<div class="after"><h3 class="h3">' + (missed ? 'What went wrong?' : 'Review the reasoning') + ' <span class="muted">(optional)</span></h3>' +
      '<p class="fine">' + (missed ? 'Tap what caused the miss, so you can fix the habit and not just this question.' : 'Review uncertain correct answers too: if this one was hard, tap what caused the difficulty.') + ' Then name the decisive evidence or grammar rule. Your previous review stays until you edit it.</p>' +
      seg('tcause', 'What caused the difficulty?', REVIEW_CAUSES.map(function (c) { return [c[0], c[0] ? c[1] : 'Not recorded']; }), saved.cause || '') +
      '<label class="label" for="tevidence">Evidence or rule to remember</label><textarea id="tevidence" rows="3" maxlength="800" placeholder="The decisive words, comparison, or sentence structure…">' + esc(saved.evidence || '') + '</textarea><p class="fine" id="treviewstatus" role="status"></p></div>';
    function keep() {
      var c = $('input[name="tcause"]:checked', host);
      saved.cause = c ? c.value : '';
      saved.evidence = document.getElementById('tevidence').value;
      if (row) { row.cause = saved.cause; row.evidence = saved.evidence; }
      save();
      document.getElementById('treviewstatus').innerHTML = (canStore ? 'Review saved in this browser.' : 'Review kept for this session.') + (saved.cause ? ' <a href="#rw-traps">See your trap report</a>' : '');
    }
    $$('input[name="tcause"]', host).forEach(function (i) { i.addEventListener('change', keep); });
    document.getElementById('tevidence').addEventListener('input', keep);
  }
  function practiceReflection(it) { reflectionBlock(document.getElementById('treview'), it, TS.res[TS.res.length - 1]); }
  function timedNext() {
    if (!TS || !TS.card || !TS.card.done()) { return; }
    if (TS.i + 1 < TS.items.length) { TS.i += 1; timedDraw(); toTop(); } else { timedFinish(); }
  }
  function timedPause() { if (TS && tclock && tclock.running()) { tclock.pause(); TS.paused = true; } }
  function timedResume() { if (TS && tclock && TS.paused && TS.card && !TS.card.done() && !document.hidden) { TS.paused = false; tclock.start(); } }
  function chartHTML(R) {
    var top = Math.max.apply(null, R.map(function (r) { return Math.max(r.t, r.l * 1.5); }));
    var step = top > 150 ? 30 : 15, t;
    top = Math.ceil(top / step) * step;
    var ticks = '', grid = '';
    for (t = 0; t <= top; t += step) {
      ticks += '<span style="bottom:' + (100 * t / top).toFixed(2) + '%">' + clock(t) + '</span>';
      if (t > 0) { grid += '<div class="tg" style="bottom:' + (100 * t / top).toFixed(2) + '%"></div>'; }
    }
    var bars = R.map(function (r, i) {
      return '<div class="tb ' + (r.ok ? 'ok' : 'no') + '" style="height:' + Math.max(1, 100 * r.t / top).toFixed(2) + '%"></div>';
    }).join('');
    var dense = R.length > 40, every = R.length <= 12 ? 1 : R.length <= 60 ? 5 : 10;
    var xs = R.map(function (r, i) { return '<span>' + (i === 0 || (i + 1) % every === 0 ? i + 1 : '') + '</span>'; }).join('');
    var desc = R.map(function (r, i) { return 'question ' + (i + 1) + ' ' + clock(r.t) + ' of ' + clock(r.l) + (r.ok ? ' right' : ' wrong'); }).join(', ');
    var lims = {};
    R.forEach(function (r) { lims[r.l] = 1; });
    var goals = Object.keys(lims).map(Number).map(function (l) {
      return '<div class="tgoal" style="bottom:' + (100 * l / top).toFixed(2) + '%"><span>' + clock(l) + ' clock</span></div>';
    }).join('');
    return '<div class="tchart' + (dense ? ' dense' : '') + '" role="img" aria-label="Seconds per question: ' + desc + '"><div class="ty" aria-hidden="true">' + ticks + '</div>' +
      '<div class="tp" aria-hidden="true">' + grid + goals + '<div class="tbs">' + bars + '</div></div>' +
      '<div class="tx" aria-hidden="true">' + xs + '</div></div>' +
      '<p class="rkey"><span><i style="background:var(--ok)"></i>Right</span><span><i style="background:var(--bad)"></i>Wrong</span><span>Bar height is the time you took. A dashed line is a clock limit.</span></p>';
  }
  function timedFinish() {
    if (!TS) { return; }
    if (tclock) { tclock.halt(); }
    var R = TS.res, n = R.length, total = TS.items.length;
    if (!n) { timedSetup(); return; }
    var right = R.filter(function (r) { return r.ok; }).length;
    var paced = R.filter(function (r) { return typeof r.t === 'number'; });
    var under = paced.filter(function (r) { return r.t <= r.l; }).length;
    var avg = paced.length ? paced.reduce(function (a, r) { return a + r.t; }, 0) / paced.length : 0;
    var slowRight = paced.filter(function (r) { return r.ok && r.t > r.l; });
    var summary = practiceSummary(R), review = summary.review;
    var retry = review.map(function (r) { return r.it; }), st = TS.settings;
    var lineFor = function (r) {
      if (r.it.t === 'g') { var ex = r.it.ex, u = U[ex.u]; return '<a href="#' + u.id + '">' + u.num + ' ' + u.title + '</a>'; }
      if (r.it.t === 'a') { var ua = U[r.it.b.unit]; return ua ? '<a href="#' + ua.id + '">' + ua.num + ' ' + ua.title + '</a>' : 'Grammar question'; }
      if (r.it.t === 'x') { var ux = U[r.it.b.u]; return ux ? '<a href="#' + ux.id + '">' + ux.num + ' ' + ux.title + '</a>' : 'Transition question'; }
      if (r.it.t === 'n') { return '<a href="#notesfirst">Notes question: goal first</a>'; }
      if (r.it.t === 'v') { return '<a href="#rq-' + r.it.id + '">Figure question</a>'; }
      if (r.it.t === 'q') { var jq = RD.jobs.filter(function (j) { return j.name === r.it.b.jn; })[0]; return jq ? '<a href="#' + jq.id + '">' + esc(r.it.b.jn) + '</a>' : esc(r.it.b.jn); }
      return '<a href="#ex-' + r.it.x.n + '">Example ' + r.it.x.n + ' · ' + esc(r.it.x.title) + '</a>';
    };
    document.getElementById('thost').innerHTML = '<p class="eyebrow">Set finished · ' + (paced.length ? 'paced practice' : 'untimed learning') + '</p><p class="dresult">' + right + ' of ' + n + ' right' + (paced.length ? ' · ' + under + ' inside the practice target' : '') + '</p>' +
      '<p class="lede">' + (paced.length ? 'Average ' + clock(avg) + ' a question.' : 'No speed rating in untimed learning.') + (n < total ? ' You answered ' + n + ' of ' + total + '.' : '') + '</p>' +
      '<p class="pretty"><b>First recorded answers:</b> ' + summary.firstRight + ' of ' + summary.first + ' right. <b>Repeat answers:</b> ' + summary.repeatRight + ' of ' + summary.repeat + ' right.</p>' +
      '<p class="fine">A first recorded answer may still be familiar from a lesson. Repeats help learning; check transfer on unfamiliar questions. This set does not predict an SAT score.</p>' + (paced.length ? chartHTML(paced) : '') +
      (review.length ? '<h3 class="subh">Review misses and uncertain answers</h3><ul class="missed">' + review.map(function (r) {
        return '<li>' + lineFor(r) + ' <span class="muted">· question ' + r.it.id + ' · you chose ' + r.k + ', the answer is ' + (r.it.t === 'g' ? r.it.ex.a : r.it.t === 'r' ? r.it.x.ans : r.it.b.ans) + (r.confidence === 'guess' ? ' · guessed' : r.confidence === 'unsure' ? ' · unsure' : '') + '</span>' +
          (r.cause ? '<p class="fine">' + esc(causeLabel(r.cause)) + '</p>' : '') + (r.evidence ? '<p class="fine">Your review: ' + esc(r.evidence) + '</p>' : '') + '</li>';
      }).join('') + '</ul>' : '<p class="subh">Every answer right.</p>') +
      (slowRight.length ? '<h3 class="subh">Right, but over the clock</h3><ul class="missed">' + slowRight.map(function (r) {
        return '<li>' + lineFor(r) + ' <span class="muted">· ' + clock(r.t) + ' of ' + clock(r.l) + '</span></li>';
      }).join('') + '</ul>' : '') +
      '<div class="row" style="margin-top:1.4rem">' + (retry.length ? '<button type="button" class="btn" id="tretry">Revisit ' + plural(retry.length, 'question') + '</button>' : '') +
      '<button type="button" class="btn' + (retry.length ? ' ghost' : '') + '" id="tagain">Set up another</button>' + (planGet() ? '<a class="btn ghost" href="#plan">Back to my plan</a>' : '') + '</div>';
    TS = null; tclock = null;
    var rb = document.getElementById('tretry');
    if (rb) { rb.addEventListener('click', function () { timedStart(shuffle(retry.slice()), st); }); }
    document.getElementById('tagain').addEventListener('click', function () { timedSetup(); toTop(); });
    toTop();
  }
  /* a bank question with College Board's answer: notes ('n') or transition ('x') */
  function BCard(b, kind, o) {
    o = o || {};
    var el = document.createElement('div');
    el.className = 'rcard bcard' + (b.qsrc ? ' sourcecard' : '');
    var pass = kind === 'n'
      ? '<p class="nlead">' + b.lead + '</p><ul class="nnotes">' + b.notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul>'
      : '<p class="passage">' + b.text + '</p>';
    var ask = kind === 'n' ? '<p class="ngoal"><span class="label">The goal</span>' + b.goal + '</p><p class="stem">' + b.stem + '</p>' : '<p class="stem">' + b.stem + '</p>';
    el.innerHTML = '<div class="q split"><div class="qpass">' + (o.meta ? '<p class="qmeta">' + o.meta + '</p>' : '') + pass + '</div>' +
      '<div class="qask">' + ask + '<ol class="opts">' + ['A', 'B', 'C', 'D'].map(function (k) {
        return '<li><button type="button" class="opt" data-k="' + k + '"><span class="let">' + k + '</span><span class="otext rtext">' + b.ch[k] + '</span><span class="otag"></span></button></li>';
      }).join('') + '</ol><div class="qfeed"></div></div></div>';
    var done = false;
    $$('.opt', el).forEach(function (bt) { bt.addEventListener('click', function () { pick(bt.getAttribute('data-k')); }); });
    function pick(k) {
      if (done || ['A', 'B', 'C', 'D'].indexOf(k) === -1) { return; }
      done = true;
      var ok = k === b.ans, res = o.onAnswer ? o.onAnswer(k, ok) : null;
      $$('.opt', el).forEach(function (bt) {
        var bk = bt.getAttribute('data-k');
        bt.disabled = true;
        if (bk === b.ans) { bt.classList.add('right'); $('.otag', bt).textContent = 'Correct'; }
        else if (bk === k) { bt.classList.add('wrong'); $('.otag', bt).textContent = 'Your answer'; }
      });
      var u = kind === 'x' ? U[b.u] : null;
      var tip = kind === 'n'
        ? '<p class="fine"><a href="#notesfirst">How to answer notes questions from the goal</a></p>'
        : (u ? '<p class="fine">Rule <a href="#' + u.id + '">' + u.num + '</a>: ' + u.title + '</p>' : '');
      $('.qfeed', el).innerHTML = verdictHTML(ok, b.ans, res) +
        (b.why[b.ans] ? '<p class="fine"><b>Why ' + b.ans + '.</b> ' + b.why[b.ans] + '</p>' : '') +
        (!ok && b.why[k] ? '<p class="fine"><b>Why not ' + k + '.</b> ' + b.why[k] + '</p>' : '') + tip +
        '<p class="fine muted">Explanations: College Board’s answer rationale, shortened.</p>';
      if (o.after) { o.after(ok); }
      showFeedback($('.verdict', el));
    }
    return { el: el, pick: pick, done: function () { return done; } };
  }
  /* a bank reading question with College Board's answer; annotated passages also get a tagged walkthrough */
  var KIND_DEF = { 'Not in the passage': 'says something the passage never says.', 'Opposite': 'says the reverse of the passage.',
    'Twisted or too strong': 'uses the passage’s words but changes them, or makes “some” into “all”.', 'Misses the job': 'may be true, but does not answer this question.',
    'Wrong about the data': 'states something the data does not show.' };
  function QBCard(b, o) {
    o = o || {};
    var el = document.createElement('div');
    el.className = 'rcard bcard';
    function passage(walk) {
      var h = b.intro ? '<p class="qintro">' + b.intro + '</p>' : '', lab = null;
      b.s.forEach(function (s, i) {
        if (b.tx && b.tx[i] && b.tx[i] !== lab) { lab = b.tx[i]; h += '<p class="label" style="margin-top:.6rem">' + esc(lab) + '</p>'; }
        h += walk && b.tg ? '<p class="wline' + (b.rs.indexOf(i) !== -1 ? ' rest' : '') + (i === b.pt ? ' mpoint' : '') + '">' + tagHTML(b.tg[i]) + ' ' + s + '</p>' : '<span class="psent">' + s + '</span> ';
      });
      return walk && b.tg ? h : '<div class="passage">' + h + '</div>';
    }
    el.innerHTML = '<div class="q split"><div class="qpass">' + (o.meta ? '<p class="qmeta">' + o.meta + '</p>' : '') + passage(false) + '</div>' +
      '<div class="qask"><p class="stem">' + b.q + '</p><ol class="opts">' + ['A', 'B', 'C', 'D'].map(function (k) {
        return '<li><button type="button" class="opt" data-k="' + k + '"><span class="let">' + k + '</span><span class="otext rtext">' + b.ch[k] + '</span><span class="otag"></span></button></li>';
      }).join('') + '</ol><div class="qfeed"></div></div></div><div class="rwalk"></div>';
    var done = false;
    $$('.opt', el).forEach(function (bt) { bt.addEventListener('click', function () { pick(bt.getAttribute('data-k')); }); });
    function pick(k) {
      if (done || ['A', 'B', 'C', 'D'].indexOf(k) === -1) { return; }
      done = true;
      var ok = k === b.ans, res = o.onAnswer ? o.onAnswer(k, ok) : null;
      $$('.opt', el).forEach(function (bt) {
        var bk = bt.getAttribute('data-k');
        bt.disabled = true;
        if (bk === b.ans) { bt.classList.add('right'); $('.otag', bt).textContent = 'Correct'; }
        else if (bk === k) { bt.classList.add('wrong'); $('.otag', bt).textContent = 'Your answer'; }
      });
      var tr = b.tr || {};
      $('.qfeed', el).innerHTML = verdictHTML(ok, b.ans, res) +
        (b.why[b.ans] ? '<p class="fine"><b>Why ' + b.ans + '.</b> ' + b.why[b.ans] + '</p>' : '') +
        (!ok && b.why[k] ? '<p class="fine"><b>Why not ' + k + '.</b> ' + b.why[k] + (tr[k] ? ' <span class="wn">' + esc(tr[k]) + '</span>' : '') + '</p>' : '');
      var job = RD.jobs.filter(function (j) { return j.name === b.jn; })[0];
      $('.rwalk', el).innerHTML = (b.tg ? '<h3 class="fasth">The passage, tagged</h3><p class="fine">' + (b.pt >= 0 ? 'The boxed line is the Point. ' : 'This passage has no single Point. ') +
        (b.rs.length ? 'The shaded ' + (b.rs.length === 1 ? 'line is the one' : 'lines are the ones') + ' the answer rests on.' : '') + '</p>' + passage(true) +
        '<h3 class="fasth">How the wrong choices fail</h3><ul class="plainlist">' + ['A', 'B', 'C', 'D'].filter(function (x) { return x !== b.ans && tr[x]; }).map(function (x) {
          return '<li><b>' + x + ': ' + esc(tr[x]) + '.</b> It ' + KIND_DEF[tr[x]] + '</li>'; }).join('') + '</ul>' : '') +
        (job ? '<p class="fine"><a href="#' + job.id + '">The ' + esc(b.jn) + ' job: what to look at first</a></p>' : '') +
        '<p class="fine muted">Answer: College Board’s key. Explanations: College Board’s rationale; source-image cards retain the full explanation.' + (b.tg ? ' Tags and wrong-choice labels: Claude’s annotation, done twice blind and settled by a third pass.' : '') + '</p>';
      if (o.after) { o.after(ok); }
      showFeedback($('.verdict', el));
    }
    return { el: el, pick: pick, done: function () { return done; } };
  }
