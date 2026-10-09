  /* =================== Drills =================== */
  var KEYS = '1234567890-';
  var DR = {
    job: { part: 'reading', title: 'Name the job', goal: 4, ask: 'Which job is this question asking you to do?',
      blurb: 'See only the question line. Name the job, and the routine you will run, before you look at the passage.' },
    tag: { part: 'reading', title: 'Tag the sentence', goal: 10, ask: 'Which tag fits the highlighted sentence?',
      blurb: 'A real passage with one sentence highlighted. Give it one of the routine’s tags.' },
    core: { part: 'reading', title: 'Core first', goal: 20, ask: 'Tap the pieces that make up the core: the subject, the main verb and what completes them.',
      blurb: 'A long sentence from the bank, already cut where its pieces join. Find the short sentence hiding inside it.' },
    point: { part: 'reading', title: 'Find the Point', goal: 20, ask: 'Which sentence is the Point: the claim the rest supports?',
      blurb: 'A real passage, sentence by sentence. Pick the claim or conclusion that everything else is there to support.' },
    pointer: { part: 'reading', title: 'Follow the pointer', goal: 15, ask: 'What does the highlighted pointer refer back to?',
      blurb: 'Words like “this pattern” or “these findings” point back. Pick the sentence they point to.' },
    notes: { part: 'reading', title: 'Notes: goal first', goal: 20, ask: 'Which choice does exactly what the goal asks?',
      blurb: 'A real notes question with the notes hidden: only the student’s goal and the four choices. College Board’s own answers.' },
    why: { part: 'reading', title: 'Why is it wrong?', goal: 25, ask: 'Why is this choice wrong?',
      blurb: 'A wrong choice from a worked example. Name the way it fails, using the five kinds from Step 4.' },
    pattern: { part: 'grammar', title: 'Spot the pattern', goal: 5, ask: 'What does this question test?',
      blurb: 'See only the four answer choices of a real question. Name what it tests before you read a word of the passage.' },
    boundary: { part: 'grammar', title: 'Which boundary?', goal: 10, ask: 'What stands on each side of the highlighted answer?',
      blurb: 'A sentence from a real question, often cut short, with the right answer in place. Name the situation that makes that mark right. <a href="#part-a">Learn the eight situations first</a>.' },
    verb: { part: 'grammar', title: 'Which verb situation?', goal: 15, ask: 'Which situation are you in?',
      blurb: 'A real verb question with its four choices. Decide which of the four verb situations you are in. <a href="#part-b">See the four situations</a>.' },
    link: { part: 'grammar', title: 'Name the link', goal: 15, ask: 'How does the statement after the blank relate to the one before it?',
      blurb: 'A real passage or excerpt with the transition hidden. Name the relationship before you see a single choice.' }
  };
  var LINK_OPTS = [
    { k: 'c14', b: 'Contrast', s: 'goes against it, despite it, an exception, admitting a point, a correction or another option' },
    { k: 'c15', b: 'Cause and effect', s: 'a result, a response, a step toward a goal' },
    { k: 'c16', b: 'Elaboration', s: 'an example, the exact detail, emphasis, a restatement' },
    { k: 'c17', b: 'Addition and similarity', s: 'another point, a parallel case' },
    { k: 'c18', b: 'Time and order', s: 'next, finally, earlier, meanwhile, numbered points' },
    { k: 'c19', b: 'Other relations', s: 'how often, fitness, place' }
  ];
  var JOB_OPTS = [
    { k: 'main', b: 'Main idea' }, { k: 'detail', b: 'Detail' }, { k: 'inference', b: 'Inference', s: 'finish the last sentence' },
    { k: 'support', b: 'Support or weaken', s: 'a finding and a claim' }, { k: 'quote', b: 'Quotation' }, { k: 'data', b: 'Table or graph' },
    { k: 'word', b: 'Word', s: 'a word in context' }, { k: 'structure', b: 'Purpose or structure' }, { k: 'cross', b: 'Two texts' },
    { k: 'notes', b: 'Notes', s: 'a student’s notes and a goal' }, { k: 'grammar', b: 'Grammar or transition', s: 'the 60-second method' }
  ];
  var JOB_OF_NAME = { 'Main idea': 'main', 'Detail': 'detail', 'Inference': 'inference', 'Support': 'support', 'Weaken': 'support', 'Quotation': 'quote', 'Table or graph': 'data', 'Word': 'word', 'Purpose or structure': 'structure', 'Two texts': 'cross', 'Notes': 'notes' };
  var KIND_OPTS = [
    { k: 'Not in the passage', b: 'Not in the passage', s: 'says something the passage never says' },
    { k: 'Opposite', b: 'Opposite', s: 'says the reverse of the passage' },
    { k: 'Twisted or too strong', b: 'Twisted or too strong', s: 'the passage’s words, changed or overstated' },
    { k: 'Misses the job', b: 'Misses the job', s: 'true or believable, but does not answer this question' },
    { k: 'Wrong about the data', b: 'Wrong about the data', s: 'the table or graph does not show it' }
  ];
  function ruleLine(u) { return '<p class="rule"><span class="rl">Rule ' + u.num + '</span>' + u.rule + '</p>'; }
  function jobOf(name) { return RD.jobs.filter(function (j) { return j.name === name; })[0]; }
  var itemCache = {};
  function drillItems(kind) {
    if (itemCache[kind]) { return itemCache[kind]; }
    var items = [];
    if (kind === 'job') {
      var seen = {};
      var addStem = function (text, k, name) {
        var key = plain(text).toLowerCase().replace(/\s+/g, ' ');
        if (seen[key]) { return; }
        seen[key] = 1;
        var j = name ? jobOf(name) : null;
        items.push({ id: 'job:' + key.slice(0, 60), ref: k === 'grammar' ? 'method' : (j ? j.id : 'job'), opts: JOB_OPTS, ans: k,
          prompt: '<p class="qstem big">' + text + '</p>',
          explain: k === 'grammar' ? '<p><b>Grammar or transition.</b> Run the 60-second method: look at what changes in the four choices, then run the one check.</p>'
            : '<p><b>' + esc(name) + '.</b> Look first at: ' + j.look + '</p>' });
      };
      RD.jobs.forEach(function (j) { j.says.forEach(function (s) { addStem(esc(s), JOB_OF_NAME[j.name], j.name); }); });
      RD.examples.forEach(function (x) { var j = RD.jobs.filter(function (jj) { return JOB_OF_NAME[jj.name] === JOB_OF_NAME[x.title]; })[0]; if (j) { addStem(x.question, JOB_OF_NAME[x.title], j.name); } });
      ((D.bank && D.bank.stems) || []).forEach(function (x) { addStem(x.s, JOB_OF_NAME[x.n], x.n); });
      addStem(STEM_SEC, 'grammar'); addStem(STEM_TRANS, 'grammar');
    } else if (kind === 'why') {
      RD.examples.forEach(function (x) {
        var right = x.choices.filter(function (c) { return c.right; })[0];
        x.choices.forEach(function (c) {
          if (c.right) { return; }
          var k = /^Twisted/.test(c.kind) ? 'Twisted or too strong' : c.kind;
          if (!KIND_OPTS.some(function (o) { return o.k === k; })) { return; }
          items.push({ id: x.qid + ':' + c.k, ref: 'ex-' + x.n, opts: KIND_OPTS, ans: k,
            prompt: '<details class="ctx"><summary>The passage (Example ' + x.n + ', ' + esc(x.title) + ')</summary><div class="ctxbody">' + rPassageHTML(x) + '</div></details>' +
              '<p class="qstem">' + x.question + '</p><p class="label">Choice ' + c.k + '</p><p class="passage boxed">' + c.t + '</p>',
            explain: '<p><b>' + esc(k) + '.</b> ' + c.why + '</p><p class="fine">The answer is ' + right.k + ': ' + right.why + '</p>' });
        });
      });
    } else if (kind === 'notes') {
      ((D.bank && D.bank.notes) || []).forEach(function (b) {
        items.push({ id: b.id, ref: 'notesfirst', opts: ['A', 'B', 'C', 'D'].map(function (k) { return { k: k, b: '<span class="sentopt"><span class="olt">' + k + '.</span> ' + b.ch[k] + '</span>' }; }), ans: b.ans, wide: true,
          prompt: '<p class="ngoal"><span class="label">The goal · question ' + b.id + ' · ' + b.d + '</span>' + b.goal + '</p>',
          explain: '<p><b>' + b.ans + '.</b> ' + (b.why[b.ans] || '') + '</p>' +
            '<details class="ctx"><summary>The notes</summary><div class="ctxbody"><ul class="nnotes">' + b.notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul></div></details>' });
      });
    } else if (kind === 'tag') {
      (ANN.tag || []).forEach(function (it) {
        var opts = (it.set === 'lit' ? ['Scene', 'Happens', 'Feeling'] : it.set === 'notes' ? ['Scene', 'Did', 'Found', 'Point', 'Goal'] : ['Scene', 'Old idea', 'Did', 'Found', 'Point'])
          .map(function (t) { return { k: t, b: t, s: TAG_HINT[t] }; });
        items.push({ id: it.id, ref: 'chunk', opts: opts, ans: it.ans,
          prompt: '<div class="sents">' + it.sents.map(function (s, i) { return '<p class="sent' + (i === it.i ? ' on' : '') + '">' + esc(s) + '</p>'; }).join('') + '</div>',
          explain: '<p>' + tagHTML(it.ans) + ' ' + esc(it.plain) + '</p><p class="fine">' + esc(TAG_DEF[it.ans] || '') + '</p>' });
      });
    } else if (kind === 'core') {
      (ANN.core || []).forEach(function (it) {
        items.push({ id: it.id, ref: 'long', type: 'pieces', pieces: it.pieces,
          prompt: '<p class="fine">' + it.w + ' words · question ' + it.qid + '</p>',
          explain: '<p><b>Core in plain words.</b> ' + esc(it.core) + '</p>' + (it.note ? '<p class="fine">' + esc(it.note) + '</p>' : '') + '<p class="fine">The commas, dashes and semicolons that cut a sentence into these pieces are the same marks the grammar questions test: <a href="#part-a">the eight situations</a>.</p>' });
      });
    } else if (kind === 'point') {
      (ANN.point || []).forEach(function (it) {
        items.push({ id: it.id, ref: 'para', opts: it.sents.map(function (s, i) { return { k: String(i), b: '<span class="sentopt">' + esc(s) + '</span>' }; }), ans: String(it.ans), wide: true,
          prompt: '', explain: '<p><b>The Point:</b> ' + esc(it.plain) + '</p>' + (it.why ? '<p class="fine">' + esc(it.why) + '</p>' : '') });
      });
    } else if (kind === 'pointer') {
      (ANN.pointer || []).forEach(function (it) {
        if (it.i < 2) { return; }
        items.push({ id: it.id, ref: 'para', opts: it.sents.slice(0, it.i).map(function (s, i) { return { k: String(i), b: '<span class="sentopt">' + esc(s) + '</span>' }; }), ans: String(it.ans), wide: true,
          prompt: '<p class="passage boxed">' + markWord(it.sents[it.i], it.word) + '</p>',
          explain: '<p><b>“' + esc(it.word) + '”</b> means ' + esc(it.meaning) + '.</p>' });
      });
    } else if (kind === 'pattern') {
      var famOpts = FAMS.map(function (f) { return { k: f, b: FAM[f].label, s: FAM[f].sub }; });
      EXLIST.forEach(function (ex) {
        var u = U[ex.u], c = CBY[u.c];
        items.push({ id: ex.q, ref: u.id, opts: famOpts, ans: c.fam,
          prompt: '<p class="label">The four choices of question ' + ex.q + '</p>' + miniHTML(ex, false, false),
          after: '<p class="label">The four choices of question ' + ex.q + '</p>' + miniHTML(ex, true, true),
          explain: '<p><b>' + FAM[c.fam].label + '.</b> ' + (ex.look || PAT[ex.pat].pat) + (ex.tie ? ' ' + ex.tie : '') + '</p><p>This question is rule <a href="#' + u.id + '">' + u.num + '</a>: ' + u.title + '.</p>' });
      });
    } else if (kind === 'boundary') {
      var sitOpts = D.structure.rows.map(function (r, i) { return { k: String(i), b: r.head }; });
      CONCEPTS.forEach(function (c) {
        if (c.part !== 'A') { return; }
        c.uses.forEach(function (uid) {
          var u = U[uid], r = D.structure.rows[u.sit];
          u.v.forEach(function (v, vi) {
            if (SKIP[uid + '/' + vi]) { return; }
            items.push({ id: uid + '/' + vi, ref: uid, opts: sitOpts, ans: String(u.sit),
              prompt: '<p class="passage">' + v.frag + '</p>',
              explain: '<p><b>' + r.head + '.</b> ' + r.tell + '</p><p><b>This version:</b> ' + endDot(quoteIfOdd(v.label)) + (v.note ? ' ' + v.note : '') + '</p>' + ruleLine(u) });
          });
        });
      });
    } else if (kind === 'verb') {
      var vOpts = D.verbs.rows.map(function (r, i) { return { k: String(i), b: r.head }; });
      EXLIST.forEach(function (ex) {
        var u = U[ex.u];
        if (u.vsit == null) { return; }
        var r = D.verbs.rows[u.vsit];
        items.push({ id: ex.q, ref: u.id, opts: vOpts, ans: String(u.vsit),
          prompt: '<p class="passage">' + passageHTML(ex, false) + '</p>' + miniHTML(ex, false, false),
          after: '<p class="passage">' + passageHTML(ex, true) + '</p>' + miniHTML(ex, true, true),
          explain: '<p><b>' + r.head + '.</b> ' + r.tell + '</p><p><b>The answer is ' + ex.a + '.</b> ' + ex.why + '</p>' + ruleLine(u) });
      });
    } else if (kind === 'link') {
      var used = {};
      var linkItem = function (c, u, before, after, label, word, id) {
        return { id: id, ref: u.id, opts: LINK_OPTS, ans: c.id,
          prompt: '<p class="passage">' + before + '</p>', after: '<p class="passage">' + after + '</p>',
          explain: '<p><b>' + esc(c.title) + '.</b> The transition is <b>' + esc(String(word).replace(/[\s,;:.]+$/, '')) + '</b>' + (label ? ' (' + plain(label).replace(/[.\s]+$/, '') + ')' : '') + '.</p>' + ruleLine(u) };
      };
      CONCEPTS.forEach(function (c) {
        if (c.part !== 'C') { return; }
        c.uses.forEach(function (uid) {
          var u = U[uid];
          if (SKIP[uid]) { return; }
          u.v.forEach(function (v, vi) {
            if (SKIP[uid + '/' + vi]) { return; }
            var shown = v.ids.filter(function (x) { return x[2]; })[0];
            var ex = shown && EX[shown[0]] && EX[shown[0]].u === uid ? EX[shown[0]] : null;
            if (ex) {
              used[ex.q] = 1;
              items.push(linkItem(c, u, passageHTML(ex, false), passageHTML(ex, true), v.label, ex.fill, ex.q));
            } else {
              var mm = /<mark class="fill">([\s\S]*?)<\/mark>/.exec(v.frag);
              items.push(linkItem(c, u, put(v.frag, /<mark class="fill">[\s\S]*?<\/mark>/, BLANK), v.frag, v.label, mm ? plain(mm[1]) : '', uid + '/' + vi));
            }
          });
        });
      });
      CONCEPTS.forEach(function (c) {
        if (c.part !== 'C') { return; }
        c.uses.forEach(function (uid) {
          if (SKIP[uid]) { return; }
          U[uid].ex.forEach(function (q) {
            if (used[q]) { return; }
            var ex = EX[q], v = versionOf(q);
            items.push(linkItem(c, U[uid], passageHTML(ex, false), passageHTML(ex, true), v ? v.label : '', ex.fill, q));
          });
        });
      });
    }
    itemCache[kind] = items;
    return items;
  }
  var TAG_DEF = {
    'Scene': 'Background: who, what, where, when, or what a term means. In a story: who and where.',
    'Old idea': 'What people thought, assumed or claimed before.',
    'Did': 'What someone did to find out.',
    'Found': 'What turned out to be true: a result, a fact, an example.',
    'Point': 'The claim or conclusion, the author’s or the researchers’.',
    'Happens': 'What someone in the story does or says.',
    'Feeling': 'What someone feels, wants, thinks or is like.',
    'Goal': 'What the student wants the sentence to do.'
  };
  var TAG_HINT = { 'Scene': 'background', 'Old idea': 'what people thought', 'Did': 'what someone did', 'Found': 'a result or fact', 'Point': 'the claim', 'Happens': 'what someone does', 'Feeling': 'what someone feels', 'Goal': 'the student wants to…' };
  function markWord(sentence, word) {
    var i = sentence.indexOf(word);
    if (i < 0) { return esc(sentence); }
    return esc(sentence.slice(0, i)) + '<mark class="ptr">' + esc(word) + '</mark>' + esc(sentence.slice(i + word.length));
  }
  var SKIP = { 'u6-2/0': 1, 'u18-2/2': 1, 'u16-1/2': 1, 'u19-4': 1 };
  var PLAIN_LINK = { c14: 'but', c15: 'so', c16: 'for example', c17: 'also', c18: 'then', c19: 'there' };
  function wrongPickHTML(kind, mine, it) {
    var b = plain(mine.b);
    if (kind === 'link') { return '<p class="whypick"><b>Not ' + esc(b) + '.</b> Read the two statements with “' + PLAIN_LINK[mine.k] + '” in the blank: the logic breaks.</p>'; }
    if (kind === 'pattern') { return '<p class="whypick"><b>Not ' + esc(b) + '.</b> That would show ' + esc(FAM[mine.k].sub.charAt(0).toLowerCase() + FAM[mine.k].sub.slice(1)) + ' across the four choices.</p>'; }
    if (kind === 'tag') { return '<p class="whypick"><b>Not ' + esc(b) + '.</b> ' + esc(TAG_DEF[mine.k] || '') + '</p>'; }
    if (kind === 'why') { var o = KIND_OPTS.filter(function (x) { return x.k === mine.k; })[0]; return '<p class="whypick"><b>Not ' + esc(b) + '.</b> That kind ' + esc(o ? o.s : '') + '.</p>'; }
    return '';
  }
  function drillAway() { if (drillRun && !drillRun.answered && !drillRun.away) { drillRun.away = now(); stopWatch(); } }
  function drillBack() {
    if (!drillRun || !drillRun.away) { return; }
    drillRun.t0 += now() - drillRun.away; drillRun.away = 0;
    var d = DR[drillRun.kind], R = drillRun, w = document.getElementById('dwatch');
    if (w && !R.answered) { stopWatch(); watch = setInterval(function () { var t = (now() - R.t0) / 1000; w.textContent = secs(t); w.classList.toggle('slow', t > d.goal); }, 100); }
  }
  function drillCount(kind) { return drillItems(kind).length; }
  function dlen() { return typeof store.s.dlen === 'number' ? store.s.dlen : 10; }
  function lastLine(r) { return isObj(r) && typeof r.n === 'number' ? 'Last round: ' + r.r + ' of ' + r.n + ' right · ' + secs(r.m) + ' median' : ''; }

  var drillRun = null, watch = null;
  function stopWatch() { clearInterval(watch); watch = null; }
  function buildDrills() {
    if (built.drills) { return; }
    built.drills = true;
    viewEl.drills.innerHTML = '<div class="wrap"><div id="dhost"></div></div>';
    drillHome();
  }
  function drillCard(k) {
    var d = DR[k], n = drillCount(k), last = store.d[k];
    return '<div class="dcard"><h3>' + d.title + '</h3><p>' + d.blurb + '</p><p class="dmeta">' + n + ' cards · goal: under ' + d.goal + ' seconds a card</p>' +
      '<p class="dlast">' + (lastLine(last) || 'Not tried yet') + '</p><button type="button" class="btn" data-start="' + k + '"' + (n ? '' : ' disabled') + '>Start</button></div>';
  }
  function drillHome() {
    drillRun = null; stopWatch();
    var len = dlen();
    var keys = Object.keys(DR);
    var h = '<header class="read"><p class="eyebrow">Drills</p><h2 class="vtitle">Short drills for the slow steps</h2>' +
      '<p class="lede">Each drill trains one move, on real questions from the bank. Answer with the number keys and press Enter for the next card.</p></header>' +
      '<fieldset class="seg" style="margin-top:1.4rem"><legend>Cards per round</legend><div class="segrow">' + [10, 20, 0].map(function (n) {
        return '<label><input type="radio" name="dlen" id="dlen-' + (n || 'all') + '" value="' + n + '"' + (n === len ? ' checked' : '') + '><span>' + (n || 'All') + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<h3 class="subh">Reading drills</h3><div class="dgrid">' + keys.filter(function (k) { return DR[k].part === 'reading'; }).map(drillCard).join('') + '</div>' +
      '<h3 class="subh">Grammar drills</h3><div class="dgrid">' + keys.filter(function (k) { return DR[k].part === 'grammar'; }).map(drillCard).join('') + '</div>';
    var host = document.getElementById('dhost');
    host.innerHTML = h;
    $$('input[name="dlen"]', host).forEach(function (r) { r.addEventListener('change', function () { store.s.dlen = Number(r.value); save(); }); });
    $$('[data-start]', host).forEach(function (b) { b.addEventListener('click', function () { startDrill(b.getAttribute('data-start')); }); });
  }
  function startDrill(kind, only) {
    if (!DR[kind]) { return; }
    buildDrills();
    var all = drillItems(kind), pool;
    if (only) { pool = shuffle(all.filter(function (it) { return only.indexOf(it.id) !== -1; })); }
    else { pool = shuffle(all.slice()); if (dlen()) { pool = pool.slice(0, dlen()); } }
    if (!pool.length) { drillHome(); return; }
    drillRun = { kind: kind, items: pool, i: 0, right: 0, streak: 0, best: 0, res: [], t0: 0, answered: false, sel: {} };
    drillDraw();
    toTop();
  }
  function drillDraw() {
    var R = drillRun, it = R.items[R.i], d = DR[R.kind];
    var host = document.getElementById('dhost');
    var body;
    if (it.type === 'pieces') {
      R.sel = {};
      body = '<div class="pieceset" id="pieceset">' + it.pieces.map(function (p, i) {
        return '<button type="button" class="pc" data-i="' + i + '" aria-pressed="false"><span class="k">' + (i < KEYS.length ? KEYS[i] : '') + '</span><span class="pt">' + esc(p.text) + '</span><span class="pl"></span></button>';
      }).join('') + '</div><p class="row" style="margin-top:.8rem"><button type="button" class="btn" id="pcheck">Check</button><span class="kbd">Enter</span></p>';
    } else {
      body = '<div class="dopts' + (it.wide ? ' wide' : '') + '">' + it.opts.map(function (o, i) {
        return '<button type="button" class="dopt" data-k="' + o.k + '"><span class="k">' + (i < KEYS.length ? KEYS[i] : '') + '</span><span><b>' + o.b + '</b>' + (o.s ? '<small>' + o.s + '</small>' : '') + '</span></button>';
      }).join('') + '</div>';
    }
    host.innerHTML = '<div class="drun"><div class="dbar"><span class="dname">' + d.title + '</span><span class="dstat">Card ' + (R.i + 1) + ' of ' + R.items.length + '</span>' +
      '<span class="dstat" id="dright">' + R.right + ' right</span><span class="dstat" id="dstreak">Streak ' + R.streak + '</span><span class="dwatch" id="dwatch">0.0 s</span>' +
      '<button type="button" class="linkbtn" id="dend">End round</button></div>' +
      '<div class="dprompt" id="dprompt">' + it.prompt + '</div><p class="dask">' + d.ask + '</p>' + body + '<div class="dfeed" id="dfeed"></div></div>';
    if (it.type === 'pieces') {
      $$('.pc', host).forEach(function (b) { b.addEventListener('click', function () { togglePiece(Number(b.getAttribute('data-i'))); }); });
      document.getElementById('pcheck').addEventListener('click', function () { drillAnswer(null); });
    } else {
      $$('.dopt', host).forEach(function (b) { b.addEventListener('click', function () { drillAnswer(b.getAttribute('data-k')); }); });
    }
    document.getElementById('dend').addEventListener('click', drillFinish);
    R.answered = false; R.t0 = now(); R.away = 0;
    stopWatch();
    var w = document.getElementById('dwatch');
    watch = setInterval(function () {
      var t = (now() - R.t0) / 1000;
      w.textContent = secs(t);
      w.classList.toggle('slow', t > d.goal);
    }, 100);
  }
  function togglePiece(i) {
    var R = drillRun;
    if (!R || R.answered) { return; }
    var b = $('.pc[data-i="' + i + '"]', document.getElementById('dhost'));
    if (!b) { return; }
    R.sel[i] = !R.sel[i];
    b.setAttribute('aria-pressed', R.sel[i] ? 'true' : 'false');
  }
  function drillAnswer(k) {
    var R = drillRun;
    if (!R || R.answered) { return; }
    var it = R.items[R.i], t = (now() - R.t0) / 1000, goal = DR[R.kind].goal, ok;
    if (it.type === 'pieces') {
      ok = it.pieces.every(function (p, i) { return !!R.sel[i] === !!p.core; });
    } else { ok = k === it.ans; }
    R.answered = true; stopWatch();
    var w = document.getElementById('dwatch');
    w.textContent = secs(t); w.classList.toggle('slow', t > goal);
    R.res.push({ id: it.id, ok: ok, t: t, ref: it.ref });
    if (ok) { R.right += 1; R.streak += 1; R.best = Math.max(R.best, R.streak); } else { R.streak = 0; }
    document.getElementById('dright').textContent = R.right + ' right';
    document.getElementById('dstreak').textContent = 'Streak ' + R.streak;
    if (it.type === 'pieces') {
      $$('#dhost .pc').forEach(function (b) {
        var i = Number(b.getAttribute('data-i')), p = it.pieces[i];
        b.disabled = true;
        b.classList.add(p.core ? 'is-core' : 'is-extra');
        if (!!R.sel[i] !== !!p.core) { b.classList.add('missed'); }
        $('.pl', b).textContent = p.lab;
      });
      document.getElementById('pcheck').disabled = true;
    } else {
      $$('#dhost .dopt').forEach(function (b) {
        var bk = b.getAttribute('data-k');
        b.disabled = true;
        if (bk === it.ans) { b.classList.add('right'); } else if (bk === k) { b.classList.add('wrong'); } else { b.classList.add('dim'); }
      });
    }
    if (it.after) { document.getElementById('dprompt').innerHTML = it.after; }
    var last = R.i + 1 >= R.items.length;
    var mine = it.opts ? it.opts.filter(function (o) { return o.k === k; })[0] : null;
    var whyNot = !ok && mine ? wrongPickHTML(R.kind, mine, it) : '';
    document.getElementById('dfeed').innerHTML = '<p class="verdict ' + (ok ? 'good' : 'miss') + '" tabindex="-1">' + (ok ? 'Right.' : 'Not this one.') +
      '<span class="vt">' + secs(t) + (ok ? (t <= goal ? ' · inside the ' + goal + ' s goal' : ' · the goal is ' + goal + ' s') : '') + '</span></p>' +
      whyNot + '<div class="dexp">' + it.explain + '</div><p class="dnext row"><button type="button" class="btn" id="dnext">' + (last ? 'See the round' : 'Next card') + '</button><span class="kbd">Enter</span></p>';
    var nb = document.getElementById('dnext');
    nb.addEventListener('click', drillNext);
    showFeedback($('#dfeed .verdict'));
  }
  function drillNext() {
    var R = drillRun;
    if (!R || !R.answered) { return; }
    if (R.i + 1 < R.items.length) { R.i += 1; drillDraw(); toTop(); } else { drillFinish(); }
  }
  function refLabel(ref) {
    if (U[ref]) { return U[ref].num + ' ' + U[ref].title; }
    var m = /^ex-(\d+)$/.exec(ref);
    if (m && REX[m[1]]) { return 'Example ' + m[1] + ' · ' + esc(REX[m[1]].title); }
    var j = RD.jobs.filter(function (x) { return x.id === ref; })[0];
    if (j) { return 'Step 1 · ' + esc(j.name); }
    return { chunk: 'Step 2 · Chunk: the tags', long: 'Long sentences: core first', para: 'Long passages: make them make sense', method: 'The 60-second method', job: 'Step 1 · Job' }[ref] || ref;
  }
  function drillFinish() {
    var R = drillRun;
    if (!R) { return; }
    stopWatch();
    var n = R.res.length;
    if (!n) { drillHome(); return; }
    var times = R.res.map(function (x) { return x.t; }), m = median(times), goal = DR[R.kind].goal;
    var inGoal = R.res.filter(function (x) { return x.t <= goal; }).length;
    store.d[R.kind] = { r: R.right, n: n, m: Math.round(m * 10) / 10 };
    save();
    var missed = R.res.filter(function (x) { return !x.ok; });
    var refs = [];
    missed.forEach(function (x) { if (refs.indexOf(x.ref) === -1) { refs.push(x.ref); } });
    var kind = R.kind, missIds = missed.map(function (x) { return x.id; });
    document.getElementById('dhost').innerHTML = '<div class="drun"><p class="eyebrow">' + DR[kind].title + ' · round finished</p>' +
      '<p class="dresult">' + R.right + ' of ' + n + ' right · ' + secs(m) + ' median</p>' +
      '<p class="lede">' + inGoal + ' of ' + n + ' inside the ' + goal + '-second goal. Longest streak: ' + R.best + '.</p>' +
      '<div class="dots" aria-hidden="true">' + R.res.map(function (x) { return '<i class="' + (x.ok ? 'ok' : 'no') + '" title="' + secs(x.t) + '"></i>'; }).join('') + '</div>' +
      (refs.length ? '<h3 class="subh">What to review</h3><ul class="missed">' + refs.map(function (ref) { return '<li><a href="#' + ref + '">' + refLabel(ref) + '</a></li>'; }).join('') + '</ul>'
        : '<p class="subh">No misses this round.</p>') +
      '<div class="row" style="margin-top:1.4rem">' + (missed.length ? '<button type="button" class="btn" id="dretry">Retry the ' + plural(missed.length, 'miss', 'misses') + '</button>' : '') +
      '<button type="button" class="btn' + (missed.length ? ' ghost' : '') + '" id="dagain">New round</button><button type="button" class="btn ghost" id="dhome">All drills</button></div></div>';
    drillRun = null;
    var rb = document.getElementById('dretry');
    if (rb) { rb.addEventListener('click', function () { startDrill(kind, missIds); }); }
    document.getElementById('dagain').addEventListener('click', function () { startDrill(kind); });
    document.getElementById('dhome').addEventListener('click', drillHome);
    toTop();
  }
