  /* =================== Math: Algebra foundations =================== */
  /* The six moves underneath almost every question, each with the idea, a worked example, the usual slip, why it works,
     and a drill of its own cards. The cards are written by src/math/foundations.py (D.mdrills.found) and tagged with the
     section they practice (r: 'm-found-<id>'); src/check/found_check.py works every answer out again with sympy. */
  function mfr(a, b) { return '<span class="fr"><span>' + a + '</span><span>' + b + '</span></span>'; }
  var MFOUND = [
    { id: 'frac', name: 'Fractions', short: 'Fractions',
      idea: 'Add or subtract only when the bottoms match. Multiply straight across. To divide, multiply by the second fraction turned upside down.',
      ex: [mfr(2, 3) + ' + ' + mfr(1, 4) + '<span class="mfx-n">The bottoms differ, so rewrite both over 12.</span>',
        mfr(8, 12) + ' + ' + mfr(3, 12) + ' = ' + mfr(11, 12),
        mfr(2, 3) + ' × ' + mfr(3, 5) + ' = ' + mfr(6, 15) + ' = ' + mfr(2, 5) + '<span class="mfx-n">Tops times tops, bottoms times bottoms.</span>',
        mfr(2, 3) + ' ÷ ' + mfr(4, 5) + ' = ' + mfr(2, 3) + ' × ' + mfr(5, 4) + ' = ' + mfr(10, 12) + ' = ' + mfr(5, 6)],
      slip: 'Adding the tops and adding the bottoms: 2/3 + 1/4 is not 3/7. A quick sense check catches it. 2/3 on its own is already more than a half, and 3/7 is less than a half.',
      why: 'Only pieces of the same size can be counted together. Thirds and quarters are different sizes, so cut both into twelfths: two thirds is 8 twelfths and a quarter is 3 twelfths, 11 twelfths in all. Dividing 2/3 by 4/5 asks how many 4/5 fit into 2/3. Exactly 5/4 of them fit into 1, so 2/3 × 5/4 of them fit into 2/3.',
      words: 'fraction fractions add subtract multiply divide common denominator numerator reciprocal flip' },
    { id: 'iso', name: 'Getting x alone', short: 'Getting x alone',
      idea: 'Undo what was done to x, last step first, and do exactly the same thing to both sides.',
      ex: ['3x − 7 = 11',
        '3x = 18<span class="mfx-n">Add 7 to both sides.</span>',
        'x = 6<span class="mfx-n">Divide both sides by 3. Check: 3(6) − 7 = 11.</span>',
        'P = 2l + 2w<span class="mfx-n">A formula works the same way. Solve it for w.</span>',
        'P − 2l = 2w<span class="mfx-n">Subtract 2l from both sides.</span>',
        'w = ' + mfr('P − 2l', 2) + '<span class="mfx-n">Divide both sides by 2.</span>'],
      slip: 'Dividing only part of a side. When both sides are divided by 2, every term is divided: (P − 2l)/2 is P/2 − l, not P/2 − 2l. When x is on both sides, gather the x-terms on one side before anything else.',
      why: 'An equation says two amounts are equal. Do the same thing to both and they stay equal, like adding the same weight to both pans of a balance. Work backward because the last thing done to x sits on the outside: in 3x − 7, x was tripled and then 7 was taken away, so put the 7 back first and undo the tripling second.',
      words: 'isolate isolating solve for x literal equation formula in terms of undo inverse operations both sides' },
    { id: 'expr', name: 'Solving for an expression', short: 'A whole expression',
      idea: 'When the question asks for something like 2x + 3, check whether the equation is already a multiple of it. Then one division answers the question and x is never needed.',
      ex: ['4x + 6 = 18<span class="mfx-n">What is the value of 2x + 3?</span>',
        '2(2x + 3) = 18<span class="mfx-n">4x + 6 is 2 × (2x + 3).</span>',
        '2x + 3 = 9<span class="mfx-n">Divide both sides by 2. Done, without finding x.</span>',
        'x + y = 9 and x − y = 5<span class="mfx-n">What is 2x?</span>',
        '2x = 14<span class="mfx-n">Add the two equations: the y-terms cancel.</span>'],
      slip: 'Answering with x. Solving 4x + 6 = 18 gives x = 3, and the value of x is often waiting among the wrong choices. Read the last sentence again before you choose.',
      why: 'Equal amounts stay equal when you halve both. 2x + 3 is exactly half of 4x + 6, so it must be half of 18. Adding two equations works for the same reason: equal amounts added to equal amounts give equal totals.',
      more: 'More of this: <a href="#mpat-disguise">The same expression in disguise</a> and <a href="#ms-composite">Find x + y without finding x and y</a>. The whole family, with a tell for each kind: <a href="#m-first">Look for the shortcut first</a>.',
      words: 'expression value of 2x + 3 x + y without solving multiple target disguise' },
    { id: 'dist', name: 'Distributing and factoring', short: 'Distributing, factoring',
      idea: 'A number in front of a bracket multiplies every term inside it. Factoring runs that backward: take out what every term shares.',
      ex: ['−3(2x − 5) = −6x + 15<span class="mfx-n">−3 × 2x = −6x, and −3 × (−5) = +15.</span>',
        '(x + 2)(x + 3) = x² + 3x + 2x + 6 = x² + 5x + 6<span class="mfx-n">Every term in one bracket times every term in the other.</span>',
        '6x + 9 = 3(2x + 3)<span class="mfx-n">Both terms share a 3.</span>',
        'x² + 5x + 6 = (x + 2)(x + 3)<span class="mfx-n">2 and 3 multiply to 6 and add to 5.</span>'],
      slip: 'Multiplying only the first term, or losing a sign: −3(2x − 5) is neither −6x − 5 nor −6x − 15. A minus sign in front of a bracket flips every sign inside: −(4x − 3) = −4x + 3.',
      why: '3(2x + 3) means three copies of 2x + 3. Three copies hold three 2x’s and three 3’s, which is 6x + 9. Factoring counts the copies: 6x + 9 is three copies of 2x + 3. Multiply back out to check any factoring.',
      words: 'distribute distributive property expand brackets parentheses factor factoring foil multiply out minus sign' },
    { id: 'like', name: 'Combining like terms', short: 'Like terms',
      idea: 'Only terms of the same kind combine: x-terms with x-terms, x²-terms with x²-terms, plain numbers with plain numbers. The sign in front of a term belongs to it.',
      ex: ['4x + 7 − 2x + 3 − x',
        '4x − 2x − x = x<span class="mfx-n">The x-terms, each with its own sign.</span>',
        '7 + 3 = 10<span class="mfx-n">The plain numbers.</span>',
        'x + 10',
        'x² + x² = 2x²<span class="mfx-n">Two of the same thing: the power stays 2.</span>'],
      slip: 'Merging different kinds: 2x + 3 is not 5x, and x² + x² is not x⁴. Or dropping a minus sign: in 4x + 7 − 2x, the 2x is taken away.',
      why: 'x and x² are different quantities, like meters and square meters: 3 meters plus 2 square meters is not 5 of anything. Combining is distributing backward: 4x − 2x − x = (4 − 2 − 1)x = 1x. Powers add only when you multiply: x² · x² = x⁴.',
      words: 'like terms combine combining collect simplify similar terms add subtract' },
    { id: 'den', name: 'An unknown in a denominator', short: 'Unknowns on the bottom',
      idea: 'Multiply both sides by the bottoms to clear them, solve what is left, then put the answer back in. An answer that makes a bottom 0 is thrown out.',
      ex: [mfr(6, 'x') + ' = ' + mfr(3, 'x − 2'),
        '6(x − 2) = 3x<span class="mfx-n">Multiply both sides by x(x − 2), that is, cross-multiply.</span>',
        '6x − 12 = 3x, so x = 4<span class="mfx-n">Check: 6/4 = 1.5 and 3/2 = 1.5.</span>',
        mfr('x', 'x − 3') + ' = ' + mfr(3, 'x − 3'),
        'x = 3<span class="mfx-n">Multiply both sides by x − 3.</span>',
        'No solution<span class="mfx-n">x = 3 makes both bottoms 0, so it is thrown out.</span>'],
      slip: 'Keeping an answer that makes a bottom 0. Also, multiplying only one side, or only one term, by the bottom.',
      why: 'Multiplying both sides by the same amount keeps them equal, unless that amount is 0. When x = 3, multiplying by x − 3 is multiplying by 0, and 0 times anything is 0, so that step can let in an answer that does not work in the original. The check at the end catches it.',
      words: 'denominator denominators rational equation fraction with x cross multiply extraneous solution no solution undefined zero' }
  ];
  var MFOUNDBY = {};
  MFOUND.forEach(function (f, i) { f.n = i + 1; MFOUNDBY[f.id] = f; });
  function mFoundCards(id) { return ((D.mdrills || {}).found || []).filter(function (c) { return !id || c.r === 'm-found-' + id; }); }
  /* Easy Algebra questions: how many the bank has, and how many you have tried and still have wrong */
  function mFoundRecord() {
    var o = { n: 0, easy: 0, tried: 0, missed: 0 };
    MQ.forEach(function (q) {
      if (q.d !== 'E') { return; }
      o.easy += 1;
      if (MDOM[q.k].id !== 'alg') { return; }
      o.n += 1;
      var r = mDone(q.id);
      if (r) { o.tried += 1; if (!r[0]) { o.missed += 1; } }
    });
    return o;
  }
  /* for the map and the lessons: a pointer here once three Easy Algebra misses are standing */
  function mFoundNudgeHTML() {
    var r = mFoundRecord();
    if (r.missed < 3) { return ''; }
    return '<aside class="mnote mfound-nudge"><p><b>' + plural(r.missed, 'Easy Algebra question') + ' still missed.</b> When Easy questions go wrong, check the basic steps first: fractions, getting x alone, signs in brackets. <a href="#m-found">Algebra basics</a> has a short refresher and a short exercise for each.</p></aside>';
  }
  function mFoundYouHTML() {
    var r = mFoundRecord();
    if (!r.tried) {
      return '<p><b>Not sure you need this page?</b> Practice ten Easy Algebra questions first. If several go wrong even though you knew the topic, come back here.</p><a class="btn sm" href="#m-found-practice">Practice Easy Algebra questions</a>';
    }
    return '<p><b>Your Easy Algebra questions:</b> ' + r.tried + ' of the ' + r.n + ' tried, ' + (r.missed ? r.missed + ' still wrong.' : 'none still wrong.') +
      (r.missed >= 3 ? ' That is the pattern this page is for: work through the sections, practice the ones that feel shaky, then try those questions again.' : '') + '</p>' +
      '<a class="btn sm" href="#m-found-practice">Practice Easy Algebra questions</a>';
  }
  function buildMFound() {
    if (built.mfound) { $('#mfound-you').innerHTML = mFoundYouHTML(); return; }
    built.mfound = true;
    var r = mFoundRecord(), all = mFoundCards().length;
    viewEl.mfound.innerHTML = '<div class="wrap">' +
      mHead('Math · Algebra basics', 'Six basic steps every question takes for granted', 'Fractions, getting x alone, solving for a whole expression, brackets and factoring, combining like terms, and an unknown on the bottom of a fraction. The lessons assume you can do these. When Easy questions go wrong even though you know the topic, check these steps first. Algebra is the biggest share of the easy questions: ' + r.n + ' of the bank’s ' + mfmt(r.easy) + ' Easy questions are Algebra.') +
      '<aside class="mnote" id="mfound-you">' + mFoundYouHTML() + '</aside>' +
      '<nav class="mfound-toc" aria-label="The six moves">' + MFOUND.map(function (f) { return '<a class="mchip" href="#m-found-' + f.id + '">' + f.n + ' · ' + esc(f.short) + '</a>'; }).join('') + '</nav>' +
      MFOUND.map(function (f) {
        var n = mFoundCards(f.id).length;
        return '<section class="sec mfound" id="m-found-' + f.id + '"><h3 class="h2">' + f.n + ' · ' + esc(f.name) + '</h3>' +
          '<p class="mfound-idea">' + esc(f.idea) + '</p>' +
          '<div class="mex"><p class="mtag">Worked example</p><ol class="mfx">' + f.ex.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ol></div>' +
          '<div class="mtrapbox"><p class="mtag bad">The usual slip</p><p>' + esc(f.slip) + '</p></div>' +
          '<div class="mtipbox"><p class="mtag">Why it works</p><p>' + esc(f.why) + '</p></div>' +
          (f.more ? '<p class="fine mfound-more">' + f.more + '</p>' : '') +
          (n ? '<p class="row mfound-go"><a class="btn sm" href="#m-drills" data-drill="mfound" data-drill-ref="m-found-' + f.id + '">Practice this step · ' + n + ' cards</a></p>' : '') +
          '</section>';
      }).join('') +
      '<section class="sec"><h3 class="h2">Then go back to real questions</h3><p class="lede">The short exercise mixes all six steps. Every wrong choice in it is a real mistake, with a note on what went wrong. Then try Easy Algebra questions from the bank again.</p>' +
        '<p class="row"><a class="btn" href="#m-drills" data-drill="mfound">Practice all six · ' + all + ' cards</a><a class="btn ghost" href="#m-found-practice">Practice Easy Algebra questions</a></p></section>' +
      nextHTML(['m-learn', 'Go on to the lessons', 'One lesson for each kind of math on the test.'], ['m-found-practice', 'practice easy algebra questions first']) + '</div>';
  }
