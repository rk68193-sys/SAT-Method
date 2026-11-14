"""Builds the Math drill cards written for this site: src/build/mdrills.json.

The "Name the skill" drill uses College Board's questions and needs nothing from here. The other Math drills train one
move each on short items made from templates, with a fixed random seed so the build is reproducible:

  count  How many solutions?   one-variable equations, systems of two lines, and quadratic equations and systems
  form   Which form shows it?  three equivalent forms of one quadratic; which one prints the value asked for
  exp    Exponent rules        found  Algebra foundations (built by foundations.py, imported below)
  pct    Percent multipliers
  slope  Slope from two points
  frac   Clearing fractions

Each card is {id, p (prompt HTML), o: [[key, label HTML, note shown when this wrong choice is picked]], a (answer key),
x (explanation HTML), r (address of the lesson or type to review)}. Answers are worked out here with exact fractions;
src/check/mdrills_check.py reads each card's printed math back with sympy and checks the answer independently.

Run: python3 -I src/math/mdrills.py
"""
import json, os, random
from fractions import Fraction as Fr
from math import gcd

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'build', 'mdrills.json')
M = '−'          # minus sign
SQ = '²'         # superscript two


# ---------------------------------------------------------------- printing
def num(v):
    """A number as text with a true minus sign: 3, −4, 3/4."""
    v = Fr(v)
    s = str(abs(v.numerator)) if v.denominator == 1 else '%d/%d' % (abs(v.numerator), v.denominator)
    return (M if v < 0 else '') + s


def dec(v):
    """A multiplier as a decimal: 1.15, 0.92, 1.04."""
    v = Fr(v)
    s = ('%.4f' % float(v)).rstrip('0').rstrip('.')
    assert Fr(s) == v, (v, s)
    return s.replace('-', M)


def fr(top, bottom):
    """A stacked fraction."""
    return '<span class="fr"><span>%s</span><span>%s</span></span>' % (top, bottom)


def numf(v):
    """A number, with a stacked fraction when it is not whole."""
    v = Fr(v)
    if v.denominator == 1:
        return num(v)
    return (M if v < 0 else '') + fr(abs(v.numerator), v.denominator)


def poly(terms):
    """[(coefficient, 'x²'), (coefficient, 'x'), (coefficient, '')] -> '2x² − 3x + 1', leaving out zero terms."""
    out = []
    for c, v in terms:
        c = Fr(c)
        if c == 0:
            continue
        assert c.denominator == 1 or not v, 'fractional coefficient on a variable'
        body = v if (v and abs(c) == 1) else num(abs(c)) + v
        if not out:
            out.append((M if c < 0 else '') + body)
        else:
            out.append((' %s ' % (M if c < 0 else '+')) + body)
    return ''.join(out) or '0'


def lin(a, b, v='x'):
    return poly([(a, v), (b, '')])


def quad(a, b, c, v='x'):
    return poly([(a, v + SQ), (b, v), (c, '')])


def shift(v, h):
    """(x − 3), (x + 2), or x when h = 0."""
    if h == 0:
        return v
    return '(%s %s %s)' % (v, M if h > 0 else '+', num(abs(h)))


def coef(a):
    """a printed in front of a bracket: '', '−', '2', '−3'."""
    return '' if a == 1 else (M if a == -1 else num(a))


def sqr(v):
    """b² printed as 4² or (−6)²."""
    return ('(%s)' % num(v) if v < 0 else num(v)) + SQ


def opt(key, label, note=''):
    return [key, label, note]


def sup(base, e):
    return '%s<sup>%s</sup>' % (base, num(e) if not isinstance(e, str) else e)


# ---------------------------------------------------------------- How many solutions?
COUNT_OPTS = [('0', 'No solution'), ('1', 'Exactly one'), ('2', 'Exactly two'), ('inf', 'Infinitely many')]
LINEAR_TWO = 'Two lines cross at most once unless they are the same line, so a linear equation or system never has exactly two solutions.'


def count_card(i, shape, lines, ans, why, ref, notes=None):
    notes = notes or {}
    o = [opt(k, b, notes.get(k, '')) for k, b in COUNT_OPTS]
    p = '<div class="mxbox">' + ''.join('<p class="mxl">%s</p>' % l for l in lines) + '</div>'
    return {'id': 'n%02d' % i, 'shape': shape, 'p': p, 'o': o, 'a': ans, 'x': why, 'r': ref}


