  /* =================== Reading and Writing: question types, the mastery map, why you miss =================== */
  /* Every question belongs to one type: one of the 106 grammar and transition rules, or one of the 20 kinds of reading question.
     Results come from the practice records (store.t, store.r, store.b): the last attempt at each question, with the cause the
     student chose in "Review the reasoning". */
  var RWT = [], RWTBY = {}, RWSETOF = {}, RWQT = {}, RWIT = {}, RWITEMS = null;
  function rwSetJob(name) {
    var J = [[/^Main idea/, 'job-main'], [/^Detail/, 'job-detail'], [/^Inference/, 'job-inference'], [/^Support/, 'job-support'], [/^Weaken/, 'job-weaken'], [/^Quotation/, 'job-quote'],
      [/^(Table|Graph)/, 'job-data'], [/^(Word|Meaning)/, 'job-word'], [/^(Main purpose|Overall structure|Function)/, 'job-structure'], [/^(How would|Both would|A difference)/, 'job-cross'], [/^Use the notes/, 'job-notes']];
    for (var i = 0; i < J.length; i += 1) { if (J[i][0].test(name)) { return J[i][1]; } }
    return '';
  }
  (function () {
    function add(t) { t.items = []; RWT.push(t); RWTBY[t.id] = t; }
    RD.sets.forEach(function (g, gi) {
      g.sets.forEach(function (s, si) {
        var id = 'rs' + gi + '-' + si;
        add({ id: id, kind: 'r', group: g.group, gi: gi, si: si, name: s.name, job: rwSetJob(s.name) });
        Object.keys(s.byDiff).forEach(function (d) { s.byDiff[d].forEach(function (q) { RWSETOF[q] = id; }); });
      });
    });
    CONCEPTS.forEach(function (c) {
      c.uses.forEach(function (uid) { var u = U[uid]; add({ id: uid, kind: 'g', part: c.part, c: c.id, name: u.num + ' ' + plain(u.title) }); });
    });
  }());
  function rwTypeOf(it) { return it.t === 'g' ? it.ex.u : it.t === 'a' ? it.b.unit : it.t === 'x' ? it.b.u : RWSETOF[it.id]; }
  /* each question once, with its type; a question that is in a lesson and in the bank keeps its lesson card */
  function rwItems() {
    if (RWITEMS) { return RWITEMS; }
    var seen = {};
    RWITEMS = itemsAll().filter(function (it) { if (seen[it.id]) { return false; } seen[it.id] = true; return true; });
    RWITEMS.forEach(function (it) { var t = RWTBY[rwTypeOf(it)]; RWIT[it.id] = it; if (t) { t.items.push(it); RWQT[it.id] = t.id; } });
    return RWITEMS;
  }
  function rwAns(it) { return it.t === 'g' ? it.ex.a : it.t === 'r' ? it.x.ans : it.b.ans; }
  var RW_DOMS = [['cs', 'Craft and Structure'], ['ii', 'Information and Ideas'], ['sec', 'Standard English Conventions'], ['eoi', 'Expression of Ideas']];
  /* College Board's four content areas, in the order the test asks them */
  function rwDomain(it) {
    var t = RWTBY[rwTypeOf(it)];
    if (!t) { return 'cs'; }
    if (t.kind === 'g') { return t.part === 'C' ? 'eoi' : 'sec'; }
    return t.group === 'Information and Ideas' ? 'ii' : t.group === 'Rhetorical Synthesis' ? 'eoi' : 'cs';
  }
  function rwStat(t) {
    rwItems();
    var tried = 0, right = 0, last = 0, missed = [], by = { Easy: [0, 0], Medium: [0, 0], Hard: [0, 0] };
    t.items.forEach(function (it) {
      var r = result(it);
      if (!r) { return; }
      tried += 1;
      if (by[it.d]) { by[it.d][1] += 1; }
      if (r.c === 1) { right += 1; if (by[it.d]) { by[it.d][0] += 1; } } else { missed.push(it); }
      if ((r.at || 0) > last) { last = r.at; }
    });
    return { n: t.items.length, tried: tried, right: right, last: last, missed: missed, by: by, lvl: levelOf(right, tried, t.items.length), pct: pct(right, tried) };
  }
  function rwRecord(s) {
    if (!s.tried) { return 'Not tried yet · ' + plural(s.n, 'question') + ' in the bank'; }
    return s.right + ' of ' + s.tried + ' right · ' + s.tried + ' of ' + s.n + ' tried' + (s.last ? ' · last practiced ' + mAgo(s.last) : '');
  }
  function rwWhere(t) {
    if (t.kind === 'r') { return esc(t.group); }
    var c = CBY[t.c];
    return 'Lesson ' + c.n + ' · ' + esc(c.title);
  }
  function rwStudy(t) { return t.kind === 'g' ? t.id : (t.job === 'job-notes' ? 'notesfirst' : t.job); }
  function rwNote(t) {
    if (t.kind === 'g') { return '<p class="rule"><span class="rl">Rule ' + U[t.id].num + '</span>' + U[t.id].rule + '</p>'; }
    var job = RD.jobs.filter(function (j) { return j.id === t.job; })[0];
    return job && job.look ? '<p><b>What to look at first:</b> ' + job.look + '</p>' : '';
  }
  function rwCardHTML(t, s) {
    return '<article class="mm-next-c"><p class="mm-next-top"><span class="mm-lvl lvl-' + s.lvl + '">' + MLVL[s.lvl] + (s.tried ? ' · ' + s.right + ' of ' + s.tried + ' right' : '') + '</span><span class="muted">' + rwWhere(t) + '</span></p>' +
      '<h4 class="h3">' + esc(t.name) + '</h4>' +
      '<p class="row"><button class="btn sm" type="button" data-rw-go="' + t.id + '">Practice this ' + (t.kind === 'g' ? 'rule' : 'type') + '</button>' + (rwStudy(t) ? '<a class="linkbtn" href="#' + rwStudy(t) + '">' + (t.kind === 'g' ? 'Study the rule' : 'How to do it') + '</a>' : '') + '</p></article>';
  }
  function rwDetailHTML(t) {
    var s = rwStat(t), n = Math.min(10, s.n);
    var diffs = ['Easy', 'Medium', 'Hard'].filter(function (d) { return s.by[d][1]; }).map(function (d) { return d + ' ' + s.by[d][0] + ' of ' + s.by[d][1]; }).join(' · ');
    return '<div class="mm-detail" id="rwm-detail" tabindex="-1"><p class="mm-next-top"><span class="mtag">' + rwWhere(t) + '</span><span class="mm-lvl lvl-' + s.lvl + '">' + MLVL[s.lvl] + '</span><button class="linkbtn mm-close" type="button" data-rwm-close>Close</button></p>' +
      '<h4 class="h3">' + esc(t.name) + '</h4><p class="mm-rec">' + rwRecord(s) + (diffs && t.kind === 'r' ? '<br>Right by difficulty: ' + diffs : '') + '</p>' + rwNote(t) +
      '<p class="row"><button class="btn sm" type="button" data-rw-go="' + t.id + '">Practice this ' + (t.kind === 'g' ? 'rule' : 'type') + ' (' + (n < s.n ? n + ' of ' + s.n : s.n) + ')</button>' +
      (s.missed.length ? '<button class="btn ghost sm" type="button" data-rw-miss="' + t.id + '">' + retryLabel('type', s.missed.length, 20) + '</button>' : '') +
      (rwStudy(t) ? '<a class="linkbtn" href="#' + rwStudy(t) + '">' + (t.kind === 'g' ? 'Study the rule' : 'How to do it') + '</a>' : '') + '</p></div>';
  }

  /* ---------- the causes you chose, added up ---------- */
  var RW_FIX = {
    meaning: 'Say the sentence in your own words, and check who or what each pronoun points to, before you read the choices.',
    scope: 'Mark the limiting words in the text (some, most, only, more than). The right choice keeps every one of them.',
    evidence: 'Put your finger on the words that prove the choice. If you cannot point to them, it is not the answer.',
    data: 'Read the title, the labels and the units first. Then find the exact row, bar or point the claim names.',
    goal: 'Read the question line first and name the job before you read the passage.',
    grammar: 'Find the subject and the verb of each clause, then run the one check for that pattern.',
    vocab: 'Look up every choice you could not define in the word list, learn it in its sentence, then retry the question.',
    pace: 'Practice this type without the clock first, then with it.',
    slip: 'Read the sentence with your answer in place before you move on.',
    other: 'Open these questions again and write down the evidence or rule that decides each one.'
  };
  function rwCaused() { return rwItems().map(function (it) { return { it: it, r: result(it) }; }).filter(function (x) { return x.r && x.r.cause && has(RW_FIX, x.r.cause); }); }
  function rwCauseTally(rows) {
    var by = {};
    rows.forEach(function (x) { (by[x.r.cause] = by[x.r.cause] || []).push(x); });
    return REVIEW_CAUSES.filter(function (c) { return c[0] && by[c[0]]; }).map(function (c) { return { key: c[0], label: c[1], rows: by[c[0]] }; }).sort(function (a, b) { return b.rows.length - a.rows.length; });
  }
  function rwStillMissed() { return rwItems().filter(function (it) { var r = result(it); return r && r.c === 0; }); }
  function rwTrapHTML() {
    var rows = rwCaused(), list = rwCauseTally(rows), total = rows.length, missed = rwStillMissed();
    var untagged = missed.filter(function (it) { return !result(it).cause; }).length;
    var head = '<h3 class="h2">Why you miss</h3><p class="lede">After an answer in practice, tap what caused the difficulty. This report adds those taps up, so you fix the habit and not just the question.</p>';
    var retryAll = missed.length ? '<p class="row" style="margin-top:1rem"><button class="btn sm" type="button" data-rw-cause="all">' + retryLabel('all', missed.length, 20) + '</button>' + (untagged && total ? '<span class="fine">' + untagged + ' of them ' + (untagged === 1 ? 'has' : 'have') + ' no cause yet.</span>' : '') + '</p>' : '';
    if (!total) {
      return head + '<aside class="mnote"><p><b>No causes recorded yet.</b> ' + (missed.length ? 'You have ' + plural(missed.length, 'missed question') + '. Retry them, and when one goes wrong again, tap the cause under the explanation.' : 'Practice a set; after each answer, the causes to choose from appear under the explanation.') + '</p></aside>' + retryAll;
    }
    var cards = list.map(function (x, i) {
      var types = {}, still = 0;
      x.rows.forEach(function (row) { var tid = RWQT[row.it.id]; if (tid) { types[tid] = (types[tid] || 0) + 1; } if (row.r.c === 0) { still += 1; } });
      var tk = Object.keys(types).sort(function (a, b) { return types[b] - types[a]; });
      var chips = tk.slice(0, 5).map(function (k) { return '<a class="mchip" href="#rw-map-' + k + '">' + esc(RWTBY[k].name) + (types[k] > 1 ? ' × ' + types[k] : '') + '</a>'; }).join('');
      return '<article class="mtr"><header class="mtr-h"><h4 class="h3">' + (i + 1) + ' · ' + esc(x.label) + '</h4><span class="mtr-n">' + plural(x.rows.length, 'question') + ' · ' + pct(x.rows.length, total) + '%</span></header>' +
        '<span class="mbar" aria-hidden="true"><i style="width:' + pct(x.rows.length, total) + '%"></i></span>' +
        '<p><b>The fix:</b> ' + esc(RW_FIX[x.key]) + (x.key === 'vocab' ? ' <a href="#vocab-mine">See the words from these questions</a>' : '') + '</p>' +
        '<p class="mtr-types"><span class="mtag">Where it happened</span> ' + chips + (tk.length > 5 ? '<span class="muted">and ' + (tk.length - 5) + ' more</span>' : '') + '</p>' +
        (still ? '<p class="row"><button class="btn ghost sm" type="button" data-rw-cause="' + x.key + '">' + retryLabel('some', still, 20) + '</button></p>' : '<p class="fine">You have since answered ' + (x.rows.length === 1 ? 'this question' : 'all of these') + ' correctly.</p>') + '</article>';
    }).join('');
    return head + '<p class="mtr-total"><b>' + plural(total, 'question') + ' with a cause.</b> Your most common one: ' + esc(list[0].label.charAt(0).toLowerCase() + list[0].label.slice(1)) + '.</p><div class="mtrs">' + cards + '</div>' + retryAll;
  }
  /* shown under the results of a module */
  function rwCauseSetHTML(items) {
    if (!items.length) { return ''; }
    var rows = items.map(function (it) { return { it: it, r: result(it) }; }).filter(function (x) { return x.r && x.r.cause && has(RW_FIX, x.r.cause); });
    var list = rwCauseTally(rows);
    if (!list.length) { return '<h3 class="subh">Why you missed</h3><p class="muted">Open a missed question and tap what caused the difficulty. Your <a href="#rw-traps">trap report</a> then shows the causes that cost you the most.</p>'; }
    return '<h3 class="subh">Why you missed</h3><ul class="mwhy-sum">' + list.map(function (x) { return '<li><b>' + x.rows.length + ' × ' + esc(x.label) + '.</b> ' + esc(RW_FIX[x.key]) + '</li>'; }).join('') + '</ul><p class="fine"><a href="#rw-traps">See your full trap report</a></p>';
  }

  /* ---------- the page ---------- */
  var rwmSel = '', rwmFilter = 'all';
  function rwmSelect(id, focus) {
    var old = document.getElementById('rwm-detail');
    if (old) { old.parentNode.removeChild(old); }
    rwmSel = has(RWTBY, id) ? id : '';
    $$('.mm-t', viewEl.rwmap).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-rwm') === rwmSel ? 'true' : 'false'); });
    if (!rwmSel) { return; }
    var tile = $('.mm-t[data-rwm="' + rwmSel + '"]', viewEl.rwmap), host = tile ? $('.mm-detail-host', tile.closest('.mm-skill')) : null;
    if (!host) { return; }
    host.innerHTML = rwDetailHTML(RWTBY[rwmSel]);
    if (focus) { focusQuiet(document.getElementById('rwm-detail')); }
  }
  function buildRwMap(openId) {
    rwItems();
    if (openId && has(RWTBY, openId)) { rwmSel = openId; rwmFilter = 'all'; }
    var stat = {}, cnt = { 'new': 0, weak: 0, mid: 0, strong: 0 }, tried = 0;
    RWT.forEach(function (t) { var s = stat[t.id] = rwStat(t); cnt[s.lvl] += 1; tried += s.tried; });
    var N = RWT.length, started = N - cnt['new'];
    var next = RWT.filter(function (t) { return stat[t.id].lvl === 'weak' || stat[t.id].lvl === 'mid'; }).sort(function (a, b) {
      var x = stat[a.id], y = stat[b.id];
      return x.pct - y.pct || y.tried - x.tried;
    }).slice(0, 6);
    function tile(t, wide) {
      var s = stat[t.id], label = esc(t.name) + ': ' + (s.tried ? s.right + ' of ' + s.tried + ' right. ' : '') + MLVL[s.lvl] + '.';
      return '<button type="button" class="mm-t' + (wide ? ' mm-tw' : '') + ' lvl-' + s.lvl + '" data-rwm="' + t.id + '" aria-pressed="false" title="' + esc(t.name) + '" aria-label="' + label + '">' +
        (wide ? '<span>' + esc(t.name) + '</span>' + (s.tried ? '<b>' + s.pct + '</b>' : '') : (s.tried ? s.pct : '')) + '</button>';
    }
    function row(head, sub, types, wide) {
      var st = types.filter(function (t) { return stat[t.id].tried; }).length;
      return '<div class="mm-skill"><p class="mm-skill-h">' + head + '<span>' + st + ' of ' + plural(types.length, sub) + ' tried</span></p><div class="mm-tiles">' + types.map(function (t) { return tile(t, wide); }).join('') + '</div><div class="mm-detail-host"></div></div>';
    }
    var reading = '<div class="mm-dom"><h4 class="h3">Reading</h4>' + RD.sets.map(function (g, gi) {
      return row('<b>' + esc(g.group) + '</b>', 'type', RWT.filter(function (t) { return t.kind === 'r' && t.gi === gi; }), true);
    }).join('') + '</div>';
    var grammar = D.parts.map(function (p) {
      return '<div class="mm-dom"><h4 class="h3">' + (p.key === 'C' ? 'Transitions' : 'Grammar · ' + esc(p.title)) + '</h4>' + p.concepts.map(function (cid) {
        var c = CBY[cid];
        return row('<a href="#' + c.id + '">' + c.n + ' · ' + esc(c.title) + '</a>', 'rule', RWT.filter(function (t) { return t.c === cid; }), false);
      }).join('') + '</div>';
    }).join('');
    var mods = Array.isArray(store.s.rwmodules) ? store.s.rwmodules.filter(isObj) : [];
    viewEl.rwmap.innerHTML = '<div class="wrap">' +
      '<header class="read"><p class="eyebrow">Reading and Writing · My map</p><h2 class="vtitle">Your mastery map</h2><p class="lede">Each square is a kind of reading question or one grammar rule, colored by how you did the last time you tried its questions. Tap one to see what to look at and practice just that.</p></header>' +
      '<div class="mst-stats mm-stats rw"><div><b>' + started + '</b><span>of ' + N + ' types tried</span></div><div><b>' + cnt.strong + '</b><span>strong</span></div><div><b>' + cnt.mid + '</b><span>getting there</span></div><div><b>' + cnt.weak + '</b><span>need work</span></div></div>' +
      diagLineHTML('rw') + dataLineHTML() +
      (tried ? '' : '<aside class="mnote"><p><b>Nothing practiced yet.</b> Answer a few questions and this map fills in. Results are saved ' + savedIn() + '.</p><a class="btn sm" href="#practice">Practice real questions</a></aside>') +
      (tried ? '<section class="sec first" id="rwm-next"><h3 class="h2">Work on these next</h3>' + (next.length
        ? '<p class="lede">Your lowest-scoring types so far. Study the rule or the routine, then practice just that type.</p><div class="mm-nexts">' + next.map(function (t) { return rwCardHTML(t, stat[t.id]); }).join('') + '</div>'
        : '<p class="lede">Nothing needs work right now. Pick a grey square below to try a type you have not seen.</p>') + '</section>' : '') +
      '<section class="sec' + (tried ? '' : ' first') + '" id="rwm-all"><h3 class="h2">All ' + N + ' types</h3><p class="lede">The number is your percent right on the questions you have tried. Grey means not tried yet.</p>' +
        seg('rwm-show', 'Show', [['all', 'All'], ['weak', 'Needs work · ' + cnt.weak], ['mid', 'Getting there · ' + cnt.mid], ['strong', 'Strong · ' + cnt.strong], ['new', 'Not tried · ' + cnt['new']]], rwmFilter) +
        '<p class="mm-key"><span><i class="mm-t lvl-weak" aria-hidden="true"></i>Needs work: under 60% right</span><span><i class="mm-t lvl-mid" aria-hidden="true"></i>Getting there</span><span><i class="mm-t lvl-strong" aria-hidden="true"></i>Strong: 85% or more, on at least 3 questions</span><span><i class="mm-t lvl-new" aria-hidden="true"></i>Not tried</span></p>' +
        '<div class="mm-map" id="rwm-map" data-show="' + rwmFilter + '">' + reading + grammar + '</div></section>' +
      '<section class="sec" id="rw-traps">' + rwTrapHTML() + '</section>' +
      '<section class="sec" id="rwm-mods"><h3 class="h2">Timed modules</h3>' + (mods.length
        ? '<p class="lede">Your last ' + (mods.length > 5 ? '5 modules' : plural(mods.length, 'module')) + ': 27 questions on one clock, like one part of the real section.</p><ul class="mm-mods">' + mods.slice(-5).reverse().map(function (r) {
            return '<li><b>' + r.r + ' of ' + r.n + '</b><span>' + clock(r.s) + ' of ' + clock(r.l) + ' used</span><span class="muted">' + new Date(r.t).toLocaleDateString() + '</span></li>';
          }).join('') + '</ul>'
        : '<p class="lede">Not taken yet. A module is 27 questions on one 32-minute clock, in the order the test asks them, with answers at the end.</p>') +
        '<p class="row" style="margin-top:1rem"><a class="btn sm" href="#rw-module">Take a timed module</a></p></section>' +
      '</div>';
    if (rwmSel) { rwmSelect(rwmSel, false); }
  }
  /* start an ordinary practice set from a list of questions */
  function rwStartSet(list) {
    if (!list.length) { return; }
    try { history.pushState(null, '', '#practice'); } catch (e) {}
    lastToken = 'practice';
    showView('practice'); buildPractice();
    timedStart(list, tset());
  }
  /* ten questions of one type: the ones not tried yet first, then the ones missed, then the rest */
  function rwTypeSet(t) {
    rwItems();
    var fresh = [], miss = [], rest = [];
    t.items.forEach(function (it) { var r = result(it); if (!r) { fresh.push(it); } else if (r.c === 0) { miss.push(it); } else { rest.push(it); } });
    return shuffle(fresh).concat(shuffle(miss), shuffle(rest)).slice(0, 10);
  }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-rwm],[data-rwm-close],[data-rw-go],[data-rw-miss],[data-rw-cause]') : null;
    if (!t) { return; }
    if (t.hasAttribute('data-rwm')) { var id = t.getAttribute('data-rwm'); rwmSelect(id === rwmSel ? '' : id, true); return; }
    if (t.hasAttribute('data-rwm-close')) { var back = $('.mm-t[aria-pressed="true"]', viewEl.rwmap); rwmSelect('', false); focusQuiet(back); return; }
    if (t.hasAttribute('data-rw-go')) { var ty = RWTBY[t.getAttribute('data-rw-go')]; if (ty) { rwStartSet(rwTypeSet(ty)); } return; }
    if (t.hasAttribute('data-rw-miss')) { var tm = RWTBY[t.getAttribute('data-rw-miss')]; if (tm) { rwStartSet(shuffle(rwStat(tm).missed).slice(0, 20)); } return; }
    var code = t.getAttribute('data-rw-cause'), missed = rwStillMissed();
    rwStartSet(shuffle(code === 'all' ? missed : missed.filter(function (it) { return result(it).cause === code; })).slice(0, 20));
  });
  document.addEventListener('change', function (e) {
    if (!e.target || e.target.name !== 'rwm-show') { return; }
    rwmFilter = e.target.value;
    var host = document.getElementById('rwm-map');
    if (host) { host.setAttribute('data-show', rwmFilter); }
  });

