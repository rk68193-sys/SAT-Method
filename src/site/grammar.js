  /* =================== Grammar =================== */
  function dialSVG(spec) {
    var cx = 100, cy = 100, r = 78;
    function pt(deg, rad) { var a = (deg - 90) * Math.PI / 180; return [(cx + rad * Math.cos(a)).toFixed(2), (cy + rad * Math.sin(a)).toFixed(2)]; }
    function arc(d0, d1, cls) {
      var p0 = pt(d0, r), p1 = pt(d1, r);
      return '<path class="' + cls + '" d="M' + p0[0] + ' ' + p0[1] + ' A' + r + ' ' + r + ' 0 ' + (d1 - d0 > 180 ? 1 : 0) + ' 1 ' + p1[0] + ' ' + p1[1] + '" fill="none" stroke-width="20"></path>';
    }
    var ticks = '', s;
    for (s = 0; s < 60; s += 1) {
      var big = s % 5 === 0, a = pt(s * 6, 93), b = pt(s * 6, big ? 101 : 98);
      ticks += '<line class="tick' + (big ? ' big' : '') + '" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"></line>';
    }
    var arcs = '', from = 0;
    spec.parts.forEach(function (p) {
      var to = from + 360 * p.s / spec.total;
      arcs += arc(from + 1.5, to - 1.5, p.cls);
      from = to;
    });
    return '<svg viewBox="-6 -6 212 212" role="img" aria-label="' + esc(spec.label) + '">' + ticks + arcs +
      '<text x="100" y="112" class="dnum" text-anchor="middle">' + spec.total + '</text><text x="100" y="134" class="dsub" text-anchor="middle">SECONDS</text></svg>';
  }
  var GRAMMAR_DIAL = { total: 60, label: 'A one-minute dial: 5 seconds to look, 40 to check, 15 to confirm', parts: [{ s: 5, cls: 'a-look' }, { s: 40, cls: 'a-check' }, { s: 15, cls: 'a-confirm' }] };
  var READING_DIAL = { total: 70, label: 'A 70-second dial: 5 seconds for the job, 35 to chunk, 10 to say, 20 to check', parts: [{ s: 5, cls: 'a-look' }, { s: 35, cls: 'a-check' }, { s: 10, cls: 'a-say' }, { s: 20, cls: 'a-confirm' }] };

  function step3(n, name, time, sw, text, tip) {
    return '<div class="step"><span class="bar ' + sw + '"></span><p class="shead"><span class="sn">' + n + '</span><span class="st">' + name + '</span><span class="stime">' + time + '</span></p><p>' + text + '</p><p class="tip">' + tip + '</p></div>';
  }
  var SAMPLE = {};
  (function () {
    var rank = { Easy: 0, Medium: 1, Hard: 2 };
    EXLIST.forEach(function (ex) { var s = SAMPLE[ex.pat]; if (!s || rank[ex.d] < rank[s.d]) { SAMPLE[ex.pat] = ex; } });
  }());
  function patRow(p, key, isSub) {
    var sample = SAMPLE[key];
    var links = p.links.map(function (l) { return '<a class="ulink" href="#' + l.t + '">' + esc(l.x) + '</a>'; }).join('');
    return '<div class="pat' + (isSub ? ' sub' : '') + '">' +
      '<div class="pc">' + p.count + '<small>of ' + TOTAL.q + '</small><span class="pbar"><i style="width:' + (100 * p.count / TOTAL.q).toFixed(1) + '%"></i></span></div>' +
      '<div class="pt"><p class="pp">' + p.pat + '</p>' + (p.what ? '<p class="tell">' + p.what + '</p>' : '') +
      (p.check ? '<p class="tell"><b>Check.</b> ' + p.check + '</p>' : '') + (links ? '<p>' + links + '</p>' : '') + '</div>' +
      '<div class="psample">' + (sample && !(p.sub && p.sub.length) ? '<p class="label">The choices of question ' + sample.q + '</p>' + miniHTML(sample, true, false) : '') + '</div></div>';
  }
  function patternsHTML() {
    var rows = '';
    F.forEach(function (p, i) {
      rows += patRow(p, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'][i], false);
      (p.sub || []).forEach(function (sp, j) { rows += patRow(sp, 'p4' + 'abc'[j], true); });
    });
    return '<section class="sec" id="patterns"><div class="sech"><p class="eyebrow">Step 1 in detail</p><h2 class="h2">Eight patterns in the answer choices</h2>' +
      '<p class="lede">' + D.first.intro + ' The highlighter marks what changes; a <span class="nomark" aria-hidden="true">^</span> marks a choice that puts nothing there.</p></div><div class="pats">' + rows + '</div></section>';
  }
  function grammarMethodHTML() {
    var A = partStats.A, B = partStats.B, C = partStats.C, s = D.first.steps;
    return '<header><p class="eyebrow">Grammar and transitions · ' + TOTAL.q + ' questions in the bank</p><h2 class="vtitle">The 60-second method</h2>' +
      '<p class="lede">Most grammar and transition questions change one small thing across their four answer choices. See what changes, run the one check that settles it, and move on.</p></header>' +
      '<div class="gintro"><figure class="dial sm">' + dialSVG(GRAMMAR_DIAL) + '<figcaption><ol class="dlegend">' +
      '<li><i class="sw-look"></i><span><b>0–5 sec · Look</b>Read the four choices. Name what changes.</span></li>' +
      '<li><i class="sw-check"></i><span><b>5–45 sec · Check</b>Read the whole sentence. Run the one check.</span></li>' +
      '<li><i class="sw-confirm"></i><span><b>45–60 sec · Confirm</b>Read it again with your answer in place.</span></li></ol></figcaption></figure>' +
      '<p class="facts">' + A.q + ' punctuation questions, ' + B.q + ' verb, pronoun, apostrophe and modifier questions, and ' + C.q + ' transition questions, sorted into ' + TOTAL.u + ' rules and ' + TOTAL.v + ' versions.</p></div>' +
      '<section class="sec" id="try"><div class="sech"><p class="eyebrow">Try one</p><h2 class="h2">A real question and a real minute</h2>' +
      '<p class="lede">Start the clock and answer. Then read the fast path: the pattern in the choices, the check that settles it, and why each wrong choice fails.</p></div><div class="demo" id="demo"></div></section>' +
      '<section class="sec" id="steps"><div class="sech"><p class="eyebrow">The method</p><h2 class="h2">One question, three steps</h2></div><div class="steps3">' +
      step3('1', 'Look', '0–5 s', 'sw-look', s[0], 'The choices tell you the rule before you read the passage. <a href="#patterns">See the eight patterns</a>.') +
      step3('2', 'Check', '5–45 s', 'sw-check', s[1], 'Each part has its own check: <a href="#part-a">what stands on each side of the blank</a>, <a href="#part-b">four verb situations</a>, and <a href="#part-c">naming the link</a>.') +
      step3('3', 'Confirm', '45–60 s', 'sw-confirm', s[2], 'Torn between two? Some choices are almost never right. <em>Is / are</em> + <em>-ing</em> was offered 45 times in verb questions and was never the answer. <a href="#shortcuts">See the shortcuts</a>.') +
      '</div><p class="fine" style="margin-top:.9rem">' + D.first.fine + ' The 5, 40 and 15 second split is a target to practice against.</p></section>' +
      patternsHTML();
  }

  /* ---------- Try one ---------- */
  var DEMO_Q = [];
  ['u1-1', 'u8-3', 'u14-1', 'u9-1', 'u13-5', 'u12-2', 'u2-1', 'u15-1', 'u11-1', 'u6-1'].forEach(function (uid) {
    if (U[uid] && U[uid].ex.length) { DEMO_Q.push(U[uid].ex[0]); }
  });
  var demo = { i: 0, clock: null, card: null, paused: false };
  function mountDemo() {
    var host = document.getElementById('demo');
    if (!host) { return; }
    host.innerHTML = '<div class="demobar"><div class="clockbox" id="demo-clock"></div><div class="row">' +
      '<button type="button" class="btn" id="demo-start">Start the clock</button><button type="button" class="btn ghost" id="demo-next">Try another question</button></div></div><div id="demo-q"></div>';
    demo.clock = Clock(document.getElementById('demo-clock'), 60, GRAMMAR_PHASES);
    document.getElementById('demo-start').addEventListener('click', function () {
      if (demo.card && !demo.card.done()) { demo.clock.start(); this.hidden = true; document.getElementById('demo-q').classList.remove('idle'); focusQuiet($('#demo-q .opt')); }
    });
    document.getElementById('demo-next').addEventListener('click', function () { demo.i = (demo.i + 1) % DEMO_Q.length; demoDraw(); });
    demoDraw();
  }
  function demoDraw() {
    var ex = EX[DEMO_Q[demo.i]];
    demo.clock.reset(60); demo.paused = false;
    document.getElementById('demo-start').hidden = false;
    document.getElementById('demo-q').classList.add('idle');
    demo.card = QCard(ex, {
      split: true,
      meta: 'Question ' + ex.q + ' · ' + ex.d + ' · sample ' + (demo.i + 1) + ' of ' + DEMO_Q.length,
      onAnswer: function () {
        document.getElementById('demo-start').hidden = true;
        if (!demo.clock.used()) { return null; }
        return { time: demo.clock.stop(), limit: 60 };
      }
    });
    var host = document.getElementById('demo-q');
    host.textContent = '';
    host.appendChild(demo.card.el);
  }
  function demoPause() { if (demo.clock && demo.clock.running()) { demo.clock.pause(); demo.paused = true; } }
  function demoResume() {
    if (demo.clock && demo.paused && demo.card && !demo.card.done() && document.getElementById('demo')) { demo.paused = false; demo.clock.start(); }
  }
  function demoHalt() { if (demo.clock) { demo.clock.halt(); } demo.paused = false; demo.card = null; }

  /* ---------- Lessons ---------- */
  function clistHTML(ids) {
    return '<ul class="clist">' + ids.map(function (cid) {
      var c = CBY[cid], cs = conceptStats[cid], d = !!store.l[cid];
      return '<li><a href="#' + cid + '"><span class="cn">' + c.n + '</span><span class="ct">' + esc(c.title) + '</span>' + mixHTML(c.split) +
        '<span class="cq">' + plural(cs.q, 'question') + '</span><span class="tickmark">' + (d ? '<span aria-hidden="true">✓</span><span class="sr">done</span>' : '') + '</span></a></li>';
    }).join('') + '</ul>';
  }
  function lessonsHomeHTML() {
    var h = '<header><p class="eyebrow">Grammar lessons</p><h2 class="vtitle">Every rule, in every version the bank uses</h2>' +
      '<p class="lede">' + NC + ' lessons in three parts cover all ' + TOTAL.u + ' rules and the ' + TOTAL.v + ' versions they take across ' + TOTAL.q + ' questions. Each rule comes with a real question to try.</p>' +
      '<p class="lmeta">' + countDone() + ' of ' + NC + ' lessons marked done</p></header>' +
      '<details class="howto-wrap"><summary>How to read a lesson</summary><ul class="howto">' +
      '<li><span class="label">Serif</span><span>Words in the serif face are quoted from the question bank: passages, fragments and answer choices. The plainer face is explanation.</span></li>' +
      '<li><span class="label">Highlight</span><span>The <mark class="fill">highlighted words</mark> are the right answer, set into the blank.</span></li>' +
      '<li><span class="label">Versions</span><span>The different forms a rule takes in the bank. Each shows a real fragment and the ID of every question built that way.</span></li>' +
      '<li><span class="label">E · M · H</span><span>The bank’s own Easy, Medium and Hard ratings, shaded light to dark. ' + MIXKEY + '</span></li>' +
      '<li><span class="label">IDs</span><span>Question IDs match College Board’s free SAT Suite Question Bank, where every question shows its ID.</span></li>' +
      '<li><span class="label">Counts</span><span>Counts describe this bank. A pattern that never failed here can still fail on a test, so each comes with the check that makes it safe.</span></li></ul></details>';
    D.parts.forEach(function (p) {
      var s = partStats[p.key];
      h += '<section class="partblock"><div class="sech"><p class="eyebrow">Part ' + p.key + ' · ' + s.q + ' questions · ' + s.u + ' rules · ' + s.v + ' versions</p><h3 class="h2">' + esc(p.title) + '</h3><p class="pretty">' + p.intro + '</p></div>' +
        '<p class="startlink"><a href="#part-' + p.key.toLowerCase() + '">Start here: ' + PART_INTRO[p.key] + '</a></p>' + clistHTML(p.concepts) + '</section>';
    });
    return h;
  }
  function useLinks(list) {
    return list.map(function (t) {
      var label = U[t] ? U[t].num : CBY[t] ? CBY[t].n + ' ' + CBY[t].title : t;
      return '<a class="ulink" href="#' + t + '">' + esc(label) + '</a>';
    }).join('');
  }
  var READ_LINK = { 0: 'a second statement joined on', 2: 'a list of examples, or a while add-on', 3: 'an aside, or a which / who add-on', 4: 'a lead-in before the subject' };
  function sitHTML(r, part, i) {
    var marks = r.marks.map(function (m) { return '<span class="mark1">' + (m.label ? '<span>' + m.label + '</span>' : '') + useLinks(m.uses) + '</span>'; }).join('');
    var first = r.marks.length && r.marks[0].uses.length ? U[r.marks[0].uses[0]] : null;
    var exm = first && first.v.length ? '<p class="sitex"><span class="label">Example · rule ' + first.num + '</span><span class="passage">' + first.v[0].frag + '</span></p>' : '';
    var rl = part === 'A' && READ_LINK[i] ? '<p class="fine">In reading, this mark shows where to cut a long sentence: ' + READ_LINK[i] + '. <a href="#long">Core first</a></p>' : '';
    return '<div class="sit"><p class="sh"><b>' + r.head + '</b><span class="wn">' + esc(r.count) + '</span></p>' +
      (marks ? '<p class="marks">' + marks + '</p>' : '') + (r.tell ? '<p class="tell">' + r.tell + '</p>' : '') + exm + rl + '</div>';
  }
  function rbarHTML(label, right, offered, max, extra) {
    var w = Math.max(1.5, 100 * offered / max);
    return '<div class="rrow' + (right === 0 ? ' never' : '') + '"><span class="rw">' + label + '</span>' +
      '<span class="rt" style="width:' + w.toFixed(1) + '%" role="img" aria-label="right ' + right + ' of ' + offered + ' times"><i class="r" style="width:' + (100 * right / offered).toFixed(1) + '%"></i><i class="w" style="width:' + (100 * (offered - right) / offered).toFixed(1) + '%"></i></span>' +
      '<span class="rs">' + right + ' of ' + offered + '</span>' + (extra || '') + '</div>';
  }
  var RKEY = '<p class="rkey"><span><i style="background:var(--ink)"></i>Right answer</span><span><i style="background:var(--d1)"></i>Offered, wrong</span><span>Bar length is how often the choices offer it.</span></p>';
  function formsHTML() {
    var max = 1;
    D.verbs.forms.forEach(function (g) { g.items.forEach(function (i) { if (i.stat && i.stat[1] > max) { max = i.stat[1]; } }); });
    var h = '<div class="rbars">';
    D.verbs.forms.forEach(function (g) {
      h += '<p class="rgroup">' + esc(g.group) + (g.stat ? ' · right ' + g.stat[0] + ' of ' + g.stat[1] : '') + '</p>';
      g.items.forEach(function (i) { if (i.stat) { h += rbarHTML(i.plain ? esc(i.w) : '<em>' + esc(i.w) + '</em>', i.stat[0], i.stat[1], max, ''); } });
    });
    return h + '</div>' + RKEY;
  }
  var TRANS = [];
  D.trans.groups.forEach(function (g) {
    g.rows.forEach(function (r) { r.words.forEach(function (w) { TRANS.push({ w: w.w, right: w.right, offered: w.offered, u: r.u, num: r.num, title: r.title, group: g.label }); }); });
  });
  var TMAX = Math.max.apply(null, TRANS.map(function (t) { return t.offered; }));
  function transHTML(mode, q) {
    q = (q || '').trim().toLowerCase();
    var list = q ? TRANS.filter(function (t) { return t.w.toLowerCase().indexOf(q) !== -1; }) : TRANS;
    if (!list.length) { return '<p class="empty">No transition in the bank matches “' + esc(q) + '”. Try part of the word.</p>'; }
    var h = '<div class="rbars">';
    if (mode === 'offered') {
      list.slice().sort(function (a, b) { return b.offered - a.offered || b.right - a.right || (a.w < b.w ? -1 : 1); }).forEach(function (t) {
        h += rbarHTML(esc(t.w), t.right, t.offered, TMAX, '<span class="rjob">' + (t.u ? '<a class="ulink" href="#' + t.u + '">' + t.num + '</a> ' : '') + t.title + '</span>');
      });
    } else {
      var lg = '', lu = '';
      list.forEach(function (t) {
        if (t.group !== lg) { h += '<p class="rgroup">' + esc(t.group) + '</p>'; lg = t.group; lu = ''; }
        var uk = t.u || t.title;
        if (uk !== lu) { h += '<p class="rsub">' + (t.u ? '<a class="ulink" href="#' + t.u + '">' + t.num + '</a> ' : '') + t.title + '</p>'; lu = uk; }
        h += rbarHTML(esc(t.w), t.right, t.offered, TMAX, '');
      });
    }
    return h + '</div>' + RKEY;
  }
  function wrongHTML() {
    return '<dl class="wrongjobs">' + D.trans.wrong.map(function (w) {
      var links = w.links.map(function (l) { return '<a class="ulink" href="#' + l.t + '">' + esc(l.x) + '</a>'; }).join(' ');
      return '<div><dt><b>' + esc(w.job) + '</b><span class="wn">' + plural(w.n, 'question') + (links ? ' · ' + links : '') + '</span></dt><dd>' +
        w.items.map(function (i) { return '<span>' + esc(i.job) + ' <span class="wn">' + i.n + '</span></span>'; }).join('') + '</dd></div>';
    }).join('') + '</dl>';
  }
  function partHTML(k) {
    var p = PART[k], s = partStats[k];
    var h = '<nav class="crumbs"><a href="#lessons">Lessons</a> / Part ' + k + ' · ' + esc(p.title) + '</nav><header style="margin-top:.6rem"><p class="eyebrow">Part ' + k + ' · ' + s.q + ' questions · ' + s.u + ' rules · ' + s.v + ' versions</p>';
    if (k === 'A') {
      var S = D.structure;
      h += '<h2 class="vtitle">' + esc(S.title) + '</h2><p class="lede">' + S.intro + '</p></header>' +
        '<div class="sits">' + S.rows.map(function (r, i) { return sitHTML(r, 'A', i); }).join('') + '</div>' +
        '<h3 class="subh">' + esc(S.subtitle) + '</h3><ol class="olist">' + S.steps.map(li).join('') + '</ol>';
    } else if (k === 'B') {
      var V = D.verbs;
      h += '<h2 class="vtitle">' + esc(V.title) + '</h2><p class="lede">' + V.intro + '</p></header>' +
        '<div class="sits">' + V.rows.map(function (r, i) { return sitHTML(r, 'B', i); }).join('') + '</div>' +
        '<h3 class="subh">The rest of Part B</h3><div class="sits">' + V.rest.map(function (r, i) { return sitHTML(r, 'B2', i); }).join('') + '</div>' +
        '<h3 class="subh">' + esc(V.formsTitle) + '</h3><p class="pretty">' + V.formsIntro + '</p>' + formsHTML() +
        (V.formsNote ? '<p class="fine" style="margin-top:.6rem">' + V.formsNote + '</p>' : '');
    } else {
      h += '<h2 class="vtitle">Name the link before you look</h2><p class="lede">' + p.intro + '</p></header>' +
        '<p class="spot"><b>Check.</b> ' + PAT.p8.check + '</p>' +
        '<h3 class="subh">Every transition the bank offers</h3><p class="pretty">' + D.trans.intro + '</p>' + transHTML('job', '') +
        '<h3 class="subh">What the wrong choices do</h3><p class="pretty">For each job the right answer does: the jobs of the three wrong choices beside it, counted over all the questions with that kind of answer.</p>' + wrongHTML();
    }
    return h + '<h3 class="subh">Lessons in this part</h3>' + clistHTML(p.concepts);
  }
  var BRIDGE = {
    c14: '<p class="fine bridge">In reading passages these are turn words: what follows them carries the weight. <a href="#turns">Mark the turn words</a></p>',
    c15: '<p class="fine bridge">In inference questions these are result cues: the blank says what follows. <a href="#leadin">See the cue table</a></p>'
  };
  var MYTH = {
    c3: '<div class="callout"><p class="label">A myth to drop</p><p>Some grammar guides say a colon may never follow a preposition. It can, when the preposition ends a complete clause: see the second example under <a class="ulink" href="#u3-3">3.3</a>. What a colon cannot do is come between a preposition and its object, which is rule <a class="ulink" href="#u7-3">7.3</a>.</p></div>'
  };
  function verHTML(v) {
    return '<li class="ver"><p class="vlabel">' + v.label + '</p><p class="vfrag">' + v.frag + '</p>' + (v.note ? '<p class="vnote">' + v.note + '</p>' : '') +
      '<p class="vids"><span>' + plural(v.ids.length, 'question') + '</span>' + v.ids.map(function (x) {
        return '<code id="i-' + x[0] + '"' + (x[2] ? ' class="shown" title="The fragment above is from this question"' : '') + '>' + x[0] + '<small>' + x[1] + '</small></code>';
      }).join('') + '</p></li>';
  }
  function useHTML(uid) {
    var u = U[uid];
    return '<article class="use" id="' + uid + '"><header class="uhead"><span class="unum">' + u.num + '</span><h3>' + u.title + '</h3>' +
      '<p class="umeta"><span>' + plural(u.q, 'question') + '</span>' + mixHTML(u.split) + '<span>E ' + u.split.Easy + ' · M ' + u.split.Medium + ' · H ' + u.split.Hard + '</span></p></header>' +
      '<p class="rule"><span class="rl">Rule</span>' + u.rule + '</p>' +
      (u.words ? '<p class="uwords"><b>Right answers in the bank.</b> ' + u.words + '</p>' : '') +
      '<section class="vers"><h4 class="label">' + plural(u.v.length, 'version') + ' in the bank</h4><ol class="vlist">' + u.v.map(verHTML).join('') + '</ol></section>' +
      (u.decoys ? '<p class="decoys"><b>Wrong choices offered.</b> ' + u.decoys + '</p>' : '') +
      u.ex.map(function (q, i) {
        return '<div class="exwrap" id="q-' + q + '"><p class="label">' + (u.ex.length > 1 ? 'Try it · example ' + (i + 1) + ' of ' + u.ex.length : 'Try it') + '</p><div class="exhost" data-q="' + q + '"></div></div>';
      }).join('') + '</article>';
  }
  function conceptHTML(c) {
    var cs = conceptStats[c.id], i = CONCEPTS.indexOf(c), next = CONCEPTS[i + 1], d = !!store.l[c.id];
    var hard = D.hard.rows.filter(function (r) { return U[r.u] && U[r.u].c === c.id && r.why; });
    var spot = c.spot || (c.part === 'C' ? PAT.p8.check : '');
    return '<nav class="crumbs"><a href="#lessons">Lessons</a> / <a href="#part-' + c.part.toLowerCase() + '">Part ' + c.part + ' · ' + esc(PART[c.part].title) + '</a></nav>' +
      '<header style="margin-top:.6rem"><p class="eyebrow">Lesson ' + c.n + ' of ' + NC + '</p><h2 class="vtitle">' + esc(c.title) + '</h2>' +
      '<p class="lmeta"><span>' + plural(cs.q, 'question') + ' in the bank · ' + plural(c.uses.length, 'rule') + ' · ' + plural(cs.v, 'version') + '</span>' + mixHTML(c.split) +
      '<span class="mixkey">Easy <b>' + c.split.Easy + '</b> Medium <b>' + c.split.Medium + '</b> Hard <b>' + c.split.Hard + '</b></span></p></header>' +
      (spot ? '<p class="spot"><b>How to spot it.</b> ' + spot + '</p>' : '') +
      (hard.length ? '<div class="callout"><p class="label">Where it gets hard</p><ul>' + hard.map(function (r) {
        return '<li><a class="ulink" href="#' + r.u + '">' + r.num + '</a> <b>' + esc(r.stat) + '.</b> ' + r.why + '</li>';
      }).join('') + '</ul></div>' : '') +
      (MYTH[c.id] || '') + (BRIDGE[c.id] || '') +
      '<p class="chips"><span class="label">Rules</span>' + c.uses.map(function (uid) { return '<a class="ulink" href="#' + uid + '">' + U[uid].num + '</a>'; }).join('') + '</p>' +
      c.uses.map(useHTML).join('') +
      (c.could ? '<aside class="could"><p class="label">Could still appear · not from the bank</p><p class="fine" style="margin-top:.3rem">Standard forms of the same rules that this bank does not use. The example sentences are written for this guide.</p><ul>' + c.could.items.map(li).join('') + '</ul></aside>' : '') +
      '<div class="lfoot"><span class="row"><button type="button" class="btn ghost donebtn" id="donebtn" aria-pressed="' + (d ? 'true' : 'false') + '">' + (d ? 'Lesson done ✓' : 'Mark this lesson done') + '</button>' +
      '<a class="btn ghost" href="#practice" data-tpart="' + c.part + '">Practice Part ' + c.part + ' against the clock</a></span>' +
      (next ? '<a class="btn" href="#' + next.id + '">Next: ' + next.n + ' ' + esc(next.title) + '</a>' : '<a class="btn" href="#practice">Take a timed set</a>') + '</div>';
  }
  function mountExamples(host) {
    $$('.exhost', host).forEach(function (slot) {
      var ex = EX[slot.getAttribute('data-q')];
      if (!ex) { return; }
      slot.appendChild(QCard(ex, { meta: 'Question ' + ex.q + ' · ' + ex.d }).el);
    });
  }
  function wireDone(cid, host) {
    var b = $('#donebtn', host);
    if (!b) { return; }
    b.addEventListener('click', function () {
      if (store.l[cid]) { delete store.l[cid]; } else { store.l[cid] = 1; }
      save();
      var d = !!store.l[cid];
      b.setAttribute('aria-pressed', d ? 'true' : 'false');
      b.textContent = d ? 'Lesson done ✓' : 'Mark this lesson done';
      grammarView.refresh();
    });
  }

  /* ---------- Shortcuts and hard questions ---------- */
  function hlist(a) {
    return '<ul class="hlist">' + a.map(function (x) {
      return '<li><a class="ulink" href="#' + x.u + '">' + x.num + '</a><span>' + x.label + (x.n != null ? ' <span class="wn">' + x.n + '</span>' : '') + '</span></li>';
    }).join('') + '</ul>';
  }
  function hardHTML() {
    var H = D.hard;
    return '<header><p class="eyebrow">Where the hard questions are</p><h2 class="vtitle">The rules the bank rates Hard most often</h2>' +
      H.intro.map(function (p) { return '<p class="lede">' + p + '</p>'; }).join('') + '</header>' +
      '<p style="margin-top:1rem">' + MIXKEY + '</p><div class="hardrows">' + H.rows.map(function (r) {
        return '<div class="hardrow"><a class="ulink hn" href="#' + r.u + '">' + r.num + '</a><div class="hb"><p class="hh"><b>' + r.title + '</b><span class="wn">' + esc(r.stat) + '</span></p>' +
          mixHTML(r.mix) + (r.why ? '<p class="tell">' + r.why + '</p>' : '') + '</div></div>';
      }).join('') + '</div>' +
      '<h3 class="subh">Hard every time</h3><p class="fine">Rules with two or more questions, all Hard. The number is how many questions the rule has.</p>' + hlist(H.always) +
      '<h3 class="subh">Versions that are Hard every time</h3><p class="fine">Versions with three or more questions, all Hard.</p>' + hlist(H.alwaysV) +
      '<h3 class="subh">Never Hard</h3><p class="fine">Rules with four or more questions, none of them Hard.</p>' + hlist(H.never) +
      '<p class="fine" style="margin-top:1.2rem">' + H.fine + '</p>';
  }
  var STANCE = ["lean", "lean", "lean", "lean", "lean", "lean", "out", "none", "none", "out", "out", "lean", "out", "none", "lean", "none", "none", "none", "lean", "out", "out", "lean", "none", "none", "none", "none", "out", "lean", "out", "none", "none", "none", "lean"];
  var STANCE_LABEL = { out: 'Rule it out', lean: 'Points to the answer', none: 'No shortcut: run the check' };
  function shortcutsHTML() {
    var G = D.gives;
    var show = [['all', 'All']].concat(G.groups.map(function (g) { return [g.id, g.title]; }));
    var fi = 0;
    return '<header><p class="eyebrow">Grammar shortcuts</p><h2 class="vtitle">What the choices give away</h2><p class="lede">' + G.intro + '</p><p class="stancekey"><span class="stance s-out">Rule it out</span> a kind of choice the bank almost never makes right · <span class="stance s-lean">Points to the answer</span> a sign that usually holds, after the check · <span class="stance s-none">No shortcut</span> background only</p></header>' +
      '<div class="gfilter">' + seg('gshow', 'Show', show, 'all') +
      '<label class="checkline" for="gquiz"><input type="checkbox" id="gquiz">Quiz me: hide what each pattern tells you until I ask</label></div>' +
      G.groups.map(function (g) {
        return '<section class="ggroup" id="' + g.id + '" data-g="' + g.id + '"><h3 class="h2">' + esc(g.title) + '</h3><div class="finds">' + g.finds.map(function (f) {
          var st = STANCE[fi++] || 'none';
          return '<article class="find"><p class="stance s-' + st + '">' + STANCE_LABEL[st] + '</p><h4>' + f.title + '</h4><button type="button" class="btn sm ghost reveal">Show what it tells you</button><div class="fbody"><p class="fcount">' + f.count + '</p>' +
            (f.note ? '<details><summary>Why, and the exceptions</summary><p class="fnote">' + f.note + '</p></details>' : '') + '</div></article>';
        }).join('') + '</div></section>';
      }).join('') + '<p class="fine" style="margin-top:2rem"><a href="#hard">Where the hard questions are</a></p>';
  }
  function wireShortcuts(v) {
    $$('input[name="gshow"]', v).forEach(function (r) {
      r.addEventListener('change', function () { $$('.ggroup', v).forEach(function (s) { s.hidden = r.value !== 'all' && s.getAttribute('data-g') !== r.value; }); });
    });
    $('#gquiz', v).addEventListener('change', function () {
      var q = this.checked;
      $$('.finds', v).forEach(function (f) { f.classList.toggle('quiz', q); });
      $$('.find', v).forEach(function (f) { f.classList.remove('open'); });
      $$('.reveal', v).forEach(function (b) { b.hidden = false; });
    });
    $$('.reveal', v).forEach(function (b) {
      b.addEventListener('click', function () { b.closest('.find').classList.add('open'); b.hidden = true; });
    });
  }

  /* ---------- the Grammar view ---------- */
  var grammarView = RailView('grammar', {
    label: 'Grammar',
    items: function () {
      var g = [{ group: 'Method', entries: [
        { key: 'method', token: 'method', label: 'The 60-second method' },
        { key: 'shortcuts', token: 'shortcuts', label: 'What the choices give away' },
        { key: 'hard', token: 'hard', label: 'Where the hard questions are' }
      ] }, { group: 'Lessons', entries: [{ key: 'home', token: 'lessons', label: 'All grammar lessons', tail: '<span class="rn">' + countDone() + '/' + NC + '</span>' }] }];
      D.parts.forEach(function (p) {
        var e = [{ key: 'part' + p.key, token: 'part-' + p.key.toLowerCase(), label: PART_INTRO[p.key] }];
        p.concepts.forEach(function (cid) { var c = CBY[cid]; e.push({ key: cid, token: cid, num: c.n, label: esc(c.title), done: !!store.l[cid] }); });
        g.push({ group: 'Part ' + p.key + ' · ' + esc(p.title), entries: e });
      });
      return g;
    },
    leave: function (key) { if (key === 'method') { demoHalt(); } },
    render: function (key, host) {
      if (key === 'method') { host.innerHTML = grammarMethodHTML(); mountDemo(); }
      else if (key === 'shortcuts') { host.innerHTML = shortcutsHTML(); wireShortcuts(host); }
      else if (key === 'hard') { host.innerHTML = hardHTML(); }
      else if (key === 'home') { host.innerHTML = lessonsHomeHTML(); }
      else if (/^part[ABC]$/.test(key)) { host.innerHTML = partHTML(key.slice(4)); }
      else if (CBY[key]) { host.innerHTML = conceptHTML(CBY[key]); mountExamples(host); wireDone(key, host); }
    }
  });
