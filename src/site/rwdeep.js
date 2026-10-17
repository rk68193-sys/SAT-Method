  /* =================== Reading and Writing: patterns found by reading every bank question =================== */
  var RWD = D.rwdeep || {};
  RWD.cards = RWD.cards || []; RWD.flow = RWD.flow || []; RWD.fix = RWD.fix || [];
  var RW_ORDER = ['Central Ideas and Details', 'Command of Evidence', 'Inferences', 'Words in Context', 'Text Structure and Purpose', 'Cross-Text Connections', 'Rhetorical Synthesis', 'Transitions', 'Boundaries', 'Form, Structure, and Sense'];
  var RW_SLUG = {};
  RW_ORDER.forEach(function (s) { RW_SLUG[s] = s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''); });
  var RBANK = {};
  (BANK.reading || []).forEach(function (b) { RBANK[b.id] = ['q', b]; });
  (BANK.notes || []).forEach(function (b) { RBANK[b.id] = ['n', b]; });
  (BANK.trans || []).forEach(function (b) { RBANK[b.id] = ['x', b]; });
  var RXBY = {};
  RLIST.forEach(function (x) { RXBY[x.qid] = x; });
  function rwLink(id) {
    if (RXBY[id]) { return '<a class="mq" href="#ex-' + RXBY[id].n + '">' + id + '</a>'; }
    if (RBANK[id]) { return '<a class="mq" href="#rq-' + id + '">' + id + '</a>'; }
    if (QI[id]) { return '<a class="mq" href="#i-' + id + '">' + id + '</a>'; }
    return '<span class="mq" title="A table or graph question: search this ID in College Board’s free question bank">' + id + '</span>';
  }
  function rwCard(c) {
    return '<article class="mtm">' +
      '<header class="mtm-h"><h4 class="mtm-name">' + esc(c.title) + '</h4>' + (c.skills && c.skills.length ? '<p class="mtm-meta">' + c.skills.map(esc).join(' · ') + '</p>' : '') + '</header>' +
      (c.rule ? '<p class="mtm-rule"><span class="mtag">Use it</span> ' + esc(c.rule) + '</p>' : '') +
      (c.detail ? '<p class="pretty">' + esc(c.detail) + '</p>' : '') +
      (c.numbers ? '<p class="fine">' + esc(c.numbers) + '</p>' : '') +
      (c.ids && c.ids.length ? '<p class="mtm-ex"><span class="label">See it in</span>' + c.ids.slice(0, 4).map(rwLink).join('') + '</p>' : '') +
      '</article>';
  }
  function rwFixList(list) {
    return '<ul class="mfix">' + list.map(function (f) {
      return '<li><p class="label">' + esc(f.skill || f.area || '') + '</p><p class="mfix-was">' + esc(f.was) + '</p><p class="mfix-is"><b>What the questions show:</b> ' + esc(f.now) + '</p>' +
        (f.ev ? '<p class="mfix-ev">' + esc(f.ev) + '</p>' : '') + (f.ids && f.ids.length ? '<p class="mtm-ex"><span class="label">Questions</span>' + f.ids.slice(0, 4).map(rwLink).join('') + '</p>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  function buildRPat() {
    if (built.rpat) { return; }
    built.rpat = true;
    var by = {};
    RWD.cards.forEach(function (c) { (by[c.skill] = by[c.skill] || []).push(c); });
    var skills = RW_ORDER.filter(function (s) { return by[s]; }).concat(Object.keys(by).filter(function (s) { return RW_ORDER.indexOf(s) === -1; }));
    viewEl.rpat.innerHTML = '<div class="wrap">' +
      '<header class="mhead"><p class="eyebrow">Reading and Writing · Patterns</p><h2 class="vtitle">What reading every question showed</h2>' +
      '<p class="lede">All ' + mfmt(1845) + ' Reading and Writing questions in College Board’s bank were read with their explanations, skill by skill, and every pattern below was then counted across the whole bank; patterns at chance level were dropped. Each one ends with real questions that show it.</p></header>' +
      '<div id="rp-one"></div>' +
      (RWD.flow.length ? '<section class="sec first"><h3 class="h2">Across every skill</h3><p class="lede">How SAT passages are built, where the answer sits, and how the wrong choices are made.</p><div class="mtml-in">' + RWD.flow.map(rwCard).join('') + '</div></section>' : '') +
      '<section class="sec"><h3 class="h2">Skill by skill</h3><p class="row"><button class="linkbtn" type="button" id="rp-all">Open all</button></p>' +
      skills.map(function (s) {
        return '<details class="mtml rpsk" id="rp-' + RW_SLUG[s] + '"><summary>' + esc(s) + ' <span class="muted">· ' + plural(by[s].length, 'pattern') + '</span></summary><div class="mtml-in">' + by[s].map(rwCard).join('') + '</div></details>';
      }).join('') + '</section>' +
      (RWD.fix.length ? '<section class="sec" id="rp-fix"><h3 class="h2">What earlier versions got wrong</h3><p class="lede">Claims this site (or the notes it was built from) used to make that the full bank does not support, and problems in College Board’s own data.</p>' + rwFixList(RWD.fix) + '</section>' : '') +
      '</div>';
    var all = $('#rp-all');
    if (all) { all.addEventListener('click', function () { $$('#v-rpat details').forEach(function (d) { d.open = true; }); }); }
  }
  /* one bank question by its id, from a link such as #rq-123bd312 */
  function rwOne(id) {
    buildRPat();
    var host = $('#rp-one'), e = RBANK[id];
    if (!host || !e) { return false; }
    var card = e[0] === 'q' ? QBCard(e[1], { meta: 'Question ' + id + ' · ' + esc(e[1].d || '') }) : BCard(e[1], e[0], { meta: 'Question ' + id + ' · ' + esc(e[1].d || '') });
    host.innerHTML = '<section class="sec first rp-one"><p class="row"><a class="linkbtn" href="#rpat">Back to the patterns</a></p></section>';
    $('.rp-one', host).appendChild(card.el);
    return true;
  }