def side_le1(rng, A, B):
    """A way to print an expression that simplifies to Ax + B, using brackets or like terms."""
    kind = rng.choice(['bracket', 'bracket+', 'like', 'two'])
    for _ in range(50):
        if kind == 'bracket':
            for k in [2, 3, 4, 5, -2, -3]:
                if A % k == 0 and B % k == 0 and abs(A // k) >= 1 and B // k != 0:
                    return '%s(%s)' % (coef(k), lin(A // k, B // k))
            kind = 'bracket+'
        if kind == 'bracket+':
            k = rng.choice([2, 3, 4, 5])
            if A % k == 0:
                inner = rng.choice([n for n in range(-6, 7) if n != 0])
                rest = B - k * inner
                if rest != 0:
                    return '%s(%s) %s %s' % (coef(k), lin(A // k, inner), M if rest < 0 else '+', num(abs(rest)))
            kind = 'like'
        if kind == 'like':
            a1 = rng.choice([n for n in range(-5, 9) if n not in (0, A)])
            a2 = A - a1
            if a2 != 0:
                return poly([(a1, 'x'), (B, '')]) + (' %s %s' % (M if a2 < 0 else '+', (num(abs(a2)) if abs(a2) != 1 else '') + 'x'))
            kind = 'two'
        if kind == 'two':
            k1 = rng.choice([2, 3, 4, 5])
            k2 = rng.choice([1, 2, 3])
            a1 = rng.choice([1, 2, 3])
            # k1(a1 x + c1) − k2(a2 x + c2) = (k1 a1 − k2 a2) x + (k1 c1 − k2 c2)
            if (k1 * a1 - A) % k2 == 0:
                a2 = (k1 * a1 - A) // k2
                c1 = rng.choice([n for n in range(-5, 6) if n != 0])
                if (k1 * c1 - B) % k2 == 0:
                    c2 = (k1 * c1 - B) // k2
                    if a2 != 0 and c2 != 0:
                        return '%s(%s) %s %s(%s)' % (coef(k1), lin(a1, c1), M, coef(k2) if k2 != 1 else '', lin(a2, c2))
            kind = rng.choice(['bracket', 'bracket+', 'like'])
    return lin(A, B)


def gen_count(rng):
    cards = []
    # one variable: 21 cards, 7 of each answer
    plan = ['inf', '0', '1'] * 7
    rng.shuffle(plan)
    for ans in plan:
        A = rng.choice([2, 3, 4, 5, 6, 8, 9, 10, 12])
        B = rng.choice([n for n in range(-15, 16) if n != 0])
        left = side_le1(rng, A, B)
        if ans == 'inf':
            C, D = A, B
        elif ans == '0':
            C, D = A, rng.choice([n for n in range(-15, 16) if n not in (0, B)])
        else:
            C = rng.choice([n for n in range(-6, 13) if n not in (0, A)])
            D = rng.choice([n for n in range(-15, 16) if n != 0 and (n - B) % (A - C) == 0] or [B + (A - C)])
        right = side_le1(rng, C, D) if rng.random() < .5 else lin(C, D)
        if right == left:
            right = lin(C, D) if left != lin(C, D) else side_le1(rng, C, D)
        if right == left:
            continue
        if rng.random() < .5:
            left, right, A, B, C, D = right, left, C, D, A, B
        simp = '%s = %s' % (lin(A, B), lin(C, D))
        if ans == 'inf':
            why = 'Simplify each side: %s. The two sides are the same expression, so every value of x works: infinitely many solutions.' % simp
        elif ans == '0':
            why = ('Simplify each side: %s. The x-terms match and the plain numbers do not. Take %s from both sides and you are left with %s = %s, '
                   'which is never true: no solution.') % (simp, lin(A, 0), num(B), num(D))
        else:
            x = Fr(D - B, A - C)
            why = 'Simplify each side: %s. The x-numbers differ (%s and %s), so x does not cancel: exactly one solution, x = %s.' % (simp, num(A), num(C), num(x))
        cards.append(count_card(len(cards) + 1, 'le1', ['%s = %s' % (left, right)], ans, why, 'mt-le1-count', {'2': LINEAR_TWO}))
    # systems of two lines: 21 cards
    plan = ['inf', '0', '1'] * 7
    rng.shuffle(plan)
    for j, ans in enumerate(plan):
        style = ['si', 'std', 'mix'][j % 3]
        if style == 'si':
            m = rng.choice([n for n in range(-5, 6) if n != 0])
            b = rng.choice([n for n in range(-9, 10) if n != 0])
            if ans == 'inf':
                # the same line, once as y = mx + b and once rearranged with a factor
                k = rng.choice([2, 3])
                second = '%sy = %s' % (k, lin(k * m, k * b))
                why = 'Divide the second equation by %d: y = %s. That is the first line again, so the two equations are one line: infinitely many solutions.' % (k, lin(m, b))
            elif ans == '0':
                b2 = rng.choice([n for n in range(-9, 10) if n not in (0, b)])
                second = 'y = %s' % lin(m, b2)
                why = 'Same slope (%s) and different y-intercepts (%s and %s): parallel lines never meet, so there is no solution.' % (num(m), num(b), num(b2))
            else:
                m2 = rng.choice([n for n in range(-5, 6) if n not in (0, m)])
                b2 = rng.choice([n for n in range(-9, 10) if n != 0])
                second = 'y = %s' % lin(m2, b2)
                why = 'The slopes differ (%s and %s), so the lines cross exactly once: exactly one solution.' % (num(m), num(m2))
            lines = ['y = %s' % lin(m, b), second]
        else:
            a1 = rng.choice([1, 2, 3, 4, 5])
            b1 = rng.choice([n for n in range(-6, 7) if n != 0])
            c1 = rng.choice([n for n in range(-12, 13) if n != 0])
            k = rng.choice([2, 3, -2, 4])
            if ans == 'inf':
                a2, b2, c2 = k * a1, k * b1, k * c1
                why = 'The second equation is the first multiplied by %s (every number, the right side too). They describe the same line: infinitely many solutions.' % num(k)
            elif ans == '0':
                a2, b2 = k * a1, k * b1
                c2 = rng.choice([n for n in range(-24, 25) if n not in (0, k * c1)])
                why = ('Multiply the first equation by %s: %s = %s. Its left side now matches the second equation and its right side does not (%s and %s): '
                       'parallel lines, no solution.') % (num(k), poly([(k * a1, 'x'), (k * b1, 'y')]), num(k * c1), num(k * c1), num(c2))
            else:
                while True:
                    a2 = rng.choice([n for n in range(-6, 7) if n != 0])
                    b2 = rng.choice([n for n in range(-6, 7) if n != 0])
                    if a1 * b2 - a2 * b1 != 0:
                        break
                c2 = rng.choice([n for n in range(-12, 13) if n != 0])
                why = ('Solve each for y and compare the slopes: %s and %s. They differ, so the lines cross once: exactly one solution.'
                       % (num(Fr(-a1, b1)), num(Fr(-a2, b2))))
            first = '%s = %s' % (poly([(a1, 'x'), (b1, 'y')]), num(c1))
            if style == 'mix' and b2 != 0 and Fr(a2, b2).denominator == 1 and Fr(c2, b2).denominator == 1 and Fr(-a2, b2) != 0:
                # print the second line as y = mx + b when it comes out whole
                second = 'y = %s' % lin(Fr(-a2, b2), Fr(c2, b2))
                if ans == 'inf':
                    why = 'Rewrite the first equation as y = mx + b: y = %s. It is the second line exactly: infinitely many solutions.' % lin(Fr(-a1, b1), Fr(c1, b1)) if Fr(-a1, b1).denominator == 1 and Fr(c1, b1).denominator == 1 else why
                elif ans == '0':
                    why = 'Both lines have slope %s and their y-intercepts differ (%s and %s): parallel lines, no solution.' % (num(Fr(-a1, b1)), num(Fr(c1, b1)), num(Fr(c2, b2)))
                else:
                    why = 'The slopes differ (%s and %s), so the lines cross once: exactly one solution.' % (num(Fr(-a1, b1)), num(Fr(-a2, b2)))
            else:
                second = '%s = %s' % (poly([(a2, 'x'), (b2, 'y')]), num(c2))
            lines = [first, second]
        cards.append(count_card(len(cards) + 1, 'sys', lines, ans, why, 'mt-sys-count', {'2': LINEAR_TWO}))
    # quadratic equations and a line meeting a parabola: 24 cards
    QNOTE = 'A quadratic can have two solutions, one or none, but never infinitely many: it is not the same expression on both sides.'
    plan = ['2', '1', '0'] * 8
    rng.shuffle(plan)
    for j, ans in enumerate(plan):
        style = ['disc', 'vertex', 'line', 'sq'][j % 4]
        if style == 'disc':
            while True:
                a = rng.choice([1, 1, 2, 3, -1, 4])
                b = rng.choice([n for n in range(-10, 11) if n != 0])
                c = rng.choice([n for n in range(-12, 13) if n != 0])
                D = b * b - 4 * a * c
                if (ans == '2' and D > 0) or (ans == '1' and D == 0) or (ans == '0' and D < 0):
                    break
                if ans == '1':
                    # build a perfect square on purpose
                    r = rng.choice([n for n in range(-6, 7) if n != 0])
                    a = rng.choice([1, 1, 4, 9])
                    s = {1: 1, 4: 2, 9: 3}[a]
                    b, c = -2 * s * r, r * r
                    D = 0
                    break
            lines = ['%s = 0' % quad(a, b, c)]
            why = 'Use b%s − 4ac: %s − 4(%s)(%s) = %s. %s' % (SQ, sqr(b), num(a), num(c), num(D),
                  {'2': 'Positive, so two solutions.', '1': 'Zero, so exactly one solution: the left side is a perfect square.', '0': 'Negative, so no real solution.'}[ans])
        elif style == 'vertex':
            a = rng.choice([1, 2, -1, -2, 3])
            h = rng.choice([n for n in range(-5, 6) if n != 0])
            k = rng.choice([n for n in range(-8, 9)])
            if ans == '1':
                m = k
            elif (ans == '2') == (a > 0):
                m = k + rng.choice([1, 2, 3, 5])
            else:
                m = k - rng.choice([1, 2, 3, 5])
            lines = ['y = %s%s%s %s' % (coef(a), shift('x', h), SQ, ('%s %s' % (M if k < 0 else '+', num(abs(k)))) if k else ''), 'y = %s' % num(m)]
            lines[0] = lines[0].rstrip()
            way = 'up' if a > 0 else 'down'
            low = 'lowest' if a > 0 else 'highest'
            rel = 'through the vertex' if m == k else ('above' if m > k else 'below')
            why = ('The parabola opens %s, and its %s point is the vertex (%s, %s). The flat line y = %s is %s%s. %s'
                   % (way, low, num(h), num(k), num(m), rel, '' if m == k else ' it',
                      {'2': 'It cuts the parabola on both sides of the vertex: two solutions.', '1': 'It touches the parabola only there: exactly one solution.',
                       '0': 'The parabola never gets there: no solution.'}[ans]))
            if m == k:
                why = why.replace('is through the vertex.', 'passes through the vertex.')
        elif style == 'line':
            while True:
                b = rng.choice([n for n in range(-8, 9)])
                c = rng.choice([n for n in range(-9, 10)])
                d = rng.choice([n for n in range(-6, 7) if n != 0])
                e = rng.choice([n for n in range(-9, 10)])
                B, C = b - d, c - e
                D = B * B - 4 * C
                if (ans == '2' and D > 0) or (ans == '1' and D == 0) or (ans == '0' and D < 0):
                    break
            lines = ['y = %s' % quad(1, b, c), 'y = %s' % lin(d, e)]
            why = ('Set the two right sides equal and move everything to one side: %s = 0. Then b%s − 4ac = %s − 4(1)(%s) = %s: %s'
                   % (quad(1, B, C), SQ, sqr(B), num(C), num(D), {'2': 'positive, so the line crosses the parabola twice.',
                                                                      '1': 'zero, so the line just touches the parabola: exactly one solution.',
                                                                      '0': 'negative, so the line misses the parabola: no solution.'}[ans]))
        else:
            h = rng.choice([n for n in range(-6, 7) if n != 0])
            v = {'2': rng.choice([4, 9, 16, 25, 7, 3]), '1': 0, '0': -rng.choice([1, 4, 9, 2])}[ans]
            lines = ['%s%s = %s' % (shift('x', h), SQ, num(v))]
            rt = {4: '2', 9: '3', 16: '4', 25: '5'}.get(v, '√%s' % num(v))
            why = {'2': 'A square equals a positive number in two ways: %s = %s or %s = −%s. Two solutions.' % (shift('x', h).strip('()'), rt, shift('x', h).strip('()'), rt),
                   '1': 'A square is 0 only when the thing squared is 0: %s = 0. Exactly one solution.' % shift('x', h).strip('()'),
                   '0': 'No real number squared is negative, so there is no solution.'}[ans].replace('−√', M + '√')
        cards.append(count_card(len(cards) + 1, 'nle', lines, ans, why, 'mt-nle-count', {'inf': QNOTE}))
    return cards


# ---------------------------------------------------------------- Which form shows it?
FORM_NAMES = {'std': 'Standard form', 'vtx': 'Vertex form', 'fac': 'Factored form'}


def gen_form(rng):
    cards = []
    asks = (['vertex', 'ext', 'axis'] * 6) + (['zeros'] * 15) + (['yint'] * 12)
    rng.shuffle(asks)
    used = set()
    for ask in asks:
        ctx = 'ball' if rng.random() < .22 else 'plain'
        for tries in range(2000):
            if tries == 1999:
                raise SystemExit('no quadratic fits a %s card' % ask)
            if ctx == 'ball':
                a = -16
                p = -rng.choice([1, 2, 3, 4])
                q = rng.choice([3, 4, 5, 6, 7, 8, 9, 10])
                v = 't'
                name = 'h'
            else:
                a = rng.choice([1, 2, 3, -1, -2, -3, 4])
                p, q = sorted(rng.sample([n for n in range(-8, 10) if n != 0], 2))
                v = 'x'
                name = 'f'
            if (p + q) % 2:
                continue
            h = (p + q) // 2
            k = -a * ((q - p) // 2) ** 2
            b, c = -a * (p + q), a * p * q
            key = {'vertex': 'vtx', 'ext': 'vtx', 'axis': 'vtx', 'zeros': 'fac', 'yint': 'std'}[ask]
            if h == 0 or k == 0 or (p, q, a) in used:
                continue
            nums = {'std': {abs(a), abs(b), abs(c)}, 'vtx': {abs(a), abs(h), abs(k)}, 'fac': {abs(a), abs(p), abs(q)}}
            target = {'vertex': {abs(h), abs(k)}, 'ext': {abs(k)}, 'axis': {abs(h)}, 'zeros': {abs(p), abs(q)}, 'yint': {abs(c)}}[ask]
            # the value asked for must not be printed in the other two forms, or the card would mislead
            if any(target & nums[f] for f in nums if f != key):
                continue
            break
        used.add((p, q, a))
        F = '%s(%s)' % (name, v)
        forms = {
            'std': '%s = %s' % (F, quad(a, b, c, v)),
            'vtx': '%s = %s%s%s %s %s' % (F, coef(a), shift(v, h), SQ, M if k < 0 else '+', num(abs(k))),
            'fac': '%s = %s%s%s' % (F, coef(a), shift(v, p), shift(v, q)),
        }
        hi = 'maximum' if a < 0 else 'minimum'
        if ctx == 'ball':
            lead = 'A ball is thrown upward. Its height, in feet, %s seconds after it is thrown is %s.' % (v, F)
            want = {'vertex': 'the greatest height the ball reaches, and when', 'ext': 'the greatest height the ball reaches',
                    'axis': 'how many seconds after the throw the ball is highest', 'zeros': 'when the ball hits the ground',
                    'yint': 'the height the ball is thrown from'}[ask]
        else:
            lead = ''
            want = {'vertex': 'the vertex of the graph', 'ext': 'the %s value of %s' % (hi, name), 'axis': 'the x-coordinate of the vertex',
                    'zeros': rng.choice(['the x-intercepts of the graph', 'the zeros of %s' % name, 'the solutions of %s = 0' % F]),
                    'yint': rng.choice(['the y-intercept of the graph', 'the value of %s(0)' % name])}[ask]
        order = ['std', 'vtx', 'fac']
        rng.shuffle(order)
        notes = {
            'std': 'Standard form prints the y-intercept, %s, because every other term is 0 when %s = 0.%s' % (
                num(c), v, ' The vertex needs −b ÷ 2a.' if key == 'vtx' else ' The zeros need factoring or the quadratic formula.'),
            'vtx': 'Vertex form prints the vertex (%s, %s).%s' % (num(h), num(k), ' The zeros need more work from here.' if key == 'fac' else ' The y-intercept needs %s = 0 put in.' % v),
            'fac': 'Factored form prints the zeros, %s and %s (mind the signs inside the brackets).%s' % (
                num(p), num(q), ' The vertex is halfway between them, but you have to work it out.' if key == 'vtx' else ' The y-intercept needs %s = 0 put in.' % v),
        }
        notes = {f: n.replace('−b', M + 'b') for f, n in notes.items()}
        if ask in ('vertex', 'ext', 'axis'):
            val = {'vertex': 'the vertex (%s, %s)' % (num(h), num(k)), 'ext': 'the %s value, %s' % (hi, num(k)), 'axis': 'the x-coordinate of the vertex, %s' % num(h)}[ask]
            if ctx == 'ball':
                val = {'vertex': 'the greatest height, %s feet, %s seconds after the throw' % (num(k), num(h)), 'ext': 'the greatest height, %s feet' % num(k),
                       'axis': 'the time of the greatest height, %s seconds' % num(h)}[ask]
            why = ('Vertex form a(%s − h)%s + k prints the vertex (h, k) directly: (%s, %s).' % (v, SQ, num(h), num(k))) + ('' if ask == 'vertex' and ctx != 'ball' else ' That gives %s.' % val)
        elif ask == 'zeros':
            if ctx == 'ball':
                why = ('Factored form a(t − p)(t − q) prints the zeros, %s and %s. The ball is in the air for positive times only, so it hits the ground at %s seconds.'
                       % (num(p), num(q), num(q)))
            else:
                why = 'Factored form a(x − p)(x − q) prints the zeros, %s and %s. Mind the signs: %s means a zero at %s.' % (
                    num(p), num(q), shift('x', p), num(p))
        else:
            why = ('Standard form ax%s + bx + c prints c, the value when %s = 0: %s. %s'
                   % (SQ, v, num(c), 'The ball leaves the hand at %s feet.' % num(c) if ctx == 'ball' else 'So the graph crosses the y-axis at (0, %s).' % num(c)))
        why = why.replace('a(x − h)', 'a(x %s h)' % M).replace('(t − h)', '(t %s h)' % M).replace('(x − p)(x − q)', '(x %s p)(x %s q)' % (M, M)).replace('(t − p)(t − q)', '(t %s p)(t %s q)' % (M, M))
        p_html = ('<p class="mxlead">%s</p>' % lead if lead else '') + '<p class="mxwant"><span class="label">You need</span> %s</p>' % want
        o = [opt(f, '<span class="mxf">%s</span>' % forms[f], '' if f == key else notes[f]) for f in order]
        ref = {'vtx': 'mt-nlf-vertex', 'fac': 'mt-nlf-zeros', 'std': 'mt-nlf-yint'}[key]
        cards.append({'id': 'f%02d' % (len(cards) + 1), 'ask': ask, 'p': p_html, 'o': o, 'a': key, 'x': why, 'r': ref,
                      'forms': forms, 'val': {'h': h, 'k': k, 'p': p, 'q': q, 'c': c}})
    return cards


# ---------------------------------------------------------------- Exponent rules
def gen_exp(rng):
    cards = []

    seen = set()

    def add(p, right, wrongs, why, ref='mt-eqx-exp'):
        """right: label; wrongs: [(label, note)]."""
        if p in seen:
            return
        seen.add(p)
        o = [opt('a', right)] + [opt('w%d' % i, l, n) for i, (l, n) in enumerate(wrongs)]
        labels = [x[1] for x in o]
        assert len(set(labels)) == len(labels), labels
        rng.shuffle(o)
        cards.append({'id': 'e%02d' % (len(cards) + 1), 'p': '<div class="mxbox"><p class="mxl">%s</p></div>' % p, 'o': o, 'a': 'a', 'x': why, 'r': ref})

    letters = ['x', 'a', 'n', 'y', 'b']
    # multiply: exponents add
    for _ in range(5):
        v = rng.choice(letters)
        m, n = rng.sample(range(2, 8), 2)
        add('%s · %s' % (sup(v, m), sup(v, n)), sup(v, m + n),
            [(sup(v, m * n), 'That multiplies the exponents. Multiplying powers of the same base adds them.'),
             ('2' + sup(v, m + n), 'The base stays %s; nothing doubles. You just have more factors of %s.' % (v, v)),
             (sup(v, abs(m - n)), 'That subtracts the exponents, which is what dividing does.')],
            '%s means %d factors of %s and %s means %d more: %d factors in all, so %s. Exponents add when you multiply powers of the same base.'
            % (sup(v, m), m, v, sup(v, n), n, m + n, sup(v, m + n)))
    # numbers in front multiply, exponents add
    for _ in range(4):
        v = rng.choice(letters)
        c1, c2 = rng.sample([2, 3, 4, 5, 6], 2)
        m, n = rng.sample(range(2, 7), 2)
        add('(%d%s)(%d%s)' % (c1, sup(v, m), c2, sup(v, n)), '%d%s' % (c1 * c2, sup(v, m + n)),
            [('%d%s' % (c1 + c2, sup(v, m + n)), 'The numbers in front multiply, they do not add.'),
             ('%d%s' % (c1 * c2, sup(v, m * n)), 'The exponents add when you multiply; they do not multiply.'),
             ('%d%s' % (c1 + c2, sup(v, m * n)), 'Both parts are off: multiply the numbers in front and add the exponents.')],
            'Multiply the numbers (%d × %d = %d) and add the exponents (%d + %d = %d): %d%s.' % (c1, c2, c1 * c2, m, n, m + n, c1 * c2, sup(v, m + n)))
    # divide: exponents subtract
    for _ in range(5):
        v = rng.choice(letters)
        n = rng.choice([2, 3, 4])
        m = n * rng.choice([2, 3]) + rng.choice([0, 1])
        if m == n * 2:
            m += 1
        wr = [(sup(v, m + n), 'That adds the exponents, which is what multiplying does.'),
              (sup(v, n - m), 'Subtract the bottom exponent from the top one, not the other way round.')]
        if m % n == 0 and m // n != m - n:
            wr.append((sup(v, m // n), 'That divides the exponents. Dividing powers subtracts them.'))
        else:
            wr.append(('1/' + sup(v, m - n), 'The extra factors are on top, so the answer has them on top too.'))
        add(fr(sup(v, m), sup(v, n)), sup(v, m - n), wr,
            '%d factors of %s over %d factors of %s: %d pairs cancel, leaving %d factors on top. So %s. Exponents subtract when you divide.'
            % (m, v, n, v, n, m - n, sup(v, m - n)))
    # power of a power: exponents multiply
    for _ in range(4):
        v = rng.choice(letters)
        m, n = rng.sample(range(2, 6), 2)
        add('(%s)<sup>%d</sup>' % (sup(v, m), n), sup(v, m * n),
            [(sup(v, m + n), 'That adds the exponents. A power raised to a power multiplies them.'),
             ('%d%s' % (n, sup(v, m)), 'The %d is an exponent, not a number to multiply by.' % n),
             (sup(v, m ** n), 'Only the exponents multiply: %d × %d, not %d to the power %d.' % (m, n, m, n))],
            '(%s)<sup>%d</sup> is %s written %d times: %s factors in all, so %s.' % (sup(v, m), n, sup(v, m), n, ' + '.join([str(m)] * n) + ' = %d' % (m * n), sup(v, m * n)))
    # power of a product: the number in front is raised too
    for _ in range(4):
        v = rng.choice(letters)
        c, m, n = rng.choice([(c_, m_, n_) for c_ in (2, 3, 5) for m_ in (2, 3, 4) for n_ in (2, 3)
                              if c_ ** n_ != c_ * n_ and m_ * n_ != m_ + n_ and c_ ** n_ < 100])
        add('(%d%s)<sup>%d</sup>' % (c, sup(v, m), n), '%d%s' % (c ** n, sup(v, m * n)),
            [('%d%s' % (c, sup(v, m * n)), 'The power applies to the %d as well: %d<sup>%d</sup> = %d.' % (c, c, n, c ** n)),
             ('%d%s' % (c * n, sup(v, m * n)), 'Raising %d to the power %d is not %d × %d.' % (c, n, c, n)),
             ('%d%s' % (c ** n, sup(v, m + n)), 'A power of a power multiplies the exponents.')],
            '(%d%s)<sup>%d</sup> is %d%s multiplied by itself %d times. Every factor gets the power: %d<sup>%d</sup> = %d and (%s)<sup>%d</sup> = %s. So %d%s.'
            % (c, sup(v, m), n, c, sup(v, m), n, c, n, c ** n, sup(v, m), n, sup(v, m * n), c ** n, sup(v, m * n)))
    # negative exponents
    for _ in range(4):
        v = rng.choice(letters)
        n = rng.choice([1, 2, 3, 4, 5])
        right = fr('1', sup(v, n) if n > 1 else v)
        add(sup(v, -n), right,
            [(M + (sup(v, n) if n > 1 else v), 'A negative exponent does not make the number negative. It means divide.'),
             (M + fr('1', sup(v, n) if n > 1 else v), 'The value is not negative: the minus sign in the exponent means one over.'),
             (sup(v, fr('1', n)) if n > 1 else '0', 'A fractional exponent is a root, which is something else.' if n > 1 else 'Only 0 to a power is 0.')],
            'Each step down in the exponent divides by %s once more: %s, %s, %s<sup>0</sup> = 1, %s. So %s = %s.'
            % (v, sup(v, 2), v, v, sup(v, -1) + ' = ' + fr('1', v), sup(v, -n), right))
    # zero exponent
    for c, base, val, wr in [(1, '(3x)<sup>0</sup>', '1', [('0', 'Anything except 0 to the power 0 is 1, not 0.'), ('3', 'The 0 exponent applies to the whole bracket, the 3 included.'), ('3x', 'An exponent of 0 does not leave the base as it was.')]),
                             (1, '5' + sup('x', 0), '5', [('1', 'The exponent belongs to x only, so the 5 stays: 5 · 1 = 5.'), ('0', 'x<sup>0</sup> is 1, not 0.'), ('5x', 'x<sup>0</sup> is 1, so the x is gone.')])]:
        add(base, val, wr, 'Dividing %s by itself gives 1, and the exponent rule gives %s, so anything (except 0) to the power 0 is 1.%s'
            % (sup('x', 3), sup('x', '3 ' + M + ' 3') + ' = ' + sup('x', 0), ' Here the whole bracket is raised to 0.' if '(' in base else ' Here only x is raised to 0, so 5 · 1 = 5.'))
    # fractional exponents with numbers
    for base, (t, b), right, wrongs in [
            (8, (2, 3), '4', [('16/3', 'The exponent is not a number to multiply by.'), ('2', 'That is the cube root; the 2 on top still squares it.'), ('64', 'That squares 8 but forgets the cube root.')]),
            (27, (2, 3), '9', [('18', 'The exponent is not a number to multiply by.'), ('3', 'That is the cube root; the 2 on top still squares it.'), ('729', 'That squares 27 but forgets the cube root.')]),
            (16, (3, 4), '8', [('12', 'The exponent is not a number to multiply by.'), ('2', 'That is the fourth root; the 3 on top still cubes it.'), ('4096', 'That cubes 16 but forgets the fourth root.')]),
            (25, (3, 2), '125', [('75/2', 'The exponent is not a number to multiply by.'), ('5', 'That is the square root; the 3 on top still cubes it.'), ('15625', 'That cubes 25 but forgets the square root.')]),
            (4, (-1, 2), '1/2', [(M + '2', 'A negative exponent means one over, not a negative value.'), ('2', 'That is the square root; the minus sign still means one over it.'), (M + '1/2', 'The value is positive: the minus sign in the exponent means one over.')]),
            (9, (1, 2), '3', [('9/2', 'The exponent is not a number to multiply by.'), ('81', 'An exponent of one half is a square root, not a square.'), ('4.5', 'A half power is a square root, not half the number.')])]:
        e = Fr(t, b)
        root = round(base ** (1 / b))
        rad = {2: '√', 3: '\u221b', 4: '\u221c'}[b] + str(base)
        if t == 1:
            steps = '%s<sup>%s</sup> = %s = %s' % (base, num(e), rad, right)
        else:
            steps = '%s<sup>%s</sup> = (%s)<sup>%s</sup> = %s<sup>%s</sup> = %s' % (base, num(e), rad, num(t), root, num(t), right)
        rl = numf(Fr(right)) if '/' in right else right
        wr = [(numf(Fr(l.replace(M, '-'))) if '/' in l else l, n) for l, n in wrongs]
        add('%s<sup>%s</sup>' % (base, num(e)), rl, wr,
            'The bottom of the fraction is a root and the top is a power: %s.%s' % (steps, ' The minus sign means one over.' if t < 0 else ''))
    # two letters at once
    for (a1, a2), (b1, b2) in [((5, 2), (3, 1)), ((7, 3), (4, 2)), ((6, 1), (5, 3))]:
        add(fr(sup('x', a1) + sup('y', b1), sup('x', a2) + ('y' if b2 == 1 else sup('y', b2))), sup('x', a1 - a2) + sup('y', b1 - b2),
            [(sup('x', a1 + a2) + sup('y', b1 + b2), 'Dividing subtracts the exponents; it does not add them.'),
             (sup('x', a1 - a2) + sup('y', b1), 'The y-factors below cancel too, so the y-exponent drops by %d.' % b2),
             (sup('x', Fr(a1, a2)) + sup('y', Fr(b1, b2)) if Fr(a1, a2).denominator == 1 and Fr(b1, b2).denominator == 1 and (Fr(a1, a2), Fr(b1, b2)) != (a1 - a2, b1 - b2) else sup('x', a1 - a2) + sup('y', b1 + b2),
              'Dividing subtracts the exponents, letter by letter.')],
            'Work one letter at a time: x<sup>%d %s %d</sup> = %s and y<sup>%d %s %d</sup> = %s.' % (a1, M, a2, sup('x', a1 - a2), b1, M, b2, sup('y', b1 - b2)))
    for c in cards:
        for o in c['o']:
            o[1] = o[1].replace('-', M)
    return cards


# ---------------------------------------------------------------- Percent multipliers
def art(n):
    """'a' or 'an' before a number said aloud: an 8% rise, an 11% fall, a 15% rise."""
    t = str(n)
    return 'an' if t.startswith('8') or t in ('11', '18') or (len(t) in (2, 5) and t.startswith('18')) else 'a'


def gen_pct(rng):
    cards = []

    def add(p, right, wrongs, why, ref='mt-pct-change'):
        o = [opt('a', right)] + [opt('w%d' % i, l, n) for i, (l, n) in enumerate(wrongs)]
        labels = [x[1] for x in o]
        assert len(set(labels)) == len(labels), labels
        rng.shuffle(o)
        cards.append({'id': 'p%02d' % (len(cards) + 1), 'p': '<p class="qstem big">%s</p>' % p, 'o': o, 'a': 'a', 'x': why, 'r': ref})

    ups = rng.sample([3, 5, 8, 12, 15, 20, 25, 40, 60, 150], 6)
    for r in ups:
        m = 1 + Fr(r, 100)
        add('Increase an amount by %d%%. Multiply it by:' % r, '× ' + dec(m),
            [('× ' + dec(Fr(r, 100)), 'That gives only the %d%% that is added. You keep the original 100%% as well.' % r),
             ('× ' + dec(1 - Fr(r, 100)) if r < 100 else '× ' + dec(Fr(r, 100) - 1), 'That is %s %d%% decrease.' % (art(r), r) if r < 100 else 'That is %d%% of the amount, not %d%% more than it.' % (r - 100, r)),
             ('× ' + dec(1 + Fr(r, 1000)), 'The decimal point is off: %d%% is %s.' % (r, dec(Fr(r, 100))))],
            '100%% of the amount plus %d%% more is %d%%, and %d%% = %s.' % (r, 100 + r, 100 + r, dec(m)))
    downs = rng.sample([2, 4, 8, 10, 15, 20, 25, 35, 60], 6)
    for r in downs:
        m = 1 - Fr(r, 100)
        add('Decrease an amount by %d%%. Multiply it by:' % r, '× ' + dec(m),
            [('× ' + dec(Fr(r, 100)), 'That is the part taken away. The multiplier is the part that is left.'),
             ('× ' + dec(1 + Fr(r, 100)), 'That is %s %d%% increase.' % (art(r), r)),
             ('× ' + dec(1 - Fr(r, 1000)), 'The decimal point is off: %d%% is %s.' % (r, dec(Fr(r, 100))))],
            'Take %d%% away and %d%% is left, and %d%% = %s.' % (r, 100 - r, 100 - r, dec(m)))
    for a, b in rng.sample([(30, -20), (20, -20), (25, -20), (50, -40), (10, 10), (-10, -10), (20, 50), (40, -50), (-20, 25)], 6):
        m = (1 + Fr(a, 100)) * (1 + Fr(b, 100))

        def say(v):
            if v == 1:
                return '× 1 (no change overall)'
            pc = (v - 1) * 100
            return '× %s (%s %s%% %s overall)' % (dec(v), art(num(abs(pc))), num(abs(pc)), 'increase' if pc > 0 else 'decrease')
        added = 1 + Fr(a + b, 100)
        wr = [(say(added), 'Adding the percents treats the second change as a share of the original amount, but it is a share of the new one.')]
        for alt in [(1 + Fr(a, 100)) + Fr(b, 100), (1 + Fr(abs(a), 100)) * (1 + Fr(abs(b), 100)), (1 - Fr(a, 100)) * (1 - Fr(b, 100)), m + Fr(1, 10), m - Fr(1, 10)]:
            lab = say(alt)
            if alt > 0 and alt != m and lab not in [w[0] for w in wr] and lab != say(m):
                wr.append((lab, 'Multiply the two multipliers: %s × %s.' % (dec(1 + Fr(a, 100)), dec(1 + Fr(b, 100)))))
            if len(wr) == 3:
                break
        word = lambda x: '%s by %d%%' % ('increases' if x > 0 else 'decreases', abs(x))
        add('An amount %s, then the new amount %s. Overall, the original is multiplied by:' % (word(a), word(b)), say(m), wr,
            'Each change multiplies whatever is there at the time: %s × %s = %s.' % (dec(1 + Fr(a, 100)), dec(1 + Fr(b, 100)), dec(m)), 'mt-pct-change')
    def money(v):
        v = Fr(v)
        return '$' + (num(v) if v.denominator == 1 else '%.2f' % float(v))
    for r, final, up in [(25, 60, False), (20, 48, False), (10, 99, True), (25, 150, True), (40, 42, False), (20, 84, True)]:
        m = (1 + Fr(r, 100)) if up else (1 - Fr(r, 100))
        orig = Fr(final) / m
        assert orig.denominator == 1 and orig != 100
        wr = [(money(final * (1 - Fr(r, 100)) if up else final * (1 + Fr(r, 100))), 'That takes %d%% of the new price, but the %d%% was of the original price.' % (r, r)),
              (money(final * m), 'That applies the change a second time instead of undoing it.'),
              (money(final - r) if up else money(Fr(final) / Fr(r, 100)),
               'A percent is a share of the price, not a number of dollars.' if up else 'Divide by the part that is left, %s, not the part taken off.' % dec(m))]
        add('After a %d%% %s, a price is %s. What was the price before?' % (r, 'increase' if up else 'discount', money(final)), money(orig), wr,
            'The new price is the old price × %s. Undo that by dividing: %d ÷ %s = %s.' % (dec(m), final, dec(m), num(orig)), 'mt-pct-change')
    for r, kind in [(40, 'more'), (20, 'less'), (150, 'of'), (35, 'less'), (5, 'more'), (60, 'of')]:
        m = {'more': 1 + Fr(r, 100), 'less': 1 - Fr(r, 100), 'of': Fr(r, 100)}[kind]
        alts = [(1 + Fr(r, 100), 'That is %d%% more than q.' % r), (1 - Fr(r, 100), 'That is %d%% less than q.' % r), (Fr(r, 100), 'That is %d%% of q.' % r),
                (Fr(r), '%d%% is %s: divide the percent by 100.' % (r, dec(Fr(r, 100)))), (m / 10, 'The decimal point is off.')]
        wr = []
        for alt, note in alts:
            if alt != m and alt > 0 and 'p = %sq' % dec(alt) not in [w[0] for w in wr]:
                wr.append(('p = %sq' % dec(alt), note))
        wr = wr[:3]
        add('p is %d%% %s q. Which equation says that?' % (r, {'more': 'more than', 'less': 'less than', 'of': 'of'}[kind]), 'p = %sq' % dec(m), wr,
            {'more': 'All of q plus %d%% more: %d%% of q, which is %sq.' % (r, 100 + r, dec(m)), 'less': 'All of q minus %d%%: %d%% of q, which is %sq.' % (r, 100 - r, dec(m)),
             'of': '%d%% of q is %s × q.' % (r, dec(m))}[kind], 'mt-pct-of')
    for a, b in [(50, 65), (80, 60), (40, 50), (120, 90), (25, 40), (200, 150)]:
        ch = Fr(b - a, a) * 100
        lab = lambda v: ('%s%% %s' if Fr(v).denominator == 1 else 'about %s%% %s') % (num(abs(v)) if Fr(v).denominator == 1 else '%.0f' % float(abs(v)), 'increase' if v > 0 else 'decrease')
        wr = [(lab(Fr(b - a, b) * 100), 'Divide by the starting value, %d, not the new one.' % a),
              (lab(Fr(b - a, 1)), 'The change is %s, but a percent change compares it with the start.' % num(abs(b - a))),
              (lab(-ch), 'It went %s, not %s.' % ('up' if b > a else 'down', 'down' if b > a else 'up'))]
        add('A value changes from %d to %d. What is the percent change?' % (a, b), lab(ch), wr,
            'Change ÷ start: %s ÷ %d = %s, a %s.' % (num(b - a), a, dec(Fr(b - a, a)), lab(ch)), 'mt-pct-change')
    for r, n in [(5, 3), (10, 2), (20, 2), (3, 4)]:
        m = 1 + Fr(r, 100)
        add('An amount grows by %d%% each year for %d years. Overall it is multiplied by:' % (r, n), '× (%s)<sup>%d</sup>' % (dec(m), n),
            [('× ' + dec(1 + Fr(r * n, 100)), 'Adding %d%% %d times ignores that each %d%% is of a bigger amount.' % (r, n, r)),
             ('× %d(%s)' % (n, dec(m)), 'Growth repeats by multiplying, not by multiplying by %d.' % n),
             ('× (%s)<sup>%d</sup>' % (dec(Fr(r, 100)), n), 'The yearly multiplier is %s, not %s.' % (dec(m), dec(Fr(r, 100))))],
            'Each year multiplies the amount by %s, so %d years multiply it by %s, %d times: (%s)<sup>%d</sup>.' % (dec(m), n, dec(m), n, dec(m), n), 'mt-nlf-exp')
    return cards


# ---------------------------------------------------------------- Slope from two points
def gen_slope(rng):
    cards = []
    seen = set()
    while len(cards) < 30:
        ctx = len(cards) % 5 == 4
        x1, x2 = rng.sample(range(-8, 13), 2)
        y1, y2 = rng.choice(range(-9, 15)), rng.choice(range(-9, 15))
        if (x1, y1, x2, y2) in seen:
            continue
        dy, dx = y2 - y1, x2 - x1
        m = Fr(dy, dx)
        if ctx:
            x1, x2 = sorted(rng.sample(range(1, 11), 2))
            rate = rng.choice([2, 3, 4, 5, 6, 8, 12, Fr(1, 2), Fr(5, 2)])
            y1 = rng.choice([10, 12, 20, 24, 30, 40, 45])
            y2 = y1 + rate * (x2 - x1)
            if Fr(y2).denominator != 1:
                continue
            y2 = int(y2)
            dy, dx, m = y2 - y1, x2 - x1, Fr(y2 - y1, x2 - x1)
        if m == 0 or dy == 0 or abs(m.numerator) > 20:
            continue
        cands = [(-m, 'Subtract in the same order on top and bottom: (y₂ − y₁) over (x₂ − x₁).'),
                 (Fr(dx, dy), 'That is change in x over change in y. Slope is rise over run: the change in y goes on top.'),
                 (Fr(y1, x1) if x1 else None, 'That is y ÷ x for one point, which gives the slope only when the line passes through (0, 0).'),
                 (Fr(y1 + y2, x1 + x2) if x1 + x2 else None, 'Slope uses differences, not sums.'),
                 (Fr(dy, dx) + 1, 'Check the arithmetic in the differences.')]
        wr = []
        for v, note in cands:
            if v is None or v == m or any(v == w for w, _ in wr):
                continue
            wr.append((v, note.replace('−', M)))
            if len(wr) == 3:
                break
        if len(wr) < 3:
            continue
        seen.add((x1, y1, x2, y2))
        o = [opt('a', numf(m))] + [opt('w%d' % i, numf(v), n) for i, (v, n) in enumerate(wr)]
        rng.shuffle(o)
        if ctx:
            p = ('<p class="qstem big">A water tank holds %d liters after %d minute%s and %d liters after %d minutes, filling at a steady rate. '
                 'How many liters per minute?</p>' % (y1, x1, '' if x1 == 1 else 's', y2, x2))
            why = 'Change in liters ÷ change in minutes = (%s %s %s) ÷ (%d %s %d) = %s ÷ %d = %s liters per minute.' % (num(y2), M, num(y1), x2, M, x1, num(dy), dx, num(m))
            ref = 'mt-lf-model'
        else:
            p = '<div class="mxbox"><p class="mxl">(%s, %s) and (%s, %s)</p></div>' % (num(x1), num(y1), num(x2), num(y2))
            why = 'Slope = change in y ÷ change in x = (%s %s %s) ÷ (%s %s %s) = %s ÷ %s = %s.' % (
                num(y2), M, '(' + num(y1) + ')' if y1 < 0 else num(y1), num(x2), M, '(' + num(x1) + ')' if x1 < 0 else num(x1), num(dy), num(dx), num(m))
            ref = 'mt-le2-intercept'
        cards.append({'id': 's%02d' % (len(cards) + 1), 'p': p, 'o': o, 'a': 'a', 'x': why, 'r': ref,
                      'pts': [x1, y1, x2, y2]})
    return cards


# ---------------------------------------------------------------- Clearing fractions
def lcm(a, b):
    return a * b // gcd(a, b)


def gen_frac(rng):
    cards = []

    def add(p, right, wrongs, why, ref='mt-le1-solve', eq=None):
        o = [opt('a', right)] + [opt('w%d' % i, l, n) for i, (l, n) in enumerate(wrongs)]
        labels = [x[1] for x in o]
        assert len(set(labels)) == len(labels), labels
        rng.shuffle(o)
        cards.append({'id': 'q%02d' % (len(cards) + 1), 'p': '<div class="mxbox"><p class="mxl">%s</p></div>' % p, 'o': o, 'a': 'a', 'x': why, 'r': ref})

    # x/a + x/b = c
    for a, b in rng.sample([(3, 4), (2, 5), (4, 6), (3, 6), (2, 3), (5, 10), (6, 9), (4, 10)], 6):
        L = lcm(a, b)
        ca, cb = L // a, L // b
        c = rng.choice([n for n in range(2, 16) if (L * n) % (ca + cb) == 0] or [ca + cb])
        p = '%s + %s = %d' % (fr('x', a), fr('x', b), c)
        right = '%sx + %sx = %d' % (coef(ca), coef(cb), L * c)
        wr = [('%sx + %sx = %d' % (coef(ca), coef(cb), c), 'Every term gets multiplied, the %d on the right too.' % c),
              ('x + x = %d' % (L * c), 'Multiplying %s by %d gives %sx: the %d divides into %d %d times.' % (fr('x', a), L, coef(ca) or '1', a, L, ca))]
        if cb != 1:
            wr.append(('%sx + x = %d' % (coef(ca), L * c), '%d · %s is %sx, not x: the %d goes into %d %d times.' % (L, fr('x', b), coef(cb), b, L, cb)))
        else:
            wr.append(('%sx + %sx = %d' % (coef(ca), coef(ca), L * c), '%d · %s is x: the %d goes into %d once.' % (L, fr('x', b), b, L)))
        x = Fr(L * c, ca + cb)
        add(p, right, wr, 'Multiply every term by %d, the smallest number %d and %d both go into: %d · %s = %sx, %d · %s = %sx and %d · %d = %d. Then %dx = %d, so x = %s.'
            % (L, a, b, L, fr('x', a), coef(ca) or '', L, fr('x', b), coef(cb) or '', L, c, L * c, ca + cb, L * c, num(x)))
    # x/a − b = c
    for a in rng.sample([2, 3, 4, 5, 6, 7], 5):
        b, c = rng.sample(range(1, 10), 2)
        p = '%s %s %d = %d' % (fr('x', a), M, b, c)
        right = 'x %s %d = %d' % (M, a * b, a * c)
        wr = [('x %s %d = %d' % (M, b, a * c), 'The %d is a term too: multiply it by %d as well.' % (b, a)),
              ('x %s %d = %d' % (M, a * b, c), 'Multiply the right side by %d as well.' % a),
              ('x %s %d = %d' % (M, b, c), 'Multiplying by %d has to reach every term.' % a)]
        add(p, right, wr, 'Multiply every term by %d: %d · %s = x, %d · %d = %d and %d · %d = %d. So x %s %d = %d, and x = %d.'
            % (a, a, fr('x', a), a, b, a * b, a, c, a * c, M, a * b, a * c, a * c + a * b))
    # (x + p)/a = (x − q)/b
    for a, b in rng.sample([(2, 3), (3, 5), (4, 3), (2, 5), (5, 2), (3, 4)], 5):
        p_, q_ = rng.sample(range(1, 9), 2)
        prompt = '%s = %s' % (fr('x + %d' % p_, a), fr('x %s %d' % (M, q_), b))
        right = '%dx + %d = %dx %s %d' % (b, b * p_, a, M, a * q_)
        wr = [('%dx + %d = %dx %s %d' % (b, p_, a, M, q_), 'Multiply the whole top: %d(x + %d) = %dx + %d.' % (b, p_, b, b * p_)),
              ('%dx + %d = %dx %s %d' % (a, a * p_, b, M, b * q_), 'Cross-multiply: each top times the other fraction’s bottom.'),
              ('%dx + %d = %dx %s %d' % (b, b * p_, a, M, q_), 'The %d multiplies the whole top on the right: %d(x %s %d).' % (a, a, M, q_))]
        add(prompt, right, wr, 'Multiply both sides by %d · %d (that is, cross-multiply): %d(x + %d) = %d(x %s %d), which is %dx + %d = %dx %s %d.'
            % (a, b, b, p_, a, M, q_, b, b * p_, a, M, a * q_))
    # (p/q)x + r/s = t/u with a common denominator
    for (p_, q_), (r_, s_), (t_, u_) in [((2, 3), (1, 2), (5, 6)), ((3, 4), (1, 2), (7, 8)), ((1, 2), (2, 3), (5, 6)), ((3, 5), (1, 2), (9, 10)), ((5, 6), (1, 3), (1, 2))]:
        L = lcm(lcm(q_, s_), u_)
        prompt = '%sx + %s = %s' % (fr(p_, q_), fr(r_, s_), fr(t_, u_))
        A, B, C = L * p_ // q_, L * r_ // s_, L * t_ // u_
        right = '%sx + %d = %d' % (coef(A) or '', B, C)
        wr = [('%sx + %d = %d' % (coef(p_), r_, t_), 'Multiplying by %d changes the tops too: %d · %s = %d.' % (L, L, fr(r_, s_), B)),
              ('%sx + %d = %d' % (coef(A) or '', r_, C), 'Every term gets multiplied by %d, %s included.' % (L, fr(r_, s_))),
              ('%sx + %d = %d' % (coef(L * p_) or '', B, C), '%d · %s is %d, not %d.' % (L, fr(p_, q_), A, L * p_))]
        x = Fr(C - B, A)
        add(prompt, right, wr, 'Multiply every term by %d, the smallest number all three bottoms go into: %sx + %d = %d. Then x = %s.' % (L, coef(A) or '', B, C, numf(x)))
    # unknown in the denominator
    for a, b, c in [(3, 4, 2), (5, 2, 3), (2, 7, 5), (6, 5, 1), (4, 3, 6)]:
        prompt = '%s = %s' % (fr(a, 'x'), fr(b, 'x + %d' % c))
        right = '%dx + %d = %dx' % (a, a * c, b)
        wr = [('%dx + %d = %dx' % (a, c, b), 'Multiply the whole bracket: %d(x + %d) = %dx + %d.' % (a, c, a, a * c)),
              ('%dx = %dx + %d' % (a, b, b * c), 'Cross-multiply: each top times the other bottom, so the %d goes with x + %d.' % (a, c)),
              ('%d = %d(x + %d)' % (a, b, c), 'Both sides need multiplying by x and by x + %d.' % c)]
        x = Fr(-a * c, a - b)
        add(prompt, right, wr, 'Multiply both sides by x(x + %d), that is, cross-multiply: %d(x + %d) = %dx, so %dx + %d = %dx and x = %s. Check that x = %s does not make a bottom 0.'
            % (c, a, c, b, a, a * c, b, num(x), num(x)), 'mt-nle-radical')
    for cc in cards:
        for o in cc['o']:
            o[1] = o[1].replace('-', M)
    return cards


def main():
    rng = random.Random(20261113)
    out = {
        'count': gen_count(rng),
        'form': gen_form(rng),
        'exp': gen_exp(rng),
        'pct': gen_pct(rng),
        'slope': gen_slope(rng),
        'frac': gen_frac(rng),
    }
    try:
        from foundations import gen_found
        out['found'] = gen_found(random.Random(20261114))
    except ImportError:
        pass
    for k, v in out.items():
        ids = [c['id'] for c in v]
        assert len(ids) == len(set(ids)), k
        for c in v:
            keys = [o[0] for o in c['o']]
            assert c['a'] in keys and len(keys) == len(set(keys)), (k, c['id'])
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('wrote', OUT, ' '.join('%s %d' % (k, len(v)) for k, v in out.items()))


if __name__ == '__main__':
    main()
