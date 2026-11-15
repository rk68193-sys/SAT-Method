  /* =================== Lookup =================== */
  var READ_GLOSS = [
    ['Tag', 'One label for what a sentence is doing in its passage: Scene, Old idea, Did, Found or Point; in stories, Scene, Happens or Feeling.'],
    ['Point', 'The claim or conclusion the rest of a passage supports. Most reading questions turn on it.'],
    ['Turn word', 'A word that sets one thing against another: but, however, although, though, yet, despite, whereas. What comes after it usually carries the weight.'],
    ['Core', 'The short sentence inside a long one: its subject, main verb and what completes them.'],
    ['Lead-in', 'An opener before the subject of a sentence: To…, Although…, By…, When…, In 2019,.'],
    ['Report frame', 'Words like “researchers found that” or “the study showed that”. The real content is in the that-part.'],
    ['Pointer', 'A word that points back to an earlier idea: this, these, such, it, they, the finding. Name what it points to before you read on.'],
    ['Say line', 'Your own answer, said in one line before you read the choices.'],
    ['Job', 'What a question asks you to produce: a main idea, a detail, an inference and so on. The question line names it.']
  ];
  var HAY = null;
  function hay() {
    if (HAY) { return HAY; }
    HAY = Object.keys(U).map(function (uid) {
      var u = U[uid], c = CBY[u.c];
      var parts = [u.num, u.title, u.rule, u.words, c.title];
      u.v.forEach(function (v) { parts.push(v.label, v.frag, v.note, v.ids.map(function (x) { return x[0]; }).join(' ')); });
      return { uid: uid, head: normQ(u.num + ' ' + plain(u.title) + ' ' + c.title), text: normQ(plain(parts.join(' '))) };
    });
    return HAY;
  }
  function normQ(t) { return String(t || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim(); }
  function reEsc(t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  // student words the rule titles do not use
  var ALIAS = { 'dangling': 'c13', 'dangling modifier': 'c13', 'misplaced modifier': 'c13', 'run-on': ['u1-1', 'u2-1', 'u6-1'], 'run on': ['u1-1', 'u2-1', 'u6-1'], 'comma splice': ['u1-1', 'u2-1', 'u6-1'], "it's": 'u11-7', 'its': 'u11-7' };
  function scoreOf(h, q, wb) {
    if (h.head.indexOf(q) !== -1) { return 3; }
    if (wb.test(h.text)) { return 2 + Math.min(h.text.split(q).length - 1, 9) / 10; }
    return h.text.indexOf(q) !== -1 ? 1 : 0;
  }
  function extraHits(q) {
    var out = '';
    var ab = D.absent.items.filter(function (t) { return normQ(plain(t)).indexOf(q) !== -1; });
    if (ab.length) { out += '<h4 class="subh">Not tested in this bank</h4><ul class="plainlist">' + ab.map(function (t) { return '<li>' + t + ' <a href="#nottested">See the list</a></li>'; }).join('') + '</ul>'; }
    var gl = READ_GLOSS.map(function (g) { return { term: esc(g[0]), def: esc(g[1]) }; }).concat(D.glossary, basicTerms()).filter(function (g) { return normQ(plain(g.term)).indexOf(q) !== -1; });
    if (gl.length) { out += '<h4 class="subh">Glossary</h4><ul class="plainlist">' + gl.map(function (g) { return '<li><b>' + g.term + '</b>: ' + g.def + ' <a href="#glossary">All terms</a></li>'; }).join('') + '</ul>'; }
    return out;
  }
  function findHTML(q) {
    q = normQ(q);
    if (q.length < 2) { return '<p class="empty">Type at least two letters: a rule, a word such as <em>which</em> or <em>however</em>, or a question ID.</p>'; }
    if (/^[0-9a-f]{8}$/.test(q)) {
      if (QI[q]) { var u0 = U[QI[q][0]]; return '<ul class="plainlist"><li><a href="#i-' + q + '">Question ' + q + '</a> is a grammar question, filed under rule ' + u0.num + ': ' + u0.title + '.</li></ul>'; }
      if (RID[q]) { return '<ul class="plainlist"><li>Question ' + q + ' is a reading question: ' + esc(RID[q].group) + ' · ' + esc(RID[q].set) + ' · ' + RID[q].diff + '.' + (EXQ[q] ? ' <a href="#ex-' + EXQ[q] + '">It is worked as Example ' + EXQ[q] + '.</a>' : ' <a href="#sets">See its practice set</a>.') + '</li></ul>'; }
      return '<p class="empty">Question ' + esc(q) + ' is not in this bank.</p>';
    }
    var al = has(ALIAS, q) ? ALIAS[q] : null, alHTML = '';
    if (al) {
      alHTML = typeof al === 'string' && has(CBY, al) ? '<li><a href="#' + al + '">Lesson: ' + esc(CBY[al].title) + '</a></li>' :
        [].concat(al).map(function (uid) { var u = U[uid]; return '<li><a href="#' + uid + '">' + u.num + ' ' + u.title + '</a> <span class="muted">· ' + esc(CBY[u.c].title) + '</span></li>'; }).join('');
      alHTML = '<p class="fine" style="margin-top:.6rem">“' + esc(q) + '” in this guide:</p><ul class="plainlist">' + alHTML + '</ul>';
    }
    var wb = new RegExp('(^|[^a-z0-9])' + reEsc(q) + '($|[^a-z0-9])');
    var skip = {};
    if (al && typeof al !== 'string') { al.forEach(function (uid) { skip[uid] = 1; }); }
    var hits = hay().map(function (h, i) { return { h: h, s: scoreOf(h, q, wb), i: i }; }).filter(function (x) { return x.s > 0 && !skip[x.h.uid]; });
    var tw = TRANS.filter(function (t) { return normQ(t.w) === q; })[0];
    if (tw) { alHTML += '<p class="fine" style="margin-top:.6rem">“' + esc(tw.w) + '” is a transition: right ' + tw.right + ' of the ' + tw.offered + ' times it is offered. <a href="#transitions">See it among the transitions</a></p>'; }
    hits.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
    var extra = extraHits(q);
    if (!hits.length && !alHTML) { return (extra || '<p class="empty">No grammar rule matches “' + esc(q) + '”. Try a shorter word, or a full eight-character question ID.</p>'); }
    return alHTML + (hits.length ? '<p class="fine" style="margin-top:.6rem">' + plural(hits.length, 'rule') + ' match' + (hits.length === 1 ? 'es' : '') + ', best first.</p><ul class="plainlist">' + hits.slice(0, 40).map(function (x) {
      var u = U[x.h.uid], c = CBY[u.c];
      return '<li><a href="#' + x.h.uid + '">' + u.num + ' ' + u.title + '</a> <span class="muted">· ' + esc(c.title) + '</span></li>';
    }).join('') + '</ul>' + (hits.length > 40 ? '<p class="fine">Showing the best 40.</p>' : '') : '') + extra;
  }
  /* the parts-of-speech primer and the terms it adds to the glossary (src/reading/grammar_basics.py) */
  function basicTerms() { return ((D.gbasics && D.gbasics.terms) || []).map(function (t) { return { term: esc(t[0]), def: t[1] }; }); }
  function posHTML() {
    var G = D.gbasics;
    if (!G) { return ''; }
    return '<div class="posbox" id="parts-of-speech"><h4 class="subh">Parts of speech in five minutes</h4>' +
      '<p class="pretty">The rules on this site name the pieces of a sentence: a subject, a tensed verb, a prepositional phrase, a coordinating conjunction. Every word in a sentence does one of eight jobs, and its job is its part of speech.</p>' +
      '<dl class="gloss posl">' + G.pos.map(function (p) {
        return '<div><dt>' + p[0].charAt(0).toUpperCase() + p[0].slice(1) + '</dt><dd class="gdef">' + p[1] + ' ' + p[2] + '<span class="posex">' + esc(p[3]) + '</span></dd></div>';
      }).join('') + '</dl>' +
      '<p class="pretty" style="margin-top:1rem"><b>What makes a sentence.</b> A subject, a noun or pronoun, with a tensed verb that belongs to it. Everything else attaches to that pair. When the pair is missing, or the only tensed verb sits inside a <em>because</em> or <em>which</em> clause, the words are a fragment, however long they are. <a href="#drill-frag">Practice telling them apart</a>.</p>' +
      '<h4 class="subh">Try it</h4><p class="pretty">Name each word’s part of speech in your head, then tap the word to check.</p>' +
      G.try.map(function (t) {
        return '<div class="posx"><p class="poss">' + t.words.map(function (w) {
          return '<button type="button" class="posw" aria-pressed="false"><span class="pw">' + esc(w[0]) + '</span><span class="pl">' + esc(w[1]) + '</span></button>';
        }).join('') + '</p><p class="fine posnote" hidden>' + t.note + '</p></div>';
      }).join('') +
      '<p class="row" style="margin-top:.9rem"><button type="button" class="btn sm ghost" id="posall">Show every answer</button></p></div>';
  }
  function posShow(b, on) {
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    var box = b.closest('.posx');
    if (box && !$('.posw[aria-pressed="false"]', box)) { $('.posnote', box).hidden = false; }
  }
  function glossHTML(q) {
    q = (q || '').trim().toLowerCase();
    var all = READ_GLOSS.map(function (g) { return { term: esc(g[0]), def: esc(g[1]), r: 1 }; }).concat(D.glossary, basicTerms());
    var list = all.filter(function (g) { return !q || plain(g.term + ' ' + g.def).toLowerCase().indexOf(q) !== -1; });
    if (!list.length) { return '<p class="empty">No term matches “' + esc(q) + '”.</p>'; }
    return list.map(function (g) { return '<div><dt>' + g.term + (g.r ? ' <span class="wn">reading</span>' : '') + '</dt><dd class="gdef">' + g.def + '</dd></div>'; }).join('');
  }
  function buildLookup() {
    if (built.lookup) { return; }
    built.lookup = true;
    viewEl.lookup.innerHTML = '<div class="wrap"><header class="read"><p class="eyebrow">Reading &amp; Writing · Look up a rule</p><h2 class="vtitle">Quick answers while you study</h2>' +
      '<p class="lede">Find the rule behind any question from its ID, check whether a linking word such as “however” is ever the right answer, see every verb form the choices use, and look up a word you do not know.</p>' +
      '<nav class="subnav" aria-label="On this page"><a class="ulink" href="#find">Find a rule or ID</a><a class="ulink" href="#transitions">Transitions</a><a class="ulink" href="#verbforms">Verb forms</a>' +
      '<a class="ulink" href="#parts-of-speech">Parts of speech</a><a class="ulink" href="#glossary">Glossary</a><a class="ulink" href="#nottested">Not tested</a><a class="ulink" href="#about">About this guide</a></nav></header>' +
      '<section class="lsec" id="find"><div class="sech"><h3 class="h2">Find a rule or a question ID</h3></div><label class="field" for="fq" style="display:block;margin-top:1rem"><span class="label">Search every grammar rule and version, or any of the ' + (TOTAL.q + RTOTAL).toLocaleString('en-US') + ' question IDs</span>' +
      '<input type="text" id="fq" inputmode="search" autocomplete="off" spellcheck="false" placeholder="for example, such as · semicolon · 7b950fc2"></label><div id="flist" aria-live="polite"></div></section>' +
      '<section class="lsec" id="transitions"><div class="sech"><h3 class="h2">Is this transition ever right?</h3><p class="pretty" style="margin-top:.4rem">' + D.trans.intro + '</p></div>' +
      '<div class="tsearch"><label class="field" for="tq"><span class="label">Find a transition</span><input type="text" id="tq" inputmode="search" autocomplete="off" spellcheck="false" placeholder="for example, nevertheless"></label>' +
      seg('tsort', 'Order', [['job', 'By job'], ['offered', 'Most offered']], 'job') + '</div><div id="tlist"></div></section>' +
      '<section class="lsec" id="verbforms"><div class="sech"><h3 class="h2">' + esc(D.verbs.formsTitle) + '</h3><p class="pretty" style="margin-top:.4rem">' + D.verbs.formsIntro + '</p></div>' + formsHTML() +
      (D.verbs.formsNote ? '<p class="fine" style="margin-top:.6rem">' + D.verbs.formsNote + '</p>' : '') + '</section>' +
      '<section class="lsec" id="glossary"><div class="sech"><h3 class="h2">Words used in this guide</h3></div>' + posHTML() +
      '<h4 class="subh">Every term</h4><label class="field" for="gq" style="display:block;margin-top:.6rem"><span class="label">Filter the terms</span>' +
      '<input type="text" id="gq" autocomplete="off" spellcheck="false" placeholder="for example, clause"></label><dl class="gloss" id="glist"></dl></section>' +
      '<section class="lsec" id="nottested"><div class="sech"><h3 class="h2">Not tested in this bank</h3><p class="pretty" style="margin-top:.4rem">' + D.absent.intro + '</p></div><ul class="plainlist">' + D.absent.items.map(li).join('') + '</ul>' + (D.absent.more || []).map(function (t) { return '<p class="pretty" style="margin-top:.8rem">' + t + '</p>'; }).join('') + '</section>' +
      '<section class="lsec" id="about"><div class="sech"><h3 class="h2">About this guide</h3></div><h4 class="subh">Grammar and transitions</h4><ul class="plainlist">' + D.method.map(li).join('') + '</ul>' +
      '<h4 class="subh">Reading</h4><p class="pretty"><a href="#measured">How the reading routine was measured, and its limits</a></p>' +
      (ANN.stats ? '<h4 class="subh">Short exercise cards</h4><p class="pretty">The Tag the sentence, Core first, Find the Point and Follow the pointer cards come from a sentence-by-sentence reading of ' + ANN.stats.units + ' passages and sentences from the two guides, plus 280 more reading passages drawn evenly across the bank’s jobs and difficulty levels. Claude annotated each one twice, blind, and a third pass settled differences. Cards where the two blind passes disagreed were left out, and the 17 worked examples keep the routine’s own tags. Answers in Practice are College Board’s own key from the question bank export.</p>' : '') +
      '<p class="fine" style="margin-top:1rem">' + CREDIT + '</p></section></div>';
    var fq = document.getElementById('fq'), tq = document.getElementById('tq'), gq = document.getElementById('gq');
    function tmode() { var r = $('input[name="tsort"]:checked', viewEl.lookup); return r ? r.value : 'job'; }
    function drawT() { document.getElementById('tlist').innerHTML = transHTML(tmode(), tq.value); }
    fq.addEventListener('input', function () { document.getElementById('flist').innerHTML = findHTML(fq.value); });
    tq.addEventListener('input', drawT);
    $$('input[name="tsort"]', viewEl.lookup).forEach(function (r) { r.addEventListener('change', drawT); });
    gq.addEventListener('input', function () { document.getElementById('glist').innerHTML = glossHTML(gq.value); });
    document.getElementById('flist').innerHTML = findHTML(fq.value);
    drawT();
    document.getElementById('glist').innerHTML = glossHTML(gq.value);
    $$('.posw', viewEl.lookup).forEach(function (b) { b.addEventListener('click', function () { posShow(b, b.getAttribute('aria-pressed') !== 'true'); }); });
    var pa = document.getElementById('posall');
    if (pa) { pa.addEventListener('click', function () { $$('.posw', viewEl.lookup).forEach(function (b) { posShow(b, true); }); }); }
  }
