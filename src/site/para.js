  /* =================== Long passages: make them make sense =================== */
  // Mark exact substrings of a sentence (first match each, no overlaps), escaping the rest.
  function markIn(text, marks) {
    var spans = [];
    marks.forEach(function (m) {
      if (!m.s) { return; }
      var at = text.indexOf(m.s);
      if (at < 0) { return; }
      if (spans.some(function (x) { return at < x.b && at + m.s.length > x.a; })) { return; }
      spans.push({ a: at, b: at + m.s.length, open: m.open, close: m.close });
    });
    spans.sort(function (x, y) { return x.a - y.a; });
    var h = '', p = 0;
    spans.forEach(function (x) { h += esc(text.slice(p, x.a)) + x.open + esc(text.slice(x.a, x.b)) + x.close; p = x.b; });
    return h + esc(text.slice(p));
  }
  // a tag phrase such as "Point + Found" with each tag name shown as a chip
  var TAG_RE = /Old idea|Scene|Did|Found|Point|Happens|Feeling|Goal/g;
  function tagsInline(t) {
    var h = '', p = 0, m;
    TAG_RE.lastIndex = 0;
    while ((m = TAG_RE.exec(t))) { h += esc(t.slice(p, m.index)) + tagHTML(m[0]); p = m.index + m[0].length; }
    return '<span class="tagline">' + h + esc(t.slice(p)) + '</span>';
  }
  function chainHTML(tags) {
    return '<span class="chain">' + tags.map(tagHTML).join('<span class="arr" aria-hidden="true">→</span>') + '</span>';
  }
  function exLinkHTML(o) {
    return o.link ? '<a href="#' + o.link + '">' + esc(o.label) + '</a>' : esc(o.label || '');
  }
  function mapHTML(m, k) {
    var rows = m.sents.map(function (s) {
      var marks = [{ s: s.turn, open: '<mark class="turnw">', close: '</mark>' }, { s: s.pointer, open: '<mark class="ptr">', close: '</mark>' }];
      var to = s.pointer && s.pointsTo >= 0 ? '<span class="mto">“' + esc(s.pointer) + '” points back to sentence ' + (s.pointsTo + 1) + '</span>' : '';
      return '<li class="msent' + (s.i === m.point ? ' mpoint' : '') + '"><span class="mnum">' + (s.i + 1) + '</span><div><p class="mtext">' + markIn(s.text, marks) + '</p>' +
        '<p class="mnote">' + tagHTML(s.tag) + '<span class="mrole">' + esc(s.role) + '</span>' + to + '</p></div></li>';
    }).join('');
    return '<figure class="pmap" id="pmap-' + k + '"><figcaption class="mhead"><span class="label">' + exLinkHTML(m) + '</span>' +
      '<button type="button" class="btn sm ghost mtoggle" aria-pressed="false">Show the map</button></figcaption>' +
      '<p class="fine mhint">Read it once and tag each sentence in your head, then check against the map.</p>' +
      '<ol class="msents">' + rows + '</ol><p class="fine mcap">' + esc(m.caption) + '</p></figure>';
  }
  function countBar(k, n) {
    return '<span class="cbar"><span class="cfill" style="width:' + (n ? Math.round(100 * k / n) : 0) + '%"></span></span><span class="cnum2">' + k + ' of ' + n + '</span>';
  }
  function paraHTML() {
    var P = ANN.para;
    var head = '<header><p class="eyebrow">Reading · step 2</p><h2 class="vtitle">Long passages: make them make sense</h2>';
    if (!P) { return head + '<p class="lede">This page is still being built.</p></header>'; }
    var h = head + '<p class="lede">' + esc(P.lede) + '</p></header>';
    h += '<section class="sec" id="pmethod"><div class="sech"><h3 class="h2">Read a long passage in one pass</h3></div><ol class="olist psteps">' +
      P.method.map(function (m) { return '<li><b>' + esc(m.title) + '.</b> ' + esc(m.text) + '</li>'; }).join('') + '</ol></section>';
    var T = P.turn;
    h += '<section class="sec" id="pturn"><div class="sech"><h3 class="h2">Read through the turn</h3><p class="lede">' + esc(T.intro) + '</p></div><div class="ctable">' +
      T.rows.map(function (r) { return '<div class="crow"><a href="#' + r.href + '">' + esc(r.job) + '</a>' + countBar(r.k, r.n) + '</div>'; }).join('') +
      '</div><p class="fine" style="margin-top:.6rem">' + esc(T.note) + ' <a href="#turns">The turn words</a></p></section>';
    h += '<section class="sec" id="pshapes"><div class="sech"><h3 class="h2">The shapes passages take</h3><p class="lede">' + esc(P.shapesNote) + '</p></div><div class="pshapes">' +
      P.shapes.map(function (s) {
        return '<div class="pshape"><p class="psname"><b>' + esc(s.name) + '</b><span class="wn">' + plural(s.n, 'passage') + '</span></p>' + chainHTML(s.tags) +
          '<p>' + esc(s.expect) + '</p><p class="fine"><b>The Point:</b> ' + esc(s.point) + '</p>' +
          (s.text && s.text.length ? '<details class="ctx"><summary>A real one · ' + esc(s.label) + '</summary><div class="ctxbody"><p class="passage">' + s.text.map(esc).join(' ') + '</p></div></details>' : '') + '</div>';
      }).join('') + '</div></section>';
    h += '<section class="sec" id="pmap"><div class="sech"><h3 class="h2">Map a passage</h3><p class="lede">Each sentence gets a tag. <mark class="turnw">Turn words</mark> mark where the weight shifts, and <mark class="ptr">pointers</mark> reach back to an earlier sentence. The Point is boxed.</p></div>' +
      P.maps.map(mapHTML).join('') + '</section>';
    var A = P.answerMap;
    h += '<section class="sec" id="panswer"><div class="sech"><h3 class="h2">Where the answer rests, by job</h3><p class="lede">' + esc(A.intro) + '</p></div><dl class="saylist">' +
      A.rows.map(function (r) { return '<div><dt><a href="#' + r.href + '">' + esc(r.job) + '</a> <span class="wn">' + r.n + '</span></dt><dd>' + esc(r.where) + '</dd></div>'; }).join('') +
      '</dl><p class="pretty" style="margin-top:.8rem"><b>' + esc(A.takeaway) + '</b></p></section>';
    h += '<section class="sec" id="ppointers"><div class="sech"><h3 class="h2">Follow the pointers</h3><p class="lede">' + esc(P.pointers.intro) + '</p></div><ul class="plainlist">' +
      P.pointers.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      ((ANN.pointer || []).length ? '<p class="row" style="margin-top:.9rem"><a class="btn sm" href="#drills" data-drill="pointer">Drill: Follow the pointer</a></p>' : '') + '</section>';
    var L = P.longs, LB = L.bank;
    h += '<section class="sec" id="plongs"><div class="sech"><h3 class="h2">Long sentences: where the weight sits</h3><p class="lede">' + esc(LB.intro) + '</p></div>' +
      '<div class="ctable">' + LB.rows.map(function (r) {
        return '<div class="crow two"><span>' + esc(r.name) + '</span><span class="cpair"><span class="cl">25+ words</span>' + countBar(r.long, LB.nLong) + '<span class="cl">under 25</span>' + countBar(r.short, LB.nShort) + '</span></div>';
      }).join('') + '</div>' +
      '<h4 class="subh">Inside a long sentence</h4><p class="fine">From ' + P.nLong + ' long sentences cut into pieces by hand in the first sample.</p><ul class="plainlist">' + L.facts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
      '<h4 class="subh">Read a long sentence in this order</h4><ol class="olist">' + L.order.map(function (o) { return '<li>' + esc(o.replace(/^\d+\.\s*/, '')) + '</li>'; }).join('') + '</ol>' +
      '<p class="row" style="margin-top:.9rem"><a class="btn sm" href="#drills" data-drill="core">Drill: Core first</a><a class="btn sm ghost" href="#long">Seven sentences taken apart</a></p></section>';
    var TR = P.traps;
    h += '<section class="sec" id="ptraps"><div class="sech"><h3 class="h2">How the wrong choices fail, by job</h3><p class="lede">' + esc(TR.intro) + '</p></div><div class="ctable">' +
      TR.rows.map(function (r) {
        return '<div class="crow two"><a href="#' + r.href + '">' + esc(r.job) + '</a><span class="cpair">' + r.kinds.map(function (k) { return '<span class="cl">' + esc(k[0]) + '</span>' + countBar(k[1], r.n); }).join('') + '</span></div>';
      }).join('') + '</div><ul class="plainlist" style="margin-top:.8rem">' + TR.defense.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></section>';
    h += '<section class="sec" id="pmyths"><div class="sech"><h3 class="h2">Shortcuts the full bank rules out</h3><p class="lede">Checked against College Board’s answer key. More in <a href="#myths">Shortcuts that do not work</a>.</p></div><ul class="plainlist">' +
      P.myths.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></section>';
    h += '<p class="fine" style="margin-top:2rem">' + esc(P.caveat) + '</p>';
    h += '<div class="nextlinks"><a class="btn" href="#say">Step 3: Say</a><a class="btn ghost" href="#drills" data-drill="point">Drill: Find the Point</a><a class="btn ghost" href="#drills" data-drill="tag">Drill: Tag the sentence</a></div>';
    return h;
  }
  function wirePara(host) {
    $$('.mtoggle', host).forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.closest('.pmap'), on = !f.classList.contains('mapped');
        f.classList.toggle('mapped', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.textContent = on ? 'Hide the map' : 'Show the map';
      });
    });
  }
  /* =================== Notes questions: goal first =================== */
  function notesHTML() {
    var P = ANN.notesPage, B = (D.bank && D.bank.notes) || [];
    var h = '<header><p class="eyebrow">Reading · more question types</p><h2 class="vtitle">Notes questions: goal first</h2>';
    if (!P) { return h + '<p class="lede">This page is still being built.</p></header>'; }
    h += '<p class="lede">' + esc(P.lede) + '</p></header>';
    h += '<section class="sec" id="nsteps"><div class="sech"><h3 class="h2">' + esc(P.stepsTitle) + '</h3></div><ol class="olist">' +
      P.steps.map(function (s) { return '<li><b>' + esc(s.title) + '.</b> ' + esc(s.text) + '</li>'; }).join('') + '</ol></section>';
    h += '<section class="sec" id="ngoals"><div class="sech"><h3 class="h2">What each goal asks for</h3><p class="lede">' + esc(P.goalsIntro) + '</p></div><dl class="saylist">' +
      P.goals.map(function (g) { return '<div><dt>' + esc(g.goal) + ' <span class="wn">' + g.n + '</span></dt><dd>' + esc(g.right) + (g.trap ? ' <span class="fine"><b>Trap:</b> ' + esc(g.trap) + '</span>' : '') + '</dd></div>'; }).join('') + '</dl></section>';
    h += '<section class="sec" id="ntraps"><div class="sech"><h3 class="h2">How the wrong choices are built</h3></div><ul class="plainlist">' +
      P.traps.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></section>';
    h += '<p class="fine" style="margin-top:2rem">' + esc(P.caveat) + '</p>';
    h += '<div class="nextlinks"><a class="btn" href="#drills" data-drill="notes">Drill: Notes, goal first (' + B.length + ')</a><a class="btn ghost" href="#practice">Practice all ' + B.length + ' against the clock</a></div>';
    return h;
  }
  function wireNotes() {}
