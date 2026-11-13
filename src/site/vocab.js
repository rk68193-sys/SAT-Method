  /* =================== Reading: words to know =================== */
  /* D.vocab (src/reading/vocab.py): every choice in the bank's fill-in Words in Context questions with a plain definition and
     its charge, the positive-or-negative check measured on those questions, the 40 "most nearly mean" questions, and the words
     that Purpose or structure, Main idea and Two texts choices use. */
  var VOC = D.vocab || { words: [], stats: {}, negLook: [], second: [], func: [], funcStats: {} };
  var VOCBY = {};
  VOC.words.forEach(function (w) { VOCBY[w[0]] = w; });
  var vocState = { q: '', show: 'all' };
  function vocChg(c) { return c === 'p' ? '<span class="vchg p" title="favorable">+</span>' : c === 'n' ? '<span class="vchg n" title="unfavorable">−</span>' : ''; }
  /* the questions you missed and marked "Did not know a word" */
  function vocMine() {
    var ids = {};
    rwItems().forEach(function (it) { var r = result(it); if (r && r.cause === 'vocab') { ids[it.id] = 1; } });
    return ids;
  }
  function vocRow(w) {
    var qs = w[5].map(function (id) { return '<a class="vq" href="#rq-' + id + '" title="Practice question ' + id + '">' + id + '</a>'; }).join('');
    return '<div class="vrow"><dt><b>' + esc(w[0]) + '</b>' + vocChg(w[2]) + (w[6] ? '<span class="vform">as “' + w[6].map(esc).join('”, “') + '”</span>' : '') + '</dt>' +
      '<dd><p>' + esc(w[1]) + '</p><p class="vmeta">' + (w[3] > 1 ? 'Offered ' + w[3] + ' times' : 'Offered once') + (w[4] ? ' · <b>right ' + (w[4] > 1 ? w[4] + ' times' : 'once') + '</b>' : '') + ' · ' + qs + '</p></dd></div>';
  }
  function vocList() {
    var q = vocState.q.trim().toLowerCase(), mine = vocState.show === 'mine' ? vocMine() : null;
    var list = VOC.words.filter(function (w) {
      if (vocState.show === 'right' && !w[4]) { return false; }
      if (vocState.show === 'twice' && w[3] < 2) { return false; }
      if (mine && !w[5].some(function (id) { return mine[id]; })) { return false; }
      return !q || w[0].toLowerCase().indexOf(q) !== -1 || w[1].toLowerCase().indexOf(q) !== -1;
    });
    var head = '<p class="fine" role="status">' + plural(list.length, 'word') + (list.length !== VOC.words.length ? ' of ' + VOC.words.length : '') + '</p>';
    if (mine && !list.length) {
      return head + '<p class="empty">No words yet. After a miss in Practice, choose “Did not know a word” under “What caused the difficulty?”. The choices of those Words in Context questions then show here. For a Purpose or structure question, look up its words in <a href="#vocab-func">the list below</a>.</p>';
    }
    return head + (list.length ? '<dl class="wordlist">' + list.map(vocRow).join('') + '</dl>' : '<p class="empty">No word matches “' + esc(q) + '”.</p>');
  }
  function vocSecondRow(x) {
    var other = x.other.map(function (k) { return esc(x.ch[k]); }).join(', ');
    return '<tr><th scope="row"><b>' + esc(x.w) + '</b><span class="vq2">' + x.id + ' · ' + x.d + '</span></th><td>' + esc(x.ch[x.k]) + '</td><td>' + esc(x.first) + '</td><td>' + (other || '<span class="muted">none</span>') + '</td></tr>';
  }
  function vocFuncRow(f) {
    return '<tr><th scope="row"><b>' + esc(f[0]) + '</b>' + (f[2] === 'p' ? '<span class="vpos">takes a position</span>' : '') + '</th><td>' + esc(f[1]) + '</td><td class="num">' + f[3] + '</td><td class="num">' + f[4] + '</td></tr>';
  }
  function vocabHTML() {
    var S = VOC.stats, F = VOC.funcStats;
    var neg = VOC.negLook.map(function (h) { var w = VOCBY[h]; return '<li><b>' + esc(h) + '</b>: ' + esc(w[1]) + (w[4] ? ' <span class="wn">right answer in the bank</span>' : '') + '</li>'; }).join('');
    var sec = VOC.second.filter(function (x) { return x.sec; }).length, oth = VOC.second.filter(function (x) { return x.other.length; }).length;
    var funcs = VOC.func.slice().sort(function (a, b) { return b[3] - a[3] || (a[0] < b[0] ? -1 : 1); });
    return '<header><p class="eyebrow">Reading · words</p><h2 class="vtitle">Words to know</h2>' +
      '<p class="lede">Words in Context is the biggest reading job: 261 of the 1,845 Reading and Writing questions. <a href="#o-word">The method</a> tells you how to use the sentence. This page gives you the words: what the choices mean, which of them are judgments, and the second meanings the test likes to ask about.</p></header>' +
      '<section class="sec first" id="vocab-why"><div class="sech"><h3 class="h2">Learn the words, not the old answers</h3></div>' +
      '<p class="pretty">Across the ' + S.fill + ' fill-in questions, ' + plural(S.heads, 'different word or phrase', 'different words and phrases') + ' are offered as choices. Only ' + S.rightTwice.length + ' of them are the right answer more than once (' + S.rightTwice.map(function (w) { return '<em>' + esc(w) + '</em>'; }).join(', ') + ', twice each), and only ' + S.offeredTwice + ' are offered more than once at all. A list of past answers will almost never come up again. What does carry over is the kind of word: the formal vocabulary that research summaries and essays are written in, such as <em>corroborate</em>, <em>buttress</em>, <em>concede</em>, <em>contingent on</em>, <em>discern</em> and <em>disparate</em>.</p>' +
      '<ul class="plainlist"><li><b>Read through the list once</b> and mark every word you could not define. Those are your words.</li><li><b>Learn them in the sentence.</b> Each word links to the questions that offered it; open one and see the word doing its job.</li><li><b>Drill them.</b> <a href="#drills" data-drill="wmean">Word meanings</a> shows a word and four definitions. <a href="#drills" data-drill="wsecond">Second meanings</a> shows a word in its sentence.</li></ul></section>' +
      '<section class="sec" id="vocab-check"><div class="sech"><h3 class="h2">Can’t predict the word? Decide plus or minus</h3></div>' +
      '<p class="pretty">Sometimes you know what the sentence is doing but no word comes to mind. Ask a smaller question: does the blank call for a favorable word or an unfavorable one? Is the writer praising, or finding fault? Is the result good, or bad? Then cross off every choice that points the other way and choose among the rest.</p>' +
      '<p class="pretty"><b>What it is worth, measured on the bank.</b> Every choice in the word list below is marked + (favorable), − (unfavorable) or left unmarked (neither). In ' + S.charged + ' of the ' + S.fill + ' fill-in questions the right word carries a clear + or −. In ' + S.removable + ' of those ' + S.charged + ', at least one choice has the opposite sign, so this check removes one or two choices (' + S.removed + ' in all). In the other ' + S.neutral + ' questions the right word is neither, a word such as <em>categorize</em>, <em>comprises</em> or <em>spans</em>, and the check decides nothing.</p>' +
      '<p class="pretty"><b>So:</b> use it when the sentence plainly praises or criticizes, as a way to narrow the choices, and then still read the survivors in the sentence. When the sentence is a plain description of a method, a finding or a sequence, go back to its logic instead.</p>' +
      '<h4 class="subh">Words that look negative but are not</h4><p class="pretty">A prefix such as <em>in-</em>, <em>un-</em> or <em>dis-</em> does not make a word unfavorable. These all appear among the choices, and several are right answers:</p><ul class="plainlist vneg">' + neg + '</ul>' +
      '<p class="fine">The + and − marks were assigned by hand for this site, word by word; a few words could reasonably go either way.</p></section>' +
      '<section class="sec" id="vocab-second"><div class="sech"><h3 class="h2">Second meanings</h3></div>' +
      '<p class="pretty">' + VOC.second.length + ' of the Words in Context questions ask what a word “most nearly means” as it is used. These are usually ordinary words. The catch is that the passage uses one of their other senses: <em>reserve</em> as holding back, <em>answers</em> as meets a need, <em>contracted</em> as came to have.</p>' +
      '<ol class="olist"><li><b>Cover the word</b> and read its sentence. Put in a plain word of your own that fits.</li><li><b>Choose the choice closest to your word</b>, then put it back in the sentence to check.</li><li><b>Expect a trap that is a real meaning.</b> By this site’s reading, ' + oth + ' of the ' + VOC.second.length + ' questions offer at least one wrong choice that is a genuine meaning of the word, just not the one this sentence uses; and in ' + sec + ' of the ' + VOC.second.length + ' the right answer is not the sense most people would give the word on its own.</li></ol>' +
      '<div class="tablewrap"><table class="dtab vsec"><thead><tr><th scope="col">Word and question</th><th scope="col">Meaning in the passage</th><th scope="col">Its everyday meaning</th><th scope="col">Wrong choices that are other real meanings</th></tr></thead><tbody>' + VOC.second.map(vocSecondRow).join('') + '</tbody></table></div>' +
      '<p class="row" style="margin-top:.8rem"><a class="btn sm" href="#drills" data-drill="wsecond">Drill: Second meanings</a></p></section>' +
      '<section class="sec" id="vocab-list"><div class="sech"><h3 class="h2">The word list</h3><p class="lede">Every choice in the ' + S.fill + ' fill-in questions, with a plain definition. ' + S.rightHeads + ' of them are a right answer somewhere. Each entry links to the questions that offered it.</p></div>' +
      '<div class="vtools"><label class="field" for="vq"><span class="label">Find a word</span><input type="text" id="vq" autocomplete="off" spellcheck="false" placeholder="for example, mitigate" value="' + esc(vocState.q) + '"></label>' +
      seg('vshow', 'Show', [['all', 'All'], ['right', 'Right answers'], ['twice', 'Offered twice or more'], ['mine', 'From my misses']], vocState.show) + '</div>' +
      '<div id="vout" aria-live="polite">' + vocList() + '</div></section>' +
      '<section class="sec" id="vocab-func"><div class="sech"><h3 class="h2">Words in Purpose and structure choices</h3></div>' +
      '<p class="pretty">Purpose, structure, main idea and two-text choices describe what a text does with one verb: it <em>acknowledges</em>, <em>concedes</em>, <em>speculates</em>, <em>refutes</em>. If you are unsure what the verb means, you cannot check the choice. This glossary covers the ' + VOC.func.length + ' such words that the ' + F.q + ' questions use (' + F.choices.toLocaleString('en-US') + ' choices), with how often each appears in a choice and how often that choice is the right one.</p>' +
      '<p class="pretty"><b>The verb alone never picks the answer.</b> Choices with a word that takes a position (<em>argues</em>, <em>refutes</em>, <em>dismisses</em>, <em>criticizes</em> and the others marked below) are right ' + pct(F.strongR, F.strongN) + '% of the time (' + F.strongR + ' of ' + F.strongN + '); all other choices ' + pct(F.plainR, F.plainN) + '% (' + F.plainR + ' of ' + F.plainN + '), against 25% by chance. That is too small a gap to choose by. What a strong verb does tell you is what to check: a choice that says the text <em>refutes</em> a view needs a text that shows the view is wrong, not one that only doubts it. And the plainest verbs, <em>describes</em> and <em>presents</em>, open right and wrong choices alike.</p>' +
      '<div class="tablewrap"><table class="dtab vfunc"><thead><tr><th scope="col">Word</th><th scope="col">The choice says the text…</th><th scope="col" class="num">In choices</th><th scope="col" class="num">Right</th></tr></thead><tbody>' + funcs.map(vocFuncRow).join('') + '</tbody></table></div>' +
      '<p class="fine">Counted in any form (<em>argue</em>, <em>argues</em>, <em>arguing</em>) across the choices of the Purpose or structure, Main idea and Two texts questions whose choices the site stores. The definitions were written for this site.</p></section>' +
      '<div class="nextlinks"><a class="btn" href="#drills" data-drill="wmean">Drill: Word meanings</a><a class="btn ghost" href="#drills" data-drill="wsecond">Drill: Second meanings</a><a class="btn ghost" href="#rw-map-rs1-0">Practice the fill-in word questions</a></div>';
  }
  function vocDraw(host) { var o = $('#vout', host || document); if (o) { o.innerHTML = vocList(); } }
  function wireVocab(host) {
    var q = $('#vq', host);
    q.addEventListener('input', function () { vocState.q = q.value; vocDraw(host); });
    $$('input[name="vshow"]', host).forEach(function (r) { r.addEventListener('change', function () { vocState.show = r.value; vocDraw(host); }); });
  }
  function vocFind(word) {
    vocState.show = 'all'; vocState.q = word;
    var host = readingView.page(), r = $('#vshow-all', host), q = $('#vq', host);
    if (r) { r.checked = true; }
    if (q) { q.value = word; }
    vocDraw(host);
  }
  /* "#vocab-mine": the word list, showing the words from the questions you missed for want of a word */
  function vocShowMine() {
    vocState.show = 'mine'; vocState.q = '';
    var host = readingView.page(), r = $('#vshow-mine', host), q = $('#vq', host);
    if (r) { r.checked = true; }
    if (q) { q.value = ''; }
    vocDraw(host);
  }
