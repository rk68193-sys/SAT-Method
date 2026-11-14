  /* =================== Math: Look for the shortcut first =================== */
  /* Six kinds of question where what is asked for drops out in a step or two, each with its tell, the move, a worked
     example, what to watch, and its bank questions to try; then the look-alikes, where the short way is not there, and
     where picking numbers fits. The bank questions and a note on each come from src/math/shortcut_first.py (D.mfirst),
     which works every note out again and matches it to College Board's answer. After a practice answer, the note for
     that question appears in the feedback (mFirstFeedbackHTML). */
  var MFIRST = [
    { id: 'scale', name: 'A multiple of what you know', short: 'Multiples',
      tell: 'You are given a multiple of x, or a small expression such as 2x + 3, and asked for a different multiple, sometimes with a number added: 4x is given and 24x is asked for, or 3x − 8 is given and 3x + 8 is asked for.',
      move: 'Work out what turns the given expression into the one asked for, and do exactly that to both sides of the equation: multiply, divide, or add a number.',
      ex: ['3x = 7<span class="mfx-n">What is 12x?</span>',
        '12x = 4 × 3x = 4 × 7 = 28<span class="mfx-n">12x is four lots of 3x. Finding x first means working with 7/3.</span>',
        '5x − 2 = 13<span class="mfx-n">What is 5x + 6?</span>',
        '5x + 6 = 13 + 8 = 21<span class="mfx-n">5x + 6 is 8 more than 5x − 2, so add 8 to both sides.</span>'],
      watch: 'Answering with x. The value of x is often waiting among the wrong choices, so read the last line again before you choose. And check the factor: going from 4x to 24x is × 6, not × 20.',
      more: 'More of this: <a href="#m-found-expr">Solving for an expression</a> in Algebra basics, and <a href="#m-study-L1-target_expression.scale">this kind of question in detail</a>.',
      tries: ['2e8cc1c0', '9b886541', 'fa80893a'],
      words: 'multiple value of an expression 2x + 3 24x scale times shift add the same number both sides without solving for x' },
    { id: 'block', name: 'The same bracket twice', short: 'Same bracket',
      tell: 'The same bracket shows up more than once, such as 5(x + 4) and 4(x + 4), and the question asks for the bracket or for something close to it. Sometimes the bracket is hidden: 2x − 6 is 2(x − 3).',
      move: 'Treat the bracket as one unknown. Collect the bracket terms the way you would collect x-terms, then solve for the bracket. Do not multiply it out.',
      ex: ['7(x − 2) + 5 = 3(x − 2) + 25<span class="mfx-n">What is x − 2?</span>',
        '4(x − 2) = 20<span class="mfx-n">Take 3(x − 2) and 5 from both sides.</span>',
        'x − 2 = 5<span class="mfx-n">Divide by 4. Done, and x itself was never needed.</span>',
        mfr('2x − 3', 5) + ' = ' + mfr('2x − 3', 8) + '<span class="mfx-n">What is 2x − 3?</span>',
        '2x − 3 = 0<span class="mfx-n">A fifth of a number equals an eighth of it only when the number is 0.</span>'],
      watch: 'Expanding everything. It gets there, but it takes longer, and each expansion is a chance to drop a sign. And the answer is the bracket, not x.',
      more: 'More of this: <a href="#m-study-L1-target_expression.block">this kind of question in detail</a>, with every bank question.',
      tries: ['620abf36', '7a5a74a6', 'aee9fd2d'],
      words: 'bracket parentheses same expression twice repeated group treat as one unknown substitution' },
    { id: 'combine', name: 'Add or subtract the equations', short: 'Add the equations',
      tell: 'Two equations, and the question asks for a combination such as x + y, x − y or 8x + 7y, not for x or y alone.',
      move: 'Add the two equations, or take one from the other, and see whether the result is the combination asked for or a multiple of it. If neither works, try twice one equation plus the other.',
      ex: ['3x + 5y = 21 and 5x + 3y = 11<span class="mfx-n">What is x + y?</span>',
        '8x + 8y = 32<span class="mfx-n">Add the equations.</span>',
        'x + y = 4<span class="mfx-n">Divide by 8. Solving for each letter gives x = −1/2 and y = 9/2: more steps, and fractions.</span>'],
      watch: 'Forcing it. If one equation already says y = …, put that into the other equation instead. That is quicker than hunting for a combination, as the look-alikes below show.',
      more: 'More of this: <a href="#ms-composite">Find x + y without finding x and y</a> on the Shortcut list, and <a href="#m-study-SYS-target">this kind of question in detail</a>.',
      tries: ['608eeb6e', '570b5a5d', '3a84f885'],
      words: 'system of equations x + y x − y add subtract elimination combination sum difference' },
    { id: 'roots', name: 'Sum or product of the solutions', short: 'Sum of solutions',
      tell: 'The question asks for the sum or the product of the solutions, not for the solutions themselves.',
      move: 'Move everything to one side: ax² + bx + c = 0. The two solutions add up to −b/a and multiply to c/a. When the equation is (x − h)² = d or |x − h| = d, the two solutions sit the same distance either side of h, so they add up to 2h. When it is already factored, read the solutions off.',
      ex: ['2x² − 9x + 4 = 0<span class="mfx-n">What are the sum and the product of the solutions?</span>',
        'sum = ' + mfr(9, 2) + ', product = ' + mfr(4, 2) + ' = 2<span class="mfx-n">−b/a and c/a. Check: the solutions are 4 and 1/2.</span>',
        '|x − 6| = 10<span class="mfx-n">What is the sum of the solutions?</span>',
        '2 × 6 = 12<span class="mfx-n">The solutions are 10 either side of 6: 16 and −4.</span>'],
      watch: 'Reading b before everything is on one side: in x(x + 1) = 4x, b is −3 only after you rearrange it to x² − 3x = 0. And −b/a and c/a are for quadratics with real solutions: if b² − 4ac is negative, there are no real solutions to add.',
      more: 'More of this: <a href="#ms-sumroots">Sum of the solutions in one line</a> on the Shortcut list, <a href="#mpat-symmetry">A parabola is symmetric</a> in Big ideas, and <a href="#m-study-NEQ-root_sum">this kind of question in detail</a>.',
      tries: ['ff2e5c76', '158591f0', '722de804'],
      words: 'sum of the solutions product of the solutions roots −b/a c/a quadratic absolute value' },
    { id: 'match', name: 'Match the two sides', short: 'Match the sides',
      tell: 'The words “for all x”, “equivalent”, “can be rewritten as” or “infinitely many solutions”, and one or more constants to find.',
      move: 'Those words say the two sides are the same expression written two ways. Expand both sides and match them part by part: x² with x², x with x, number with number. Each match is an equation for the constants. Asked for a + b + c in ax² + bx + c? Put x = 1 into the other side.',
      ex: ['(2x + k)(x − 3) = 2x² − x − 15<span class="mfx-n">This is true for all x. What is k?</span>',
        '2x² + (k − 6)x − 3k<span class="mfx-n">Expand the left side.</span>',
        'k − 6 = −1, so k = 5<span class="mfx-n">Match the x-terms. Check the numbers: −3k = −15.</span>',
        '(x + 2)(3x − 1) = ax² + bx + c<span class="mfx-n">What is a + b + c?</span>',
        '(1 + 2)(3 − 1) = 6<span class="mfx-n">Put x = 1 into both sides: the right side becomes a + b + c.</span>'],
      watch: 'Matching only works when the equation holds for every x. An ordinary equation, true for one value of x, cannot be matched part by part: see the look-alikes.',
      more: 'More of this: <a href="#mpat-disguise">The same expression in disguise</a> in Big ideas, and these kinds of question in detail: <a href="#m-study-EQV-coefficient">matching coefficients</a>, <a href="#m-study-L1-identity">infinitely many solutions</a> and <a href="#m-study-SYS-infinite">a system with infinitely many solutions</a>.',
      tries: ['371cbf6b', 'f237ccfc', '571174f3'],
      words: 'equivalent for all x identity infinitely many solutions coefficients match compare rewritten constant a + b + c same line' },
    { id: 'mirror', name: 'Halfway between equal heights', short: 'Halfway',
      tell: 'A parabola, and two inputs that give the same output: the two zeros, two times at the same height, two prices with the same sales. Or the vertex and one of a pair.',
      move: 'A parabola is symmetric about the vertical line through its vertex, so the vertex is exactly halfway between any two inputs with equal outputs. Average the two inputs to find the vertex; reflect across the vertex to find a missing partner.',
      ex: ['f(x) = (x − 3)(x + 11)<span class="mfx-n">For what x is f(x) smallest?</span>',
        'x = ' + mfr('3 + (−11)', 2) + ' = −4<span class="mfx-n">The zeros are 3 and −11, and the lowest point is halfway between them.</span>',
        'A ball leaves a 2 m ledge and is back at 2 m after 5 s.<span class="mfx-n">When is it highest?</span>',
        'At 2.5 s<span class="mfx-n">0 s and 5 s give the same height, so the top is halfway between them.</span>'],
      watch: 'Only equal outputs count. If two inputs give different outputs, the vertex is not halfway between them. And this is a parabola fact: a line or an exponential curve has no turning point to be halfway to.',
      more: 'More of this: <a href="#ms-vertex">Find the vertex exactly</a> on the Shortcut list, <a href="#mpat-symmetry">A parabola is symmetric</a> in Big ideas, and this kind of question in detail: <a href="#m-study-NF-vertex.symmetry">equal outputs either side of a vertex</a>.',
      tries: ['8e1da169', '271ffad7', 'bba18ecb'],
      words: 'parabola vertex symmetric symmetry halfway average zeros maximum minimum highest lowest axis of symmetry' }
  ];
  /* Look-alikes: they look like one of the six kinds, but the short way is not there. tries: the bank's examples. */
  var MFIRSTX = [
    { id: 'x-sub', name: 'x + y when y is already given', of: 'combine',
      looks: 'A system that asks for x + y or x − y, where one equation already reads y = 4x or y = 3x + 9.',
      why: 'Adding or subtracting the equations gives some other mix of x and y, not a multiple of the one asked for, so nothing drops out in one step.',
      instead: 'Substitute: put the y = … expression into the other equation, solve for x, then find y and combine.',
      tries: ['ea8bd66f', 'bd45df49', '1362ccde'] },
    { id: 'x-divide', name: 'Dividing away a bracket', of: 'block',
      looks: 'The same bracket on both sides of a quadratic, such as 3(x − 2) = (x − 2)(x + 5).',
      why: 'Dividing both sides by x − 2 looks like kind 2, but it is only allowed when x − 2 is not 0, so it throws away the solution x = 2 and leaves x = −2 alone.',
      instead: 'Move everything to one side and take out the bracket: (x − 2)(x + 5 − 3) = 0, so x = 2 or x = −2.',
      tries: ['7028c74f'] },
    { id: 'x-cubic', name: 'Three factors', of: 'roots',
      looks: 'The sum or product of the solutions of an equation with three factors, such as (x − 3)(x + 1)(x − 2) = 0.',
      why: '−b/a and c/a are for quadratics. Multiplying this one out gives a plain number of +6, but the product of the solutions is 3 × (−1) × 2 = −6.',
      instead: 'Read the solutions off the factors, here 3, −1 and 2, and add or multiply them.',
      tries: ['911383f2'] },
    { id: 'x-match', name: '“For all x” is missing', of: 'match',
      looks: 'An equation with a constant to find, but no “for all x”, “equivalent” or “infinitely many solutions”.',
      why: 'Matching parts only works for an equation that holds for every x. If 4x + 9 = ax + 1 is true only when x = 2, matching would give a = 4 and 9 = 1, which is nonsense.',
      instead: 'Put in the value of x the question gives: 8 + 9 = 2a + 1, so a = 8.',
      tries: [] },
    { id: 'x-half', name: 'Halfway between unequal outputs', of: 'mirror',
      looks: 'A quadratic with two known points whose outputs differ, such as f(1) = 3 and f(5) = 11.',
      why: 'The halfway rule needs equal outputs. Nothing puts the vertex at x = 3 here.',
      instead: 'Find the equation first, then use its vertex form or −b/(2a).',
      tries: [] }
  ];
  var MFIRSTBY = {};
  MFIRST.forEach(function (f, i) { f.n = i + 1; MFIRSTBY[f.id] = f; });
  MFIRSTX.forEach(function (f) { MFIRSTBY[f.id] = f; });
  function mFirstData() { return (D.mfirst || {}).qs || {}; }
  /* the bank questions filed under a kind ('x' for all the look-alikes) */
  function mFirstIds(kind) {
    var Q = mFirstData();
    return Object.keys(Q).filter(function (id) { return MQBY[id] && (kind === 'x' ? Q[id].k.indexOf('x-') === 0 : Q[id].k === kind); });
  }
  function mFirstCount(ids) {
    var o = { E: 0, M: 0, H: 0 };
    ids.forEach(function (id) { o[MQBY[id].d] += 1; });
    return o;
  }
  function mFirstTryHTML(ids) {
    var L = ids.filter(function (id) { return MQBY[id]; });
    if (!L.length) { return ''; }
    return '<p class="mfirst-try"><span class="label">Try one</span>' + L.map(function (id) { return '<a class="mchip" href="#mq-' + id + '">' + MDIFF[MQBY[id].d] + ' · ' + id + '</a>'; }).join('') + '</p>';
  }
  /* after a practice answer: the short way for this question, or why it was not there */
  function mFirstFeedbackHTML(id) {
    var e = mFirstData()[id], f = e ? MFIRSTBY[e.k] : null;
    if (!f) { return ''; }
    var x = e.k.indexOf('x-') === 0;
    return '<aside class="mfirst-fb' + (x ? ' x' : '') + '"><p class="mtag' + (x ? ' bad' : '') + '">' + (x ? 'Looks like a shortcut, but isn’t' : 'A shortcut works here') + '</p>' +
      '<p><b>' + esc(f.name) + '.</b> ' + esc(e.n) + '</p>' +
      '<a class="linkbtn" href="#m-first-' + f.id + '">' + (x ? 'Why the short way is not there' : 'How to spot this kind') + '</a></aside>';
  }
  /* a practice set: one kind's questions, or (no kind) ten mixed: one of each kind, two look-alikes, two more */
  function mFirstPractice(kind) {
    clearInterval(mpInterval); mpPause();
    var ids;
    if (kind) { ids = shuffle(mFirstIds(kind)).slice(0, 10); }
    else {
      var rest = [];
      ids = [];
      MFIRST.forEach(function (f) { var L = shuffle(mFirstIds(f.id)); if (L.length) { ids.push(L[0]); rest = rest.concat(L.slice(1)); } });
      ids = ids.concat(shuffle(mFirstIds('x')).slice(0, 2));
      ids = shuffle(ids.concat(shuffle(rest).slice(0, Math.max(0, 10 - ids.length))));
    }
    MP = { qs: ids.map(function (id) { return MQBY[id]; }), i: 0, res: [], timer: false, over: false };
    mpShow();
  }
  function buildMFirst() {
    if (built.mfirst) { return; }
    built.mfirst = true;
    var all = [], allX = mFirstIds('x');
    MFIRST.forEach(function (f) { all = all.concat(mFirstIds(f.id)); });
    var hard = all.filter(function (id) { return MQBY[id].d === 'H'; }).length;
    viewEl.mfirst.innerHTML = '<div class="wrap">' +
      mHead('Math · Look for a shortcut', 'Look for the shortcut first', 'Some questions ask for something other than x: 24x, x + 4, x + y, the sum of the solutions, a constant in an identity. Many of them are built so that the thing asked for drops out in a step or two, while finding x first takes longer and leaves more room for slips. Six kinds come up again and again: ' + all.length + ' bank questions, ' + hard + ' of them Hard. Learn the clue that gives each one away, and the look-alikes where the short way is not there.') +
      '<section class="mfirst-habit" aria-labelledby="mfirst-habit-h"><h3 class="h3" id="mfirst-habit-h">The habit, before you solve anything</h3><ol class="msteps">' +
        '<li><span><b>Read the last line first.</b> What exactly is asked for: x itself, or something built from it, such as 3x + 1, x + y or the sum of the solutions?</span></li>' +
        '<li><span><b>Look for it in what you are given.</b> Is that expression, or a multiple of it, already sitting in the equation? Do the words “for all x”, “equivalent” or “infinitely many” appear?</span></li>' +
        '<li><span><b>Take the short way only when a tell below fits.</b> If none does, solve the normal way. A shortcut you have to force is not a shortcut.</span></li>' +
      '</ol></section>' +
      '<nav class="mfound-toc" aria-label="The six kinds">' + MFIRST.map(function (f) { return '<a class="mchip" href="#m-first-' + f.id + '">' + f.n + ' · ' + esc(f.short) + '</a>'; }).join('') +
        '<a class="mchip" href="#m-first-fakes">Look-alikes</a><a class="mchip" href="#m-first-picknum">Picking numbers</a></nav>' +
      MFIRST.map(function (f) {
        var ids = mFirstIds(f.id), c = mFirstCount(ids), n = ids.length;
        return '<section class="sec mfound mfirst" id="m-first-' + f.id + '"><h3 class="h2">' + f.n + ' · ' + esc(f.name) + '</h3>' +
          '<p class="mfirst-line"><span class="mtag">The tell</span> ' + esc(f.tell) + '</p>' +
          '<p class="mfirst-line"><span class="mtag">The move</span> ' + esc(f.move) + '</p>' +
          '<div class="mex"><p class="mtag">Worked example</p><ol class="mfx">' + f.ex.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ol></div>' +
          '<div class="mtrapbox"><p class="mtag bad">Watch out</p><p>' + esc(f.watch) + '</p></div>' +
          '<p class="fine mfirst-n">' + plural(n, 'bank question') + ' of this kind: ' + ['E', 'M', 'H'].filter(function (d) { return c[d]; }).map(function (d) { return c[d] + ' ' + MDIFF[d]; }).join(', ') + '.</p>' +
          mFirstTryHTML(f.tries) +
          (n ? '<p class="row mfound-go"><a class="btn sm" href="#m-first-practice-' + f.id + '">' + (n > 10 ? 'Practice 10 of the ' + n : 'Practice all ' + n) + '</a></p>' : '') +
          '<p class="fine mfound-more">' + f.more + '</p></section>';
      }).join('') +
      '<section class="sec mfound mfirst" id="m-first-fakes"><h3 class="h2">Look-alikes: when the short way is not there</h3>' +
        '<p class="lede">Each of these looks like one of the six kinds. Taking the shortcut anyway gives a wrong answer or no answer, so check the tell before you start.</p>' +
        '<div class="mfirst-fakes">' + MFIRSTX.map(function (f) {
          return '<article class="mfirst-fake" id="m-first-' + f.id + '"><h4 class="h3">' + esc(f.name) + '</h4>' +
            '<p><span class="mtag">Looks like</span> <a href="#m-first-' + f.of + '">' + esc(MFIRSTBY[f.of].name) + '</a>. ' + esc(f.looks) + '</p>' +
            '<p><span class="mtag bad">Why not</span> ' + esc(f.why) + '</p>' +
            '<p><span class="mtag">Instead</span> ' + esc(f.instead) + '</p>' + mFirstTryHTML(f.tries) + '</article>';
        }).join('') + '</div>' +
        (allX.length ? '<p class="row mfound-go"><a class="btn sm" href="#m-first-practice-x">Practice the ' + allX.length + ' look-alike questions</a></p>' : '') + '</section>' +
      '<section class="sec mfound mfirst" id="m-first-picknum"><h3 class="h2">Picking numbers: a check, not the first move</h3>' +
        '<p class="lede">Putting your own number in for x is a good way to check an answer, and a way out when the algebra stalls on a “which expression is equivalent” question. Do the algebra first when you can: picking numbers breaks down in three places.</p>' +
        '<ul class="mfacts">' +
          '<li><b>Constants fixed by a condition.</b> When a question says the equation has infinitely many solutions, or the system has none, the constant is set by that condition. No value of x you try will show it.</li>' +
          '<li><b>“No solution” and “infinitely many solutions”.</b> A number can show that an equation holds at that number. It cannot show that the equation holds for every x, or for none.</li>' +
          '<li><b>Choices that agree at your number.</b> At x = 2, the expressions x², 2x and x + 2 are all 4. If two choices give the same value, try a second, less friendly number, such as 7.</li>' +
        '</ul>' +
        '<p class="fine mfound-more">Putting x = 1 into an identity, as in kind 5, is not guessing: the two sides are equal for every x, so they are equal at 1. Putting in a value the question gives you, such as a point on a graph, is exact too. The steps for picking numbers are on the Shortcut list: <a href="#ms-picknum">Pick a number</a>.</p></section>' +
      '<section class="sec" id="m-first-mix"><h3 class="h2">Then mix them: shortcut or not?</h3>' +
        '<p class="lede">Ten bank questions from all six kinds and the look-alikes, shuffled. Before you work each one, decide whether there is a short way and which tell gave it away. After each answer, a note shows the short way for that question, or why it was not there.</p>' +
        '<p class="row"><a class="btn" href="#m-first-practice">Shortcut or not? · 10 questions</a></p></section>' +
      nextHTML(['m-first-practice', 'Practice these questions', 'Real test questions where the short way works.'], ['m-short', 'see the full shortcut list']) + '</div>';
  }
