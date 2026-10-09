  var D = JSON.parse(document.getElementById('sprint-data').textContent);

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;';
    });
  }
  function plain(html) { var d = document.createElement('div'); d.innerHTML = html; return d.textContent; }
  function li(x) { return '<li>' + x + '</li>'; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i -= 1) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function clock(sec) { var s = Math.max(0, Math.round(sec)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function secs(sec) { return (Math.round(sec * 10) / 10).toFixed(1) + ' s'; }
  function median(a) {
    if (!a.length) { return 0; }
    var b = a.slice().sort(function (x, y) { return x - y; }), m = Math.floor(b.length / 2);
    return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
  }
  function now() { return window.performance && performance.now ? performance.now() : Date.now(); }
  function put(s, token, html) { return s.replace(token, function () { return html; }); }
  function focusQuiet(el) { if (el) { try { el.focus({ preventScroll: true }); } catch (e) {} } }
  function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }

  /* ---------- grammar data ---------- */
  var CONCEPTS = D.concepts, U = D.uses, EX = D.ex, QI = D.qi;
  var CBY = {}, PART = {};
  CONCEPTS.forEach(function (c) { CBY[c.id] = c; });
  D.parts.forEach(function (p) { PART[p.key] = p; });
  var EXLIST = [];
  CONCEPTS.forEach(function (c) { c.uses.forEach(function (uid) { U[uid].ex.forEach(function (q) { EXLIST.push(EX[q]); }); }); });
  var TOTAL = { q: 0, u: 0, v: 0 }, partStats = {}, conceptStats = {};
  CONCEPTS.forEach(function (c) {
    var q = 0, v = 0;
    c.uses.forEach(function (uid) { q += U[uid].q; v += U[uid].v.length; });
    conceptStats[c.id] = { q: q, v: v };
    var p = partStats[c.part] || (partStats[c.part] = { q: 0, u: 0, v: 0 });
    p.q += q; p.u += c.uses.length; p.v += v;
    TOTAL.q += q; TOTAL.u += c.uses.length; TOTAL.v += v;
  });
  var NC = CONCEPTS.length;
  var PART_INTRO = { A: 'Which mark: eight situations', B: 'Verbs: four situations', C: 'Every transition offered' };
  var FAM = {
    punct: { label: 'Punctuation', noun: 'punctuation', sub: 'The marks change' },
    agree: { label: 'Subject–verb agreement', noun: 'subject–verb agreement', sub: 'A singular or a plural verb' },
    form: { label: 'Verb form', noun: 'verb form', sub: 'A tensed verb, or -ing, to or -ed' },
    tense: { label: 'Verb tense', noun: 'verb tense', sub: 'One verb in different times' },
    pron: { label: 'Pronouns', noun: 'pronoun', sub: 'it, they, this, its / it’s, their / they’re' },
    apos: { label: 'Plurals and possessives', noun: 'plural and possessive', sub: 'The same nouns with and without apostrophes' },
    mod: { label: 'Modifier placement', noun: 'modifier', sub: 'Long choices, a different first noun' },
    trans: { label: 'Transitions', noun: 'transition', sub: 'Linking words and phrases' }
  };
  var FAMS = ['punct', 'agree', 'form', 'tense', 'pron', 'apos', 'mod', 'trans'];
  var F = D.first.pats;
  var PAT = { p1: F[0], p2: F[1], p3: F[2], p4a: F[3].sub[0], p4b: F[3].sub[1], p4c: F[3].sub[2], p5: F[4], p6: F[5], p7: F[6], p8: F[7] };
  var STEM_SEC = 'Which choice completes the text so that it conforms to the conventions of Standard English?';
  var STEM_TRANS = 'Which choice completes the text with the most logical transition?';
  var BLANK = '<span class="blank" role="img" aria-label="blank"></span>';
  var CREDIT = 'Passages, answer choices and answer keys come from College Board’s free SAT Suite Question Bank; the literary excerpts belong to their authors. They are quoted here for study. The rules, routine, explanations and counts come from two guides built from an export of that bank, the SAT Grammar Catalog and the SAT Reading Routine. SAT® is a trademark registered by College Board, which is not affiliated with, and does not endorse, this site.';

  /* ---------- reading data ---------- */
  var RD = D.reading;
  var REX = {};
  RD.examples.forEach(function (x) { REX[x.n] = x; });
  var RLIST = RD.examples.slice();
  var JOBNAME = { main: 'Main idea', detail: 'Detail', inference: 'Inference', support: 'Support', weaken: 'Weaken', quote: 'Quotation', data: 'Table or graph', word: 'Word', structure: 'Purpose or structure', cross: 'Two texts', notes: 'Notes' };
  var RTOTAL = 0;
  RD.sets.forEach(function (g) { g.sets.forEach(function (s) { RTOTAL += s.count; }); });
  var RID = {};
  RD.sets.forEach(function (g) {
    g.sets.forEach(function (s) {
      Object.keys(s.byDiff).forEach(function (d) { s.byDiff[d].forEach(function (q) { RID[q] = { group: g.group, set: s.name, diff: d }; }); });
    });
  });
  var EXQ = {};
  RD.examples.forEach(function (x) { EXQ[x.qid] = x.n; });
  var ANN = D.ann || { units: {}, drills: {} };

  /* ---------- saved progress: this browser only ---------- */
  var KEY = 'sat-grammar-sprint.v1';
  var store = { t: {}, l: {}, d: {}, s: {}, r: {}, rl: {}, b: {}, m: {} }, canStore = false;
  function isObj(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
  try {
    var raw = window.localStorage.getItem(KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (isObj(parsed)) {
        Object.keys(store).forEach(function (k) { if (isObj(parsed[k])) { store[k] = parsed[k]; } });
      }
    }
    window.localStorage.setItem(KEY, JSON.stringify(store));
    canStore = true;
  } catch (e) { canStore = false; }
  function save() {
    if (!canStore) { return; }
    try { window.localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { canStore = false; }
  }
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY || !e.newValue) { return; }
    try { var p = JSON.parse(e.newValue); Object.keys(store).forEach(function (k) { if (isObj(p[k])) { store[k] = p[k]; } }); } catch (err) {}
  });
  function endDot(html) { return /[.,;:?!…”’)]\s*$/.test(plain(html)) ? html : html + '.'; }
  function quoteIfOdd(html) { return /^\W/.test(plain(html)) ? '“' + html + '”' : html; }
  function narrow() { return window.matchMedia && window.matchMedia('(max-width: 760px)').matches; }
  function showFeedback(el) {
    if (!el) { return; }
    focusQuiet(el);
    if (narrow()) { try { el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { el.scrollIntoView(); } }
  }
  function rec(bucket, id) { var r = store[bucket][id]; return isObj(r) ? r : null; }
  function countDone() { return CONCEPTS.filter(function (c) { return !!store.l[c.id]; }).length; }
  function countReadDone() { return Object.keys(store.rl).filter(function (k) { return !!store.rl[k]; }).length; }

  /* ---------- what changes from one choice to the next ---------- */
  var TOK = /[A-Za-z0-9À-ɏ’'\-]+|[^\sA-Za-z0-9À-ɏ’'\-]/g;
  function tokens(s) {
    var out = [], m;
    TOK.lastIndex = 0;
    while ((m = TOK.exec(s))) { out.push({ t: m[0].toLowerCase(), s: m.index, e: m.index + m[0].length }); }
    return out;
  }
  function changes(chs) {
    var T = chs.map(tokens);
    var min = Math.min.apply(null, T.map(function (t) { return t.length; }));
    var pre = 0, suf = 0;
    while (pre < min && T.every(function (t) { return t[pre].t === T[0][pre].t; })) { pre += 1; }
    while (suf < min - pre && T.every(function (t) { return t[t.length - 1 - suf].t === T[0][T[0].length - 1 - suf].t; })) { suf += 1; }
    if (pre + suf === 0) { return null; }
    if (T.every(function (t) { return (t.length - pre - suf) / t.length > 0.75; })) { return null; }
    return chs.map(function (s, i) {
      var t = T[i];
      var a = pre > 0 ? t[pre - 1].e : 0;
      var b = suf > 0 ? t[t.length - suf].s : s.length;
      var mid = s.slice(a, b);
      if (!mid.trim()) {
        return esc(s.slice(0, a)) + '<span class="nomark" role="img" aria-label="no mark" title="No mark here">^</span>' + esc(s.slice(a));
      }
      var a2 = a + mid.length - mid.replace(/^\s+/, '').length;
      var b2 = b - (mid.length - mid.replace(/\s+$/, '').length);
      return esc(s.slice(0, a2)) + '<mark class="chg">' + esc(s.slice(a2, b2)) + '</mark>' + esc(s.slice(b2));
    });
  }
  function miniHTML(ex, hl, showRight) {
    var d = hl ? changes(ex.ch) : null;
    var long = ex.ch.some(function (t) { return t.length > 34; });
    return '<ol class="mini' + (long ? ' long' : '') + '">' + ex.ch.map(function (t, i) {
      var k = 'ABCD'[i];
      return '<li' + (showRight && k === ex.a ? ' class="is-right"' : '') + '><span class="let">' + k + '</span><span>' + (d ? d[i] : esc(t)) + '</span></li>';
    }).join('') + '</ol>';
  }
  function mixHTML(s) {
    var e = s.Easy || 0, m = s.Medium || 0, h = s.Hard || 0, t = e + m + h || 1;
    return '<span class="mix" role="img" aria-label="' + e + ' Easy, ' + m + ' Medium, ' + h + ' Hard">' +
      '<i class="e" style="width:' + (100 * e / t).toFixed(1) + '%"></i><i class="m" style="width:' + (100 * m / t).toFixed(1) + '%"></i><i class="h" style="width:' + (100 * h / t).toFixed(1) + '%"></i></span>';
  }
  var MIXKEY = '<span class="mixkey"><span><i style="background:var(--d1)"></i>Easy</span><span><i style="background:var(--d2)"></i>Medium</span><span><i style="background:var(--d3)"></i>Hard</span></span>';
  function versionOf(q) { var x = QI[q]; return x ? U[x[0]].v[x[1]] : null; }
  function seg(name, legend, opts, sel) {
    return '<fieldset class="seg"><legend>' + legend + '</legend><div class="segrow">' + opts.map(function (o) {
      return '<label><input type="radio" name="' + name + '" id="' + name + '-' + o[0] + '" value="' + o[0] + '"' + (String(o[0]) === String(sel) ? ' checked' : '') + '><span>' + o[1] + '</span></label>';
    }).join('') + '</div></fieldset>';
  }

  /* ---------- the clock ---------- */
  var GRAMMAR_PHASES = [[1 / 12, 'Look', 'Name what changes'], [0.75, 'Check', 'Run the one check'], [1, 'Confirm', 'Read it with your answer']];
  var READING_PHASES = [[5 / 70, 'Job', 'Read the question first'], [40 / 70, 'Chunk', 'Tag each sentence'], [50 / 70, 'Say', 'Your own answer first'], [1, 'Check', 'Every piece needs a line']];
  function Clock(host, limit, phases) {
    var R = 42, CIRC = 2 * Math.PI * R;
    phases = phases || GRAMMAR_PHASES;
    host.innerHTML = '<span class="clock idle"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="42" fill="none" stroke-width="9"></circle>' +
      '<circle class="arc" cx="50" cy="50" r="42" fill="none" stroke-width="9" stroke-dasharray="' + CIRC.toFixed(2) + '" stroke-dashoffset="0"></circle></svg>' +
      '<span class="cnum"></span></span><span class="phase"><b></b><span></span></span><span class="sr" aria-live="polite"></span>';
    var wrap = $('.clock', host), arc = $('.arc', host), num = $('.cnum', host), phB = $('.phase b', host), phS = $('.phase span', host), live = $('.sr', host);
    var acc = 0, t0 = 0, on = false, timer = null, said = {};
    function el() { return acc + (on ? (now() - t0) / 1000 : 0); }
    function paint() {
      var e = el(), left = limit - e;
      arc.setAttribute('stroke-dashoffset', (CIRC * Math.min(e / limit, 1)).toFixed(2));
      num.textContent = left >= 0 ? clock(Math.ceil(left - 1e-6)) : '+' + clock(Math.floor(-left));
      wrap.classList.toggle('late', left >= 0 && left < limit / 4);
      wrap.classList.toggle('over', left < 0);
      if (!on) { return; }
      if (left < 0) { phB.textContent = 'Over time'; phS.textContent = 'Answer and move on'; }
      else {
        for (var i = 0; i < phases.length; i += 1) {
          if (e < limit * phases[i][0] || i === phases.length - 1) { phB.textContent = phases[i][1]; phS.textContent = phases[i][2]; break; }
        }
      }
      if (left <= limit / 2 && !said.half) { said.half = 1; live.textContent = Math.round(limit / 2) + ' seconds left'; }
      if (left < 0 && !said.up) { said.up = 1; live.textContent = 'Time is up'; }
    }
    function reset(l, ph) {
      limit = l || limit; phases = ph || phases; acc = 0; on = false; said = {};
      clearInterval(timer); timer = null;
      wrap.classList.add('idle'); wrap.classList.remove('late', 'over');
      arc.setAttribute('stroke-dashoffset', '0');
      num.textContent = clock(limit);
      phB.textContent = 'Ready'; phS.textContent = clock(limit) + ' on the clock';
      live.textContent = '';
    }
    reset(limit);
    return {
      reset: reset,
      start: function () {
        if (on) { return; }
        on = true; t0 = now(); wrap.classList.remove('idle');
        clearInterval(timer); timer = setInterval(paint, 200); paint();
      },
      pause: function () {
        if (!on) { return; }
        acc = el(); on = false; clearInterval(timer); timer = null; paint();
        phB.textContent = 'Paused'; phS.textContent = 'The clock waits for you';
      },
      stop: function () {
        var e = el();
        acc = e; on = false; clearInterval(timer); timer = null; paint();
        phB.textContent = e <= limit ? 'Answered' : 'Answered late';
        phS.textContent = clock(e) + ' used';
        return e;
      },
      halt: function () { on = false; clearInterval(timer); timer = null; },
      running: function () { return on; },
      used: function () { return acc > 0 || on; }
    };
  }
  function limitWords(l) { return l === 60 ? 'a minute' : clock(l); }

  /* ---------- a grammar question card ---------- */
  function passageHTML(ex, filled) {
    return put(esc(ex.text), '{{BLANK}}', filled ? '<mark class="fill">' + esc(ex.fill) + '</mark>' : BLANK);
  }
  function checkHTML(u, c) {
    var r;
    if (c.part === 'A' && u.sit != null) { r = D.structure.rows[u.sit]; return '<p><b>' + r.head + '.</b> ' + r.tell + '</p>'; }
    if (u.vsit != null) { r = D.verbs.rows[u.vsit]; return '<p><b>' + r.head + '.</b> ' + r.tell + '</p>'; }
    if (c.n >= 11 && c.n <= 13 && D.verbs.rest[c.n - 11]) { r = D.verbs.rest[c.n - 11]; return '<p><b>' + r.head + '.</b> ' + r.tell + '</p>'; }
    return '<p><b>Name the link: ' + esc(c.title.toLowerCase()) + '.</b> ' + PAT.p8.check + '</p>';
  }
  function fstep(n, title, body) {
    return '<div class="fstep"><span class="n">' + n + '</span><div class="fb"><h4>' + title + '</h4>' + body + '</div></div>';
  }
  function fastHTML(ex, picked) {
    var u = U[ex.u], c = CBY[u.c], p = PAT[ex.pat], f = FAM[c.fam];
    var no = '';
    ['A', 'B', 'C', 'D'].forEach(function (k) {
      if (k !== ex.a && ex.no[k]) { no += '<li' + (k === picked ? ' class="yours"' : '') + '><span class="let sm">' + k + '</span><span>' + ex.no[k] + '</span></li>'; }
    });
    var notes = ex.notes.map(function (n) { return '<p class="note">' + n + '</p>'; }).join('');
    var ver = versionOf(ex.q);
    return '<div class="fast"><h3 class="fasth">The fast path</h3>' +
      fstep(1, 'Look at the choices', '<p><b>' + (ex.look || p.pat) + '</b> So it is a ' + f.noun + ' question.' + (ex.tie ? ' ' + ex.tie : '') + '</p>' + miniHTML(ex, true, true)) +
      fstep(2, 'Run the check', checkHTML(u, c) + '<p class="rule"><span class="rl">Rule ' + u.num + '</span>' + u.rule + '</p>') +
      fstep(3, 'Why ' + ex.a, '<p class="why">' + ex.why + '</p>' + (no ? '<ul class="whynot">' + no + '</ul>' : '') + notes) +
      '<p class="fmore">' + (ver ? '<b>Version:</b> ' + endDot(quoteIfOdd(ver.label)) + ' ' : '') + '<a href="#' + u.id + '">Study rule ' + u.num + '</a></p></div>';
  }
  function verdictHTML(ok, ans, res) {
    var t = '';
    if (res && typeof res.time === 'number') {
      t = '<span class="vt">' + clock(res.time) + (res.time <= res.limit ? ' · under ' : ' · over ') + limitWords(res.limit) + '</span>';
    }
    return '<p class="verdict ' + (ok ? 'good' : 'miss') + '" tabindex="-1">' + (ok ? 'Correct.' : 'Not this one. The answer is ' + ans + '.') + t + '</p>';
  }
  function QCard(ex, o) {
    o = o || {};
    var el = document.createElement('div');
    el.className = 'q' + (o.split ? ' split' : '');
    var d = o.hints ? changes(ex.ch) : null;
    el.innerHTML = '<div class="qpass">' + (o.meta ? '<p class="qmeta">' + o.meta + '</p>' : '') + '<p class="passage">' + passageHTML(ex, false) + '</p></div>' +
      '<div class="qask"><p class="stem">' + (ex.p === 'C' ? STEM_TRANS : STEM_SEC) + '</p><ol class="opts">' +
      ex.ch.map(function (t, i) {
        var k = 'ABCD'[i];
        return '<li><button type="button" class="opt" data-k="' + k + '"><span class="let">' + k + '</span><span class="otext">' + (d ? d[i] : esc(t)) + '</span><span class="otag"></span></button></li>';
      }).join('') + '</ol><div class="qfeed"></div></div>';
    var done = false;
    $$('.opt', el).forEach(function (b) { b.addEventListener('click', function () { pick(b.getAttribute('data-k')); }); });
    function pick(k) {
      if (done || ['A', 'B', 'C', 'D'].indexOf(k) === -1) { return; }
      done = true;
      var ok = k === ex.a;
      var res = o.onAnswer ? o.onAnswer(k, ok) : null;
      $$('.opt', el).forEach(function (b) {
        var bk = b.getAttribute('data-k');
        b.disabled = true;
        if (bk === ex.a) { b.classList.add('right'); $('.otag', b).textContent = 'Correct'; }
        else if (bk === k) { b.classList.add('wrong'); $('.otag', b).textContent = 'Your answer'; }
      });
      $('.passage', el).innerHTML = passageHTML(ex, true);
      if (o.metaAfter) {
        var mm = $('.qmeta', el);
        if (!mm) { mm = document.createElement('p'); mm.className = 'qmeta'; $('.qpass', el).insertBefore(mm, $('.passage', el)); }
        mm.innerHTML = o.metaAfter;
      }
      $('.qfeed', el).innerHTML = verdictHTML(ok, ex.a, res) + fastHTML(ex, k);
      if (o.after) { o.after(ok); }
      showFeedback($('.verdict', el));
    }
    return { el: el, pick: pick, done: function () { return done; } };
  }

  /* ---------- a page with a contents rail ---------- */
  function RailView(v, o) {
    var st = { built: false, key: '' };
    var host, rail, sel, page;
    function build() {
      if (st.built) { return; }
      st.built = true;
      viewEl[v].innerHTML = '<div class="wrap"><div class="lgrid"><nav class="lrail" aria-label="' + o.label + '"></nav><div class="lmain">' +
        '<label class="ljump" for="' + v + '-jump"><span class="sr">Go to a page</span><select id="' + v + '-jump"></select></label><div class="lpage"></div></div></div></div>';
      host = viewEl[v]; rail = $('.lrail', host); sel = $('select', host); page = $('.lpage', host);
      sel.addEventListener('change', function () { if (this.value) { nav(this.value); } });
      refresh();
    }
    function refresh() {
      if (!st.built) { return; }
      var top = rail.scrollTop, h = '', opt = '';
      o.items().forEach(function (g) {
        h += '<p class="label">' + g.group + '</p><ul>';
        opt += '<optgroup label="' + esc(plain(g.group)) + '">';
        g.entries.forEach(function (e) {
          h += '<li><a href="#' + e.token + '" data-k="' + e.key + '"><span class="rn">' + (e.num || '') + '</span><span>' + e.label + '</span><span class="tickmark">' +
            (e.done ? '<span aria-hidden="true">✓</span><span class="sr">done</span>' : (e.tail || '')) + '</span></a></li>';
          opt += '<option value="' + e.token + '" data-k="' + e.key + '">' + (e.num ? e.num + ' ' : '') + esc(plain(e.label)) + (e.done ? ' ✓' : '') + '</option>';
        });
        h += '</ul>'; opt += '</optgroup>';
      });
      rail.innerHTML = h; rail.scrollTop = top; sel.innerHTML = opt;
      mark();
    }
    function mark() {
      $$('a', rail).forEach(function (a) { if (a.getAttribute('data-k') === st.key) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); } });
      var opt = $('option[data-k="' + st.key + '"]', sel);
      if (opt) { sel.value = opt.value; }
    }
    function show(key) {
      build();
      if (key === st.key) { return false; }
      if (o.leave) { o.leave(st.key); }
      st.key = key;
      page.innerHTML = '';
      o.render(key, page);
      mark();
      return true;
    }
    return { show: show, refresh: refresh, key: function () { return st.key; }, page: function () { build(); return page; } };
  }
