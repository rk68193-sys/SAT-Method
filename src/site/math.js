  /* =================== Math =================== */
  var MD = D.math, MORDER = MD.order, MQ = [], MQBY = {}, MSK = MD.skills, MTY = MD.types;
  MD.qs.forEach(function (r) {
    var q = { id: r[0], t: MORDER[r[1]], d: 'EMH'[r[2]], mc: !!r[3], a: r[4], qw: r[5], qh: r[6], rw: r[7], rh: r[8], qnw: r[9], qnh: r[10], rnw: r[11], rnh: r[12], pm: r[13] };
    q.k = MTY[q.t].skill; MQ.push(q); MQBY[q.id] = q;
  });
  var MDOM = {};
  MD.domains.forEach(function (d) { d.skills.forEach(function (k) { MDOM[k] = d; }); });
  var MDIFF = { E: 'Easy', M: 'Medium', H: 'Hard' };
  var MIMG = 'm/';
  var MSCALE = 1.15, MSCALEN = 1.12;
  if (!isObj(store.m)) { store.m = {}; }
  function mfmt(n) { return Number(n).toLocaleString('en-US'); }
  function mpc(a, b) { return b ? Math.round(100 * a / b) : 0; }
  function mmix(o) { return mixHTML({ Easy: o.E, Medium: o.M, Hard: o.H }); }
  function mImg(kind, q) {
    /* A wide image for big screens and, for phones, the same text re-wrapped into a narrow column.
       The wide one is drawn at 1.15 image pixels per CSS pixel and the narrow one at 1.12, so the text reads at about 14 px. */
    var w = kind === 'q' ? q.qw : q.rw, h = kind === 'q' ? q.qh : q.rh;
    var nw = kind === 'q' ? q.qnw : q.rnw, nh = kind === 'q' ? q.qnh : q.rnh;
    var alt = kind === 'q' ? 'Question ' + q.id + ' from College Board’s question bank, with its answer choices' : 'College Board’s explanation for question ' + q.id;
    var lazy = kind === 'r' ? ' loading="lazy"' : '';
    var img = '<img class="mimg" srcset="' + MIMG + kind + '/' + q.id + '.webp ' + MSCALE + 'x" src="' + MIMG + kind + '/' + q.id + '.webp" width="' + Math.round(w / MSCALE) + '" height="' + Math.round(h / MSCALE) + '" alt="' + alt + '"' + lazy + ' decoding="async">';
    if (!nw) { return img; }
    return '<picture><source media="(max-width: 720px)" srcset="' + MIMG + kind + 'n/' + q.id + '.webp ' + MSCALEN + 'x" width="' + Math.round(nw / MSCALEN) + '" height="' + Math.round(nh / MSCALEN) + '">' + img + '</picture>';
  }
  function mDone(id) { var r = store.m[id]; return Array.isArray(r) ? r : null; }
  function mSkillStats(k) {
    var L = MQ.filter(function (q) { return q.k === k; }), tried = 0, right = 0;
    L.forEach(function (q) { var r = mDone(q.id); if (r) { tried++; right += r[0]; } });
    return { n: L.length, tried: tried, right: right };
  }
  function mStepList(a) { return '<ol class="msteps">' + a.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>'; }
  function mTypeCard(t, opts) {
    var T = MTY[t]; opts = opts || {};
    return '<article class="mtype" id="mt-' + t + '">' +
      '<header class="mtype-h"><h3 class="h3">' + esc(T.name) + '</h3><p class="mtype-n">' + plural(T.n, 'question') + ' in the bank · ' + mpc(T.H, T.n) + '% Hard ' + mmix(T) + '</p></header>' +
      '<p class="mspot"><span class="mtag">You will see</span> ' + esc(T.spot) + '</p>' +
      '<div class="mhow"><p class="mtag">What to do</p>' + mStepList(T.steps) + '</div>' +
      '<p class="mtrap"><span class="mtag bad">Watch out</span> ' + esc(T.trap) + '</p>' +
      (T.tip ? '<p class="mtip"><span class="mtag">Tip</span> ' + esc(T.tip) + '</p>' : '') +
      mDesLine(T) +
      (opts.noPractice ? '' : '<p class="row" style="margin-top:.8rem"><a class="btn sm" href="#mp-' + t + '">Practice these ' + T.n + '</a>' + (opts.showSkill ? ' <a class="linkbtn" href="#m-' + T.skill + '">' + esc(MSK[T.skill].name) + ' lesson</a>' : '') + '</p>') +
      '</article>';
  }
  var MMOVE = {};
  MD.desmos.forEach(function (m, i) { m.n = i + 1; MMOVE[m.id] = m; });
  function mDesLine(T) {
    if (!T.dtext) { return ''; }
    var m = T.dmove ? MMOVE[T.dmove] : null;
    return '<p class="mtip mdesline"><span class="mtag des">Desmos</span> ' + (m ? '<a class="mmove" href="#md-' + m.id + '">Move ' + m.n + ': ' + esc(m.name) + '</a> ' : '') + esc(T.dtext) + '</p>';
  }
  function mHead(eyebrow, title, lede) {
    return '<header class="mhead"><p class="eyebrow">' + eyebrow + '</p><h2 class="vtitle">' + title + '</h2>' + (lede ? '<p class="lede">' + lede + '</p>' : '') + '</header>';
  }
  function mNext(links) {
    return '<nav class="mnext" aria-label="Where to go next">' + links.map(function (l) { return '<a class="mnext-a" href="#' + l[0] + '"><span class="label">' + l[1] + '</span><b>' + l[2] + '</b></a>'; }).join('') + '</nav>';
  }

  /* ---------- Math: start here ---------- */
  function buildMStart() {
    if (built.mstart) { $('#mstart-prog').innerHTML = mProgHTML(); return; }
    built.mstart = true;
    var F = MD.facts, T = MD.tot;
    var doms = MD.domains.map(function (d) {
      var n = d.skills.reduce(function (a, k) { return a + MSK[k].n; }, 0);
      return '<a class="mdom" href="#m-learn-' + d.id + '"><span class="mdom-spec">' + esc(d.spec) + '</span><b>' + esc(d.name) + '</b><span>' + esc(d.blurb) + '</span><span class="label">' + d.skills.length + ' skills · ' + mfmt(n) + ' bank questions</span></a>';
    }).join('');
    var h = '<div class="wrap">' +
      mHead('Math · Start here', 'How to approach every math question', 'The digital SAT Math section has two parts of 22 questions, 35 minutes each: about a minute and a half per question, with a calculator (Desmos) built in. Everything on this page comes from College Board’s full question bank of ' + mfmt(T.n) + ' math questions.') +
      '<section class="sec first"><h3 class="h2">The routine: ten seconds before you solve</h3>' +
      '<ol class="mroutine">' +
        '<li><b>Read the last sentence first.</b><span>It is the real question. Everything above it is information.</span></li>' +
        '<li><b>Name the question type.</b><span>Certain words give it away: “margin of error”, “line of best fit”, “in terms of”, “vertex”. The <a href="#m-types">Question finder</a> lists them.</span></li>' +
        '<li><b>Look for the three warning signs.</b><span>“no solution / infinitely many”, the word “constant”, and “positive” or “negative” as a condition. Each one means the question has a twist (below).</span></li>' +
        '<li><b>Choose your tool.</b><span>Two steps or fewer: by hand, it is faster. Long algebra, a parabola, a circle, two lines crossing, a constant to find or a chain of percents: Desmos. The <a href="#m-desmos">Desmos playbook</a> has the exact keystrokes.</span></li>' +
        '<li><b>Solve, then read the last sentence again.</b><span>Is your number the thing it asked for? x, or x + y? The radius, or the diameter? This one habit catches the most common wrong answer.</span></li>' +
      '</ol></section>' +
      '<section class="sec"><h3 class="h2">What the test covers</h3><p class="lede">Four content areas. College Board’s own test plan says Algebra and Advanced Math are about 35% each and the other two about 15% each, so start with the first two.</p><div class="mdoms">' + doms + '</div></section>' +
      '<section class="sec"><h3 class="h2">Three warning signs that make a question hard</h3><div class="mcards3">' +
        '<div class="mcard"><p class="mtag">“No solution” / “infinitely many”</p><p>Do not solve. Compare the two sides or the two lines. In the bank, ' + F.sol + ' questions ask how many solutions there are, and ' + mpc(F.solHard, F.sol) + '% of them are Hard. They come in three kinds: two lines (' + F.solSys + ' questions: compare slopes), one equation in x (' + F.solOne + ': compare both sides) and quadratics (' + F.solNon + ': use b² − 4ac).</p><a class="linkbtn" href="#mt-sys-count">How to do it</a></div>' +
        '<div class="mcard"><p class="mtag">The word “constant”</p><p>There is a second unknown that is not the one asked for. Pin it down first: match the parts on both sides, or put in a point you know.</p><a class="linkbtn" href="#mt-eqx-coef">How to do it</a></div>' +
        '<div class="mcard"><p class="mtag">“Positive” or “negative”</p><p>There are two answers and only one is allowed. Find both, keep the right one. The other one is always among the choices.</p><a class="linkbtn" href="#mt-nle-sign">How to do it</a></div>' +
      '</div></section>' +
      '<section class="sec"><h3 class="h2">What the data says, in plain words</h3><ul class="mfacts">' +
        '<li><b>Most wrong answers are right answers to a different question.</b> College Board’s explanations say it again and again: “this is the value of x, not x + 4”. Re-reading the last sentence beats re-checking your arithmetic.</li>' +
        '<li><b>About one question in four has no choices.</b> ' + mfmt(F.grid) + ' of the ' + mfmt(T.n) + ' are typed-in answers. ' + F.gridFrac + ' of those accept a fraction and ' + F.gridNeg + ' have a negative answer, so a fraction or a minus sign is not a sign you went wrong. You can type a fraction like 7/6 instead of a long decimal.</li>' +
        '<li><b>Maximum and minimum questions are the hardest single shape.</b> ' + F.vx + ' questions ask for a parabola’s highest or lowest point; ' + F.vxHard + ' are Hard. Say the answer as a sentence: “the minimum is −4, at x = 3”, then match it to what was asked.</li>' +
        '<li><b>Circles are mostly algebra, but not only.</b> ' + F.cirEq + ' of the ' + F.cir + ' circle questions are about the circle’s equation; the rest are arcs, radians, tangent lines and triangles inside circles.</li>' +
        '<li><b>Hard questions are usually two ordinary steps joined together.</b> When one feels impossible, look for the seam: what could you work out first?</li>' +
        '<li><b>The answer letter tells you nothing you can use.</b> In the bank, D is right more often on Hard questions and B on Easy ones, but real tests can order choices differently. Never let it override your work.</li>' +
      '</ul></section>' +
      '<section class="sec"><h3 class="h2">Your progress</h3><div id="mstart-prog">' + mProgHTML() + '</div></section>' +
      '<section class="sec"><h3 class="h2">The ideas underneath</h3><p class="lede">About a dozen ideas connect almost every question type. The same move solves a percent chain, a growth model and a unit conversion; the same picture answers every “how many solutions” question. <a href="#m-patterns">See the big patterns</a>.</p></section>' +
      mNext([['m-learn', 'Next', 'Open the lessons'], ['m-patterns', 'The big ideas', 'Big patterns'], ['m-desmos', 'The calculator', 'Desmos playbook'], ['m-practice', 'Or jump in', 'Practice real questions']]) +
      '</div>';
    viewEl.mstart.innerHTML = h;
  }
  function mProgHTML() {
    var tried = 0, right = 0;
    Object.keys(store.m).forEach(function (k) { var r = mDone(k); if (r && MQBY[k]) { tried++; right += r[0]; } });
    if (!tried) { return '<p class="muted">Nothing practiced yet. Your results are saved in this browser only.</p>'; }
    var rows = MD.domains.map(function (d) {
      var s = d.skills.map(mSkillStats).reduce(function (a, x) { return { n: a.n + x.n, tried: a.tried + x.tried, right: a.right + x.right }; }, { n: 0, tried: 0, right: 0 });
      return '<div class="mprog-row"><span>' + esc(d.name) + '</span><span class="mbar"><i style="width:' + mpc(s.tried, s.n) + '%"></i></span><span class="num">' + s.tried + ' tried · ' + mpc(s.right, s.tried || 1) + '% right</span></div>';
    }).join('');
    return '<p>' + plural(tried, 'question') + ' tried, ' + right + ' right (' + mpc(right, tried) + '%).</p><div class="mprog">' + rows + '</div>';
  }

  /* ---------- Math: lessons ---------- */
  var mlearnView = (function () {
    var page = '';
    function home() {
      return '<div class="wrap">' + mHead('Math · Lessons', 'Lessons, one skill at a time', 'College Board sorts every math question into 19 skills in four areas. Each lesson explains the idea from scratch, gives the method, a worked example, the usual trap, and every question type in that skill with how to solve it.') +
        MD.domains.map(function (d) {
          return '<section class="sec" id="m-learn-' + d.id + '"><div class="mdom-h"><h3 class="h2">' + esc(d.name) + '</h3><p class="mdom-spec">' + esc(d.spec) + '</p></div><p class="lede">' + esc(d.blurb) + '</p><div class="mskills">' +
            d.skills.map(function (k) {
              var S = MSK[k], st = mSkillStats(k);
              return '<a class="mskill" href="#m-' + k + '"><b>' + esc(S.name) + '</b><span class="mskill-idea">' + esc(S.idea) + '</span><span class="mskill-meta">' + S.n + ' questions · ' + mpc(S.H, S.n) + '% Hard ' + mmix(S) + '</span>' + (st.tried ? '<span class="mskill-done">' + st.tried + ' practiced · ' + mpc(st.right, st.tried) + '% right</span>' : '') + '</a>';
            }).join('') + '</div></section>';
        }).join('') + '</div>';
    }
    function skill(k) {
      var S = MSK[k], d = MDOM[k], ex = S.example;
      var i = d.skills.indexOf(k), prev = d.skills[i - 1], next = d.skills[i + 1];
      var nav = [];
      if (prev) { nav.push(['m-' + prev, 'Previous skill', MSK[prev].name]); }
      if (next) { nav.push(['m-' + next, 'Next skill', MSK[next].name]); }
      else { var di = MD.domains.indexOf(d), nd = MD.domains[di + 1]; if (nd) { nav.push(['m-' + nd.skills[0], 'Next area: ' + nd.name, MSK[nd.skills[0]].name]); } }
      return '<div class="wrap mlesson">' +
        '<nav class="crumbs"><a href="#m-learn">Lessons</a> / <a href="#m-learn-' + d.id + '">' + esc(d.name) + '</a></nav>' +
        mHead(esc(d.name) + ' · ' + S.n + ' questions in the bank · ' + mpc(S.H, S.n) + '% Hard', esc(S.name), '') +
        '<div class="mlesson-grid"><div class="mlesson-main">' +
        '<div class="midea"><p class="mtag">The idea</p><p>' + esc(S.idea) + '</p></div>' +
        '<section class="msec"><h3 class="h3">What is really going on</h3><p class="pretty">' + esc(S.plain) + '</p></section>' +
        '<section class="msec"><h3 class="h3">The method</h3>' + mStepList(S.steps) + '</section>' +
        '<section class="msec"><h3 class="h3">Worked example</h3><div class="mex"><p class="mex-q">' + esc(ex.q) + '</p><ol class="mex-l">' + ex.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ol><p class="mex-c">' + esc(ex.check) + '</p></div><p class="fine">This example was written for this site; the practice questions are College Board’s.</p></section>' +
        '<section class="msec"><div class="mtrapbox"><p class="mtag bad">The trap</p><p>' + esc(S.trap) + '</p></div>' + (S.tip ? '<div class="mtipbox"><p class="mtag">Tip</p><p>' + esc(S.tip) + '</p></div>' : '') + '</section>' +
        '<p class="row" style="margin-top:1.4rem"><a class="btn" href="#mp-' + k + '">Practice all ' + S.n + ' ' + esc(S.short.toLowerCase()) + ' questions</a></p>' +
        '<section class="sec" id="m-types-' + k + '"><h3 class="h2">The ' + S.types.length + ' question types in this skill</h3><p class="lede">Every question in this skill belongs to one of these. Learn to recognize each one from the words in the question.</p>' +
          '<div class="mtypes">' + S.types.slice().sort(function (a, b) { return MTY[b].n - MTY[a].n; }).map(function (t) { return mTypeCard(t); }).join('') + '</div></section>' +
        '</div><aside class="mlesson-side" aria-label="Skills in this area"><p class="label">' + esc(d.name) + '</p><ul>' + d.skills.map(function (x) { return '<li><a href="#m-' + x + '"' + (x === k ? ' aria-current="page"' : '') + '>' + esc(MSK[x].short) + '</a></li>'; }).join('') + '</ul></aside></div>' +
        mNext(nav) + '</div>';
    }
    return {
      show: function (p) {
        p = p || 'home';
        if (p === page && built.mlearn) { return false; }
        built.mlearn = true; page = p;
        viewEl.mlearn.innerHTML = p === 'home' ? home() : skill(p);
        return true;
      },
      refresh: function () { var p = page; page = ''; this.show(p); }
    };
  }());

  /* ---------- Math: question finder ---------- */
  function buildMTypes() {
    if (built.mtypes) { return; }
    built.mtypes = true;
    var opts = '<option value="">All four areas</option>' + MD.domains.map(function (d) { return '<option value="' + d.id + '">' + esc(d.name) + '</option>'; }).join('');
    var trig = MD.trig.map(function (r) {
      return '<tr><td>“' + esc(r[0]) + '”</td><td><a href="#m-' + r[1] + '">' + esc(MSK[r[1]].short) + '</a></td><td class="num">' + r[3] + '%</td><td class="num">' + r[2] + '</td></tr>';
    }).join('');
    viewEl.mtypes.innerHTML = '<div class="wrap">' +
      mHead('Math · Question finder', 'Which kind of question is this?', 'Type a few words from a question, like “margin of error”, “vertex” or “perpendicular”, and see which question type it is and how to solve it. Every one of the ' + mfmt(MD.tot.n) + ' bank questions belongs to one of these ' + MORDER.length + ' types.') +
      '<div class="mfind"><label class="field"><span class="label">Words from the question</span><input type="text" id="mf-q" placeholder="for example: line of best fit" autocomplete="off"></label>' +
      '<label class="field"><span class="label">Area</span><select id="mf-d">' + opts + '</select></label></div>' +
      '<p class="muted" id="mf-n" aria-live="polite"></p><div class="mtypes" id="mf-list"></div>' +
      '<section class="sec"><h3 class="h2">Words that give the type away</h3><p class="lede">How often each phrase, when it appears in a question, belongs to the skill named. Measured on all ' + mfmt(MD.tot.n) + ' bank questions; read the lower ones as hints, not rules.</p>' +
      '<div class="tablewrap"><table class="mtable"><thead><tr><th>If the question says</th><th>It is usually</th><th>How often</th><th>Questions</th></tr></thead><tbody>' + trig + '</tbody></table></div></section>' +
      '</div>';
    var inp = $('#mf-q'), sel = $('#mf-d');
    function draw() {
      var q = inp.value.toLowerCase().trim(), d = sel.value, words = q.split(/\s+/).filter(Boolean);
      var list = MORDER.filter(function (t) {
        var T = MTY[t];
        if (d && MDOM[T.skill].id !== d) { return false; }
        if (!words.length) { return true; }
        var hay = (T.name + ' ' + T.spot + ' ' + T.steps.join(' ') + ' ' + MSK[T.skill].name).toLowerCase();
        return words.every(function (w) { return hay.indexOf(w) !== -1; });
      });
      if (!words.length) { list.sort(function (a, b) { return MTY[b].n - MTY[a].n; }); }
      $('#mf-n').textContent = list.length ? plural(list.length, 'question type') + (words.length ? ' match.' : ', most common first.') : 'No type matches those words. Try fewer or simpler words.';
      $('#mf-list').innerHTML = list.slice(0, 40).map(function (t) { return mTypeCard(t, { showSkill: true }); }).join('') + (list.length > 40 ? '<p class="muted">Showing 40. Type more words to narrow it down.</p>' : '');
    }
    inp.addEventListener('input', draw); sel.addEventListener('change', draw);
    draw();
  }

  /* ---------- Math: shortcuts ---------- */
  var MSHORT = [
    { id: 'backsolve', t: 'Try the answer choices', when: 'Any multiple-choice question whose choices are plain numbers.', how: ['Choices are usually in order. Try B or C first.', 'Put the choice into the original question.', 'Too big? Go smaller. Too small? Go bigger.'],
      ex: ['If (x − 2)(x + 5) = 18, what is the positive value of x?  A 2  B 3  C 4  D 7', 'Try B, x = 3: (1)(8) = 8. Too small.', 'Try C, x = 4: (2)(9) = 18. Correct: C.'] },
    { id: 'picknum', t: 'Pick a number', when: 'Choices with letters in them: “which expression is equivalent”, “in terms of”.', how: ['Choose an easy value such as 2 or 3 (not 0 or 1).', 'Work out the original with it.', 'Work out each choice; keep the one that matches. If two match, try a second number.'],
      ex: ['If 3a + 2b = 12, which gives a in terms of b?  A (12 − 2b)/3  B (12 + 2b)/3', 'Let b = 3: then 3a + 6 = 12, so a = 2.', 'A gives (12 − 6)/3 = 2. B gives 6. Answer: A.'] },
    { id: 'composite', t: 'Find x + y without finding x and y', when: 'A system that asks for x + y or x − y.', how: ['Add the two equations (or subtract them).', 'See if the result is a multiple of what is asked.'],
      ex: ['2x + 3y = 10 and 3x + 2y = 15. What is x + y?', 'Add: 5x + 5y = 25.', 'Divide by 5: x + y = 5.'] },
    { id: 'ratios', t: 'Count solutions without solving', when: '“no solution”, “infinitely many”, “exactly one solution”.', how: ['Two lines Ax + By = C: compare A₁/A₂, B₁/B₂, C₁/C₂.', 'First two different: one solution. First two equal, third different: none. All equal: infinitely many.', 'Quadratic: b² − 4ac positive, zero or negative gives 2, 1 or 0 solutions.'],
      ex: ['2x + 3y = 7 and 4x + 6y = 9', '2/4 = 3/6 = 1/2, but 7/9 is different.', 'Parallel lines: no solution.'] },
    { id: 'sumroots', t: 'Sum of the solutions in one line', when: '“What is the sum of the solutions…?” (nearly always Hard).', how: ['Write as ax² + bx + c = 0.', 'Sum = −b ÷ a. Product = c ÷ a.'],
      ex: ['2x² − 10x + 8 = 0', 'Sum = 10 ÷ 2 = 5.', 'Check: the roots are 1 and 4.'] },
    { id: 'vertex', t: 'The vertex is halfway between the zeros', when: 'Maximum, minimum or vertex of a parabola.', how: ['Find where the parabola crosses the x-axis.', 'The vertex x is the average of the two crossings.', 'Put that x back in to get the maximum or minimum value.'],
      ex: ['f(x) = x² − 6x + 5 = (x − 1)(x − 5)', 'Halfway between 1 and 5 is 3.', 'f(3) = −4. The minimum value is −4.'] },
    { id: 'multipliers', t: 'Percent changes: multiply, never add', when: 'Increases and decreases, one after another, or working back to an original.', how: ['Up p%: × (1 + p/100). Down p%: × (1 − p/100).', 'Several changes: multiply the multipliers.', 'Original value: divide by the multiplier.'],
      ex: ['Up 20%, then down 20%: 1.20 × 0.80 = 0.96, a 4% drop.', 'After 15% off, a coat costs $68: 68 ÷ 0.85 = $80.'] },
    { id: 'swap', t: 'a% of b = b% of a', when: 'An awkward percent of a friendly number.', how: ['Swap the two numbers if it makes the arithmetic easier.'],
      ex: ['4% of 75 = 75% of 4 = 3.', '18% of 50 = 50% of 18 = 9.'] },
    { id: 'totals', t: 'Work with totals, not averages', when: 'An average changes when a value is added or removed.', how: ['Total = mean × count.', 'Compare the totals before and after.'],
      ex: ['Five numbers average 12. What sixth number makes the average 14?', 'Totals: 6 × 14 = 84 and 5 × 12 = 60.', 'The sixth number is 84 − 60 = 24.'] },
    { id: 'triples', t: 'Spot a Pythagorean triple', when: 'A right triangle with two whole-number sides.', how: ['Divide both sides by a common factor.', 'Look for 3-4-5, 5-12-13, 8-15-17 or 7-24-25.'],
      ex: ['Legs 9 and 12: divide by 3 to get 3 and 4.', 'So the hypotenuse is 3 × 5 = 15.'] },
    { id: 'sincos', t: 'sin of one angle = cos of the other', when: 'Two angles that add to 90°.', how: ['sin(x°) = cos(90° − x°).', 'If sin A = 0.6 in a right triangle, cos B = 0.6.'],
      ex: ['sin(30°) = cos(60°) = 0.5.'] },
    { id: 'scale', t: 'Scale lengths, areas and volumes', when: 'A shape made bigger or smaller.', how: ['Lengths × k means areas × k² and volumes × k³.', 'Going back from volumes: take the cube root.'],
      ex: ['Triple every length: area × 9, volume × 27.', 'Volumes in ratio 8 : 27 means lengths in ratio 2 : 3.'] },
    { id: 'units', t: 'Let the units check the setup', when: 'Conversions and rates.', how: ['Write units on every number.', 'Arrange fractions so unwanted units cancel.', 'If the units left are not the ones asked for, the setup is upside down.'],
      ex: ['4.76 miles per second × 3,600 seconds per hour', 'Seconds cancel: 17,136 miles per hour.'] }
  ];
  function buildMShort() {
    if (built.mshort) { return; }
    built.mshort = true;
    var F = MD.facts;
    viewEl.mshort.innerHTML = '<div class="wrap">' +
      mHead('Math · Shortcuts', 'Faster ways to the right answer', 'Each shortcut is real mathematics, not a guessing trick. Use one when you recognize the shape; otherwise solve the normal way. The first two work on most multiple-choice questions (' + mfmt(F.mc) + ' of the ' + mfmt(MD.tot.n) + ' in the bank).') +
      '<div class="mshorts">' + MSHORT.map(function (s, i) {
        return '<article class="mshort" id="ms-' + s.id + '"><p class="mshort-n">' + (i + 1) + '</p><div><h3 class="h3">' + esc(s.t) + '</h3><p class="mspot"><span class="mtag">When</span> ' + esc(s.when) + '</p>' + mStepList(s.how) +
          '<div class="mex"><p class="mtag">Example</p><ol class="mex-l">' + s.ex.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ol></div></div></article>';
      }).join('') + '</div>' +
      '<section class="sec"><h3 class="h2">Shortcuts that do not work</h3><ul class="mfacts">' +
        '<li><b>Picking by answer letter.</b> In the bank, D is the answer to ' + mpc(F.mcLetters.H.D, F.mcLetters.H.A + F.mcLetters.H.B + F.mcLetters.H.C + F.mcLetters.H.D) + '% of Hard multiple-choice questions and B to ' + mpc(F.mcLetters.E.B, F.mcLetters.E.A + F.mcLetters.E.B + F.mcLetters.E.C + F.mcLetters.E.D) + '% of Easy ones, against 25% by chance. Number choices are listed smallest to largest, so this may only mean hard answers tend to be the bigger numbers. Do not use it.</li>' +
        '<li><b>Trying the choices on a typed-in question.</b> About one question in four (' + mfmt(F.grid) + ' in the bank) has no choices. Solve those directly.</li>' +
        '<li><b>Using Desmos for everything.</b> On a two-step question, typing it in takes longer than doing it by hand.</li>' +
      '</ul></section>' +
      mNext([['m-desmos', 'Next', 'Desmos playbook'], ['m-ref', 'Then', 'Formulas'], ['m-practice', 'Try them out', 'Practice real questions']]) + '</div>';
  }

  /* ---------- Math: formulas and Desmos ---------- */
  function buildMRef() {
    if (built.mref) { return; }
    built.mref = true;
    var on = [['Circle', 'A = πr²,  C = 2πr'], ['Rectangle', 'A = lw'], ['Triangle', 'A = ½bh'], ['Right triangle', 'c² = a² + b²'], ['Special right triangles', '45-45-90: x, x, x√2 · 30-60-90: x, x√3, 2x'], ['Box (rectangular prism)', 'V = lwh'], ['Cylinder', 'V = πr²h'], ['Sphere', 'V = (4/3)πr³'], ['Cone', 'V = (1/3)πr²h'], ['Pyramid', 'V = (1/3)lwh'], ['Angles', 'A circle has 360° = 2π radians. A triangle’s angles add to 180°.']];
    var off = [['Slope from two points', 'm = (y₂ − y₁) ÷ (x₂ − x₁)'], ['Line', 'y = mx + b; slope of Ax + By = C is −A/B'], ['Perpendicular slopes', 'm₁ × m₂ = −1'], ['Vertex form', 'y = a(x − h)² + k, vertex (h, k)'], ['Vertex x', 'x = −b ÷ 2a'], ['Quadratic formula', 'x = (−b ± √(b² − 4ac)) ÷ 2a'], ['Discriminant', 'b² − 4ac: positive 2, zero 1, negative 0 real solutions'], ['Sum and product of roots', '−b/a and c/a'], ['Circle equation', '(x − h)² + (y − k)² = r²'], ['Exponential model', 'y = a·bˣ; b = 1 + rate or 1 − rate'], ['Percent change', '(new − old) ÷ old'], ['SOH CAH TOA', 'sin = opp/hyp, cos = adj/hyp, tan = opp/adj'], ['Complementary angles', 'sin x° = cos(90° − x°)'], ['Polygon angles', 'Sum = 180(n − 2)'], ['Arc and sector', '(angle ÷ 360) × circumference or area'], ['Radians', 'π radians = 180°'], ['Exponent rules', 'xᵃxᵇ = xᵃ⁺ᵇ, (xᵃ)ᵇ = xᵃᵇ, x^(1/n) = n-th root']];
    function tbl(rows) { return '<div class="tablewrap"><table class="mtable"><tbody>' + rows.map(function (r) { return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>'; }
    viewEl.mref.innerHTML = '<div class="wrap">' +
      mHead('Math · Formulas', 'Formulas and typing in answers', 'You get a formula sheet on test day. Know what is on it, learn what is not, and know how to type in your own answers.') +
      '<div class="mref2"><section><h3 class="h2">On the formula sheet</h3><p class="lede">No need to memorize these. Practice finding them quickly.</p>' + tbl(on) + '</section>' +
      '<section><h3 class="h2">Not on the sheet: learn these</h3><p class="lede">These come up again and again and are not printed for you.</p>' + tbl(off) + '</section></div>' +
      '<section class="sec"><h3 class="h2">Desmos</h3><p class="lede">When the calculator saves time, and exactly what to type, is in the <a href="#m-desmos">Desmos playbook</a>: ' + MD.desmos.length + ' moves, each checked on real bank questions.</p></section>' +
      '<section class="sec"><h3 class="h2">Typing in your own answer</h3><ul class="mfacts">' +
        '<li>About one math question in four has no choices: you type the answer.</li>' +
        '<li>Fractions are fine: type 7/6. Do not type mixed numbers like 1 1/6.</li>' +
        '<li>A long decimal can be rounded or cut off, as long as it fills the space: 1.166 or 1.167 for 7/6.</li>' +
        '<li>Negative answers are allowed. Leave out units, commas, dollar signs and percent signs.</li>' +
        '<li>If more than one answer is correct, type just one.</li>' +
      '</ul></section>' +
      mNext([['m-desmos', 'Next', 'Desmos playbook'], ['m-practice', 'Or', 'Practice real questions']]) + '</div>';
  }

  /* ---------- Math: practice ---------- */
  var MP = null;                         /* the running set */
  var mpPreset = null;                   /* {kind:'skill'|'type'|'domain', id} from a link */
  function mpSettings() { var s = isObj(store.s.math) ? store.s.math : {}; return { topic: s.topic || 'all', diff: s.diff || 'all', n: s.n || 10, pick: s.pick || 'any', timer: s.timer !== false }; }
  /* step 1: what kind of set; step 2: a short group of big buttons for that kind */
  function mpKindHTML(topic) {
    var kind = topic === 'all' ? 'all' : topic.split(':')[0];
    var opts = [['all', 'Everything, mixed'], ['d', 'One area'], ['k', 'One skill'], ['p', 'One big pattern']];
    if (kind === 't') { opts.push(['t', 'One question type']); }
    return seg('mp-kind', '1 · What to practice', opts, kind);
  }
  function mpSubHTML(kind, topic) {
    var cur = topic && topic.indexOf(kind + ':') === 0 ? topic.slice(kind.length + 1) : '';
    function group(legend, opts) {
      if (!cur && opts.length) { cur = opts[0][0]; }
      return '<fieldset class="seg mpchips"><legend>' + legend + '</legend><div class="segrow">' + opts.map(function (o) {
        return '<label><input type="radio" name="mp-sub" value="' + o[0] + '"' + (o[0] === cur ? ' checked' : '') + '><span>' + esc(o[1]) + (o[2] ? ' <small>' + o[2] + '</small>' : '') + '</span></label>';
      }).join('') + '</div></fieldset>';
    }
    if (kind === 'd') { return group('Choose an area', MD.domains.map(function (d) { var n = d.skills.reduce(function (a, k) { return a + MSK[k].n; }, 0); return [d.id, d.name, n]; })); }
    if (kind === 'k') {
      if (!cur) { cur = MD.domains[0].skills[0]; }
      return MD.domains.map(function (d) {
        return '<fieldset class="seg mpchips"><legend>' + esc(d.name) + '</legend><div class="segrow">' + d.skills.map(function (k) {
          return '<label><input type="radio" name="mp-sub" value="' + k + '"' + (k === cur ? ' checked' : '') + '><span>' + esc(MSK[k].short) + ' <small>' + MSK[k].n + '</small></span></label>';
        }).join('') + '</div></fieldset>';
      }).join('');
    }
    if (kind === 'p') { return group('Choose a pattern', MD.patterns.map(function (p) { return [p.id, p.name, p.n]; })); }
    if (kind === 't') { return group('Question type', cur ? [[cur, MTY[cur].name, MTY[cur].n]] : []); }
    return '';
  }
  function mpTopicOptions(sel) {
    var h = '<option value="all"' + (sel === 'all' ? ' selected' : '') + '>Everything, mixed</option>';
    h += '<optgroup label="Big patterns">' + MD.patterns.map(function (p) { return '<option value="p:' + p.id + '"' + (sel === 'p:' + p.id ? ' selected' : '') + '>Pattern: ' + esc(p.name) + '</option>'; }).join('') + '</optgroup>';
    MD.domains.forEach(function (d) {
      h += '<optgroup label="' + esc(d.name) + '"><option value="d:' + d.id + '"' + (sel === 'd:' + d.id ? ' selected' : '') + '>All of ' + esc(d.name) + '</option>';
      d.skills.forEach(function (k) {
        h += '<option value="k:' + k + '"' + (sel === 'k:' + k ? ' selected' : '') + '>' + esc(MSK[k].name) + '</option>';
        MSK[k].types.forEach(function (t) { if (sel === 't:' + t) { h += '<option value="t:' + t + '" selected>   · ' + esc(MTY[t].name) + '</option>'; } });
      });
      h += '</optgroup>';
    });
    return h;
  }
  var MPAT = {};
  MD.patterns.forEach(function (p, i) { MPAT[p.id] = i; });
  /* one exact question, from a link such as #mq-4aaa9c42 */
  function mpOne(id) {
    var q = MQBY[id];
    if (!q) { mpSetup(); return; }
    clearInterval(mpInterval);
    MP = { qs: [q], i: 0, res: [], timer: false, over: false, one: true };
    mpShow();
  }
  function mpPool(s) {
    return MQ.filter(function (q) {
      var tp = s.topic;
      if (tp.indexOf('d:') === 0 && MDOM[q.k].id !== tp.slice(2)) { return false; }
      if (tp.indexOf('k:') === 0 && q.k !== tp.slice(2)) { return false; }
      if (tp.indexOf('t:') === 0 && q.t !== tp.slice(2)) { return false; }
      if (tp.indexOf('p:') === 0 && !(q.pm >> MPAT[tp.slice(2)] & 1)) { return false; }
      if (s.diff !== 'all' && q.d !== s.diff) { return false; }
      var r = mDone(q.id);
      if (s.pick === 'new' && r) { return false; }
      if (s.pick === 'missed' && !(r && !r[0])) { return false; }
      return true;
    });
  }
  function buildMPrac() {
    if (MP && !MP.over) { return; }
    mpSetup();
  }
  function mpSetup() {
    MP = null;
    var s = mpSettings();
    if (mpPreset) { s.topic = mpPreset; mpPreset = null; }
    viewEl.mprac.innerHTML = '<div class="wrap">' +
      mHead('Math · Practice', 'Practice real SAT questions', 'Every question is from College Board’s question bank, with College Board’s answer and explanation. After each one you also see how to solve that type of question.') +
      '<form class="mpset" id="mp-form"><div class="mpset-grid">' +
        mpKindHTML(s.topic) + '<div id="mp-sub" class="mpsub"></div>' +
        seg('mp-diff', '2 · How hard', [['all', 'Any'], ['E', 'Easy'], ['M', 'Medium'], ['H', 'Hard']], s.diff) +
        seg('mp-n', '3 · How many', [[5, '5'], [10, '10'], [22, '22 (one module)']], s.n) +
        seg('mp-pick', '4 · Which ones', [['any', 'Any'], ['new', 'Not tried yet'], ['missed', 'Ones I missed']], s.pick) +
        '<label class="checkline"><input type="checkbox" id="mp-timer"' + (s.timer ? ' checked' : '') + '> Show a timer (about 95 seconds a question on the real test)</label>' +
      '</div><p class="mpset-n" id="mp-count" aria-live="polite"></p><p class="row"><button class="btn big" type="submit" id="mp-go">Start practicing</button></p></form>' +
      '</div>';
    var form = $('#mp-form');
    function read() {
      var r = function (n) { var el = $('input[name="' + n + '"]:checked', form); return el ? el.value : ''; };
      var kind = r('mp-kind') || 'all', sub = r('mp-sub');
      return { topic: kind === 'all' ? 'all' : (sub ? kind + ':' + sub : 'all'), diff: r('mp-diff') || 'all', n: Number(r('mp-n')) || 10, pick: r('mp-pick') || 'any', timer: $('#mp-timer').checked };
    }
    function count() {
      var st = read(), n = mpPool(st).length;
      $('#mp-count').textContent = n ? mfmt(n) + ' questions match. You will get ' + Math.min(n, st.n) + '.' : 'No questions match these choices. Try “Any” for difficulty or for which ones.';
      $('#mp-go').disabled = !n;
    }
    function drawSub(keep) {
      var kind = (form.querySelector('input[name="mp-kind"]:checked') || {}).value || 'all';
      $('#mp-sub').innerHTML = mpSubHTML(kind, keep);
    }
    form.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'mp-kind') { drawSub(''); }
      count();
    });
    drawSub(s.topic);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var st = read(); store.s.math = st; save();
      var pool = shuffle(mpPool(st).slice()).slice(0, st.n);
      if (!pool.length) { return; }
      MP = { qs: pool, i: 0, res: [], timer: st.timer, over: false, settings: st };
      mpShow();
    });
    count();
  }
  function mpElapsed() { if (!MP || !MP.cur) { return 0; } var c = MP.cur; return (c.acc + (c.t0 ? now() - c.t0 : 0)) / 1000; }
  function mpPause() { if (MP && MP.cur && MP.cur.t0 && !MP.cur.done) { MP.cur.acc += now() - MP.cur.t0; MP.cur.t0 = 0; } }
  function mpResume() { if (MP && MP.cur && !MP.cur.t0 && !MP.cur.done && !MP.over) { MP.cur.t0 = now(); } }
  function mpTick() {
    var el = $('#mp-clock');
    if (!el || !MP || !MP.cur) { return; }
    var s = mpElapsed();
    el.textContent = clock(s);
    el.classList.toggle('over', s > 95);
  }
  var mpInterval = null;
  function mpShow() {
    var q = MP.qs[MP.i], T = MTY[q.t], S = MSK[q.k];
    MP.cur = { q: q, t0: now(), acc: 0, done: false };
    var ans = q.mc
      ? '<div class="mpchoices" role="group" aria-label="Your answer">' + ['A', 'B', 'C', 'D'].map(function (L, i) { return '<button class="mpch" type="button" data-k="' + L + '"><span class="mpch-l">' + L + '</span><span class="kbd">' + (i + 1) + '</span></button>'; }).join('') + '</div><p class="fine">Choose the letter of your answer. The choices are in the question above.</p>'
      : '<form class="mpgrid" id="mp-gform"><label class="field"><span class="label">Type your answer</span><input type="text" id="mp-gin" inputmode="decimal" autocomplete="off" placeholder="e.g. 12, −3, 7/6 or 2.5"></label><button class="btn" type="submit">Check</button></form><p class="fine">Numbers only. Fractions like 7/6 are fine; leave out units.</p>';
    viewEl.mprac.innerHTML = '<div class="wrap mpwrap">' +
      '<div class="mpbar"><span class="mpbar-pos"><b>Question ' + (MP.i + 1) + '</b> of ' + MP.qs.length + '</span><span class="mpbar-dots" aria-hidden="true">' + MP.qs.map(function (x, i) { var r = MP.res[i]; return '<i class="' + (r ? (r.ok ? 'ok' : 'no') : (i === MP.i ? 'cur' : '')) + '"></i>'; }).join('') + '</span>' + (MP.timer ? '<span class="mpclock" id="mp-clock" aria-label="Time on this question">0:00</span>' : '') + '<button class="linkbtn" type="button" id="mp-end">End set</button></div>' +
      '<article class="mpcard"><header class="mpcard-h"><span class="mtag">' + esc(S.name) + '</span><span class="mdiff d' + q.d + '">' + MDIFF[q.d] + '</span><span class="muted">' + (q.mc ? 'Multiple choice' : 'Type in your answer') + '</span></header>' +
        '<div class="mpq">' + mImg('q', q) + '</div><p class="mpzoom"><button class="linkbtn" type="button" data-zoom="q">See the question larger</button></p>' + ans +
        '<div id="mp-fb" class="mpfb" tabindex="-1" hidden></div></article></div>';
    if (q.mc) {
      $$('.mpch', viewEl.mprac).forEach(function (b) { b.addEventListener('click', function () { mpAnswer(b.getAttribute('data-k')); }); });
    } else {
      $('#mp-gform').addEventListener('submit', function (e) { e.preventDefault(); mpAnswer($('#mp-gin').value); });
    }
    $('#mp-end').addEventListener('click', function () { mpPause(); mpSummary(); });
    clearInterval(mpInterval);
    if (MP.timer) { mpInterval = setInterval(mpTick, 500); }
    var first = $('.mpch', viewEl.mprac) || $('#mp-gin');
    window.scrollTo(0, 0);
    if (first && !narrow()) { focusQuiet(first); }
  }
  /* full-size viewer: the original page image at one image pixel per CSS pixel, scrollable both ways */
  function mpZoom(kind) {
    var q = MP && MP.cur ? MP.cur.q : null;
    if (!q) { return; }
    var d = document.getElementById('mzoom');
    if (!d) {
      d = document.createElement('dialog'); d.id = 'mzoom'; d.className = 'mzoom';
      d.innerHTML = '<div class="mzoom-bar"><p class="mzoom-t"></p><button class="btn sm" type="button" data-close>Close</button></div><div class="mzoom-body"></div>';
      document.body.appendChild(d);
      d.addEventListener('click', function (e) { if (e.target === d || (e.target.closest && e.target.closest('[data-close]'))) { d.close(); } });
    }
    $('.mzoom-t', d).textContent = kind === 'q' ? 'Question, full size. Scroll or pinch to move around.' : 'Explanation, full size. Scroll or pinch to move around.';
    var w = kind === 'q' ? q.qw : q.rw, h = kind === 'q' ? q.qh : q.rh;
    $('.mzoom-body', d).innerHTML = '<img class="mimg" src="' + MIMG + kind + '/' + q.id + '.webp" width="' + w + '" height="' + h + '" alt="">';
    if (d.showModal) { d.showModal(); } else { d.setAttribute('open', ''); }
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-zoom]') : null;
    if (b) { mpZoom(b.getAttribute('data-zoom')); }
  });
  function mpNum(s) {
    s = String(s).trim().replace(/[−–]/g, '-').replace(/\s+/g, '').replace(/,/g, '');
    var m = /^(-?)(\d*\.?\d+)\/(\d*\.?\d+)$/.exec(s);
    if (m) { var v = parseFloat(m[2]) / parseFloat(m[3]); return m[1] ? -v : v; }
    if (/^-?\d*\.?\d+$/.test(s)) { return parseFloat(s); }
    return NaN;
  }
  function mpGridOK(input, forms) {
    var v = mpNum(input);
    if (isNaN(v)) { return null; }
    var dec = (String(input).split('.')[1] || '').replace(/\D/g, '').length;
    return forms.some(function (f) {
      var w = mpNum(f);
      if (Math.abs(v - w) < 1e-9) { return true; }
      return dec >= 3 && Math.abs(v - w) <= 0.5 * Math.pow(10, -dec) + 1e-12;
    });
  }
  function mpAnswer(given) {
    var c = MP.cur, q = c.q;
    if (c.done) { return; }
    var ok;
    if (q.mc) { ok = given === q.a; }
    else {
      ok = mpGridOK(given, q.a);
      if (ok === null) { var fbx = $('#mp-fb'); fbx.hidden = false; fbx.className = 'mpfb warn'; fbx.innerHTML = '<p>Type a number, such as 12, −3, 2.5 or 7/6.</p>'; return; }
    }
    mpPause(); c.done = true;
    var secs = Math.round(mpElapsed());
    MP.res[MP.i] = { id: q.id, ok: ok, secs: secs, given: given };
    store.m[q.id] = [ok ? 1 : 0, secs, Date.now()]; save();
    clearInterval(mpInterval); mpTick();
    if (q.mc) {
      $$('.mpch', viewEl.mprac).forEach(function (b) {
        var k = b.getAttribute('data-k'); b.disabled = true;
        if (k === q.a) { b.classList.add('right'); } else if (k === given) { b.classList.add('wrong'); }
      });
    } else { $('#mp-gin').disabled = true; $('#mp-gform button').disabled = true; }
    var T = MTY[q.t], last = MP.i === MP.qs.length - 1;
    var right = q.mc ? q.a : q.a.join(' or ');
    var fb = $('#mp-fb');
    fb.hidden = false; fb.className = 'mpfb ' + (ok ? 'ok' : 'no');
    fb.innerHTML = '<p class="mpverdict">' + (ok ? 'Correct.' : 'Not this time.') + ' <span>College Board’s answer: <b>' + esc(right) + '</b>' + (q.mc ? '' : (q.a.length > 1 ? ' (any of these is accepted)' : '')) + '</span>' + (MP.timer ? ' <span class="muted">· ' + secs + ' s</span>' : '') + '</p>' +
      '<div class="mpstrat"><p class="mtag">This is a “' + esc(T.name) + '” question</p>' + mStepList(T.steps) + '<p class="mtrap"><span class="mtag bad">Watch out</span> ' + esc(T.trap) + '</p>' + mDesLine(T) + '<a class="linkbtn" href="#mt-' + q.t + '">More on this type</a></div>' +
      '<details class="mprat"' + (ok ? '' : ' open') + '><summary>College Board’s explanation</summary><div class="mpq">' + mImg('r', q) + '</div><p class="mpzoom"><button class="linkbtn" type="button" data-zoom="r">See the explanation larger</button></p></details>' +
      '<p class="row mpnext"><button class="btn big" type="button" id="mp-next">' + (last ? 'See my results' : 'Next question') + '</button><span class="fine">or press Enter</span></p>';
    $('#mp-next').addEventListener('click', mpNextQ);
    showFeedback(fb);
  }
  function mpNextQ() {
    if (!MP) { return; }
    if (MP.cur && !MP.cur.done) { return; }
    if (MP.i < MP.qs.length - 1) { MP.i++; mpShow(); } else { mpSummary(); }
  }
  function mpSummary() {
    clearInterval(mpInterval);
    MP.over = true;
    var done = MP.res.filter(Boolean), right = done.filter(function (r) { return r.ok; }).length;
    var avg = done.length ? Math.round(done.reduce(function (a, r) { return a + r.secs; }, 0) / done.length) : 0;
    var missedTypes = {};
    done.forEach(function (r) { if (!r.ok) { var t = MQBY[r.id].t; missedTypes[t] = (missedTypes[t] || 0) + 1; } });
    var mt = Object.keys(missedTypes);
    viewEl.mprac.innerHTML = '<div class="wrap">' + mHead('Math · Practice', done.length ? 'You got ' + right + ' of ' + done.length + ' right' : 'Set ended', done.length ? 'Average time ' + avg + ' seconds a question (the real test allows about 95).' : '') +
      (mt.length ? '<section class="msec"><h3 class="h3">Question types to review</h3><div class="mtypes">' + mt.map(function (t) { return mTypeCard(t, { showSkill: true }); }).join('') + '</div></section>' : (done.length ? '<p class="mpraise">Every one right. Try a harder set.</p>' : '')) +
      '<section class="msec"><h3 class="h3">Your answers</h3><ol class="mpsum">' + done.map(function (r) {
        var q = MQBY[r.id];
        return '<li class="' + (r.ok ? 'ok' : 'no') + '"><span class="mpsum-v">' + (r.ok ? '✓' : '✗') + '</span><span>' + esc(MTY[q.t].name) + ' <span class="muted">· ' + MDIFF[q.d] + ' · ' + r.secs + ' s</span></span><a class="linkbtn" href="#mt-' + q.t + '">How to solve</a></li>';
      }).join('') + '</ol></section>' +
      '<p class="row" style="margin-top:1.5rem"><button class="btn big" type="button" id="mp-again">Practice again</button>' + (mt.length ? '<button class="btn ghost" type="button" id="mp-miss">Retry the ones I missed</button>' : '') + '</p></div>';
    $('#mp-again').addEventListener('click', mpSetup);
    var mm = $('#mp-miss');
    if (mm) { mm.addEventListener('click', function () { var pool = done.filter(function (r) { return !r.ok; }).map(function (r) { return MQBY[r.id]; }); MP = { qs: pool, i: 0, res: [], timer: MP.timer, over: false }; mpShow(); }); }
    window.scrollTo(0, 0);
  }
  function mpKey(e, key, tag) {
    if (!MP || MP.over || !MP.cur) { return; }
    if (!MP.cur.done) {
      if (!MP.cur.q.mc) { return; }
      var k = key.toUpperCase(), n = ['1', '2', '3', '4'].indexOf(key);
      if (n !== -1) { k = 'ABCD'[n]; }
      if (k.length === 1 && 'ABCD'.indexOf(k) !== -1) { e.preventDefault(); mpAnswer(k); }
    } else if (key === 'Enter' && tag !== 'BUTTON' && tag !== 'A' && tag !== 'SUMMARY') { e.preventDefault(); mpNextQ(); }
  }

  /* ---------- Math: big patterns and the Desmos playbook ---------- */
  var MCOL = ['#c74440', '#2d70b3', '#388c46', '#6042a6', '#fa7e19', '#000000'];
  function mDesBox(lines) {
    return '<ol class="mdbox" aria-label="What to type in Desmos">' + lines.map(function (l, i) {
      return '<li><span class="mdbox-n">' + (i + 1) + '</span><i style="background:' + MCOL[i % MCOL.length] + '"></i><code>' + esc(l) + '</code></li>';
    }).join('') + '</ol>';
  }
  function mProof(ids) {
    if (!ids || !ids.length) { return ''; }
    return '<div class="mproof"><p class="mtag ok">Checked on real questions</p><ul>' + ids.map(function (id) {
      var q = MQBY[id], v = MD.verified[id];
      if (!q || !v) { return ''; }
      return '<li><a class="mproof-a" href="#mq-' + id + '"><span class="mproof-id">' + id + '</span><span class="mdiff d' + q.d + '">' + MDIFF[q.d] + '</span><span class="mproof-how">' + esc(v.how) + '</span><span class="mproof-try">Try it →</span></a></li>';
    }).join('') + '</ul></div>';
  }
  function mOpenAll(host) {
    return '<p class="mopenall"><button class="linkbtn" type="button" data-openall="' + host + '">Open all</button> · <button class="linkbtn" type="button" data-closeall="' + host + '">Close all</button></p>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-openall],[data-closeall]') : null;
    if (!b) { return; }
    var open = b.hasAttribute('data-openall'), host = document.getElementById(b.getAttribute(open ? 'data-openall' : 'data-closeall'));
    if (host) { $$('details', host).forEach(function (d) { d.open = open; }); }
  });
  function mReach(o) {
    return '<p class="mreach"><b>' + mfmt(o.n) + '</b> questions · ' + (100 * o.n / MD.tot.n).toFixed(1) + '% of the bank · <b>' + mpc(o.H, o.n) + '%</b> Hard ' + mmix(o) + '</p>';
  }
  function buildMPat() {
    if (built.mpat) { return; }
    built.mpat = true;
    var P = MD.patterns, anyN = 0;
    MQ.forEach(function (q) { if (q.pm) { anyN++; } });
    var multi = MQ.filter(function (q) { var c = 0, m = q.pm; while (m) { c += m & 1; m >>= 1; } return c >= 2; }).length;
    var idx = P.map(function (p, i) {
      return '<a class="mpidx" href="#mpat-' + p.id + '"><span class="mpidx-n">' + (i + 1) + '</span><b>' + esc(p.name) + '</b><span>' + mfmt(p.n) + ' questions · ' + mpc(p.H, p.n) + '% Hard</span></a>';
    }).join('');
    var cards = P.map(function (p, i) {
      var moves = p.desmos.map(function (id) { var m = MMOVE[id]; return '<a class="mmove" href="#md-' + id + '">Move ' + m.n + ': ' + esc(m.name) + '</a>'; }).join(' ');
      var first = MMOVE[p.desmos[0]];
      var ex = p.example ? '<div class="mpex"><p class="mtag">Example</p><p class="mpex-q">' + esc(p.example.q) + '</p>' + mDesBox(p.example.desmos) + '<p class="mex-c">' + esc(p.example.result) + '</p></div>' : '';
      return '<details class="mpat" id="mpat-' + p.id + '"><summary class="mpat-sum"><header class="mpat-h"><span class="mpat-n">' + (i + 1) + '</span><div><h3 class="h2">' + esc(p.name) + '</h3>' + mReach(p) + '</div></header>' +
        '<p class="mpat-idea">' + esc(p.idea) + '</p><span class="mpat-more" aria-hidden="true"></span></summary><div class="mpat-body">' +
        '<div class="mpat-grid"><div><p class="mtag">You will see</p><p>' + esc(p.spot) + '</p></div><div><p class="mtag">By hand</p><p>' + esc(p.hand) + '</p></div></div>' +
        '<div class="mpat-des"><p class="mtag des">In Desmos</p><p class="mpat-moves">' + moves + '</p>' + (p.example ? '' : mDesBox(first.type)) + '</div>' +
        ex +
        '<p class="mpat-conn"><span class="mtag">Connects</span> ' + p.types.map(function (t) { return '<a class="mchip" href="#mt-' + t + '">' + esc(MTY[t].name) + '</a>'; }).join('') + '</p>' +
        '<p class="mcheck"><span class="mtag">Is it really a pattern?</span> ' + esc(p.check) + '</p>' +
        mProof(p.proof) +
        '<p class="row" style="margin-top:.4rem"><a class="btn sm" href="#mpp-' + p.id + '">Practice this pattern (' + mfmt(p.n) + ')</a></p></div></details>';
    }).join('');
    var rare = MD.rare.slice().sort(function (a, b) { return b.H / Math.max(b.n, 1) - a.H / Math.max(a.n, 1); }).map(function (r) {
      var m = r.desmos ? MMOVE[r.desmos] : null, tries = (r.proof.length ? r.proof : r.ids).slice(0, 2);
      return '<article class="mrare"><h3 class="h3">' + esc(r.name) + '</h3><p class="mreach"><b>' + r.n + '</b> questions · <b>' + mpc(r.H, r.n) + '%</b> Hard</p><p>' + esc(r.trick) + '</p>' +
        (m ? '<p><a class="mmove" href="#md-' + m.id + '">Move ' + m.n + ': ' + esc(m.name) + '</a></p>' : '') +
        '<p class="mrare-try">' + tries.map(function (id) { return '<a class="linkbtn" href="#mq-' + id + '">Try ' + id + '</a>'; }).join(' · ') + '</p></article>';
    }).join('');
    viewEl.mpat.innerHTML = '<div class="wrap">' +
      mHead('Math · Big patterns', 'A dozen ideas under every question', 'College Board sorts math into 19 skills, but the same few ideas keep solving questions in different skills. We tagged all ' + mfmt(MD.tot.n) + ' bank questions by the idea that solves them: ' + P.length + ' ideas reach ' + mpc(anyN, MD.tot.n) + '% of the bank, and ' + mpc(multi, MD.tot.n) + '% of questions use two or more. Learn the idea once and it works everywhere it appears.') +
      '<div class="mnote"><p><b>How this was checked.</b> Each question was tagged from its type and from the method College Board’s own explanation uses, so the counts are close, not exact. Then ' + MD.nver + ' real bank questions were solved with the Desmos moves on this page and every answer was compared with College Board’s answer key: all ' + MD.nver + ' matched.</p></div>' +
      '<nav class="mpidxs" aria-label="The patterns">' + idx + '</nav>' +
      mOpenAll('mpats') + '<div class="mpats" id="mpats">' + cards + '</div>' +
      '<section class="sec" id="mrare"><h3 class="h2">Rare patterns worth memorizing</h3><p class="lede">Each of these appears only a handful of times in the bank, but most are Hard, so one memorized trick can be worth a hard question. Sorted from most often Hard.</p><div class="mrares">' + rare + '</div></section>' +
      mNext([['m-desmos', 'Next', 'Desmos playbook'], ['mpp-constant', 'Hardest pattern', 'Practice “A constant plus one fact”']]) + '</div>';
  }
  function buildMDes() {
    if (built.mdes) { return; }
    built.mdes = true;
    var chooser = [
      ['an equation with one unknown', 'both'], ['“how many solutions”, “sum of the solutions”', 'zero'], ['two kinds of tickets, coins, tents, mixtures', 'twolines'],
      ['four number choices', 'list'], ['percents of percents, a chain of facts', 'chain'], ['a constant: “no solution”, “touches”, “passes through”', 'slide'],
      ['“greatest integer value of the constant”', 'swapx'], ['“equivalent … where a, b, c are constants”, a table', 'fit'], ['maximum, minimum, vertex, zeros', 'dots'],
      ['constants known only as “a > 7”, “0 < a < b”', 'legal'], ['x² + y² + Dx + Ey = F', 'circle'], ['mean, median, missing value', 'stats'],
      ['inequalities, “which point is a solution”', 'shade'], ['f(3), f(x) = 10, “which table”', 'machine']
    ].map(function (r) { var m = MMOVE[r[1]]; return '<tr><td>' + esc(r[0]) + '</td><td><a class="mmove" href="#md-' + m.id + '">Move ' + m.n + ': ' + esc(m.name) + '</a></td></tr>'; }).join('');
    var moves = MD.desmos.map(function (m) {
      var used = MORDER.filter(function (t) { return MTY[t].dmove === m.id; });
      var nq = used.reduce(function (a, t) { return a + MTY[t].n; }, 0);
      return '<details class="mmovecard" id="md-' + m.id + '"><summary class="mpat-sum"><header class="mpat-h"><span class="mpat-n des">' + m.n + '</span><div><h3 class="h2">' + esc(m.name) + '</h3><p class="mreach">' + esc(m.short) + (used.length ? ' · first choice for ' + plural(used.length, 'question type') + ', ' + mfmt(nq) + ' bank questions' : '') + '</p></div></header>' +
        '<p><span class="mtag">Use it for</span> ' + esc(m.when) + '</p><span class="mpat-more" aria-hidden="true"></span></summary><div class="mpat-body">' +
        '<div><p class="mtag des">Type this</p>' + mDesBox(m.type) + '</div>' +
        '<p><span class="mtag">You will see</span> ' + esc(m.see) + '</p>' +
        '<p><span class="mtag">Why it works</span> ' + esc(m.why) + '</p>' +
        '<p class="mtrap"><span class="mtag bad">Watch out</span> ' + esc(m.watch) + '</p>' +
        mProof(m.proof) + '</div></details>';
    }).join('');
    var bySkill = MD.domains.map(function (d) {
      return '<details class="mtbld"><summary>' + esc(d.name) + ' <span class="muted">· ' + d.skills.reduce(function (a, k) { return a + MSK[k].types.length; }, 0) + ' question types</span></summary><div class="tablewrap"><table class="mtable mtbl"><tbody>' + d.skills.map(function (k) {
        return '<tr class="mtbl-sk"><th colspan="2">' + esc(MSK[k].name) + '</th></tr>' + MSK[k].types.map(function (t) {
          var T = MTY[t], m = T.dmove ? MMOVE[T.dmove] : null;
          return '<tr><td><a href="#mt-' + t + '">' + esc(T.name) + '</a></td><td>' + (m ? '<a class="mmove" href="#md-' + m.id + '">' + m.n + ' · ' + esc(m.name) + '</a> ' : '<span class="muted">By hand · </span>') + esc(T.dtext) + '</td></tr>';
        }).join('');
      }).join('') + '</tbody></table></div></details>';
    }).join('');
    viewEl.mdes.innerHTML = '<div class="wrap">' +
      mHead('Math · Desmos playbook', MD.desmos.length + ' Desmos moves, and exactly what to type', 'The digital SAT has the Desmos graphing calculator built in, for every math question. These moves turn the hardest algebra into reading a graph. Each one was checked on real questions from College Board’s bank: ' + MD.nver + ' questions solved, all ' + MD.nver + ' matching College Board’s answers.') +
      '<section class="sec first"><h3 class="h2">Before you start: eight things Desmos does not tell you</h3><div class="mgotchas">' + MD.gotchas.map(function (g) { return '<div class="mgotcha"><b>' + esc(g[0]) + '</b><span>' + esc(g[1]) + '</span></div>'; }).join('') + '</div></section>' +
      '<section class="sec"><h3 class="h2">Which move?</h3><div class="tablewrap"><table class="mtable"><thead><tr><th>If the question has…</th><th>Use</th></tr></thead><tbody>' + chooser + '</tbody></table></div></section>' +
      '<section class="sec"><h3 class="h2">The ' + MD.desmos.length + ' moves</h3><p class="lede">Tap a move to see what to type, what you will see, and the real questions it was checked on.</p>' + mOpenAll('mmoves') + '<div class="mmoves" id="mmoves">' + moves + '</div></section>' +
      '<section class="sec" id="md-types"><h3 class="h2">Every question type, the Desmos way</h3><p class="lede">For each of the ' + MORDER.length + ' question types: the move to use, or why to do it by hand.</p><div class="mtblds">' + bySkill + '</div></section>' +
      mNext([['m-patterns', 'The ideas behind the moves', 'Big patterns'], ['m-practice', 'Try the moves', 'Practice real questions']]) + '</div>';
  }
