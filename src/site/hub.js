  /* =================== Learn: one overview per subject, with one search across everything there is to learn =================== */
  var HUB = { math: { view: 'mhub', p: 'mhub', name: 'Math', eg: 'for example: vertex, percent, no solution' },
              rw: { view: 'rwhub', p: 'rwhub', name: 'Reading and Writing', eg: 'for example: semicolon, main idea, however' } };
  var hubIx = {};
  function hubNorm(t) { return String(t || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim(); }
  /* [{ k: kind, t: title, s: a line about it, h: where it is, x: the words to search }] */
  function hubIndex(subj) {
    if (hubIx[subj]) { return hubIx[subj]; }
    var out = [];
    function add(k, t, s, h, more) { out.push({ k: k, t: t, s: s || '', h: h, tx: hubNorm(t), x: hubNorm(t + ' ' + (s || '') + ' ' + (more || '')) }); }
    if (subj === 'math') {
      MD.domains.forEach(function (d) { d.skills.forEach(function (k) { add('Lesson', MSK[k].name, MSK[k].idea, 'm-' + k, d.name + ' ' + MSK[k].plain); }); });
      MD.patterns.forEach(function (p) { add('Big pattern', p.name, p.idea, 'mpat-' + p.id, p.spot); });
      MD.rare.forEach(function (r) { add('Rare pattern', r.name, r.trick, 'mrare'); });
      MORDER.forEach(function (t) { add('Question type', MTY[t].name, MTY[t].spot, 'mt-' + t, MSK[MTY[t].skill].name + ' ' + MTY[t].trap); });
      MST.methods.forEach(function (m) { add('Expanded type', m.title, m.why_it_works, 'm-study-' + encodeURIComponent(m.id), MSK[m.skill].name + ' ' + m.common_trap); });
      MSHORT.forEach(function (s) { add('Shortcut', s.t, s.when, 'ms-' + s.id, s.how.join(' ')); });
      if (D.mnotin) {
        D.mnotin.none.forEach(function (t) { add('Not in the bank', t.name, t.why, 'm-notin'); });
        D.mnotin.rare.forEach(function (t) { add('Once in the bank', t.name, t.why, 'm-notin'); });
        D.mnotin.keep.forEach(function (t) { add('In the bank', t.name, t.why, 'm-notin', 'factor theorem remainder theorem'); });
      }
      MFOUND.forEach(function (f) { add('Algebra foundations', f.name, f.idea, 'm-found-' + f.id, f.slip + ' ' + f.why + ' ' + f.words); });
      MFIRST.forEach(function (f) { add('Shortcut first', f.name, f.tell, 'm-first-' + f.id, f.move + ' ' + f.watch + ' ' + f.words); });
      MFIRSTX.forEach(function (f) { add('Shortcut look-alike', f.name, f.why, 'm-first-' + f.id, f.looks + ' ' + f.instead); });
      add('Shortcut first', 'Picking numbers: a check, not the first move', 'Where picking your own numbers breaks down: constants fixed by a condition, no solution and infinitely many, and choices that agree at your number.', 'm-first-picknum', 'pick a number plug in substitute choose a value');
      MD.desmos.forEach(function (m) { add('Desmos move', m.name, m.when, 'md-' + m.id, m.short + ' ' + m.see); });
      add('Formulas', 'The reference sheet', 'The formulas and facts the test gives you, and the Reference button that opens them while you practice.', 'm-sheet', 'formula sheet circle rectangle triangle pythagorean special right triangles 30-60-90 45-45-90 box rectangular prism cylinder sphere cone pyramid volume area degrees radians');
      add('Formulas', 'Formulas and typing in answers', 'What is on the formula sheet, what is not, and how to type in your own answers.', 'm-ref', 'circle area volume quadratic formula discriminant slope vertex radians sohcahtoa exponent rules');
    } else {
      [['routine', 'The reading routine: Job, Chunk, Say, Check'], ['shape', 'What the passages are like'], ['job', 'Step 1 · Job: read the question line first'], ['chunk', 'Step 2 · Chunk: tag each sentence'],
        ['long', 'Long sentences: core first'], ['para', 'Long passages: make them make sense'], ['say', 'Step 3 · Say: your own answer first'], ['check', 'Step 4 · Check: five ways a choice is wrong'],
        ['reasoning', 'Deeper reading structures'], ['data-patterns', 'Tables and graphs: deeper patterns'], ['others', 'More question types'], ['vocab', 'Words to know: the vocabulary for Words in Context'], ['vocab-check', 'Can’t predict the word? Decide plus or minus'], ['vocab-second', 'Second meanings'], ['vocab-func', 'Words in Purpose and structure choices'], ['notesfirst', 'Notes questions: goal first'],
        ['method', 'Grammar in 60 seconds: look, check, confirm'], ['shortcuts', 'Grammar shortcuts'], ['hard', 'What makes a grammar question hard'], ['transitions', 'Every transition offered'], ['glossary', 'Glossary'], ['nottested', 'What is not tested']
      ].forEach(function (r) { add('Guide', r[1], '', r[0]); });
      RD.jobs.forEach(function (j) { add('Reading question', j.name, plain(j.look), j.id, (j.says || []).join(' ')); });
      RLIST.forEach(function (x) { add('Worked example', 'Example ' + x.n + ': ' + plain(x.title), JOBNAME[x.job] || '', 'ex-' + x.n, x.diff); });
      CONCEPTS.forEach(function (c) { add('Grammar lesson', 'Lesson ' + c.n + ': ' + plain(c.title), PART[c.part].title, c.id); });
      Object.keys(U).forEach(function (uid) { var u = U[uid]; add('Grammar rule', u.num + ' ' + plain(u.title), plain(u.rule), uid, CBY[u.c].title + ' ' + plain(u.words || '')); });
      READ_GLOSS.map(function (g) { return [g[0], g[1]]; }).concat(D.glossary.map(function (g) { return [plain(g.term), plain(g.def)]; })).forEach(function (g) { add('Term', g[0], g[1], 'glossary'); });
      TRANS.forEach(function (t) { add('Transition word', t.w, 'Right ' + t.right + ' of the ' + t.offered + ' times it is offered.', 'transitions'); });
      VOC.words.forEach(function (w) { add('Word', w[0], w[1], 'voc-' + encodeURIComponent(w[0])); });
      VOC.func.forEach(function (f) { add('Purpose word', f[0], 'The choice says the text ' + f[1] + '.', 'vocab-func'); });
    }
    hubIx[subj] = out;
    return out;
  }
  function hubSearch(subj, q) {
    var words = hubNorm(q).split(' ').filter(Boolean);
    if (!words.length || hubNorm(q).length < 2) { return null; }
    var hits = [];
    hubIndex(subj).forEach(function (e, i) {
      if (!words.every(function (w) { return e.x.indexOf(w) !== -1; })) { return; }
      var inTitle = words.every(function (w) { return e.tx.indexOf(w) !== -1; });
      hits.push({ e: e, s: (e.tx === words.join(' ') ? 4 : inTitle ? (e.tx.indexOf(words[0]) === 0 ? 3 : 2) : 1), i: i });
    });
    hits.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
    return hits.map(function (h) { return h.e; });
  }
  function buildHub(subj) {
    var H = HUB[subj], host = viewEl[H.view], p = H.p;
    if (built[H.view]) { return; }
    built[H.view] = true;
    var pages = SUBJ[subj].items.filter(function (it) { return it[4] === 'learn' && it[0] !== H.view; });
    var start = SUBJ[subj].items[0], prac = SUBJ[subj].items.filter(function (it) { return it[4] === 'practice'; })[0];
    host.innerHTML = '<div class="wrap">' +
      '<header class="mhead"><p class="eyebrow">' + SUBJ[subj].name + ' · Learn</p><h2 class="vtitle">Everything to learn, in one place</h2>' +
      '<p class="lede">Search across every ' + (subj === 'math' ? 'lesson, question type, pattern, shortcut and calculator move' : 'reading step, grammar lesson, rule, worked example and term') + ', or open a section below.</p></header>' +
      '<div class="hub-find"><label class="field"><span class="label">Search everything in Learn</span><input type="text" id="' + p + '-q" autocomplete="off" placeholder="' + H.eg + '"></label></div>' +
      '<p class="muted hub-n" id="' + p + '-n" aria-live="polite"></p><ul class="hub-res" id="' + p + '-res"></ul>' +
      '<section class="sec first"><h3 class="h2">Sections</h3><div class="hub-cards">' + pages.map(function (it) {
        return '<a class="hub-card" href="#' + it[1] + '"><b>' + esc(it[2]) + '</b><span>' + esc(it[3]) + '</span></a>';
      }).join('') + '</div></section>' +
      '<section class="sec"><h3 class="h2">A good order</h3><ol class="hsteps hub-order">' +
        '<li><b><a href="#' + start[1] + '">Start here</a>.</b><span>Five minutes on what the section asks and the routine to use.</span></li>' +
        (subj === 'math'
          ? '<li><b><a href="#m-found">Algebra foundations</a>, if the basics feel rusty.</b><span>Six moves every lesson assumes, each with a short drill.</span></li><li><b><a href="#m-learn">Lessons</a>, one skill at a time.</b><span>Each ends with a button for real questions on just that skill.</span></li><li><b><a href="#m-first">Shortcut first</a>, <a href="#m-patterns">Big patterns</a> and <a href="#m-desmos">Desmos</a>.</b><span>The habit of checking for a short way, the ideas that connect the question types, and the calculator moves that save time.</span></li>'
          : '<li><b><a href="#reading">Reading</a>: the four-step routine.</b><span>Then the worked examples, trying each before you read it.</span></li><li><b><a href="#method">Grammar</a> in 60 seconds.</b><span>Look at the choices, run one check, confirm. Then the lessons you need.</span></li>') +
        '<li><b><a href="#' + prac[1] + '">Practice</a>, then <a href="#' + (subj === 'math' ? 'm-map' : 'rw-map') + '">My map</a>.</b><span>The map shows which types to come back to.</span></li>' +
      '</ol></section></div>';
    var inp = document.getElementById(p + '-q'), res = document.getElementById(p + '-res'), cnt = document.getElementById(p + '-n');
    inp.addEventListener('input', function () {
      var hits = hubSearch(subj, inp.value);
      if (hits === null) { res.innerHTML = ''; cnt.textContent = ''; return; }
      cnt.textContent = hits.length ? plural(hits.length, 'result') + (hits.length > 40 ? ', showing the first 40. Add a word to narrow it down.' : '.') : 'Nothing matches. Try fewer or simpler words.';
      res.innerHTML = hits.slice(0, 40).map(function (e) {
        return '<li><a href="#' + e.h + '"><span class="mtag">' + esc(e.k) + '</span><b>' + esc(e.t) + '</b>' + (e.s ? '<span class="hub-s">' + esc(e.s.length > 150 ? e.s.slice(0, 147) + '…' : e.s) + '</span>' : '') + '</a></li>';
      }).join('');
    });
  }

  /* =================== Home: a real question to try, before anything else =================== */
  var HTRY_M = ['3d04de9c', 'c943acba', '4ddfa209', 'e7b6f0d1', 'be35c117', '42b4493b', 'd964bc26'];
  var htryN = { math: 0, rw: 0 }, htryPool = {};
  function htryList(subj) {
    if (htryPool[subj]) { return htryPool[subj]; }
    var L = subj === 'math'
      ? HTRY_M.map(function (id) { return MQBY[id]; }).filter(function (q) { return q && q.mc && mtxHas(q.id); })
      : EXLIST.filter(function (ex) { return ex.d === 'Easy' && (ex.p === 'A' || ex.p === 'B') && ex.text.length < 230 && ex.text.charAt(0) !== '…'; });
    htryPool[subj] = shuffle(L.slice());
    return htryPool[subj];
  }
  function htryShow(subj) {
    var host = document.getElementById('htry');
    if (!host) { return; }
    var L = htryList(subj);
    if (!L.length) { host.innerHTML = '<p class="muted">Open <a href="#' + (subj === 'math' ? 'm-practice' : 'practice') + '">Practice</a> to try real questions.</p>'; return; }
    var it = L[htryN[subj] % L.length];
    store.s.htry = subj; save();
    $$('#htry-tabs button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-htry') === subj ? 'true' : 'false'); });
    if (subj === 'rw') {
      host.innerHTML = '';
      var card = QCard(it, { hints: true, after: function () {
        var more = document.createElement('p');
        more.className = 'row htry-more';
        more.innerHTML = '<a class="btn sm" href="#method">The 60-second method</a><button class="linkbtn" type="button" data-htry-next="rw">Try another</button>';
        card.el.appendChild(more);
      } });
      host.appendChild(card.el);
      return;
    }
    var T = MTY[it.t];
    host.innerHTML = '<div class="mpcard htry-m"><header class="mpcard-h"><span class="mtag">' + esc(MSK[it.k].name) + '</span><span class="mdiff d' + it.d + '">' + MDIFF[it.d] + '</span></header>' +
      '<div class="mpq">' + mImg('q', it, true) + '</div>' +
      '<div class="mpchoices" role="group" aria-label="Your answer">' + ['A', 'B', 'C', 'D'].map(function (L2) { return '<button class="mpch" type="button" data-k="' + L2 + '"><span class="mpch-l">' + L2 + '</span></button>'; }).join('') + '</div>' +
      '<div class="htry-fb" id="htry-fb" tabindex="-1" hidden></div></div>';
    $$('.mpch', host).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-k'), ok = k === it.a, fb = document.getElementById('htry-fb');
        $$('.mpch', host).forEach(function (x) { x.disabled = true; var xk = x.getAttribute('data-k'); if (xk === it.a) { x.classList.add('right'); } else if (xk === k) { x.classList.add('wrong'); } });
        fb.hidden = false;
        fb.className = 'htry-fb ' + (ok ? 'ok' : 'no');
        fb.innerHTML = '<p class="mpverdict">' + (ok ? 'Correct.' : 'Not this time. The answer is ' + it.a + '.') + '</p>' +
          '<p class="mtag">This is a “' + esc(T.name) + '” question</p>' +
          '<p class="mspot"><b>How to spot it:</b> ' + esc(T.spot) + '</p>' + mStepList(T.steps) +
          '<p class="mtrap"><span class="mtag bad">Watch out</span> ' + esc(T.trap) + '</p>' +
          '<p class="row htry-more"><a class="btn sm" href="#mp-' + it.t + '">Practice more like this</a><button class="linkbtn" type="button" data-htry-next="math">Try another</button></p>';
        showFeedback(fb);
      });
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-htry],[data-htry-next]') : null;
    if (!b) { return; }
    if (b.hasAttribute('data-htry-next')) { var s = b.getAttribute('data-htry-next'); htryN[s] += 1; htryShow(s); focusQuiet($('#htry .mpch, #htry .opt')); htrySee(); return; }
    htryShow(b.getAttribute('data-htry'));
    htrySee();
  });
  /* the answer and its notes are long on a phone: when the next question would be left off the screen, bring it back */
  function htrySee() {
    var box = $('.hh-try');
    if (!box) { return; }
    var r = box.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight - 160) { box.scrollIntoView({ block: 'start' }); }
  }
  function htryHTML() {
    return '<div class="hh-try" aria-label="Try a real question"><div class="htry-top"><p class="label">Try a real question</p>' +
      '<div class="htry-tabs" id="htry-tabs" role="group" aria-label="Section"><button type="button" data-htry="math" aria-pressed="false">Math</button><button type="button" data-htry="rw" aria-pressed="false">Reading &amp; Writing</button></div></div>' +
      '<div id="htry"></div><p class="fine htry-note">Answer it to see how to spot this kind of question. Nothing is saved from here.</p></div>';
  }

