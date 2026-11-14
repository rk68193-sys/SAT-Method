  /* =================== Drills =================== */
  var KEYS = '1234567890-';
  var DR = {
    job: { part: 'reading', title: 'Name the job', goal: 4, ask: 'Which job is this question asking you to do?',
      blurb: 'You see only the question, not the passage. Pick what kind of question it is, so you know what to look for before you read.' },
    tag: { part: 'reading', title: 'Tag the sentence', goal: 10, ask: 'Which tag fits the highlighted sentence?',
      blurb: 'A real passage with one sentence highlighted. Pick the label that fits it, such as “Found” for a result or “Point” for the main claim.' },
    core: { part: 'reading', title: 'Core first', goal: 20, ask: 'Tap the pieces that make up the core: the subject, the main verb and what finishes them. Then press Check.',
      blurb: 'A long sentence from a real question, cut into pieces. Tap the pieces that make the short sentence hiding inside it.' },
    point: { part: 'reading', title: 'Find the Point', goal: 20, ask: 'Which sentence is the Point: the claim the rest supports?',
      blurb: 'A real passage, one sentence on each button. Pick the main claim: the sentence the others are there to back up.' },
    pointer: { part: 'reading', title: 'Follow the pointer', goal: 15, ask: 'What does the highlighted pointer refer back to?',
      blurb: 'Words like “this pattern” or “these findings” point back to something said earlier. Pick the sentence they point to.' },
    same: { part: 'reading', title: 'Same idea, different words', goal: 30, ask: 'Which choice says the same thing in other words?',
      blurb: 'One sentence from a real passage and four rewordings written for this site. Only one keeps the meaning. The others reuse its words but change what it says. Do not pick by matching words: on the real test the right answer shares the most words with the passage in only 18% of questions (<a href="#myths">shortcuts that do not work</a>).' },
    notes: { part: 'reading', title: 'Notes: goal first', goal: 60, ask: 'Which choice does what the goal asks and matches the notes?',
      blurb: 'A student’s notes and a goal. Read the goal first, then pick the choice that does what it asks and matches the notes. Real questions, with College Board’s answers.' },
    why: { part: 'reading', title: 'Why is it wrong?', goal: 25, ask: 'Why is this choice wrong?',
      blurb: 'A wrong answer from one of the worked examples. Pick why it is wrong, from the five kinds in Step 4 of the reading lessons.' },
    pattern: { part: 'grammar', title: 'Spot the pattern', goal: 5, ask: 'What does this question test?',
      blurb: 'You see only the four answer choices of a real question. Say what it tests before you read the passage.' },
    frag: { part: 'grammar', title: 'Sentence or fragment?', goal: 8, ask: 'Can these words stand alone as a sentence? If not, what is missing?',
      blurb: 'A group of words written like a sentence. Decide whether it can stand on its own. A warm-up for Which boundary?, and the skill behind rule 9.1' +
        (typeof U !== 'undefined' && U['u9-1'] ? ' (' + U['u9-1'].q + ' questions, ' + U['u9-1'].split.Easy + ' of them Easy)' : '') + '. Cards written for this site. <a href="#parts-of-speech">Parts of speech in five minutes</a>.' },
    boundary: { part: 'grammar', title: 'Which boundary?', goal: 10, ask: 'What stands on each side of the highlighted answer?',
      blurb: 'A sentence from a real question with the right answer filled in. Say what makes that punctuation mark right: what stands on each side of it. <a href="#part-a">Learn the eight situations first</a>.' },
    verb: { part: 'grammar', title: 'Which verb situation?', goal: 15, ask: 'Which situation are you in?',
      blurb: 'A real verb question with its four choices. Say which of the four verb situations it is. <a href="#part-b">See the four situations</a>.' },
    link: { part: 'grammar', title: 'Name the link', goal: 15, ask: 'How does the statement after the blank relate to the one before it?',
      blurb: 'A real passage with the linking word (such as “however”) hidden. Say how the two ideas connect before you see the choices.' },
    wmean: { part: 'words', title: 'Word meanings', goal: 8, ask: 'What does this word mean?',
      blurb: 'A word from the test’s fill-in-the-blank questions, and four meanings. Pick the right one. <a href="#vocab-list">See the word list</a>.' },
    wsecond: { part: 'words', title: 'Second meanings', goal: 20, ask: 'What does the highlighted word or phrase mean in this sentence?',
      blurb: 'A familiar word in a sentence from a real question. The sentence often uses one of its less common meanings. <a href="#vocab-second">How to read them</a>.' },
    mskill: { subj: 'math', part: 'mspot', title: 'Name the skill', goal: 20, ask: 'Which skill is this question from?',
      blurb: 'A real test question. Before you solve anything, say which skill it tests. The answer shows the kind of question and the clue that gives it away.' },
    mcount: { subj: 'math', part: 'mspot', title: 'How many solutions?', goal: 15, ask: 'How many solutions are there?',
      blurb: 'An equation, two lines, or a line and a curve. Count the solutions without solving. <a href="#mt-sys-count">See how</a>.' },
    mform: { subj: 'math', part: 'mspot', title: 'Which form shows it?', goal: 12, ask: 'Which form shows it as a number printed in the equation?',
      blurb: 'The same quadratic written three ways, and a value you need: the vertex, the zeros or the y-intercept. Pick the way of writing it that shows that value. <a href="#mpat-form">The form shows the answer</a>.' },
    mexp: { subj: 'math', part: 'mreps', title: 'Exponent rules', goal: 10, ask: 'Which is equal to it?',
      blurb: 'Multiplying, dividing and raising powers, and negative and fractional exponents. Each wrong choice is a real mistake, and the answer shows where the rule comes from.' },
    mpct: { subj: 'math', part: 'mreps', title: 'Percent multipliers', goal: 15, ask: '',
      blurb: 'Turn a percent change into one number to multiply by, combine two changes, undo a discount, and find a percent change.' },
    mslope: { subj: 'math', part: 'mreps', title: 'Slope from two points', goal: 15, ask: 'What is the slope?',
      blurb: 'Two points, or two readings of a steady rate. Change in y over change in x, with the signs right.' },
    mfrac: { subj: 'math', part: 'mreps', title: 'Clearing fractions', goal: 15, ask: 'Multiply through to clear the fractions. Which equation do you get?',
      blurb: 'One step only: multiply every term by the right number, the whole numbers included.' },
    mfound: { subj: 'math', part: 'mfound', title: 'Algebra basics', goal: 20, ask: '',
      blurb: 'Fractions, getting x alone, solving for a whole expression, brackets and factoring, like terms, and an unknown on the bottom of a fraction. Each wrong choice is a real mistake. <a href="#m-found">Read the page</a>.' }
  };
  /* the Math drills written for this site: drill -> key in D.mdrills (src/math/mdrills.py) */
  var MDR_KIND = { mcount: 'count', mform: 'form', mexp: 'exp', mpct: 'pct', mslope: 'slope', mfrac: 'frac', mfound: 'found' };
  function drillSubjOf(kind) { return DR[kind] && DR[kind].subj === 'math' ? 'math' : 'rw'; }
  function drillsOf(subj) { return Object.keys(DR).filter(function (k) { return drillSubjOf(k) === subj; }); }
  var LINK_OPTS = [
    { k: 'c14', b: 'Contrast', s: 'goes against it, despite it, an exception, admitting a point, a correction or another option' },
    { k: 'c15', b: 'Cause and effect', s: 'a result, a response, a step toward a goal' },
    { k: 'c16', b: 'Elaboration', s: 'an example, the exact detail, emphasis, a restatement' },
    { k: 'c17', b: 'Addition and similarity', s: 'another point, a parallel case' },
    { k: 'c18', b: 'Time and order', s: 'next, finally, earlier, meanwhile, numbered points' },
    { k: 'c19', b: 'Other relations', s: 'how often, fitness, place' }
  ];
  /* Sentence or fragment?: a sentence, or one of the three kinds of fragment the wrong answers build (src/reading/grammar_basics.py) */
  var FRAG_OPTS = [
    { k: 'ok', b: 'A sentence', s: 'a subject with a tensed verb of its own' },
    { k: 'verb', b: 'Fragment: no tensed verb', s: 'only an <em>-ing</em>, <em>to</em> or <em>-ed</em> form' },
    { k: 'sub', b: 'Fragment: because, although, when…', s: 'that clause leans on a main clause that is not there' },
    { k: 'rel', b: 'Fragment: which, who, many of which…', s: 'the only verb belongs to a describing clause' }
  ];
  var FRAG_REF = { ok: 'parts-of-speech', verb: 'u9-1', sub: 'u6-2', rel: 'u9-2' };
  var FRAG_HEAD = { ok: 'A sentence', verb: 'Fragment: no tensed verb', sub: 'Fragment: a clause opened by a word like because, and no main clause', rel: 'Fragment: a describing clause (which, who, that), and no main clause' };
  var FRAG_WHYNOT = {
    ok: 'A sentence needs a subject with a tensed verb of its own, outside any <em>because</em> or <em>which</em> clause.',
    verb: 'That kind has no tensed verb at all: only <em>-ing</em>, <em>to</em> or <em>-ed</em> forms with no helping verb.',
    sub: 'That kind opens with a word such as <em>because</em> or <em>although</em>, and no main clause follows.',
    rel: 'That kind is only a <em>which</em>, <em>who</em> or <em>that</em> clause, so its one verb belongs to the clause.'
  };
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
  /* Same idea, different words: the words each choice shares with the sentence (src/reading/same_idea.py counts them), and what matching words would pick */
  function sameWordsLine(c) {
    var top = Math.max.apply(null, c.m), best = ['A', 'B', 'C', 'D'].filter(function (k, i) { return c.m[i] === top; });
    var named = best.length > 1 ? best.slice(0, -1).join(', ') + ' or ' + best[best.length - 1] : best[0];
    return '<p class="fine"><b>Words shared with the sentence</b>, not counting small ones like <em>the</em> and <em>of</em>: ' + c.m.map(function (n, i) { return 'ABCD'.charAt(i) + ' ' + n; }).join(', ') +
      '. Matching words would pick ' + named + (best.indexOf(c.a) !== -1 ? ', a tie with the right one.' : best.length > 1 ? ', ' + (best.length === 2 ? 'both' : 'all') + ' wrong.' : ', a wrong choice.') + '</p>';
  }
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
    } else if (kind === 'same') {
      ((D.same && D.same.cards) || []).forEach(function (c) {
        items.push({ id: 'sm:' + c.id, ref: 'say', opts: c.o.map(function (o) { return { k: o[0], b: '<span class="sentopt"><span class="olt">' + o[0] + '.</span> ' + esc(o[1]) + '</span>', n: esc(o[2]) }; }), ans: c.a, wide: true,
          prompt: '<p class="fine">A sentence from question ' + c.q + ' (' + c.d + ')</p>' + (c.c ? '<p class="fine"><b>Just before it:</b> ' + esc(c.c) + '</p>' : '') + '<p class="passage boxed">' + esc(c.t) + '</p>',
          explain: '<p><b>The answer is ' + c.a + '.</b> ' + esc(c.x) + '</p>' + sameWordsLine(c) +
            '<p class="fine">The rewordings were written for this site. The whole passage: <a href="#rq-' + c.q + '">question ' + c.q + '</a>.</p>' });
      });
    } else if (kind === 'notes') {
      ((D.bank && D.bank.notes) || []).forEach(function (b) {
        items.push({ id: b.id, ref: 'notesfirst', opts: ['A', 'B', 'C', 'D'].map(function (k) { return { k: k, b: '<span class="sentopt"><span class="olt">' + k + '.</span> ' + b.ch[k] + '</span>' }; }), ans: b.ans, wide: true,
          prompt: '<p class="ngoal"><span class="label">The goal · question ' + b.id + ' · ' + b.d + '</span>' + b.goal + '</p>' +
            '<p class="fine">Select the relevant facts, then verify the whole choice against these notes.</p><ul class="nnotes">' + b.notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul>',
          explain: '<p><b>' + b.ans + '.</b> ' + (b.why[b.ans] || '') + '</p><p class="fine">The choice must satisfy the goal and accurately represent the notes. Goal wording alone does not verify the facts.</p>' });
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
    } else if (kind === 'frag') {
      ((D.gbasics && D.gbasics.cards) || []).forEach(function (c) {
        var u = U[FRAG_REF[c.k]];
        items.push({ id: 'fr:' + c.id, ref: FRAG_REF[c.k], opts: FRAG_OPTS, ans: c.k,
          prompt: '<p class="passage boxed">' + esc(c.t) + '</p>',
          explain: '<p><b>' + FRAG_HEAD[c.k] + '.</b> ' + (c.k === 'ok' ? 'Subject: <b>' + esc(c.s) + '</b>. Tensed verb: <b>' + esc(c.v) + '</b>. ' : '') + c.x + '</p>' +
            (c.fix ? '<p class="fine"><b>One way to fix it:</b> ' + esc(c.fix) + '</p>' : '') + (u ? ruleLine(u) : '') });
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
    } else if (kind === 'wmean') {
      /* three wrong definitions from words with the same + or − mark, so the mark alone does not give the answer away */
      var byChg = { p: [], n: [], '': [] };
      VOC.words.forEach(function (w) { byChg[w[2]].push(w); });
      VOC.words.forEach(function (w) {
        var pool = byChg[w[2]].filter(function (o) { return o[0] !== w[0] && o[1] !== w[1] && o[0].split(' ')[0] !== w[0].split(' ')[0]; });
        var picks = shuffle(pool.slice()).slice(0, 3).concat([w]);
        items.push({ id: 'w:' + w[0], ref: 'voc-' + encodeURIComponent(w[0]), opts: shuffle(picks).map(function (o) { return { k: o[0], b: esc(o[1]) }; }), ans: w[0], wide: true,
          prompt: '<p class="vword">' + esc(w[0]) + '</p>',
          explain: '<p><b>' + esc(w[0]) + '</b>: ' + esc(w[1]) + '.</p><p class="fine">' + (w[3] > 1 ? 'Offered ' + w[3] + ' times' : 'Offered once') + (w[4] ? ', and the right answer ' + (w[4] > 1 ? w[4] + ' times' : 'once') : '') + ' in the fill-in questions: ' +
            w[5].map(function (id) { return '<a href="#rq-' + id + '">' + id + '</a>'; }).join(', ') + '.</p>' });
      });
    } else if (kind === 'wsecond') {
      VOC.second.forEach(function (x) {
        var other = x.other.map(function (k) { return '<em>' + esc(x.ch[k].toLowerCase()) + '</em>'; });
        items.push({ id: 'ws:' + x.id, ref: 'vocab-second', opts: ['A', 'B', 'C', 'D'].map(function (k) { return { k: k, b: esc(x.ch[k]) }; }), ans: x.k,
          prompt: '<p class="fine">Question ' + x.id + ' · ' + x.d + '</p><p class="passage boxed">' + markWordCI(x.sent, x.w) + '</p>',
          explain: '<p>Here <b>' + esc(x.w) + '</b> means <b>' + esc(x.ch[x.k].toLowerCase()) + '</b>. ' + (x.sec ? 'Its everyday meaning is “' + esc(x.first) + '”, which is not the sense this sentence uses.' : 'That is close to its everyday meaning, “' + esc(x.first) + '”.') + '</p>' +
            (other.length ? '<p class="fine">' + (other.length === 1 ? other[0] + ' is' : other.slice(0, -1).join(', ') + ' and ' + other[other.length - 1] + ' are') + ' also a real meaning of the word, just not here.</p>' : '') });
      });
    } else if (kind === 'mskill') {
      /* one skill from the same area of the test and two from other areas, so the area alone does not give it away */
      var skills = Object.keys(MSK);
      MQ.forEach(function (q) {
        var same = MDOM[q.k].skills.filter(function (k) { return k !== q.k; });
        var other = skills.filter(function (k) { return k !== q.k && same.indexOf(k) === -1; });
        var picks = shuffle(same.slice()).slice(0, 1).concat(shuffle(other.slice()).slice(0, 4 - Math.min(1, same.length) - 1)).concat([q.k]);
        var T = MTY[q.t], pats = MD.patterns.filter(function (p, i) { return (q.pm >> i) & 1; });
        items.push({ id: 'ms:' + q.id, ref: 'm-' + q.k, opts: shuffle(picks).map(function (k) { return { k: k, b: esc(MSK[k].name) }; }), ans: q.k, wide: true,
          prompt: '<p class="fine">Question ' + q.id + ' · ' + MDIFF[q.d] + '</p>' + mImg('q', q),
          explain: '<p><b>' + esc(MSK[q.k].name) + '</b>, in ' + esc(MDOM[q.k].name) + '. Its question type: <a href="#mt-' + q.t + '">' + esc(T.name) + '</a>.</p>' +
            '<p><b>The cue:</b> ' + esc(T.spot) + '</p>' +
            (pats.length ? '<p class="fine">Big idea' + (pats.length > 1 ? 's' : '') + ': ' + pats.map(function (p) { return '<a href="#mpat-' + p.id + '">' + esc(p.name) + '</a>'; }).join(', ') + '.</p>' : '') });
      });
    } else if (has(MDR_KIND, kind)) {
      var made = (D.mdrills || {})[MDR_KIND[kind]] || [];
      made.forEach(function (c) {
        items.push({ id: kind + ':' + c.id, ref: c.r, opts: c.o.map(function (o) { return { k: o[0], b: o[1], n: o[2] }; }), ans: c.a, wide: kind === 'mpct' || kind === 'mform',
          prompt: c.p, explain: '<p>' + c.x + '</p>' + mdrillMore(kind, c) });
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
    'Found': 'A reported result, fact or example; retain who reports or interprets it.',
    'Point': 'The claim or conclusion, the author’s or the researchers’.',
    'Happens': 'What someone in the story does or says.',
    'Feeling': 'What someone feels, wants, thinks or is like.',
    'Goal': 'What the student wants the sentence to do.'
  };
  var TAG_HINT = { 'Scene': 'background', 'Old idea': 'what people thought', 'Did': 'what someone did', 'Found': 'a result or fact', 'Point': 'the claim', 'Happens': 'what someone does', 'Feeling': 'what someone feels', 'Goal': 'the student wants to…' };
  function markWordCI(sentence, word) {
    var norm = function (t) { return t.toLowerCase().replace(/’/g, "'"); };
    var w = /^an? /i.test(word) ? word.replace(/^an? /i, '') : word, i = norm(sentence).indexOf(norm(w));
    if (i < 0) { return esc(sentence); }
    return esc(sentence.slice(0, i)) + '<mark class="ptr">' + esc(sentence.slice(i, i + w.length)) + '</mark>' + esc(sentence.slice(i + w.length));
  }
  function markWord(sentence, word) {
    var i = sentence.indexOf(word);
    if (i < 0) { return esc(sentence); }
    return esc(sentence.slice(0, i)) + '<mark class="ptr">' + esc(word) + '</mark>' + esc(sentence.slice(i + word.length));
  }
  /* under each card written for this site: where the bank's real questions of that kind are */
  function mdrillMore(kind, c) {
    var types = { mcount: ['le1-count', 'sys-count', 'nle-count'], mform: ['nlf-vertex', 'nlf-zeros', 'nlf-yint'] }[kind];
    if (types) {
      var n = types.reduce(function (a, t) { return a + MTY[t].n; }, 0);
      return '<p class="fine">This card was written for this site. The bank has ' + n + ' questions like it: ' + types.map(function (t) { return '<a href="#mp-' + t + '">' + esc(MTY[t].name) + '</a> (' + MTY[t].n + ')'; }).join(', ') + '.</p>';
    }
    var f = /^m-found-([a-z]+)$/.exec(c.r || '');
    if (f && MFOUNDBY[f[1]]) { return '<p class="fine">Written for this site. The move: <a href="#' + c.r + '">' + esc(MFOUNDBY[f[1]].name) + '</a>, on the Algebra basics page.</p>'; }
    var t = /^mt-(.+)$/.exec(c.r || '');
    return t && MTY[t[1]] ? '<p class="fine">Written for this site. It comes up in questions such as <a href="#' + c.r + '">' + esc(MTY[t[1]].name) + '</a>.</p>' : '';
  }
  var SKIP = { 'u6-2/0': 1, 'u18-2/2': 1, 'u16-1/2': 1, 'u19-4': 1 };
  var PLAIN_LINK = { c14: 'but', c15: 'so', c16: 'for example', c17: 'also', c18: 'then', c19: 'there' };
  function wrongPickHTML(kind, mine, it) {
    var b = plain(mine.b);
    if (mine.n) { return '<p class="whypick"><b>Why not:</b> ' + mine.n + '</p>'; }
    if (kind === 'mskill' && MSK[mine.k]) { return '<p class="whypick"><b>Not ' + esc(MSK[mine.k].name) + '.</b> That skill: ' + esc(MSK[mine.k].idea) + '</p>'; }
    if (kind === 'link') { return '<p class="whypick"><b>Not ' + esc(b) + '.</b> Read the two statements with “' + PLAIN_LINK[mine.k] + '” in the blank: the logic breaks.</p>'; }
    if (kind === 'pattern') { return '<p class="whypick"><b>Not ' + esc(b) + '.</b> That would show ' + esc(FAM[mine.k].sub.charAt(0).toLowerCase() + FAM[mine.k].sub.slice(1)) + ' across the four choices.</p>'; }
    if (kind === 'frag') { return '<p class="whypick"><b>Not “' + esc(b) + '”.</b> ' + FRAG_WHYNOT[mine.k] + '</p>'; }
    if (kind === 'tag') { return '<p class="whypick"><b>Not ' + esc(b) + '.</b> ' + esc(TAG_DEF[mine.k] || '') + '</p>'; }
    if (kind === 'wmean') { return '<p class="whypick"><b>Not this one.</b> That is what <em>' + esc(mine.k) + '</em> means.</p>'; }
    if (kind === 'why') { var o = KIND_OPTS.filter(function (x) { return x.k === mine.k; })[0]; return '<p class="whypick"><b>Not ' + esc(b) + '.</b> That kind ' + esc(o ? o.s : '') + '.</p>'; }
    return '';
  }
  function drillAway() { if (drillRun && !drillRun.answered && !drillRun.away) { drillRun.away = now(); stopWatch(); } }
  function drillBack() {
    if (!drillRun || !drillRun.away) { return; }
    drillRun.t0 += now() - drillRun.away; drillRun.away = 0;
    var d = DR[drillRun.kind], R = drillRun, w = document.getElementById('dwatch');
    if (w && !R.answered) { stopWatch(); watch = setInterval(function () { tickWatch(w, R, d); }, 250); }
  }
  function drillCount(kind) { return drillItems(kind).length; }
  function dlen() { return typeof store.s.dlen === 'number' ? store.s.dlen : 10; }
  function lastLine(r) { return isObj(r) && typeof r.n === 'number' ? 'Last time: ' + r.r + ' of ' + r.n + ' right, about ' + wholeSecs(r.m) + ' a card' : ''; }
  /* the clock on a card counts whole seconds: tenths flicker and make people hurry */
  function wholeSecs(t) { var n = Math.max(0, Math.round(t)); return n + (n === 1 ? ' second' : ' seconds'); }
  function tickWatch(w, R, d) { var t = (now() - R.t0) / 1000; w.textContent = Math.floor(t) + ' s'; w.classList.toggle('slow', t > d.goal); }

  /* My progress: the last round of each short exercise tried in this subject */
  function drillTried(subj) { return drillsOf(subj).filter(function (k) { return isObj(store.d[k]) && typeof store.d[k].n === 'number'; }); }
  function drillProgressHTML(subj) {
    var keys = drillTried(subj), math = subj === 'math';
    if (!keys.length) { return ''; }
    return '<section class="sec" id="' + (math ? 'mm' : 'rwm') + '-drills"><h3 class="h2">Short exercises</h3><p class="lede">How your last round went on each one you have tried.</p><ul class="mm-mods dprog">' + keys.map(function (k) {
      var r = store.d[k];
      return '<li><a href="#' + (math ? 'm-drill-' : 'drill-') + k + '">' + DR[k].title + '</a><b>' + r.r + ' of ' + r.n + ' right</b><span class="muted">about ' + wholeSecs(r.m) + ' a card</span></li>';
    }).join('') + '</ul><p class="row" style="margin-top:1rem"><a class="btn sm ghost" href="#' + (math ? 'm-drills' : 'drills') + '">All short exercises</a></p></section>';
  }
  var drillRun = null, watch = null, drillSubj = '';
  function stopWatch() { clearInterval(watch); watch = null; }
  /* Reading and Writing drills live on #drills and Math drills on #m-drills. They share one host, which moves to the
     page in use; one round runs at a time, and opening the other subject's drills ends the round in progress. */
  function buildDrills(subj) {
    subj = subj === 'math' ? 'math' : 'rw';
    var view = viewEl[subj === 'math' ? 'mdrills' : 'drills'];
    if (!view.firstElementChild) { view.innerHTML = '<div class="wrap"></div>'; }
    var host = document.getElementById('dhost');
    if (!host) { host = document.createElement('div'); host.id = 'dhost'; }
    if (host.parentNode !== view.firstElementChild) { view.firstElementChild.appendChild(host); }
    if (drillSubj !== subj) { drillSubj = subj; drillHome(); }
  }
  function drillCard(k) {
    var d = DR[k], n = drillCount(k), last = store.d[k];
    return '<div class="dcard"><h3>' + d.title + '</h3><p>' + d.blurb + '</p><p class="dmeta">' + n.toLocaleString('en-US') + ' cards · aim for ' + d.goal + ' seconds or less a card</p>' +
      '<p class="dlast">' + (lastLine(last) || 'Not tried yet') + '</p><button type="button" class="btn" data-start="' + k + '"' + (n ? '' : ' disabled') + '>Start <span class="sr">' + d.title + '</span></button></div>';
  }
  function drillHome() {
    drillRun = null; stopWatch();
    var len = dlen();
    var keys = drillsOf(drillSubj || 'rw'), math = drillSubj === 'math';
    var groups = math ? [['mspot', 'Know what the question asks'], ['mreps', 'Avoid the usual mistakes'], ['mfound', 'Algebra basics']]
      : [['reading', 'Reading'], ['grammar', 'Grammar'], ['words', 'Word meanings']];
    var how = 'Pick one and press Start. After each card you see the right answer and why. A small clock counts the seconds, but there is no time limit.' +
      '<span class="kbd-only"> On a keyboard, press 1, 2, 3 or 4 to answer and Enter for the next card.</span>';
    var h = (math ? mHead('Math · Short exercises', 'Short exercises', 'Quick cards that each train one small step that many questions share. ' + how)
        : '<header class="read"><p class="eyebrow">Reading &amp; Writing · Short exercises</p><h2 class="vtitle">Short exercises</h2>' +
          '<p class="lede">Quick cards that each train one small step, most of them on real test questions. ' + how + '</p></header>') +
      '<fieldset class="seg" style="margin-top:1.4rem"><legend>Cards each time</legend><div class="segrow">' + [10, 20, 0].map(function (n) {
        return '<label><input type="radio" name="dlen" id="dlen-' + (n || 'all') + '" value="' + n + '"' + (n === len ? ' checked' : '') + '><span>' + (n || 'All') + '</span></label>';
      }).join('') + '</div></fieldset>' +
      groups.map(function (g) {
        var ks = keys.filter(function (k) { return DR[k].part === g[0]; });
        return ks.length ? '<h3 class="subh">' + g[1] + '</h3><div class="dgrid">' + ks.map(drillCard).join('') + '</div>' : '';
      }).join('') + (math ? '<p class="fine" style="margin-top:1.4rem">“Name the skill” uses real test questions. The other Math cards were written for this site, and a script works out every card’s answer a second way to check it.</p>' : '');
    var host = document.getElementById('dhost');
    host.innerHTML = h;
    $$('input[name="dlen"]', host).forEach(function (r) { r.addEventListener('change', function () { store.s.dlen = Number(r.value); save(); }); });
    $$('[data-start]', host).forEach(function (b) { b.addEventListener('click', function () { startDrill(b.getAttribute('data-start')); }); });
  }
  function startDrill(kind, only) {
    if (!DR[kind]) { return; }
    buildDrills(drillSubjOf(kind));
    var all = drillItems(kind), pool;
    if (only) { pool = shuffle(all.filter(function (it) { return only.indexOf(it.id) !== -1; })); }
    else { pool = shuffle(all.slice()); if (dlen()) { pool = pool.slice(0, dlen()); } }
    if (!pool.length) { drillHome(); return; }
    drillRun = { kind: kind, items: pool, i: 0, right: 0, streak: 0, best: 0, res: [], t0: 0, answered: false, sel: {}, subj: drillSubjOf(kind) };
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
      }).join('') + '</div><p class="row" style="margin-top:.8rem"><button type="button" class="btn big" id="pcheck">Check</button><span class="kbd">Enter</span></p>';
    } else {
      body = '<div class="dopts' + (it.wide ? ' wide' : '') + '">' + it.opts.map(function (o, i) {
        return '<button type="button" class="dopt" data-k="' + o.k + '"><span class="k">' + (i < KEYS.length ? KEYS[i] : '') + '</span><span><b>' + o.b + '</b>' + (o.s ? '<small>' + o.s + '</small>' : '') + '</span></button>';
      }).join('') + '</div>';
    }
    host.innerHTML = '<div class="drun"><div class="dbar"><span class="dname">' + d.title + '</span><span class="dstat">Card ' + (R.i + 1) + ' of ' + R.items.length + '</span>' +
      '<span class="dstat" id="dright">' + R.right + ' right</span><span class="dwatch" id="dwatch" aria-hidden="true">0 s</span>' +
      '<button type="button" class="btn sm ghost" id="dend">Stop</button></div>' +
      '<div class="dprompt" id="dprompt">' + it.prompt + '</div>' + (d.ask ? '<p class="dask">' + d.ask + '</p>' : '') + body + '<div class="dfeed" id="dfeed"></div></div>';
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
    watch = setInterval(function () { tickWatch(w, R, d); }, 250);
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
    w.textContent = Math.round(t) + ' s'; w.classList.toggle('slow', t > goal);
    R.res.push({ id: it.id, ok: ok, t: t, ref: it.ref });
    if (ok) { R.right += 1; R.streak += 1; R.best = Math.max(R.best, R.streak); } else { R.streak = 0; }
    document.getElementById('dright').textContent = R.right + ' right';
    noteDrill(R.subj);
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
    /* the button to go on sits right under the verdict, so it is on screen, and again after the explanation (one of them when it all fits) */
    var nextRow = function (id) { return '<p class="dnext row"><button type="button" class="btn big" id="' + id + '">' + (last ? 'See how I did' : 'Next card') + ' <span aria-hidden="true">→</span></button><span class="kbd">Enter</span></p>'; };
    document.getElementById('dfeed').innerHTML = '<p class="verdict ' + (ok ? 'good' : 'miss') + '" tabindex="-1">' + (ok ? 'Right.' : 'Not this one.') +
      '<span class="vt">' + wholeSecs(t) + (ok && t > goal ? ' · aim for ' + goal + ' or less' : '') + '</span></p>' + nextRow('dnext') +
      whyNot + '<div class="dexp">' + it.explain + '</div>' + nextRow('dnext2');
    document.getElementById('dnext').addEventListener('click', drillNext);
    document.getElementById('dnext2').addEventListener('click', drillNext);
    oneNext($('#dfeed .verdict'), document.getElementById('dnext').parentNode, document.getElementById('dnext2'), document.getElementById('dfeed'));
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
    if (/^voc-/.test(ref)) { return 'Word list · ' + esc(decodeURIComponent(ref.slice(4))); }
    var mm = /^mt-(.+)$/.exec(ref);
    if (mm && MTY[mm[1]]) { return 'Question type · ' + esc(MTY[mm[1]].name); }
    mm = /^m-(.+)$/.exec(ref);
    if (mm && MSK[mm[1]]) { return 'Lesson · ' + esc(MSK[mm[1]].name); }
    mm = /^m-found-([a-z]+)$/.exec(ref);
    if (mm && MFOUNDBY[mm[1]]) { return 'Algebra basics · ' + esc(MFOUNDBY[mm[1]].name); }
    return { chunk: 'Step 2 · Chunk: the tags', long: 'Long sentences: core first', para: 'Long passages: make them make sense', method: 'The 60-second method', 'parts-of-speech': 'Parts of speech in five minutes', say: 'Step 3 · Say: your own answer first', job: 'Step 1 · Job', 'vocab-second': 'Words to know · Second meanings' }[ref] || ref;
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
      '<p class="dresult">You got ' + R.right + ' of ' + n + ' right</p>' +
      '<p class="lede">About ' + wholeSecs(m) + ' a card. ' + inGoal + ' of ' + n + ' took ' + goal + ' seconds or less.' + (R.best > 1 ? ' Most right in a row: ' + R.best + '.' : '') + '</p>' +
      '<div class="dots" aria-hidden="true">' + R.res.map(function (x) { return '<i class="' + (x.ok ? 'ok' : 'no') + '" title="' + wholeSecs(x.t) + '"></i>'; }).join('') + '</div>' +
      (refs.length ? '<h3 class="subh">Read these again</h3><ul class="missed">' + refs.map(function (ref) { return '<li><a href="#' + ref + '">' + refLabel(ref) + '</a></li>'; }).join('') + '</ul>'
        : '<p class="subh">Every card right.</p>') +
      '<div class="row" style="margin-top:1.4rem">' + (missed.length ? '<button type="button" class="btn big" id="dretry">Try the ' + plural(missed.length, 'card', 'cards') + ' I missed again</button>' : '') +
      '<button type="button" class="btn' + (missed.length ? ' ghost' : ' big') + '" id="dagain">Another round</button><button type="button" class="btn ghost" id="dhome">All short exercises</button></div></div>';
    drillRun = null;
    var rb = document.getElementById('dretry');
    if (rb) { rb.addEventListener('click', function () { startDrill(kind, missIds); }); }
    document.getElementById('dagain').addEventListener('click', function () { startDrill(kind); });
    document.getElementById('dhome').addEventListener('click', drillHome);
    toTop();
  }
