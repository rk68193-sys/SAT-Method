"""Cards for the Algebra foundations drill (imported by mdrills.py into src/build/mdrills.json as "found").

Six topics, each card tagged with k (topic) and r (its section on the foundations page, #m-found-<topic>):
  frac  fractions: add, subtract, multiply, divide
  iso   isolating a variable, in equations and in formulas
  expr  solving for an expression instead of for x
  dist  distributing and factoring
  like  combining like terms
  den   unknowns in denominators, including a solution that has to be thrown out

Every card asks one of four kinds of question, written into the prompt so src/check/found_check.py can read it back:
"Which is equal to it?", "What is x?", "What is the value of <expression>?" or "Solve for <letter>."
"""
from fractions import Fraction as Fr
from mdrills import M, SQ, fr, num, numf, poly, lin, coef, opt, shift

TOPIC = {'frac': 'Fractions', 'iso': 'Isolating a variable', 'expr': 'Solving for an expression', 'dist': 'Distributing and factoring',
         'like': 'Combining like terms', 'den': 'Unknowns in denominators'}


def box(*lines):
    return '<div class="mxbox">' + ''.join('<p class="mxl">%s</p>' % l for l in lines) + '</div>'


def ask(q):
    return '<p class="dask">%s</p>' % q


def frac_text(v):
    return numf(v)


