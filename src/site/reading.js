  /* =================== Reading =================== */
  var TAGCLS = { 'Scene': 't-scene', 'Old idea': 't-old', 'Did': 't-did', 'Found': 't-found', 'Point': 't-point', 'Happens': 't-happens', 'Feeling': 't-feeling', 'Goal': 't-point', 'n/a': 't-scene' };
  function tagHTML(t) { return '<span class="tag ' + (TAGCLS[t] || '') + '">' + esc(t) + '</span>'; }
  function splitMix(meta) {
    var m = { Easy: 0, Medium: 0, Hard: 0 };
    String(meta).replace(/(Easy|Medium|Hard)\s+(\d+)/g, function (_, k, n) { m[k] = Number(n); return _; });
    return m;
  }
  function tableHTML(t, cls) {
    if (!t) { return ''; }
    return '<div class="tablewrap"><table class="' + (cls || '') + '">' + (t.caption ? '<caption>' + esc(t.caption) + '</caption>' : '') +
      (t.head && t.head.length ? '<thead><tr>' + t.head.map(function (h) { return '<th scope="col">' + h + '</th>'; }).join('') + '</tr></thead>' : '') +
      '<tbody>' + t.rows.map(function (r) {
        return '<tr>' + r.map(function (c, i) { return i === 0 ? '<th scope="row">' + c + '</th>' : '<td>' + c + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  function blocksHTML(sec) {
    if (!sec) { return ''; }
    return sec.blocks.map(function (b) {
      if (b.p != null) { return '<p class="' + (/tfoot/.test(b.cls) ? 'fine' : 'pretty') + '">' + b.p + '</p>'; }
      if (b.list) { return '<' + (b.ordered ? 'ol class="olist"' : 'ul class="plainlist"') + '>' + b.list.map(li).join('') + '</' + (b.ordered ? 'ol' : 'ul') + '>'; }
      if (b.table) { return tableHTML(b.table, 'dtab'); }
      if (b.tagset) {
        return '<div class="tagset"><p class="label">' + esc(b.tagset.title) + '</p><dl>' + b.tagset.rows.map(function (r) {
          return '<div><dt>' + (TAGCLS[r.tag] ? tagHTML(r.tag) : '<b>' + esc(r.tag) + '</b>') + '</dt><dd>' + r.def + '</dd></div>';
        }).join('') + '</dl></div>';
      }
      return '';
    }).join('');
  }
  function hbar(label, value, max, shown, extra) {
    return '<div class="hbarrow"><span class="hl">' + label + '</span><span class="ht"><i style="width:' + (100 * value / max).toFixed(1) + '%"></i></span><span class="hv">' + shown + '</span>' + (extra || '') + '</div>';
  }

  /* ---------- pages ---------- */
  function rRoutineHTML() {
    return '<header><p class="eyebrow">Reading · the plan</p><h2 class="vtitle">Four steps, in this order, on every question</h2>' +
      '<p class="lede">The passages are short and the sentences are long. So the routine works one sentence at a time, and it is the same four steps on every reading question.</p></header>' +
      '<div class="gintro"><figure class="dial sm">' + dialSVG(READING_DIAL) + '<figcaption><ol class="dlegend">' +
      '<li><i class="sw-look"></i><span><b>0–5 sec · Job</b>Read the question first.</span></li>' +
      '<li><i class="sw-check"></i><span><b>5–40 sec · Chunk</b>One sentence at a time: tag it, say it.</span></li>' +
      '<li><i class="sw-say"></i><span><b>40–50 sec · Say</b>Your own answer before the choices.</span></li>' +
      '<li><i class="sw-confirm"></i><span><b>50–70 sec · Check</b>Every piece of a choice needs a line.</span></li></ol></figcaption></figure></div>' +
      '<ol class="rsteps">' + RD.steps.map(function (s) {
        return '<li><span class="snum">' + s.n + '</span><div><h3 class="sname">' + esc(s.name) + '</h3><p class="sdo">' + s.do + '</p><p class="swhy">' + s.why + '</p></div><span class="stime">' + esc(s.time) + '</span></li>';
      }).join('') + '</ol>' +
      '<div class="after">' + RD.routineAfter.map(function (p) { return '<p class="pretty">' + p + '</p>'; }).join('') + '</div>' +
      '<div class="nextlinks"><a class="btn" href="#job">Step 1: Job</a><a class="btn ghost" href="#ex-1">Watch it on a real question</a></div>';
  }
  function rShapeHTML() {
    var S = RD.shape, fig = S.fig;
    var bullets = S.bullets;
    var panels = fig.panels.map(function (p) {
      var max = Math.max.apply(null, p.rows.map(function (r) { return parseFloat(r.v) || 0; }));
      var isShare = /share/i.test(p.unit);
      return '<div class="panel"><p class="ptitle">' + esc(p.caption) + '<span>' + esc(p.unit) + '</span></p>' + p.rows.map(function (r) {
        var v = parseFloat(r.v) || 0;
        return hbar(esc(r.k), v, isShare ? 100 : max, esc(r.v));
      }).join('') + '</div>';
    }).join('');
    return '<header><p class="eyebrow">Reading · why it fits</p><h2 class="vtitle">What the passages are really like</h2><p class="lede">' + S.intro + '</p></header>' +
      '<ul class="plainlist">' + bullets.slice(0, 3).map(li).join('') + '</ul>' +
      '<figure class="fig"><figcaption><p class="figtitle">' + esc(fig.title) + '</p><p class="fine">' + fig.cap + '</p></figcaption><div class="panels">' + panels + '</div></figure>' +
      '<ul class="plainlist">' + bullets.slice(3).map(li).join('') + '</ul>';
  }
  function rJobHTML() {
    return '<header><p class="eyebrow">Reading · step 1</p><h2 class="vtitle">Job: read the question first</h2>' + RD.jobIntro.map(function (p) { return '<p class="lede">' + p + '</p>'; }).join('') + '</header>' +
      '<p class="fine" style="margin-top:.8rem">The bar under each count is the difficulty mix. ' + MIXKEY + '</p>' +
      '<ol class="jobs">' + RD.jobs.map(function (j) {
        var mix = splitMix(j.meta);
        var n = (j.meta.match(/^(\d+)/) || [0, ''])[1];
        var worked = j.worked.map(function (t) { return '<a class="ulink" href="#' + t + '">Example ' + t.replace('ex-', '') + '</a>'; }).join('');
        return '<li class="job' + (j.divide ? ' divide' : '') + '" id="' + j.id + '"><div><h3 class="jname">' + esc(j.name) + '</h3><p class="jmeta">' + n + ' questions</p>' + mixHTML(mix) + '</div>' +
          '<div class="jbody"><p class="label">The question says</p><ul class="says">' + j.says.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
          '<p class="label">Look first at</p><p>' + j.look + '</p>' + (worked ? '<p class="label">Worked examples</p><p>' + worked + '</p>' : '') + '</div></li>';
      }).join('') + '</ol>' +
      '<section class="sec" id="leadin"><div class="sech"><h3 class="h2">' + esc(RD.leadin.title) + '</h3></div>' + '<p class="pretty" style="margin-top:.6rem">' + RD.leadin.blocks[0].p + '</p>' +
      '<div class="cues">' + RD.cues.map(function (c) {
        return '<div class="cue"><p class="cn2">' + c.n + '</p><div><p><b>' + c.kind + '</b></p>' + (c.cues ? '<p class="bqline">' + c.cues + '</p>' : '') + (c.blank ? '<p class="muted">So the blank is: ' + c.blank + '</p>' : '') + '</div></div>';
      }).join('') + '</div></section>' +
      '<div class="nextlinks"><a class="btn" href="#chunk">Step 2: Chunk</a><a class="btn ghost" href="#drills" data-drill="job">Drill: Name the job</a></div>';
  }
  function rChunkHTML() {
    return '<header><p class="eyebrow">Reading · step 2</p><h2 class="vtitle">Chunk: one sentence at a time</h2></header>' +
      '<section id="tags" class="sec first"><div class="sech"><h3 class="h2">' + esc(RD.tags.title) + '</h3></div>' + blocksHTML(RD.tags) + '</section>' +
      '<section id="turns" class="sec"><div class="sech"><h3 class="h2">' + esc(RD.turns.title) + '</h3></div>' + '<p class="pretty">' + RD.turns.blocks[0].p + '</p>' +
      '<div class="hbars">' + RD.turnShares.map(function (r) {
        var m = /(\d+)%\s*\((\d+) of (\d+)\)/.exec(r[1]) || [0, 0, 0, 0];
        return hbar(esc(r[0]), Number(m[1]), 100, esc(r[1]));
      }).join('') + '</div>' + (RD.turnNote ? '<p class="fine">' + RD.turnNote + '</p>' : '') + blocksHTML({ blocks: RD.turns.blocks.slice(1).filter(function (b) { return !b.table; }) }) + '</section>' +
      '<section id="names" class="sec"><div class="sech"><h3 class="h2">' + esc(RD.names.title) + '</h3></div>' + blocksHTML(RD.names) + '</section>' +
      '<div class="nextlinks"><a class="btn" href="#long">Long sentences: core first</a><a class="btn ghost" href="#drills" data-drill="tag">Drill: Tag the sentence</a></div>';
  }
  function apartHTML(a, i) {
    return '<figure class="apart" id="' + a.id + '"><figcaption class="aphead"><span class="aptitle">' + esc(a.title) + '</span><span class="apmeta">' + esc(a.meta) + '</span></figcaption>' +
      '<ol class="pieces">' + a.pieces.map(function (p) {
        return '<li class="piece' + (p.core ? ' core' : ' extra') + '"><span class="plab">' + esc(p.lab) + '</span><span class="ptext">' + esc(p.text) + '</span></li>';
      }).join('') + '</ol><p class="coreplain">' + a.core + '</p><p class="apnote">' + a.note + '</p></figure>';
  }
  function rLongHTML() {
    var L = RD.long;
    var att = RD.attachments;
    return '<header><p class="eyebrow">Reading · step 2</p><h2 class="vtitle">' + esc(L.title) + '</h2><p class="lede">' + L.blocks[0].p + '</p></header>' +
      '<figure class="fig"><figcaption><p class="figtitle">What gets attached to a long sentence</p><p class="fine">Share of sentences carrying each attachment: 40 words or more against under 25 words.</p></figcaption>' +
      '<div class="attrows">' + att.map(function (a) {
        return '<div class="attrow"><div class="al"><b>' + a.label + '</b><span>' + a.spot + '</span></div><div class="ab">' +
          hbar('40+ words', a.long, 100, a.long + '%') + hbar('Under 25', a.short, 100, a.short + '%', '') + '</div></div>';
      }).join('') + '</div><p class="fine">' + L.blocks.filter(function (b) { return /tfoot/.test(b.cls); }).map(function (b) { return b.p; }).join(' ') + '</p></figure>' +
      blocksHTML({ blocks: L.blocks.slice(1).filter(function (b) { return !b.table && !/tfoot/.test(b.cls); }) }) +
      '<section id="apart" class="sec"><div class="sech"><h3 class="h2">Seven sentences taken apart</h3><p class="lede">Seven long sentences from the bank, cut where their pieces join. Read down the core rows first; six of them come from the worked examples.</p></div>' +
      '<p class="row" style="margin-top:.9rem"><button type="button" class="btn ghost sm" id="coreonly" aria-pressed="false">Show the core only</button></p>' +
      '<div id="aparts">' + RD.aparts.map(apartHTML).join('') + '</div></section>' +
      '<div class="nextlinks"><a class="btn" href="#para">Long passages: make them make sense</a><a class="btn ghost" href="#drills" data-drill="core">Drill: Core first</a></div>';
  }
  function wireLong(host) {
    var b = $('#coreonly', host);
    if (!b) { return; }
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? 'Show every piece' : 'Show the core only';
      $('#aparts', host).classList.toggle('coreonly', on);
    });
  }
  function rSayHTML() {
    var t = RD.say.table;
    return '<header><p class="eyebrow">Reading · step 3</p><h2 class="vtitle">Say: your own answer first</h2>' + RD.say.intro.map(function (p) { return '<p class="lede">' + p + '</p>'; }).join('') + '</header>' +
      '<dl class="saylist">' + t.rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="nextlinks"><a class="btn" href="#check">Step 4: Check</a></div>';
  }
  function rCheckHTML() {
    var fig = RD.trapsFig;
    var intro = RD.checkBlocks.map(function (b) { return b.list ? '<ol class="olist">' + b.list.map(li).join('') + '</ol>' : '<p class="lede">' + b.p + '</p>'; }).join('');
    return '<header><p class="eyebrow">Reading · step 4</p><h2 class="vtitle">Check: every piece needs a line</h2></header>' + intro +
      '<section id="traps" class="sec"><div class="sech"><h3 class="h2">' + esc(RD.traps.title) + '</h3></div>' + blocksHTML({ blocks: RD.traps.blocks.filter(function (b) { return b.tagset; }) }) +
      '<figure class="fig"><figcaption><p class="figtitle">' + esc(fig.title) + '</p><p class="fine">' + esc(fig.cap) + '</p></figcaption><div class="panels">' + fig.panels.map(function (p) {
        return '<div class="panel"><p class="ptitle">' + esc(p.job) + '<span>' + esc(p.unit) + '</span></p>' + p.rows.map(function (r) {
          return hbar(esc(r.kind) + (r.sub ? '<small>' + esc(r.sub) + '</small>' : ''), r.pct, 100, r.pct + '%', '<span class="hn">' + r.n + '</span>');
        }).join('') + '</div>';
      }).join('') + '</div></figure>' + blocksHTML({ blocks: RD.traps.blocks.filter(function (b) { return !b.tagset; }) }) + '</section>' +
      '<section id="partly" class="sec"><div class="sech"><h3 class="h2">' + esc(RD.partly.title) + '</h3></div>' + blocksHTML(RD.partly) + '</section>' +
      '<section id="myths" class="sec"><div class="sech"><h3 class="h2">' + esc(RD.myths.title) + '</h3></div>' + blocksHTML(RD.myths) + '</section>' +
      '<div class="nextlinks"><a class="btn" href="#others">The other question types</a><a class="btn ghost" href="#drills" data-drill="why">Drill: Why is it wrong?</a></div>';
  }
  function rOthersHTML() {
    return '<header><p class="eyebrow">Reading · beyond Information and Ideas</p><h2 class="vtitle">The other reading questions</h2>' + RD.othersIntro.map(function (p) { return '<p class="lede">' + p + '</p>'; }).join('') + '</header>' +
      RD.others.map(function (o) {
        return '<section class="sec" id="' + o.id + '"><div class="sech"><h3 class="h2">' + esc(o.title) + '</h3><p class="lmeta">' + o.meta + '</p></div>' + o.paras.map(function (p) { return '<p class="pretty">' + p + '</p>'; }).join('') + (o.items && o.items.length ? '<ul class="plainlist">' + o.items.map(li).join('') + '</ul>' : '') + '</section>';
      }).join('') +
      '<section class="sec" id="train"><div class="sech"><h3 class="h2">How to train it</h3>' + RD.train.intro.map(function (p) { return '<p class="lede">' + p + '</p>'; }).join('') + '</div><ol class="olist drills">' + RD.train.drills.map(li).join('') + '</ol>' +
      '<p class="fine">The Drills tab has timed versions of the first two (Tag the sentence, Core first), plus Find the Point, which trains the step before your Say line.</p></section>';
  }
  function rMeasuredHTML() {
    return '<header><p class="eyebrow">Reading · method</p><h2 class="vtitle">How this was measured, and its limits</h2></header><ul class="plainlist">' + RD.method.concat(RD.methodExtra || []).map(li).join('') + '</ul>' +
      (ANN.method ? '<h3 class="subh">The long-passage pages</h3><ul class="plainlist">' + ANN.method.map(li).join('') + '</ul>' : '') +
      '<p class="fine" style="margin-top:1rem">' + CREDIT + '</p>';
  }

  /* ---------- practice sets ---------- */
  function rSetsHTML() {
    return '<header><p class="eyebrow">Reading · practice sets</p><h2 class="vtitle">Every reading question, by job</h2>' +
      '<p class="lede">All ' + RTOTAL.toLocaleString('en-US') + ' reading questions in the bank, sorted by job and difficulty. Every one without a table or graph is in <a href="#practice">Practice</a> with College Board’s answer; table and graph questions are best opened by ID in College Board’s free SAT Suite Question Bank. Worked examples are marked.</p></header>' +
      '<label class="field" for="idq" style="display:block;margin-top:1.2rem;max-width:22rem"><span class="label">Look up a question ID</span><input type="text" id="idq" maxlength="8" autocomplete="off" spellcheck="false" placeholder="for example, 123bd312"></label><p class="idres" id="idres" role="status"></p>' +
      RD.sets.map(function (g) {
        return '<h3 class="subh">' + esc(g.group) + '</h3>' + g.sets.map(function (s) {
          return '<details class="set"><summary><span class="setname">' + esc(s.name) + '</span><span class="wn">' + plural(s.count, 'question') + '</span></summary><dl class="ids">' +
            ['Easy', 'Medium', 'Hard'].filter(function (d) { return s.byDiff[d] && s.byDiff[d].length; }).map(function (d) {
              return '<div><dt>' + d + ' ' + s.byDiff[d].length + '</dt><dd>' + s.byDiff[d].map(function (q) {
                return EXQ[q] ? '<a href="#ex-' + EXQ[q] + '" class="exid"><code>' + q + '</code></a>' : '<code>' + q + '</code>';
              }).join('') + '</dd></div>';
            }).join('') + '</dl></details>';
        }).join('');
      }).join('');
  }
  function idLookup(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) { return ''; }
    if (!/^[0-9a-f]{8}$/.test(q)) { return q.length < 8 ? 'Keep typing: IDs have eight characters.' : 'That is not an ID from this bank.'; }
    if (RID[q]) { return 'Question ' + q + ': ' + RID[q].group + ' · ' + RID[q].set + ' · ' + RID[q].diff + '.' + (EXQ[q] ? ' It is worked as Example ' + EXQ[q] + '.' : ''); }
    if (QI[q]) { var u = U[QI[q][0]]; return 'Question ' + q + ' is a grammar question: rule ' + u.num + ', ' + plain(u.title) + '.'; }
    return 'Question ' + q + ' is not in this bank.';
  }
  function wireSets(host) {
    var i = $('#idq', host), r = $('#idres', host);
    i.addEventListener('input', function () { r.textContent = idLookup(i.value); });
  }

  /* ---------- a reading question card ---------- */
  function rPassageHTML(x) {
    var chunks = x.chunks, h = '';
    if (x.table) { h += '<figure class="dtable"><figcaption class="tcap">' + esc(x.table.caption) + '</figcaption>' + tableHTML({ head: x.table.head, rows: x.table.rows }, 'datatab') + '</figure>'; }
    if (x.tagset === 'notes') {
      h += '<p class="passage">' + plainChunk(chunks[0]) + '</p><ul class="notes">' + chunks.slice(1, -1).map(function (c) { return '<li>' + plainChunk(c) + '</li>'; }).join('') + '</ul>' +
        '<p class="passage">' + plainChunk(chunks[chunks.length - 1]) + '</p>';
      return h;
    }
    var groups = [], cur = null;
    chunks.forEach(function (c) {
      if (c.head || !cur) { cur = { head: c.head, parts: [] }; groups.push(cur); }
      cur.parts.push(plainChunk(c));
    });
    return h + groups.map(function (g) { return (g.head ? '<p class="thead">' + esc(g.head) + '</p>' : '') + '<p class="passage">' + g.parts.join(' ') + '</p>'; }).join('');
  }
  function plainChunk(c) {
    return c.html.replace(/<mark class="turn">([\s\S]*?)<\/mark>/g, '$1').replace(/<span class="xtra">([\s\S]*?)<\/span>/g, '$1').replace(/_{3,}/g, BLANK);
  }
  function walkHTML(x, picked) {
    var chunks = x.chunks.map(function (c) {
      return '<li class="chunk">' + (c.head ? '<p class="thead">' + esc(c.head) + '</p>' : '') + '<div class="cgrid"><p class="ctext">' + c.html.replace(/_{3,}/g, '______') + '</p>' +
        '<div class="gloss">' + tagHTML(c.tag) + '<span class="pl">' + c.plain + '</span>' + (c.apart ? '<a class="aplink" href="#' + c.apart + '">Long sentence: see it taken apart</a>' : '') + '</div></div></li>';
    }).join('');
    var choices = x.choices.map(function (c) {
      var kind = c.right ? '<span class="vtag ok">Answer</span>' : '<span class="vtag bad">' + esc(c.kind) + '</span>' + (c.partly ? '<span class="vtag half">Partly right</span>' : '');
      return '<li class="rchoice' + (c.right ? ' right' : '') + (picked && c.k === picked && !c.right ? ' yours' : '') + '"><span class="let sm">' + c.k + '</span><div><p class="ct">' + c.t + '</p><p class="vline">' + kind + c.why + '</p></div></li>';
    }).join('');
    return '<div class="walk">' +
      fstep(1, 'Job', '<p class="qstem">' + x.question + '</p><p>' + (x.jobtag ? tagHTML(x.jobtag) + ' ' : '') + x.jobans + '</p>') +
      fstep(2, 'Chunk', '<p class="fine">Tag each sentence and say it in plain words. Turn words are highlighted; the dimmed words can wait for a second pass.</p><ol class="chunks">' + chunks + '</ol>') +
      fstep(3, 'Say', '<p class="sayline">' + x.say + '</p>') +
      fstep(4, 'Check', '<ol class="rchoices">' + choices + '</ol>') +
      (x.lesson ? '<p class="note">' + x.lesson + '</p>' : '') + '</div>';
  }
  function RCard(x, o) {
    o = o || {};
    var el = document.createElement('div');
    el.className = 'rcard';
    el.innerHTML = '<div class="q split"><div class="qpass">' + (o.meta ? '<p class="qmeta">' + o.meta + '</p>' : '') + rPassageHTML(x) + '</div>' +
      '<div class="qask"><p class="stem">' + x.question + '</p><ol class="opts">' + x.choices.map(function (c) {
        return '<li><button type="button" class="opt" data-k="' + c.k + '"><span class="let">' + c.k + '</span><span class="otext rtext">' + c.t + '</span><span class="otag"></span></button></li>';
      }).join('') + '</ol><div class="qfeed"></div></div></div><div class="rwalk"></div>';
    var done = false;
    $$('.opt', el).forEach(function (b) { b.addEventListener('click', function () { pick(b.getAttribute('data-k')); }); });
    function pick(k) {
      if (done || ['A', 'B', 'C', 'D'].indexOf(k) === -1) { return; }
      done = true;
      var ok = k === x.ans;
      var res = o.onAnswer ? o.onAnswer(k, ok) : null;
      $$('.opt', el).forEach(function (b) {
        var bk = b.getAttribute('data-k');
        b.disabled = true;
        if (bk === x.ans) { b.classList.add('right'); $('.otag', b).textContent = 'Correct'; }
        else if (bk === k) { b.classList.add('wrong'); $('.otag', b).textContent = 'Your answer'; }
      });
      var mine = x.choices.filter(function (c) { return c.k === k; })[0];
      $('.qfeed', el).innerHTML = verdictHTML(ok, x.ans, res) + (!ok && mine ? '<p class="fine">Your choice: <b>' + esc(mine.kind) + '.</b> ' + mine.why + '</p>' : '');
      $('.rwalk', el).innerHTML = '<h3 class="fasth">The walkthrough</h3>' + walkHTML(x, k);
      if (o.after) { o.after(ok); }
      showFeedback($('.verdict', el));
    }
    return { el: el, pick: pick, done: function () { return done; } };
  }
  function rExampleHTML(x) {
    var prev = REX[x.n - 1], next = REX[x.n + 1], d = !!store.rl['ex-' + x.n];
    return '<nav class="crumbs"><a href="#reading">Reading</a> / Worked examples</nav>' +
      '<header style="margin-top:.6rem"><p class="eyebrow">Example ' + x.n + ' of ' + RLIST.length + ' · ' + esc(x.diff) + ' · question ' + x.qid + '</p><h2 class="vtitle">' + esc(x.title) + '</h2></header>' +
      '<p class="row" style="margin-top:1rem"><span class="label">Mode</span><button type="button" class="btn sm" id="ex-try" aria-pressed="true">Try it first</button><button type="button" class="btn sm ghost" id="ex-read" aria-pressed="false">Show the walkthrough</button></p>' +
      '<div id="ex-host" style="margin-top:1rem"></div>' +
      '<div class="lfoot"><button type="button" class="btn ghost donebtn" id="exdone" aria-pressed="' + (d ? 'true' : 'false') + '">' + (d ? 'Studied ✓' : 'Mark as studied') + '</button><span class="row">' +
      (prev ? '<a class="btn ghost" href="#ex-' + prev.n + '">Example ' + prev.n + '</a>' : '') + (next ? '<a class="btn" href="#ex-' + next.n + '">Next: Example ' + next.n + ' · ' + esc(next.title) + '</a>' : '<a class="btn" href="#practice">Practice against the clock</a>') + '</span></div>';
  }
  function wireExample(x, host) {
    var slot = $('#ex-host', host), bt = $('#ex-try', host), br = $('#ex-read', host);
    function mode(m) {
      bt.setAttribute('aria-pressed', m === 'try' ? 'true' : 'false'); br.setAttribute('aria-pressed', m === 'read' ? 'true' : 'false');
      bt.classList.toggle('ghost', m !== 'try'); br.classList.toggle('ghost', m !== 'read');
      slot.textContent = '';
      if (m === 'try') { slot.appendChild(RCard(x, { meta: 'Question ' + x.qid }).el); }
      else { slot.innerHTML = '<div class="q"><div class="qpass">' + rPassageHTML(x) + '</div></div>' + walkHTML(x, ''); }
      store.s.exmode = m; save();
    }
    bt.addEventListener('click', function () { mode('try'); });
    br.addEventListener('click', function () { mode('read'); });
    mode(store.s.exmode === 'read' ? 'read' : 'try');
    var b = $('#exdone', host);
    b.addEventListener('click', function () {
      var k = 'ex-' + x.n;
      if (store.rl[k]) { delete store.rl[k]; } else { store.rl[k] = 1; }
      save();
      var on = !!store.rl[k];
      b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'Studied ✓' : 'Mark as studied';
      readingView.refresh();
    });
  }

  /* ---------- the Reading view ---------- */
  var READ_PAGES = {
    routine: rRoutineHTML, shape: rShapeHTML, job: rJobHTML, chunk: rChunkHTML, long: rLongHTML, say: rSayHTML,
    check: rCheckHTML, others: rOthersHTML, sets: rSetsHTML, measured: rMeasuredHTML
  };
  var readingView = RailView('reading', {
    label: 'Reading',
    items: function () {
      var ex = RLIST.map(function (x) { return { key: 'ex-' + x.n, token: 'ex-' + x.n, num: x.n, label: esc(x.title) + ' <span class="rn">' + x.diff.charAt(0) + '</span>', done: !!store.rl['ex-' + x.n] }; });
      return [
        { group: 'The routine', entries: [{ key: 'routine', token: 'routine', label: 'Four steps on every question' }, { key: 'shape', token: 'shape', label: 'What the passages are like' }] },
        { group: 'The steps', entries: [
          { key: 'job', token: 'job', num: 1, label: 'Job' }, { key: 'chunk', token: 'chunk', num: 2, label: 'Chunk' },
          { key: 'long', token: 'long', label: 'Long sentences: core first' }, { key: 'para', token: 'para', label: 'Long passages: make them make sense' },
          { key: 'say', token: 'say', num: 3, label: 'Say' }, { key: 'check', token: 'check', num: 4, label: 'Check' }] },
        { group: 'More question types', entries: [{ key: 'others', token: 'others', label: 'Words, structure, two texts, notes' }, { key: 'notes', token: 'notesfirst', label: 'Notes questions: goal first' }] },
        { group: 'Worked examples', entries: ex },
        { group: 'More', entries: [{ key: 'sets', token: 'sets', label: 'Practice sets: 1,230 IDs' }, { key: 'measured', token: 'measured', label: 'How this was measured' }] }
      ];
    },
    render: function (key, host) {
      var m = /^ex-(\d+)$/.exec(key);
      if (m && REX[m[1]]) { host.innerHTML = rExampleHTML(REX[m[1]]); wireExample(REX[m[1]], host); return; }
      if (key === 'para') { host.innerHTML = paraHTML(); wirePara(host); return; }
      if (key === 'notes') { host.innerHTML = notesHTML(); wireNotes(host); return; }
      host.innerHTML = (READ_PAGES[key] || rRoutineHTML)();
      if (key === 'long') { wireLong(host); }
      if (key === 'sets') { wireSets(host); }
    }
  });
