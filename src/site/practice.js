  /* =================== Practice: timed sets =================== */
  var TIERS = { std: { g: 60, r: 70, label: 'Standard · 1:00 grammar, 1:10 reading' }, fast: { g: 45, r: 55, label: 'Fast · 0:45 and 0:55' }, easy: { g: 80, r: 90, label: 'Relaxed · 1:20 and 1:30' } };
  var TS = null, tclock = null;
  function tset() {
    var s = isObj(store.s.timed) ? store.s.timed : {};
    return {
      src: ['g', 'r', 'q', 'n', 'x', 'both'].indexOf(s.src) !== -1 ? s.src : 'g',
      part: ['all', 'A', 'B', 'C'].indexOf(s.part) !== -1 ? s.part : 'all',
      diff: ['all', 'Easy', 'Medium', 'Hard'].indexOf(s.diff) !== -1 ? s.diff : 'all',
      which: ['all', 'new', 'missed', 'slow'].indexOf(s.which) !== -1 ? s.which : 'all',
      len: [10, 20, 0].indexOf(s.len) !== -1 ? s.len : 10,
      tier: TIERS[s.tier] ? s.tier : 'std',
      hints: s.hints === true
    };
  }
  // n: notes questions and x: transition questions, both with College Board's own answers
  var BANK = D.bank || {};
  BANK.notes = BANK.notes || []; BANK.trans = BANK.trans || []; BANK.reading = BANK.reading || [];
  var NOTES_PHASES = [[10 / 60, 'Goal', 'Read the goal first'], [0.75, 'Match', 'Find the choice that does it'], [1, 'Confirm', 'Check it against the notes']];
  function itemsAll() {
    return EXLIST.map(function (ex) { return { t: 'g', id: ex.q, d: ex.d, p: ex.p, ex: ex }; })
      .concat(RLIST.map(function (x) { return { t: 'r', id: x.qid, d: x.diff, p: 'R', x: x }; }))
      .concat(BANK.reading.map(function (b) { return { t: 'q', id: b.id, d: b.d, p: 'R', b: b }; }))
      .concat(BANK.notes.map(function (b) { return { t: 'n', id: b.id, d: b.d, p: 'N', b: b }; }))
      .concat(BANK.trans.map(function (b) { return { t: 'x', id: b.id, d: b.d, p: 'C', b: b }; }));
  }
  function bucketOf(it) { return it.t === 'g' ? 't' : it.t === 'r' ? 'r' : 'b'; }
  function result(it) { return rec(bucketOf(it), it.id); }
  function matching(s) {
    return itemsAll().filter(function (it) {
      var r = result(it);
      if (s.src === 'both' ? it.t === 'x' : it.t !== s.src) { return false; }
      if (it.t === 'g' && s.part !== 'all' && it.p !== s.part) { return false; }
      if (s.diff !== 'all' && it.d !== s.diff) { return false; }
      if (s.which === 'new' && r) { return false; }
      if (s.which === 'missed' && !(r && r.c === 0)) { return false; }
      if (s.which === 'slow' && !(r && typeof r.t === 'number' && r.t > (r.l || 60))) { return false; }
      return true;
    });
  }
  function timedRecord(bucket, list) {
    var tried = 0, right = 0, under = 0, times = [];
    list.forEach(function (id) {
      var r = rec(bucket, id);
      if (!r || typeof r.t !== 'number') { return; }
      tried += 1; if (r.c === 1) { right += 1; } if (r.t <= (r.l || 60)) { under += 1; } times.push(r.t);
    });
    return { tried: tried, right: right, under: under, med: median(times) };
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
    var s = tset();
    var g = timedRecord('t', EXLIST.map(function (e) { return e.q; })), r = timedRecord('r', RLIST.map(function (x) { return x.qid; }));
    var nb = timedRecord('b', BANK.notes.map(function (x) { return x.id; })), xb = timedRecord('b', BANK.trans.map(function (x) { return x.id; })), qb = timedRecord('b', BANK.reading.map(function (x) { return x.id; }));
    var all = itemsAll();
    var nNew = all.filter(function (it) { return !result(it); }).length;
    var nMiss = all.filter(function (it) { var x = result(it); return x && x.c === 0; }).length;
    var nSlow = all.filter(function (it) { var x = result(it); return x && typeof x.t === 'number' && x.t > (x.l || 60); }).length;
    var h = (prefix || '') + '<header class="read"><p class="eyebrow">Practice</p><h2 class="vtitle">Real questions against the clock</h2>' +
      '<p class="lede">' + EXLIST.length + ' grammar and transition questions with at least one for every rule, the ' + RLIST.length + ' reading worked examples, ' + BANK.reading.length + ' more reading questions from the bank, and every notes (' + BANK.notes.length + ') and transition (' + BANK.trans.length + ') question in the bank with College Board’s own answer. The clock counts down and keeps counting past zero, so you can see how far over you went. Each answer is followed by its fast path or walkthrough.</p></header>' +
      '<div class="record"><div><b>' + g.tried + '</b><span>of ' + EXLIST.length + ' grammar tried</span></div><div><b>' + g.right + '</b><span>right last time</span></div>' +
      '<div><b>' + r.tried + '</b><span>of ' + RLIST.length + ' reading tried</span></div><div><b>' + r.right + '</b><span>right last time</span></div>' +
      '<div><b>' + qb.tried + '</b><span>of ' + BANK.reading.length + ' bank reading tried</span></div><div><b>' + nb.tried + '</b><span>of ' + BANK.notes.length + ' notes tried</span></div><div><b>' + xb.tried + '</b><span>of ' + BANK.trans.length + ' transitions tried</span></div></div>' +
      '<div class="tsetup">' +
      seg('tsrc', 'Questions from', [['g', 'Grammar and transition lessons'], ['r', 'Reading worked examples'], ['q', BANK.reading.length + ' reading questions from the bank'], ['n', 'All ' + BANK.notes.length + ' notes questions'], ['x', 'All ' + BANK.trans.length + ' transition questions'], ['both', 'Mixed: everything but the transition set']], s.src) +
      '<div id="tpartwrap">' + seg('tpart', 'Grammar part', [['all', 'All parts'], ['A', 'A · Boundaries'], ['B', 'B · Form, Structure, and Sense'], ['C', 'C · Transitions']], s.part) + '</div>' +
      seg('tdiff', 'Difficulty', [['all', 'Any'], ['Easy', 'Easy'], ['Medium', 'Medium'], ['Hard', 'Hard']], s.diff) +
      seg('twhich', 'Which questions', [['all', 'All'], ['new', 'Not tried yet (' + nNew + ')'], ['missed', 'Missed last time (' + nMiss + ')'], ['slow', 'Over the clock last time (' + nSlow + ')']], s.which) +
      seg('tlen', 'Questions per set', [[10, '10'], [20, '20'], [0, 'All that match']], s.len) +
      seg('ttier', 'Clock', Object.keys(TIERS).map(function (k) { return [k, TIERS[k].label]; }), s.tier) +
      '<label class="checkline" for="thints"><input type="checkbox" id="thints"' + (s.hints ? ' checked' : '') + '>Highlight what changes in grammar choices</label>' +
      '<p class="h3" id="tcount" role="status"></p>' +
      '<div class="row"><button type="button" class="btn" id="tstart">Start the set</button>' +
      '<button type="button" class="linkbtn" id="tforget"' + (g.tried + r.tried + nb.tried + xb.tried + qb.tried ? '' : ' hidden') + '>Clear my saved results</button></div>' +
      '<div id="tconfirm" hidden><p class="verdict miss">Clear every saved timed result in this browser?</p><div class="row"><button type="button" class="btn" id="tyes">Clear them</button><button type="button" class="btn ghost" id="tno">Keep them</button></div></div>' +
      '<p class="fine">Answer with A, B, C or D, or 1 to 4, and press Enter for the next question. ' + (canStore ? 'Results are saved in this browser only.' : 'Results last until you close this page.') + '</p></div>' +
      '<h3 class="subh">Tables and graphs</h3><p class="pretty">The 133 table and graph questions are not in these sets, because their figures are drawings the export does not keep as text. Their IDs are on the <a href="#sets">practice sets</a> page, to open in College Board’s free question bank.</p>';
    var host = document.getElementById('thost');
    host.innerHTML = h;
    function readSettings() {
      var gv = function (n) { var x = $('input[name="' + n + '"]:checked', host); return x ? x.value : ''; };
      store.s.timed = { src: gv('tsrc'), part: gv('tpart'), diff: gv('tdiff'), which: gv('twhich'), len: Number(gv('tlen')), tier: gv('ttier'), hints: document.getElementById('thints').checked };
      save();
      return tset();
    }
    function refresh() {
      var st = readSettings(), n = matching(st).length;
      document.getElementById('tpartwrap').hidden = st.src !== 'g' && st.src !== 'both';
      document.getElementById('tcount').textContent = n === 0 ? 'No question matches these settings.' : plural(n, 'question') + ' match.';
      document.getElementById('tstart').disabled = n === 0;
    }
    $$('input', host).forEach(function (i) { i.addEventListener('change', refresh); });
    document.getElementById('tstart').addEventListener('click', function () {
      var st = readSettings(), list = shuffle(matching(st).slice());
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
    TS = { items: list, i: 0, res: [], tier: TIERS[st.tier], hints: st.hints, card: null, paused: false };
    document.getElementById('thost').innerHTML = '<div class="tplay"><div class="tbar"><span class="tpos" id="tpos"></span><div class="clockbox" id="tclock"></div>' +
      '<div class="row"><button type="button" class="btn sm" id="tnext2" hidden>Next</button><button type="button" class="linkbtn" id="tend">End set</button></div></div>' +
      '<div id="tcard"></div><div class="tnav" id="tnav"></div></div>';
    tclock = Clock(document.getElementById('tclock'), TS.tier.g, GRAMMAR_PHASES);
    document.getElementById('tend').addEventListener('click', timedFinish);
    document.getElementById('tnext2').addEventListener('click', timedNext);
    timedDraw();
    toTop();
  }
  function timedDraw() {
    var it = TS.items[TS.i], lim = it.t === 'r' || it.t === 'q' ? TS.tier.r : TS.tier.g;
    document.getElementById('tpos').textContent = 'Question ' + (TS.i + 1) + ' of ' + TS.items.length + ' · ' + { g: 'grammar', r: 'reading', q: 'reading', n: 'notes', x: 'transition' }[it.t];
    document.getElementById('tnav').innerHTML = '';
    document.getElementById('tnext2').hidden = true;
    tclock.reset(lim, it.t === 'r' || it.t === 'q' ? READING_PHASES : it.t === 'n' ? NOTES_PHASES : GRAMMAR_PHASES);
    TS.paused = false;
    var onAnswer = function (k, ok) {
      var t = tclock.stop(), bucket = bucketOf(it), prev = rec(bucket, it.id);
      TS.res.push({ it: it, k: k, ok: ok, t: t, l: lim });
      store[bucket][it.id] = { c: ok ? 1 : 0, t: Math.round(t * 10) / 10, l: lim, n: (prev && typeof prev.n === 'number' ? prev.n : 0) + 1 };
      save();
      return { time: t, limit: lim };
    };
    var after = function () {
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
      : it.t === 'q' ? QBCard(it.b, { meta: 'Question ' + it.id + ' · ' + it.b.jn + ' · ' + it.d, onAnswer: onAnswer, after: after })
      : BCard(it.b, it.t, { meta: 'Question ' + it.id + ' · ' + it.d, onAnswer: onAnswer, after: after });
    var host = document.getElementById('tcard');
    host.textContent = '';
    host.appendChild(TS.card.el);
    if (cur.view === 'practice' && !document.hidden) { tclock.start(); } else { TS.paused = true; }
  }
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
    var under = R.filter(function (r) { return r.t <= r.l; }).length;
    var avg = R.reduce(function (a, r) { return a + r.t; }, 0) / n;
    var missed = R.filter(function (r) { return !r.ok; });
    var slowRight = R.filter(function (r) { return r.ok && r.t > r.l; });
    var retry = missed.map(function (r) { return r.it; }), st = tset();
    var lineFor = function (r) {
      if (r.it.t === 'g') { var ex = r.it.ex, u = U[ex.u]; return '<a href="#' + u.id + '">' + u.num + ' ' + u.title + '</a>'; }
      if (r.it.t === 'x') { var ux = U[r.it.b.u]; return ux ? '<a href="#' + ux.id + '">' + ux.num + ' ' + ux.title + '</a>' : 'Transition question'; }
      if (r.it.t === 'n') { return '<a href="#notesfirst">Notes question: goal first</a>'; }
      if (r.it.t === 'q') { var jq = RD.jobs.filter(function (j) { return j.name === r.it.b.jn; })[0]; return jq ? '<a href="#' + jq.id + '">' + esc(r.it.b.jn) + '</a>' : esc(r.it.b.jn); }
      return '<a href="#ex-' + r.it.x.n + '">Example ' + r.it.x.n + ' · ' + esc(r.it.x.title) + '</a>';
    };
    document.getElementById('thost').innerHTML = '<p class="eyebrow">Set finished</p><p class="dresult">' + right + ' of ' + n + ' right · ' + under + ' inside the clock</p>' +
      '<p class="lede">Average ' + clock(avg) + ' a question.' + (n < total ? ' You answered ' + n + ' of ' + total + '.' : '') + '</p>' + chartHTML(R) +
      (missed.length ? '<h3 class="subh">What to review</h3><ul class="missed">' + missed.map(function (r) {
        return '<li>' + lineFor(r) + ' <span class="muted">· question ' + r.it.id + ' · you chose ' + r.k + ', the answer is ' + (r.it.t === 'g' ? r.it.ex.a : r.it.t === 'r' ? r.it.x.ans : r.it.b.ans) + '</span></li>';
      }).join('') + '</ul>' : '<p class="subh">Every answer right.</p>') +
      (slowRight.length ? '<h3 class="subh">Right, but over the clock</h3><ul class="missed">' + slowRight.map(function (r) {
        return '<li>' + lineFor(r) + ' <span class="muted">· ' + clock(r.t) + ' of ' + clock(r.l) + '</span></li>';
      }).join('') + '</ul>' : '') +
      '<div class="row" style="margin-top:1.4rem">' + (retry.length ? '<button type="button" class="btn" id="tretry">Retry the ' + plural(retry.length, 'miss', 'misses') + '</button>' : '') +
      '<button type="button" class="btn' + (retry.length ? ' ghost' : '') + '" id="tagain">Set up another</button></div>';
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
    el.className = 'rcard bcard';
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
      return walk && b.tg ? h : '<p class="passage">' + h + '</p>';
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
        '<p class="fine muted">Answer: College Board’s key. Explanations: College Board’s rationale, shortened.' + (b.tg ? ' Tags and wrong-choice labels: Claude’s annotation, done twice blind and settled by a third pass.' : '') + '</p>';
      if (o.after) { o.after(ok); }
      showFeedback($('.verdict', el));
    }
    return { el: el, pick: pick, done: function () { return done; } };
  }