def gen_found(rng):
    cards = []

    def add(k, prompt, q, right, wrongs, why):
        o = [opt('a', right)] + [opt('w%d' % i, l, n) for i, (l, n) in enumerate(wrongs)]
        labels = [x[1] for x in o]
        assert len(set(labels)) == len(labels), labels
        rng.shuffle(o)
        cards.append({'id': 'g%02d' % (len(cards) + 1), 'k': k, 'p': box(prompt) + ask(q), 'o': o, 'a': 'a', 'x': why, 'r': 'm-found-' + k})

    # ---------------------------------------------------------------- fractions
    for a, b, c, d in [(2, 3, 1, 4), (1, 2, 1, 3), (3, 4, 1, 6), (2, 5, 1, 2)]:
        s = Fr(a, b) + Fr(c, d)
        L = b * d // __import__('math').gcd(b, d)
        wr = [(numf(Fr(a + c, b + d)), 'Adding the tops and the bottoms does not work: the pieces are different sizes. Rewrite both over %d first.' % L),
              (numf(Fr(a + c, L)), 'Over %d, the tops change too: %s and %s.' % (L, fr(a * L // b, L), fr(c * L // d, L))),
              (numf(Fr(a * c, b * d)), 'That multiplies the fractions.')]
        add('frac', '%s + %s' % (fr(a, b), fr(c, d)), 'Which is equal to it?', numf(s), wr,
            'Rewrite both over %d: %s + %s = %s.%s' % (L, fr(a * L // b, L), fr(c * L // d, L), fr(a * L // b + c * L // d, L),
                                                   '' if s.denominator == L else ' That simplifies to %s.' % numf(s)))
    for a, b, c, d in [(3, 4, 1, 3), (5, 6, 1, 4)]:
        s = Fr(a, b) - Fr(c, d)
        L = b * d // __import__('math').gcd(b, d)
        wr = [(numf(Fr(a - c, b - d)), 'Subtracting the tops and the bottoms does not work. Rewrite both over %d first.' % L),
              (numf(Fr(a - c, L)), 'Over %d, the tops change too: %s and %s.' % (L, fr(a * L // b, L), fr(c * L // d, L))),
              (numf(-s), 'Subtract in the order written: the first fraction minus the second.')]
        add('frac', '%s %s %s' % (fr(a, b), M, fr(c, d)), 'Which is equal to it?', numf(s), wr,
            'Rewrite both over %d: %s %s %s = %s.%s' % (L, fr(a * L // b, L), M, fr(c * L // d, L), fr(a * L // b - c * L // d, L),
                                                    '' if s.denominator == L else ' That simplifies to %s.' % numf(s)))
    for a, b, c, d in [(2, 3, 3, 5), (3, 4, 2, 7)]:
        s = Fr(a * c, b * d)
        wr = [(numf(Fr(a * d, b * c)), 'That flips the second fraction, which you do only when dividing.'),
              (numf(Fr(a + c, b + d)), 'Multiply the tops together and the bottoms together.'),
              (numf(Fr(a * c, b + d)), 'The bottoms multiply as well.')]
        add('frac', '%s × %s' % (fr(a, b), fr(c, d)), 'Which is equal to it?', numf(s), wr,
            'Multiply the tops and the bottoms: %s = %s.' % (fr('%d × %d' % (a, c), '%d × %d' % (b, d)), numf(s)))
    for a, b, c, d in [(2, 3, 4, 5), (3, 8, 3, 4)]:
        s = Fr(a * d, b * c)
        wr = [(numf(Fr(a * c, b * d)), 'That multiplies. Dividing means multiplying by the flipped second fraction.'),
              (numf(Fr(b * c, a * d)), 'Flip the second fraction, not the first.'),
              (numf(Fr(b * d, a * c)), 'Only the second fraction flips.')]
        add('frac', '%s ÷ %s' % (fr(a, b), fr(c, d)), 'Which is equal to it?', numf(s), wr,
            'Dividing by %s asks how many %s fit, which is the same as multiplying by %s: %s × %s = %s.'
            % (fr(c, d), fr(c, d), fr(d, c), fr(a, b), fr(d, c), numf(s)))

    # ---------------------------------------------------------------- isolating a variable
    for a, b, c in [(3, -7, 11), (5, 4, 39), (4, -9, 15), (6, 5, -13)]:
        x = Fr(c - b, a)
        assert x.denominator == 1
        wr = [(num(Fr(c + b, a)), 'To undo %s, %s %d, not %s it.' % ('+ %d' % b if b > 0 else '%s %d' % (M, -b), 'subtract' if b > 0 else 'add', abs(b), 'add' if b > 0 else 'subtract')),
              (num(Fr(c, a) - b), 'Undo in reverse order: move the %d first, then divide by %d.' % (abs(b), a)),
              (num(Fr(c - b) * a), 'To undo × %d, divide by %d.' % (a, a))]
        wr = [w for w in wr if w[0] != num(x)]
        add('iso', '%s = %s' % (lin(a, b), num(c)), 'What is x?', num(x), wr[:3],
            '%s %d from both sides: %sx = %s. Then divide both sides by %d: x = %s.' % ('Subtract' if b > 0 else 'Add', abs(b), a, num(c - b), a, num(x)))
    for a, b, c, d in [(7, 2, 3, 18), (5, -3, 2, 9), (9, -4, 4, 21)]:
        x = Fr(d - b, a - c)
        assert x.denominator == 1
        wr = [(num(Fr(d - b, a + c)), 'Subtract %dx from both sides: %d %s %d, not %d + %d.' % (c, a, M, c, a, c)),
              (num(Fr(d + b, a - c)), 'Move the %d by %s it on both sides.' % (abs(b), 'subtracting' if b > 0 else 'adding')),
              (num(-x), 'Check the signs: put your answer back into both sides.')]
        add('iso', '%s = %s' % (lin(a, b), lin(c, d)), 'What is x?', num(x), wr,
            'Take %dx from both sides and %s %d: %dx = %s. Divide by %d: x = %s.' % (c, 'subtract' if b > 0 else 'add', abs(b), a - c, num(d - b), a - c, num(x)))
    for f, var, right, wrongs, why in [
            ('P = 2l + 2w', 'w', 'w = %s' % fr('P %s 2l' % M, 2), [('w = P %s %s' % (M, fr('2l', 2)), 'Divide the whole of P − 2l by 2, not just one term.'),
                                                                   ('w = %s' % fr('P + 2l', 2), 'Subtract 2l from both sides to move it.'),
                                                                   ('w = %s' % fr('P', 2) + ' %s 2l' % M, 'The 2l has to be divided by 2 as well.')],
             'Subtract 2l from both sides: P − 2l = 2w. Divide both sides by 2: w = (P − 2l) ÷ 2.'),
            ('V = %sBh' % fr(1, 3), 'h', 'h = %s' % fr('3V', 'B'), [('h = %s' % fr('V', '3B'), 'Multiplying by one third is undone by multiplying by 3, so the 3 goes on top.'),
                                                                    ('h = 3VB', 'Undo × B by dividing by B.'),
                                                                    ('h = %s' % fr('B', '3V'), 'h is on top: h = 3V ÷ B.')],
             'Multiply both sides by 3: 3V = Bh. Divide both sides by B: h = 3V ÷ B.'),
            ('y = mx + b', 'x', 'x = %s' % fr('y %s b' % M, 'm'), [('x = %s %s b' % (fr('y', 'm'), M), 'Divide the whole of y − b by m.'),
                                                                   ('x = %s' % fr('y + b', 'm'), 'Subtract b from both sides to move it.'),
                                                                   ('x = m(y %s b)' % M, 'Undo × m by dividing by m.')],
             'Subtract b from both sides: y − b = mx. Divide by m: x = (y − b) ÷ m.')]:
        add('iso', f, 'Solve for %s.' % var, right, wrongs, why.replace('−', M))

    # ---------------------------------------------------------------- solving for an expression
    for eqn, want, val, wrongs, why in [
            ('4x + 6 = 18', '2x + 3', 9, [('3', 'That is x. The question asks for 2x + 3.'), ('6', 'That is 2x; add the 3.'), ('12', 'That is 4x.')],
             '2x + 3 is half of 4x + 6, so it is half of 18: 9. No need to find x.'),
            ('3x %s 12 = 15' % M, 'x %s 4' % M, 5, [('9', 'That is x. The question asks for x − 4.'), ('27', 'That is 3x.'), ('3', 'Divide every term by 3: 15 ÷ 3 = 5.')],
             'x − 4 is a third of 3x − 12, so it is a third of 15: 5.'),
            ('5(x + 2) = 35', 'x + 2', 7, [('5', 'That is x. The question asks for x + 2.'), ('33', 'Divide by 5 rather than taking 2 away.'), ('9', 'Divide by 5 first, and stop there: x + 2 is what is asked.')],
             'Divide both sides by 5: x + 2 = 7. That is the answer; x itself is never needed.'),
            ('6x + 9y = 21', '2x + 3y', 7, [('21', 'That is 6x + 9y. Divide by 3.'), ('63', 'Divide by 3, not multiply.'), ('14', '21 ÷ 3 is 7.')],
             '2x + 3y is a third of 6x + 9y, so it is 21 ÷ 3 = 7. You cannot find x and y here, and you do not need to.'),
            ('x + y = 9 and x %s y = 5' % M, '2x', 14, [('7', 'That is x. The question asks for 2x.'), ('4', 'Adding the equations cancels y and gives 2x directly.'), ('2', 'That is y.')],
             'Add the two equations: the y-terms cancel and 2x = 14.'),
            ('%s = 6' % fr('x', 2), '%s' % fr('x', 4), 3, [('12', 'That is x.'), ('24', 'That is 2x. x ÷ 4 is half of x ÷ 2.'), ('1.5', 'Half of 6 is 3.')],
             'x ÷ 4 is half of x ÷ 2, so it is half of 6: 3.')]:
        lines = eqn.split(' and ')
        o = [opt('a', num(val))] + [opt('w%d' % i, l, n.replace('−', M)) for i, (l, n) in enumerate(wrongs)]
        rng.shuffle(o)
        cards.append({'id': 'g%02d' % (len(cards) + 1), 'k': 'expr', 'p': box(*lines) + ask('What is the value of %s?' % want), 'o': o, 'a': 'a',
                      'x': why.replace('−', M), 'r': 'm-found-expr'})

    # ---------------------------------------------------------------- distributing and factoring
    b_, c_ = 4, -3
    add('dist', '%s(%s)' % (M, lin(b_, c_)), 'Which is equal to it?', lin(-b_, -c_),
        [(lin(-b_, c_), 'The minus sign in front reaches every term in the bracket, the %s too.' % num(c_)),
         (lin(b_, c_), 'A minus sign in front of a bracket changes the sign of every term inside.'),
         (lin(b_, -c_), 'The x-term changes sign too: %s(4x) = %s4x.' % (M, M))],
        'A minus sign in front of a bracket means multiply by %s1: %s(%s) = %s.' % (M, M, lin(b_, c_), lin(-b_, -c_)))
    for a_, b_, c_ in [(-3, 2, -5), (4, 3, -2), (-2, -5, 7), (5, 1, 6)]:
        right = lin(a_ * b_, a_ * c_)
        wr = [(lin(a_ * b_, c_), 'The %s multiplies every term inside the bracket, the %s too.' % (num(a_), num(c_))),
              (lin(a_ * b_, -a_ * c_), 'Check the sign: %s × %s = %s.' % (num(a_), ('(%s)' % num(c_)) if c_ < 0 else num(c_), num(a_ * c_))),
              (lin(a_ + b_, a_ * c_) if a_ + b_ != 0 and a_ + b_ != a_ * b_ else lin(-a_ * b_, a_ * c_), 'Multiply %s by %s; do not add them.' % (num(a_), lin(b_, 0)) if a_ + b_ != 0 and a_ + b_ != a_ * b_ else 'Check the sign of the x-term: %s × %s.' % (num(a_), lin(b_, 0)))]
        add('dist', '%s(%s)' % (coef(a_) if a_ != -1 else M, lin(b_, c_)), 'Which is equal to it?', right, wr,
            'Multiply each term inside by %s: %s × %s = %s and %s × %s = %s. So %s.' % (num(a_), num(a_), lin(b_, 0), lin(a_ * b_, 0), num(a_), ('(%s)' % num(c_)) if c_ < 0 else num(c_), num(a_ * c_), right))
    for p_, q_ in [(2, 5), (-3, 4)]:
        right = poly([(1, 'x' + SQ), (p_ + q_, 'x'), (p_ * q_, '')])
        wr = [(poly([(1, 'x' + SQ), (p_ * q_, '')]), 'Each term in the first bracket multiplies each term in the second, so there are two x-terms to add: %s and %s.' % (lin(q_, 0), lin(p_, 0))),
              (poly([(1, 'x' + SQ), (p_ * q_, 'x'), (p_ + q_, '')]), 'The x-terms add (%s + %s) and the numbers multiply (%s × %s).' % (num(p_), num(q_), num(p_), num(q_))),
              (poly([(1, 'x' + SQ), (p_ + q_, 'x'), (p_ + q_, '')]), 'The plain number is %s × %s = %s.' % (num(p_), num(q_), num(p_ * q_)))]
        add('dist', '%s%s' % (shift('x', -p_), shift('x', -q_)), 'Which is equal to it?', right, wr,
            'Multiply every term by every term: x·x = x%s, x·%s + %s·x = %s, and %s × %s = %s. So %s.' % (SQ, num(q_), num(p_), lin(p_ + q_, 0), num(p_), num(q_), num(p_ * q_), right))
    for expr, right, wrongs, why in [
            ('6x + 9', '3(2x + 3)', [('3(2x + 9)', 'Divide every term by the 3 you pull out: 9 ÷ 3 = 3.'), ('6(x + 9)', '6 does not go into 9.'), ('3(3x + 2)', '6x ÷ 3 = 2x and 9 ÷ 3 = 3.')],
             'Both terms share a 3: 6x = 3 · 2x and 9 = 3 · 3. So 6x + 9 = 3(2x + 3). Multiply back out to check.'),
            ('x%s + 5x + 6' % SQ, '(x + 2)(x + 3)', [('(x + 1)(x + 6)', '1 × 6 is 6, but 1 + 6 is 7, not 5.'), ('(x %s 2)(x %s 3)' % (M, M), 'The signs: (x − 2)(x − 3) gives −5x.'), ('(x + 5)(x + 1)', 'The numbers must multiply to 6.')],
             'Find two numbers that multiply to 6 and add to 5: 2 and 3. So (x + 2)(x + 3).'),
            ('x%s %s 9' % (SQ, M), '(x + 3)(x %s 3)' % M, [('(x %s 3)%s' % (M, SQ), '(x − 3)² = x² − 6x + 9, which has an x-term.'), ('(x + 9)(x %s 1)' % M, 'That gives x² + 8x − 9.'), ('(x + 3)%s' % SQ, '(x + 3)² = x² + 6x + 9.')],
             'A square minus a square: x² − 9 = (x + 3)(x − 3). The x-terms, +3x and −3x, cancel.')]:
        add('dist', expr, 'Which is equal to it?', right, [(l, n.replace('−', M)) for l, n in wrongs], why.replace('−', M))

    # ---------------------------------------------------------------- combining like terms
    for terms in [[(4, 'x'), (7, ''), (-2, 'x'), (-3, ''), (-1, 'x')], [(5, 'x'), (-8, ''), (-5, 'x'), (2, ''), (3, 'x')], [(-3, 'x'), (6, ''), (7, 'x'), (-9, '')]]:
        A = sum(c for c, v in terms if v == 'x'); B = sum(c for c, v in terms if v == '')
        right = lin(A, B)
        allc = sum(c for c, v in terms)
        posx = sum(c for c, v in terms if v == 'x' and c > 0)
        wr = [(lin(allc, 0), 'x-terms and plain numbers are different kinds of term; they do not combine.'),
              (lin(posx, B) if posx != A else lin(A + 2, B), 'Every x-term counts, the subtracted ones too.'),
              (lin(A, sum(abs(c) for c, v in terms if v == '')) if sum(abs(c) for c, v in terms if v == '') != B else lin(A, B + 2), 'A minus sign belongs to the number after it.')]
        add('like', poly(terms), 'Which is equal to it?', right, wr,
            'Collect the x-terms (%s = %s) and the plain numbers (%s = %s): %s.' % (poly([(c, v) for c, v in terms if v == 'x']), lin(A, 0), poly([(c, '') for c, v in terms if v == '']), num(B), right))
    for expr, right, wrongs, why in [
            ('2x%s + 3x %s x%s + 5x' % (SQ, M, SQ), 'x%s + 8x' % SQ, [('9x%s' % SQ, 'x² and x are different kinds of term; they do not combine.'), ('3x%s + 8x' % SQ, '−x² takes one x² away: 2x² − x² = x².'), ('x%s + 2x' % SQ, '3x + 5x = 8x.')],
             'x²-terms: 2x² − x² = x². x-terms: 3x + 5x = 8x. Together: x² + 8x.'),
            ('x%s + x%s' % (SQ, SQ), '2x%s' % SQ, [('x<sup>4</sup>', 'Adding does not change the power: one x² plus one x² is two x².'), ('2x<sup>4</sup>', 'The power stays 2.'), ('(2x)%s' % SQ, '(2x)² = 4x².')],
             'One x² plus another x² is two of them: 2x². Powers add only when you multiply.'),
            ('3(x + 2) %s (x %s 4)' % (M, M), '2x + 10', [('2x + 2', 'The minus sign reaches both terms in the bracket: −(x − 4) = −x + 4.'), ('4x + 2', 'Subtract the whole bracket: 3x − x.'), ('2x %s 2' % M, '3 × 2 = 6, and −(−4) = +4: 6 + 4 = 10.')],
             'Expand first: 3x + 6 − x + 4. Then collect: 2x + 10.')]:
        add('like', expr, 'Which is equal to it?', right, [(l, n.replace('−', M)) for l, n in wrongs], why.replace('−', M))

    # ---------------------------------------------------------------- unknowns in denominators
    for a_, b_, c_ in [(6, 3, -2), (4, 2, 3), (5, 3, -4)]:
        # a/x = b/(x + c)  ->  a(x + c) = bx  ->  x = -ac/(a - b)
        x = Fr(-a_ * c_, a_ - b_)
        assert x.denominator == 1 and x != 0 and x != -c_
        slip = Fr(-c_, a_ - b_)              # a x + c = b x
        cross = Fr(b_ * c_, a_ - b_)         # a x = b(x + c)
        wr = [(num(slip), 'The %s multiplies the whole of %s: %s.' % (a_, lin(1, c_), lin(a_, a_ * c_))),
              (num(cross), 'Cross-multiply: each top times the other bottom, so the %d goes with %s.' % (a_, lin(1, c_))),
              (num(-x), 'Check the signs by putting your answer back in.')]
        wr = [w for w in wr if w[0] != num(x)]
        while len(wr) < 3:
            wr.append((num(x + len(wr) + 1), 'Put your answer back in: both sides must match.'))
        add('den', '%s = %s' % (fr(a_, 'x'), fr(b_, lin(1, c_))), 'What is x?', num(x), wr[:3],
            'Multiply both sides by x(%s), that is, cross-multiply: %d(%s) = %dx, so %s = %dx and x = %s. Neither bottom is 0 there, so it stands.'
            % (lin(1, c_), a_, lin(1, c_), b_, lin(a_, a_ * c_), b_, num(x)))
    for a_, b_, c_ in [(12, 1, 4), (10, 3, 5), (6, -1, 2)]:
        # a/x + b = c -> x = a/(c - b)
        x = Fr(a_, c_ - b_)
        assert x.denominator == 1
        wr = [(numf(Fr(c_ - b_, a_)), 'That is upside down: x = %d ÷ %s.' % (a_, num(c_ - b_))),
              (numf(Fr(a_, c_) - b_) if Fr(a_, c_) - b_ != x else numf(x + 1), 'Move the %d first, then deal with the fraction.' % abs(b_)),
              (numf(Fr(a_, c_ + b_)) if c_ + b_ and Fr(a_, c_ + b_) != x else numf(x + 2), '%s %d from both sides, do not %s it.' % ('Subtract' if b_ > 0 else 'Add', abs(b_), 'add' if b_ > 0 else 'subtract'))]
        add('den', '%s %s %d = %d' % (fr(a_, 'x'), '+' if b_ > 0 else M, abs(b_), c_), 'What is x?', num(x), wr,
            '%s %d from both sides: %s = %s. Multiply both sides by x: %d = %sx, so x = %s.' % ('Subtract' if b_ > 0 else 'Add', abs(b_), fr(a_, 'x'), num(c_ - b_), a_, num(c_ - b_) if c_ - b_ != 1 else '', num(x)))
    for k_ in [3, 5]:
        add('den', '%s = %s' % (fr('x', 'x %s %d' % (M, k_)), fr(k_, 'x %s %d' % (M, k_))), 'What is x?', 'No solution',
            [(str(k_), 'x = %d makes both bottoms 0, so it cannot be a solution.' % k_), ('0', 'Put 0 in: the left side is 0 and the right side is %s1.' % M), (M + str(k_), 'Put %s%d in: the two sides are %s and %s.' % (M, k_, fr(1, 2), fr(M + '1', 2)))],
            'Multiplying both sides by x %s %d gives x = %d. But x = %d makes both bottoms 0, so it is thrown out, and there is no solution. Always put the answer back into the original.'
            % (M, k_, k_, k_))
    return cards
