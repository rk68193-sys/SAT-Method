  /* =================== Math: mastery map, and why you miss =================== */
  /* store.m[id] = [right 0/1, seconds, time] is the last attempt at a question (math.js).
     store.x[id] = [reason, time] is what the student said went wrong the last time they missed it. */
  if (!isObj(store.x)) { store.x = {}; }
  var MWHY = [
    ['target', 'Answered a different question', 'A correct value, but not the one the last sentence asked for.', 'After you solve, read the last sentence again and say your answer as a sentence before you choose.'],
    ['trap', 'Fell for this type’s trap', 'The mistake named in the “Watch out” note for this question type.', 'Read the Watch out note for each type below, then retry those questions.'],
    ['method', 'Did not know the method', 'Could not name the question type or see how to start.', 'Open the method for each type below and follow one worked example before you retry.'],
    ['slip', 'Arithmetic or sign slip', 'The right method, but a wrong number along the way.', 'Write one more line of working, and check awkward arithmetic in Desmos.'],
    ['read', 'Misread the question', 'Missed a word, a unit, or a condition such as “positive”.', 'Mark the units and conditions before you start solving.'],
    ['time', 'Rushed or guessed', 'Short of time, or picked without working it out.', 'Practice this type without the clock first, then with it.']
  ];
  var MWHYBY = {};
  MWHY.forEach(function (w) { MWHYBY[w[0]] = w; });
  /* drills that train the habit behind a cause */
  var MWHY_DRILL = {
    slip: 'Short exercises for the usual mistakes: <a href="#m-drill-mexp">exponent rules</a>, <a href="#m-drill-mpct">percent multipliers</a>, <a href="#m-drill-mslope">slope from two points</a> and <a href="#m-drill-mfrac">clearing fractions</a>. The basics underneath: <a href="#m-found">Algebra basics</a>.',
    method: 'Short exercises for knowing where to start: <a href="#m-drill-mskill">Name the skill</a>, <a href="#m-drill-mcount">How many solutions?</a> and <a href="#m-drill-mform">Which form shows it?</a>'
  };
  function mWhyOf(id) { var r = store.x[id]; return Array.isArray(r) && has(MWHYBY, r[0]) ? r[0] : ''; }
  function mWhySaid(code) { return '<b>Saved.</b> ' + esc(MWHYBY[code][3]) + ' <a href="#m-traps">See your trap report</a>' + (MWHY_DRILL[code] ? '<br>' + MWHY_DRILL[code] : ''); }
  function mWhyHTML(id) {
    var cur = mWhyOf(id);
    return '<div class="mwhy" data-why-q="' + id + '"><p class="mwhy-h"><b>What went wrong?</b> <span class="muted">One tap builds your trap report.</span></p><div class="mwhy-row">' +
      MWHY.map(function (w) { return '<button type="button" class="mwhy-b" data-why="' + w[0] + '" aria-pressed="' + (cur === w[0] ? 'true' : 'false') + '" title="' + esc(w[2]) + '">' + esc(w[1]) + '</button>'; }).join('') +
      '</div><p class="fine mwhy-st" role="status">' + (cur ? mWhySaid(cur) : '') + '</p></div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-why]') : null;
    if (!b) { return; }
    var host = b.closest('[data-why-q]'), id = host.getAttribute('data-why-q'), code = b.getAttribute('data-why');
    if (!has(MWHYBY, code) || !MQBY[id]) { return; }
    if (mWhyOf(id) === code) { delete store.x[id]; code = ''; } else { store.x[id] = [code, Date.now()]; }
    save();
    $$('[data-why]', host).forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-why') === code ? 'true' : 'false'); });
    $('.mwhy-st', host).innerHTML = code ? mWhySaid(code) : 'Removed.';
  });
  /* the reasons given for a list of missed questions, most common first */
  function mWhyTally(ids) {
    var by = {}, none = 0;
    ids.forEach(function (id) { var c = mWhyOf(id); if (c) { (by[c] = by[c] || []).push(id); } else { none += 1; } });
    return { list: MWHY.filter(function (w) { return by[w[0]]; }).map(function (w) { return { w: w, ids: by[w[0]] }; }).sort(function (a, b) { return b.ids.length - a.ids.length; }), none: none };
  }
  /* shown under the results of a set or a module */
  function mWhySetHTML(ids) {
    if (!ids.length) { return ''; }
    var t = mWhyTally(ids);
    if (!t.list.length) { return '<section class="msec"><h3 class="h3">Why you missed</h3><p class="muted">After a miss, tap what went wrong. Your <a href="#m-traps">trap report</a> then shows the reasons that cost you the most.</p></section>'; }
    return '<section class="msec"><h3 class="h3">Why you missed</h3><ul class="mwhy-sum">' + t.list.map(function (x) {
      return '<li><b>' + x.ids.length + ' × ' + esc(x.w[1]) + '.</b> ' + esc(x.w[3]) + '</li>';
    }).join('') + '</ul><p class="fine">' + (t.none ? plural(t.none, 'miss', 'misses') + ' in this set ' + (t.none === 1 ? 'has' : 'have') + ' no reason yet. ' : '') + '<a href="#m-traps">See your full trap report</a></p></section>';
  }

  /* ---------- how you are doing on one fine type ---------- */
  var MLVL = { 'new': 'Not tried', weak: 'Needs work', mid: 'Getting there', strong: 'Strong' };
  function mTypeStat(m) {
    var tried = 0, right = 0, last = 0, missed = [];
    m.question_ids.forEach(function (id) {
      var r = mDone(id);
      if (!r || !MQBY[id]) { return; }
      tried += 1;
      if (r[0]) { right += 1; } else { missed.push(id); }
      if (r[2] > last) { last = r[2]; }
    });
    return { n: m.question_count, tried: tried, right: right, last: last, missed: missed, lvl: levelOf(right, tried, m.question_count), pct: mpc(right, tried) };
  }
  function mAgo(t) {
    var d = Math.floor((Date.now() - t) / 86400000);
    return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 14 ? d + ' days ago' : Math.round(d / 7) + ' weeks ago';
  }
  function mRecord(s) {
    if (!s.tried) { return 'Not tried yet · ' + plural(s.n, 'question') + ' in the bank'; }
    return s.right + ' of ' + s.tried + ' right · ' + s.tried + ' of ' + s.n + ' tried · last practiced ' + mAgo(s.last);
  }
  function mmCardHTML(m, s) {
    var id = encodeURIComponent(m.id);
    return '<article class="mm-next-c"><p class="mm-next-top"><span class="mm-lvl lvl-' + s.lvl + '">' + MLVL[s.lvl] + (s.tried ? ' · ' + s.right + ' of ' + s.tried + ' right' : '') + '</span><span class="muted">' + esc(MSK[m.skill].short) + '</span></p>' +
      '<h4 class="h3">' + esc(m.title) + '</h4><p class="mtrap"><span class="mtag bad">Watch out</span> ' + esc(m.common_trap) + '</p>' +
      '<p class="row"><a class="btn sm" href="#m-study-practice-' + id + '">Practice this type</a><a class="linkbtn" href="#m-study-' + id + '">Method</a></p></article>';
  }
  function mmDetailHTML(m) {
    var s = mTypeStat(m), id = encodeURIComponent(m.id);
    return '<div class="mm-detail" id="mm-detail" tabindex="-1"><p class="mm-next-top"><span class="mtag">' + esc(MSK[m.skill].name) + '</span><span class="mm-lvl lvl-' + s.lvl + '">' + MLVL[s.lvl] + '</span><button class="linkbtn mm-close" type="button" data-mm-close>Close</button></p>' +
      '<h4 class="h3">' + esc(m.title) + '</h4><p class="mm-rec">' + mRecord(s) + '</p>' +
      '<p><b>Why the method works:</b> ' + esc(m.why_it_works) + '</p>' +
      '<p class="mtrap"><span class="mtag bad">Watch out</span> ' + esc(m.common_trap) + '</p>' +
      '<p class="row"><a class="btn sm" href="#m-study-practice-' + id + '">Practice this type (' + s.n + ')</a>' +
      (s.missed.length ? '<button class="btn ghost sm" type="button" data-mm-retry="' + esc(m.id) + '">' + retryLabel('type', s.missed.length, 22) + '</button>' : '') +
      '<a class="linkbtn" href="#m-study-' + id + '">Full method</a></p></div>';
  }

  /* ---------- the reasons you miss ---------- */
  function mStillMissed() { return Object.keys(store.m).filter(function (id) { var r = mDone(id); return r && MQBY[id] && !r[0]; }); }
  function mTrapHTML() {
    var missed = mStillMissed(), tagged = Object.keys(store.x).filter(function (id) { return MQBY[id] && mWhyOf(id); });
    var t = mWhyTally(tagged), total = tagged.length;
    var untagged = missed.filter(function (id) { return !mWhyOf(id); }).length;
    var head = '<h3 class="h2">Why you miss</h3><p class="lede">After a miss in practice, tap what went wrong. This report adds those taps up, so you fix the habit and not just the question.</p>';
    var retryAll = missed.length ? '<p class="row" style="margin-top:1rem"><button class="btn sm" type="button" data-mw-retry="all">' + retryLabel('all', missed.length, 22) + '</button>' + (untagged && total ? '<span class="fine">' + untagged + ' of them ' + (untagged === 1 ? 'has' : 'have') + ' no reason yet.</span>' : '') + '</p>' : '';
    if (!total) {
      return head + '<aside class="mnote"><p><b>No reasons recorded yet.</b> ' + (missed.length ? 'You have ' + plural(missed.length, 'missed question') + '. Retry them, and when one goes wrong again, tap the reason under the answer.' : 'Practice a set; when you miss a question, the reasons to choose from appear under the answer.') + '</p></aside>' + retryAll;
    }
    var cards = t.list.map(function (x, i) {
      var types = {}, still = 0;
      x.ids.forEach(function (id) { var m = MSTBY[MST.questions[id].method]; types[m.id] = (types[m.id] || 0) + 1; var r = mDone(id); if (r && !r[0]) { still += 1; } });
      var tk = Object.keys(types).sort(function (a, b) { return types[b] - types[a]; });
      var chips = tk.slice(0, 5).map(function (k) { return '<a class="mchip" href="#m-map-' + encodeURIComponent(k) + '">' + esc(MSTBY[k].title) + (types[k] > 1 ? ' × ' + types[k] : '') + '</a>'; }).join('');
      var traps = x.w[0] === 'trap' ? '<ul class="mtr-traps">' + tk.slice(0, 3).map(function (k) { return '<li><b>' + esc(MSTBY[k].title) + ':</b> ' + esc(MSTBY[k].common_trap) + '</li>'; }).join('') + '</ul>' : '';
      return '<article class="mtr"><header class="mtr-h"><h4 class="h3">' + (i + 1) + ' · ' + esc(x.w[1]) + '</h4><span class="mtr-n">' + plural(x.ids.length, 'miss', 'misses') + ' · ' + mpc(x.ids.length, total) + '%</span></header>' +
        '<span class="mbar" aria-hidden="true"><i style="width:' + mpc(x.ids.length, total) + '%"></i></span>' +
        '<p class="muted">' + esc(x.w[2]) + '</p><p><b>The fix:</b> ' + esc(x.w[3]) + '</p>' + (MWHY_DRILL[x.w[0]] ? '<p class="mtr-drill">' + MWHY_DRILL[x.w[0]] + '</p>' : '') + traps +
        '<p class="mtr-types"><span class="mtag">Where it happened</span> ' + chips + (tk.length > 5 ? '<span class="muted">and ' + (tk.length - 5) + ' more</span>' : '') + '</p>' +
        (still ? '<p class="row"><button class="btn ghost sm" type="button" data-mw-retry="' + x.w[0] + '">' + retryLabel('some', still, 22) + '</button></p>' : '<p class="fine">You have since answered ' + (x.ids.length === 1 ? 'this question' : 'all of these') + ' correctly.</p>') + '</article>';
    }).join('');
    return head + '<p class="mtr-total"><b>' + plural(total, 'miss', 'misses') + ' with a reason.</b> Your most common one: ' + esc(t.list[0].w[1].toLowerCase()) + '.</p><div class="mtrs">' + cards + '</div>' + retryAll;
  }

  /* ---------- the page ---------- */
  var mmSel = '', mmFilter = 'all';
  function mmSkillHost(m) { return $('.mm-skill[data-skill="' + m.skill + '"] .mm-detail-host', viewEl.mmap); }
  function mmSelect(id, focus) {
    var old = document.getElementById('mm-detail');
    if (old) { old.parentNode.removeChild(old); }
    mmSel = has(MSTBY, id) ? id : '';
    $$('.mm-t', viewEl.mmap).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mm') === mmSel ? 'true' : 'false'); });
    if (!mmSel) { return; }
    mmSkillHost(MSTBY[mmSel]).innerHTML = mmDetailHTML(MSTBY[mmSel]);
    if (focus) { focusQuiet(document.getElementById('mm-detail')); }
  }
  function buildMMap(openId) {
    if (openId && has(MSTBY, openId)) { mmSel = openId; mmFilter = 'all'; }
    var stat = {}, cnt = { 'new': 0, weak: 0, mid: 0, strong: 0 }, tried = 0;
    MST.methods.forEach(function (m) { var s = stat[m.id] = mTypeStat(m); cnt[s.lvl] += 1; tried += s.tried; });
    var N = MST.methods.length, started = N - cnt['new'];
    var next = MST.methods.filter(function (m) { return stat[m.id].lvl === 'weak' || stat[m.id].lvl === 'mid'; }).sort(function (a, b) {
      var x = stat[a.id], y = stat[b.id];
      return x.pct - y.pct || y.tried - x.tried;
    }).slice(0, 6);
    var mods = Array.isArray(store.s.modules) ? store.s.modules.filter(isObj) : [];
    var doms = MD.domains.map(function (d) {
      return '<div class="mm-dom"><h4 class="h3">' + esc(d.name) + '</h4>' + d.skills.map(function (k) {
        var L = MST.methods.filter(function (m) { return m.skill === k; }), st = L.filter(function (m) { return stat[m.id].tried; }).length;
        return '<div class="mm-skill" data-skill="' + k + '"><p class="mm-skill-h"><a href="#m-' + k + '">' + esc(MSK[k].short) + '</a><span>' + st + ' of ' + plural(L.length, 'type') + ' tried</span></p><div class="mm-tiles">' +
          L.map(function (m) {
            var s = stat[m.id];
            return '<button type="button" class="mm-t lvl-' + s.lvl + '" data-mm="' + esc(m.id) + '" aria-pressed="false" title="' + esc(m.title) + '" aria-label="' + esc(m.title) + ': ' + (s.tried ? s.right + ' of ' + s.tried + ' right. ' : '') + MLVL[s.lvl] + '.">' + (s.tried ? s.pct : '') + '</button>';
          }).join('') + '</div><div class="mm-detail-host"></div></div>';
      }).join('') + '</div>';
    }).join('');
    viewEl.mmap.innerHTML = '<div class="wrap">' +
      mHead('Math · My progress', 'My progress', 'How you are doing on each of the ' + N + ' kinds of math question. This page fills in as you answer practice questions. Tap a colored square to see what to watch out for, and to practice just that kind.') +
      '<div class="mst-stats mm-stats"><div><b>' + started + '</b><span>of ' + N + ' types tried</span></div><div><b>' + cnt.strong + '</b><span>strong</span></div><div><b>' + cnt.mid + '</b><span>getting there</span></div><div><b>' + cnt.weak + '</b><span>need work</span></div></div>' +
      diagLineHTML('m') + dataLineHTML() + mFoundNudgeHTML() +
      (tried ? '' : '<aside class="mnote"><p><b>No practice questions answered yet.</b> Answer a few and this page fills in.' + (drillTried('math').length ? ' Your short exercises are listed below.' : '') + ' Results are saved ' + savedIn() + '.</p><a class="btn sm" href="#m-practice">Practice real questions</a></aside>') +
      (tried ? '<section class="sec first" id="mm-next"><h3 class="h2">Work on these next</h3>' + (next.length
        ? '<p class="lede">Your lowest-scoring types so far. Read the trap, then practice just that type.</p><div class="mm-nexts">' + next.map(function (m) { return mmCardHTML(m, stat[m.id]); }).join('') + '</div>'
        : '<p class="lede">Nothing needs work right now. Pick a grey square below to try a type you have not seen.</p>') + '</section>' : '') +
      drillProgressHTML('math') +
      '<section class="sec' + (tried ? '' : ' first') + '" id="mm-all"><h3 class="h2">All ' + N + ' types</h3><p class="lede">The number in a square is your percent right on the questions you have tried. Grey squares are types you have not tried.</p>' +
        seg('mm-show', 'Show', [['all', 'All'], ['weak', 'Needs work · ' + cnt.weak], ['mid', 'Getting there · ' + cnt.mid], ['strong', 'Strong · ' + cnt.strong], ['new', 'Not tried · ' + cnt['new']]], mmFilter) +
        '<p class="mm-key"><span><i class="mm-t lvl-weak" aria-hidden="true"></i>Needs work: under 60% right</span><span><i class="mm-t lvl-mid" aria-hidden="true"></i>Getting there</span><span><i class="mm-t lvl-strong" aria-hidden="true"></i>Strong: 85% or more, on at least 3 questions</span><span><i class="mm-t lvl-new" aria-hidden="true"></i>Not tried</span></p>' +
        '<div class="mm-map" id="mm-map" data-show="' + mmFilter + '">' + doms + '</div></section>' +
      '<section class="sec" id="m-traps">' + mTrapHTML() + '</section>' +
      '<section class="sec" id="mm-mods"><h3 class="h2">Timed tests</h3>' + (mods.length
        ? '<p class="lede">Your last ' + (mods.length > 5 ? '5 timed tests' : plural(mods.length, 'timed test')) + ': 22 questions on one clock, like one part of the real Math section.</p><ul class="mm-mods">' + mods.slice(-5).reverse().map(function (r) {
            return '<li><b>' + r.r + ' of ' + r.n + '</b><span>' + clock(r.s) + ' of ' + clock(r.l) + ' used</span><span class="muted">' + new Date(r.t).toLocaleDateString() + '</span></li>';
          }).join('') + '</ul>'
        : '<p class="lede">None taken yet. A timed test is 22 questions on one 35-minute clock, like one part of the real Math section. You see the answers at the end.</p>') +
        '<p class="row" style="margin-top:1rem"><a class="btn sm" href="#m-module">Take a timed test</a></p></section>' +
      nextHTML(['m-practice', 'Practice real questions', 'Work on the kinds of question that need it.'], ['m-learn', 'go back to the lessons']) + '</div>';
    if (mmSel) { mmSelect(mmSel, false); }
  }
  function mRetrySet(ids) {
    var pool = shuffle(ids.map(function (id) { return MQBY[id]; }).filter(Boolean)).slice(0, 22);
    if (!pool.length) { return; }
    clearInterval(mpInterval);
    MP = { qs: pool, i: 0, res: [], timer: false, over: false };
    try { history.pushState(null, '', '#m-practice'); } catch (e) {}
    lastToken = 'm-practice';
    showView('mprac'); mpShow();
  }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-mm],[data-mm-close],[data-mm-retry],[data-mw-retry]') : null;
    if (!t) { return; }
    if (t.hasAttribute('data-mm')) { var id = t.getAttribute('data-mm'); mmSelect(id === mmSel ? '' : id, true); return; }
    if (t.hasAttribute('data-mm-close')) { var back = $('.mm-t[aria-pressed="true"]', viewEl.mmap); mmSelect('', false); focusQuiet(back); return; }
    if (t.hasAttribute('data-mm-retry')) { var m = MSTBY[t.getAttribute('data-mm-retry')]; if (m) { mRetrySet(mTypeStat(m).missed); } return; }
    var code = t.getAttribute('data-mw-retry'), missed = mStillMissed();
    mRetrySet(code === 'all' ? missed : missed.filter(function (q) { return mWhyOf(q) === code; }));
  });
  document.addEventListener('change', function (e) {
    if (!e.target || e.target.name !== 'mm-show') { return; }
    mmFilter = e.target.value;
    var host = document.getElementById('mm-map');
    if (host) { host.setAttribute('data-show', mmFilter); }
  });

