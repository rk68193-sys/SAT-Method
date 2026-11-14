"""Builds src/build/mfirst.json: the bank questions behind the "Look for the shortcut first" page (#m-first).

Each question is filed under one of the six kinds the page teaches, or under a look-alike (a question that looks as if
it has the short way but does not), with a note in this site's own words on how the short way goes for that question.
The page lists them, practices them, and shows the note after a practice answer.

  scale    A multiple of what you know      you know 4x and are asked for 24x, or 3x - 8 and are asked for 3x + 8
  block    The same bracket twice           5(x + 4) = 4(x + 4) + 29: solve for the bracket
  combine  Add or subtract the equations    a system that asks for x + y, or for 8x + 7y
  roots    Sum or product of the solutions  -b/a and c/a, or the mirror pair of (x - h)^2 = k and |x - h| = k
  match    Match the two sides              "for all x", "equivalent", "infinitely many solutions"
  mirror   Halfway between equal heights    a parabola's vertex sits halfway between two equal outputs
  x-sub    look-alike: x + y when one equation already says y = ...; substitute instead
  x-divide look-alike: dividing both sides by a bracket throws away a solution
  x-cubic  look-alike: three factors, so -b/a and c/a do not apply

Every entry is checked before anything is written: the note's value is worked out again with sympy from the question,
it must agree with College Board's answer in src/build/mdata.json (the letter for a multiple-choice question, one of
the accepted forms for a typed answer), and the note must state it.

Usage: python3 src/math/shortcut_first.py          check every entry and write src/build/mfirst.json
       python3 src/math/shortcut_first.py --check  check every entry and that the written file is up to date
"""
import json
import os
import re
import sys
from fractions import Fraction

import sympy as sp

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(os.path.dirname(HERE), 'build')
OUT = os.path.join(BUILD, 'mfirst.json')
KINDS = ['scale', 'block', 'combine', 'roots', 'match', 'mirror', 'x-sub', 'x-divide', 'x-cubic']

x, y, t, a, b, c, k, r, s, p, v, g, m = sp.symbols('x y t a b c k r s p v g m')
kp = sp.Symbol('k', positive=True)   # a constant the question says is positive
R = sp.Rational


def one(eqs, unknowns, target):
    """the value the equations force on target (they must pin it down exactly)"""
    sol = sp.solve(eqs, unknowns, dict=True)
    assert len(sol) == 1, ('not one solution', eqs, sol)
    return sp.simplify(target.subs(sol[0]))


def ident(lhs, rhs, var, unknowns):
    """the constants that make lhs = rhs for every value of var"""
    poly = sp.Poly(sp.expand(sp.together(lhs - rhs) * 1), var)
    sol = sp.solve(poly.all_coeffs(), unknowns, dict=True)
    assert len(sol) == 1, ('not one identity', lhs, rhs, sol)
    return sol[0]


def ident_frac(lhs, rhs, var, unknowns):
    """as ident, for sides with the same bottoms: compare the tops over a common bottom"""
    num = sp.numer(sp.together(lhs - rhs))
    return ident(sp.expand(num), 0, var, unknowns)


def roots(expr, var=x):
    sols = sp.solve(expr, var)
    assert all(sp.im(z) == 0 for z in sols), sols
    return sols


def vieta(expr, var=x):
    """sum and product of the solutions of a quadratic, read from its coefficients"""
    A, B, C = sp.Poly(sp.expand(expr), var).all_coeffs()
    return -B / A, C / A


def vertex_x(expr, var=x):
    d = sp.diff(expr, var)
    sol = sp.solve(d, var)
    assert len(sol) == 1
    return sol[0]


E = []


def add(qid, kind, note, value, calc, choice=None, show=None):
    E.append({'id': qid, 'k': kind, 'n': note, 'value': value, 'calc': calc, 'choice': choice, 'show': show})


# ---- 1. A multiple of what you know -------------------------------------------------------------------------------
add('2e8cc1c0', 'scale', '24x is 6 × 4x, so 24x = 6 × 3 = 18. There is no need to find x = 3/4.', 18,
    lambda: one([sp.Eq(4 * x, 3)], [x], 24 * x), 'C')
add('49cd76d5', 'scale', '72x is 9 × 8x, so 72x = 9 × 6 = 54, with no fractions on the way.', 54,
    lambda: one([sp.Eq(8 * x, 6)], [x], 72 * x), 'C')
add('70774aa4', 'scale', '15x is 3 × 5x, so 15x = 3 × 20 = 60.', 60, lambda: one([sp.Eq(5 * x, 20)], [x], 15 * x), 'D')
add('b4553284', 'scale', '9x is 4.5 times 2x, so 9x = 4.5 × 12 = 54. Here x = 6 is just as quick.', 54,
    lambda: one([sp.Eq(2 * x, 12)], [x], 9 * x))
add('b82a943c', 'scale', 'Finding x is quickest here: x = 4, so 8x = 32. The question wants 8x, not x.', 32,
    lambda: one([sp.Eq(7 * x, 28)], [x], 8 * x), 'B')
add('088bc84e', 'scale', '2(5x) = 6 already holds 5x. Divide both sides by 2: 5x = 3.', 3,
    lambda: one([sp.Eq(2 * (5 * x), 6)], [x], 5 * x), 'C')
add('fa80893a', 'scale', 'Triple both sides: 6x + 9 = 27. Then take 10 from both sides: 6x − 1 = 17.', 17,
    lambda: one([sp.Eq(2 * x + 3, 9)], [x], 6 * x - 1))
add('0adbe034', 'scale', '4x − 28 is 4(x − 7), so divide both sides by 4: x − 7 = −6.', -6,
    lambda: one([sp.Eq(4 * x - 28, -24)], [x], x - 7), 'C')
add('9b886541', 'scale', '3x + 8 is 16 more than 3x − 8, so add 16 to both sides: 3x + 8 = 23.', 23,
    lambda: one([sp.Eq(3 * x - 8, 7)], [x], 3 * x + 8), 'D')
add('590f2187', 'scale', '3x − 27 is 3(x − 9), so divide both sides by 3: x − 9 = 8.', 8,
    lambda: one([sp.Eq(3 * x - 27, 24)], [x], x - 9), 'B')
add('2f0a43b2', 'scale', '8/x is x/8 turned upside down, so turn the 5 upside down too: 8/x = 1/5.', R(1, 5),
    lambda: one([sp.Eq(x / 8, 5)], [x], 8 / x))
add('40ba6288', 'scale', 'Take 12 from both sides of 3x = 30: 3x − 12 = 18.', 18, lambda: one([sp.Eq(3 * x, 30)], [x], 3 * x - 12), 'B')
add('eac739b2', 'scale', '16x + 8 is 4(4x + 2), so it is 4 × 12 = 48.', 48, lambda: one([sp.Eq(4 * x + 2, 12)], [x], 16 * x + 8), 'B')
add('3c4ce699', 'scale', '18 + 3x is 3(6 + x), so it is 3 × 9 = 27.', 27, lambda: one([sp.Eq(6 + x, 9)], [x], 18 + 3 * x))
add('4e77195b', 'scale', '16 + 8x is 8(2 + x), so it is 8 × 60 = 480.', 480, lambda: one([sp.Eq(2 + x, 60)], [x], 16 + 8 * x))
add('5eb4918d', 'scale', '90x + 40 is 10(9x + 4), so it is 10 × 67 = 670.', 670, lambda: one([sp.Eq(9 * x + 4, 67)], [x], 90 * x + 40), 'D')
add('ce6b52d8', 'scale', 'Expand and collect: 7t − 20 = 40 + 4t, so 3t = 60. That is what is asked, so stop before finding t.', 60,
    lambda: one([sp.Eq(2 * (3 * t - 10) + t, 40 + 4 * t)], [t], 3 * t))

# ---- 2. The same bracket twice ------------------------------------------------------------------------------------
add('620abf36', 'block', 'Five lots of (x + 4) equal four lots plus 29, so one lot is 29: x + 4 = 29.', 29,
    lambda: one([sp.Eq(5 * (x + 4), 4 * (x + 4) + 29)], [x], x + 4), 'C')
add('f60aa0dc', 'block', 'Nine lots of (4 − 3x) plus 2 equal eight lots plus 18, so one lot is 16: 4 − 3x = 16.', 16,
    lambda: one([sp.Eq(9 * (4 - 3 * x) + 2, 8 * (4 - 3 * x) + 18)], [x], 4 - 3 * x), 'D')
add('018a2704', 'block', 'Take 16 from both sides: 2(x − 8) = 30, which is exactly what is asked.', 30,
    lambda: one([sp.Eq(46, 16 + 2 * (x - 8))], [x], 2 * (x - 8)), 'C')
add('7a5a74a6', 'block', '2x − 6 is 2(x − 3), so the equation is 6(x − 3) − 11 = 4(x − 3) + 6. That gives 2(x − 3) = 17, so x − 3 = 17/2.', R(17, 2),
    lambda: one([sp.Eq(3 * (2 * x - 6) - 11, 4 * (x - 3) + 6)], [x], x - 3), 'B')
add('4771a64a', 'block', 'Call 2 − 4x the bracket: 5 − 7 × bracket = 16 − 8 × bracket, so the bracket is 11.', 11,
    lambda: one([sp.Eq(5 - 7 * (2 - 4 * x), 16 - 8 * (2 - 4 * x))], [x], 2 - 4 * x))
add('aee9fd2d', 'block', 'The same number over 3 and over 13 can be equal only when the number is 0. So x + 6 = 0, which is between −2 and 2.', 0,
    lambda: one([sp.Eq((x + 6) / 3, (x + 6) / 13)], [x], x + 6), 'B', show='between −2 and 2')
add('f5ff91b2', 'block', 'The same number over 7 and over 9 can be equal only when it is 0. So x − 5 = 0, which is between −3 and 3.', 0,
    lambda: one([sp.Eq((x - 5) / 7, (x - 5) / 9)], [x], x - 5), 'B', show='between −3 and 3')

# ---- 3. Add or subtract the equations -----------------------------------------------------------------------------
add('608eeb6e', 'combine', 'Add the equations: 5x − 4x + y = 15 − 2, so x + y = 13.', 13,
    lambda: one([sp.Eq(5 * x, 15), sp.Eq(-4 * x + y, -2)], [x, y], x + y), 'C')
add('9db5b5c1', 'combine', 'Add the equations: 4x − 3x + y = 20 − 7, so x + y = 13.', 13,
    lambda: one([sp.Eq(4 * x, 20), sp.Eq(-3 * x + y, -7)], [x, y], x + y), 'C')
add('570b5a5d', 'combine', 'The first equation plus twice the second: (7/2 + 5)x + 18y = 25 + 46, so (17/2)x + 18y = 71.', 71,
    lambda: one([sp.Eq(R(7, 2) * x + 6 * y, 25), sp.Eq(R(5, 2) * x + 6 * y, 23)], [x, y], R(17, 2) * x + 18 * y), 'D')
add('edc1b7b7', 'combine', 'Subtract the equations: 4(8x) = 0, so 8x = 0. Add them: 8(7y) = 24, so 7y = 3. So 8x + 7y = 3.', 3,
    lambda: one([sp.Eq(2 * (8 * x) + 4 * (7 * y), 12), sp.Eq(-2 * (8 * x) + 4 * (7 * y), 12)], [x, y], 8 * x + 7 * y))
add('3a84f885', 'combine', 'Add the equations: the 4(y + 7) terms cancel, so 2(x − 2) = 559. Triple both sides: 6(x − 2) = 1677.', 1677,
    lambda: one([sp.Eq((x - 2) - 4 * (y + 7), 117), sp.Eq((x - 2) + 4 * (y + 7), 442)], [x, y], 6 * (x - 2)))

# ---- 4. Sum or product of the solutions ---------------------------------------------------------------------------
add('4b6f0a3f', 'roots', 'Sum = −b/a = 5. (The solutions are 8 and −3.)', 5, lambda: sum(roots(x**2 - 5 * x - 24)), show='= 5')
add('ff2e5c76', 'roots', 'Sum = −b/a = 40. Finding the solutions themselves would take the quadratic formula and square roots.', 40,
    lambda: sp.simplify(sum(roots(x**2 - 40 * x - 10))), 'D')
add('158591f0', 'roots', 'Move everything to one side first: 3x² − 29x + 56 = 0. Then the sum is −b/a = 29/3.', R(29, 3),
    lambda: sp.simplify(sum(roots(x * (x + 1) - 56 - 4 * x * (x - 7)))))
add('5edc8c98', 'roots', 'Sum = (16a + 4b)/64 = 4(4a + b)/64 = (4a + b)/16, so k = 1/16.', R(1, 16),
    lambda: sp.simplify(vieta(64 * x**2 - (16 * a + 4 * b) * x + a * b)[0] / (4 * a + b)))
add('2c05d312', 'roots', 'Product = c/a = ab/57, so k = 1/57.', R(1, 57),
    lambda: sp.simplify(vieta(57 * x**2 + (57 * b + a) * x + a * b)[1] / (a * b)), 'A')
add('722de804', 'roots', 'x − 47 is 1 or −1, so the two solutions sit 1 either side of 47. Their sum is 2 × 47 = 94.', 94,
    lambda: sum(roots((x - 47)**2 - 1)))
add('c9417793', 'roots', '|x − 9| = 18, so the two solutions sit 18 either side of 9. Their sum is 2 × 9 = 18.', 18,
    lambda: sum(sp.solve(sp.Eq(x - 9, 18), x) + sp.solve(sp.Eq(x - 9, -18), x)), show='2 × 9 = 18')
add('3a01a5ee', 'roots', 'The two solutions sit either side of the x that makes −5x + 13 zero, x = 13/5. So their sum is 2 × 13/5 = 26/5.', R(26, 5),
    lambda: sum(sp.solve(sp.Eq(-5 * x + 13, 73), x) + sp.solve(sp.Eq(-5 * x + 13, -73), x)), 'D')
add('30596346', 'roots', 'Read the solutions off the factors: k, 4 and −4. The 4 and −4 cancel, so the sum is k, and k = 59.', 59,
    lambda: one([sp.Eq(sum(roots(R(1, 7) * (x - kp) * (16 - x**2))), 59)], [kp], kp))

# ---- 5. Match the two sides ---------------------------------------------------------------------------------------
add('371cbf6b', 'match', 'Match the x³ terms: 5a = 20, so a = 4. Match the x² terms: 15 − ab = −9, so ab = 24, which is what is asked.', 24,
    lambda: (lambda d: d[a] * d[b])(ident((a * x + 3) * (5 * x**2 - b * x + 4), 20 * x**3 - 9 * x**2 - 2 * x + 12, x, [a, b])), 'C')
add('b4a6ed81', 'match', 'Multiply out the right side: 15ry⁵ − 9ry⁴. Match the y⁵ terms: 15r = 90, so r = 6.', 6,
    lambda: ident(90 * y**5 - 54 * y**4, r * y**4 * (15 * y - 9), y, [r])[r])
add('34847f8a', 'match', 'Over the common bottom, the top on the left is 2(x + 5) + 3(x − 2) = 5x + 4. So r = 5, t = 4 and rt = 20.', 20,
    lambda: (lambda d: d[r] * d[t])(ident_frac(2 / (x - 2) + 3 / (x + 5), (r * x + t) / ((x - 2) * (x + 5)), x, [r, t])), 'C')
add('ea6d05bb', 'match', 'Only the x-term is needed: 3x × 6 − 23 × 19x = 18x − 437x = −419x, so b = −419.', -419,
    lambda: sp.Poly(sp.expand((3 * x - 23) * (19 * x + 6)), x).coeff_monomial(x))
add('5355c0ef', 'match', 'Match the x² terms: 4a = 0.36, so a = 0.09. Check: 7 × 0.09 = 0.63 and 13 × 0.09 = 1.17.', R(9, 100),
    lambda: ident(R(36, 100) * x**2 + R(63, 100) * x + R(117, 100), a * (4 * x**2 + 7 * x + 13), x, [a])[a], show='a = 0.09')
add('c81b6c57', 'match', 'Match the x-terms: 3p − 16p − 64 = −155, so −13p = −91 and p = 7.', 7,
    lambda: ident(3 * (2 * x**2 + p * x + 8) - 16 * x * (p + 4), 6 * x**2 - 155 * x + 24, x, [p])[p], 'B')
add('a0b4103e', 'match', '(x − k)(x + k) = x² − k², so the right side is x²/3 − k²/3. Match the plain numbers: k²/3 = 2, so k = √6.', sp.sqrt(6),
    lambda: [z for z in sp.solve(sp.expand(R(1, 3) * x**2 - 2 - R(1, 3) * (x - k) * (x + k)), k) if z > 0][0], 'D', show='k = √6')
add('49efde89', 'match', 'x(2x + 7) = 2x² + 7x. Match the x-terms: a = 7.', 7, lambda: ident(2 * x**2 + a * x, x * (2 * x + 7), x, [a])[a], 'D')
add('04887c7b', 'match', '(2x + 3)(7x − 2) − (5x + 6) has x-terms −4x + 21x − 5x = 12x, so b = 12.', 12,
    lambda: sp.Poly(sp.expand((2 * x + 3) * (7 * x - 2) - (5 * x + 6)), x).coeff_monomial(x), 'B')
add('f237ccfc', 'match', 'a + b + c is the value at x = 1, so put x = 1 into the sum: (−2 + 1 + 31) + (3 + 7 − 8) = 32.', 32,
    lambda: sum(sp.Poly(sp.expand(-2 * x**2 + x + 31 + 3 * x**2 + 7 * x - 8), x).all_coeffs()))
add('a391ed22', 'match', 'Only the x-term is needed: (1/2)(1/2) + (3/2)(3/2) = 1/4 + 9/4 = 5/2.', R(5, 2),
    lambda: sp.Poly(sp.expand((x / 2 + R(3, 2)) * (R(3, 2) * x + R(1, 2))), x).coeff_monomial(x))
add('c8a5c221', 'match', 'Collect the x² terms: −5x² − 3x² = −8x², so a = −8.', -8,
    lambda: sp.Poly(sp.expand((9 * x**4 + 8 * x**3) - (7 * x**3 + 5 * x**2) - (3 * x**2 + x)), x).coeff_monomial(x**2), 'A')
add('911c415b', 'match', 'a + b is the value at y = 1: (7532 + 100) + 10(10 − 110) = 7632 − 1000 = 6632.', 6632,
    lambda: sum(sp.Poly(sp.expand((7532 + 100 * y**2) + 10 * (10 * y**2 - 110)), y).as_dict().values()))
add('16de54c7', 'match', 'Match the plain numbers: −3k = −12, so k = 4. Check the x-terms: 2k − 3 = 5.', 4,
    lambda: ident(2 * x**2 + 5 * x - 12, (2 * x - 3) * (x + k), x, [k])[k])
add('26e83bbc', 'match', 'Match the x² terms: bx × (−27x) = −27bx² must be −3x², so b = 1/9. Check the x³ terms: −27 + 9b = −26.', R(1, 9),
    lambda: ident((x**2 + b * x) * (9 * x**2 - 27 * x), 9 * x**4 - 26 * x**3 - 3 * x**2, x, [b])[b], 'C')
add('1dd13816', 'match', 'Collect the x³ terms: 5x³ + 4x³ = 9x³, so b = 9.', 9,
    lambda: ident((5 * x**3 - 3) - (-4 * x**3 + 8), b * x**3 - 11, x, [b])[b])
add('5c94e6fa', 'match', 'Infinitely many solutions means the two sides are the same expression: 3x + 21 = 3x + k, so k = 21.', 21,
    lambda: ident(3 * x + 21, 3 * x + k, x, [k])[k])
add('e53870b6', 'match', 'Infinitely many solutions means the two sides are the same expression, so k = 5.', 5,
    lambda: ident(6 * x + k, 6 * x + 5, x, [k])[k], show='k = 5')
add('15daa8d6', 'match', 'a(x + 8) = ax + 8a has to be 2x + 16 for every x, so a = 2.', 2, lambda: ident(2 * x + 16, a * (x + 8), x, [a])[a], show='a = 2')
add('40049d49', 'match', '4x + 12 is 4(x + 3) and the right side is (a/2)(x + 3). So a/2 = 4 and a = 8.', 8,
    lambda: ident(4 * x + 12, a * (x + 3) / 2, x, [a])[a], 'C')
add('70e29454', 'match', 'a(3 − x) − b = −ax + 3a − b. Match the x-terms: a = 2. Match the plain numbers: 6 − b = −1, so b = 7.', (2, 7),
    lambda: (lambda d: (d[a], d[b]))(ident(a * (3 - x) - b, -1 - 2 * x, x, [a, b])), 'B', show='b = 7')
add('ac472881', 'match', 'The left side is 3x + 7 − s/13 and the right side is rx − 8r. Match: r = 3, then 7 − s/13 = −24, so s = 403.', 403,
    lambda: ident((12 * x + 28) / 4 - s / 13, r * (x - 8), x, [r, s])[s])
add('4b76c7f1', 'match', '8x + 28y is 4(2x + 7y). For the same line the right side must also be 4 times as big: a = 4 × 9 = 36.', 36,
    lambda: one([sp.Eq(2 * a, 8 * 9), sp.Eq(7 * a, 28 * 9)], [a], a), 'C')
add('dcc4886a', 'match', 'Infinitely many solutions means the second equation is the same line, so b = 3.', 3,
    lambda: ident(R(2, 7) * x + 3, m * x + b, x, [m, b])[b], 'D')
add('e142f83c', 'match', 'Same line: the first is y = (4/5)x + 10 and the second is y = (4/5)x + 8 + v, so v = 2.', 2,
    lambda: ident(R(4, 5) * (x + 5) + 6, R(4, 5) * (x + 10) + v, x, [v])[v], 'B')
add('571174f3', 'match', 'Same line, so g and k are the same multiple of 2/5 and 7/5. So g/k = (2/5) ÷ (7/5) = 2/7, without finding g or k.', R(2, 7),
    lambda: one([sp.Eq(g, m * R(2, 5)), sp.Eq(k, m * R(7, 5)), sp.Eq(R(5, 2), m * R(2, 7))], [g, k, m], g / k))
add('d909cd31', 'match', 'Multiply the given equation by 4/5: −12x + 20y = 52. Same line, so infinitely many solutions.', (-12, 20, 52),
    lambda: tuple(R(4, 5) * z for z in (-15, 25, 65)), 'C', show='−12x + 20y = 52')

# ---- 6. Halfway between equal heights -----------------------------------------------------------------------------
add('8e1da169', 'mirror', 'The zeros are 44 and 46, and the minimum is halfway between them: x = 45.', 45, lambda: vertex_x((x - 44) * (x - 46)), 'B')
add('18e35375', 'mirror', 'The zeros are 14 and −19, and the minimum is halfway: (14 − 19)/2 = −5/2.', R(-5, 2), lambda: vertex_x((x - 14) * (x + 19)), 'D')
add('083ef63a', 'mirror', 'The zeros are 2 and −15, and the minimum is halfway: (2 − 15)/2 = −13/2.', R(-13, 2), lambda: vertex_x((x - 2) * (x + 15)))
add('4d7064a6', 'mirror', 'The zeros are 10 and −13, and the minimum is halfway: (10 − 13)/2 = −3/2.', R(-3, 2), lambda: vertex_x((x - 10) * (x + 13)), 'D')
add('668f1863', 'mirror', 'f(−20) and f(−4) are both 0, so the vertex is halfway between: r = (−20 − 4)/2 = −12.', -12,
    lambda: vertex_x((x + 20) * (x + 4)))
add('271ffad7', 'mirror', 'It starts at 7 m at time 0 and is highest at 3 s, so it is back at 7 m the same time after the peak: at 6 s.', 6,
    lambda: (lambda A: [z for z in sp.solve(A * (t - 3)**2 + R(511, 10) - 7, t) if z != 0][0])(sp.solve(a * (0 - 3)**2 + R(511, 10) - 7, a)[0]), 'B',
    show='6 s')
add('de91a6fc', 'mirror', 'The most bowls sell at $10. $8 and $12 are both $2 away from it, so they sell the same number: 5.', 5,
    lambda: (lambda A: A * (8 - 10)**2 + 9)(sp.solve(a * (12 - 10)**2 + 9 - 5, a)[0]), show='number: 5')
add('bba18ecb', 'mirror', '−17/4 is 5/4 to the left of the vertex at x = −3, so the other intercept is 5/4 to the right of it: −7/4.', R(-7, 4),
    lambda: (lambda A: [z for z in roots(A * (x + 3)**2 + 6) if z != R(-17, 4)][0])(sp.solve(a * (R(-17, 4) + 3)**2 + 6, a)[0]), 'B')

# ---- look-alikes ----------------------------------------------------------------------------------------------------
add('ea8bd66f', 'x-sub', 'Adding these equations does not give x + y. One already says y = 4x, so substitute: 5x − 12x = −14, x = 2, y = 8, and x + y = 10.', 10,
    lambda: one([sp.Eq(y, 4 * x), sp.Eq(5 * x - 3 * y, -14)], [x, y], x + y), 'D')
add('bd45df49', 'x-sub', 'Put y = 3x + 9 into the second equation: 9x + 27 = 8x − 6, so x = −33 and y = −90. Then x − y = 57.', 57,
    lambda: one([sp.Eq(y, 3 * x + 9), sp.Eq(3 * y, 8 * x - 6)], [x, y], x - y), 'D')
add('1362ccde', 'x-sub', 'Put y = 4x + 1 into the second equation: 16x + 4 = 15x − 8, so x = −12 and y = −47. Then x − y = 35.', 35,
    lambda: one([sp.Eq(y, 4 * x + 1), sp.Eq(4 * y, 15 * x - 8)], [x, y], x - y))
add('7028c74f', 'x-divide', 'Dividing both sides by x + 7 throws away x = −7. Move everything to one side instead: (x + 7)(15x − 260) = 0, so x = −7 or 52/3, and the sum is 31/3.', R(31, 3),
    lambda: sum(roots(5 * (x + 7) - 15 * (x - 17) * (x + 7))))
add('911383f2', 'x-cubic', 'Three factors, so c/a does not apply. Read the solutions off: 4, −2 and 1. Their product is −8. Multiplying out gives a constant of +8, which is choice A.', -8,
    lambda: sp.prod(roots((x - 4) * (x + 2) * (x - 1))), 'D', show='product is −8')


def show_text(v):
    """how a value is written in a note"""
    if isinstance(v, tuple):
        return None
    v = sp.nsimplify(v)
    if v.is_Integer:
        return str(v).replace('-', '−')
    if v.is_Rational:
        return ('−' if v < 0 else '') + '%d/%d' % (abs(v.p), v.q)
    return None


def official(qid, Q):
    row = Q[qid]
    return row[3], row[4]   # multiple choice?, the letter or the accepted forms


def form_value(f):
    f = f.strip()
    if '/' in f:
        n, d = f.split('/')
        return Fraction(n) / Fraction(d)
    return Fraction(f)


def check(Q):
    bad = []
    seen = set()
    for e in E:
        qid = e['id']
        if qid in seen:
            bad.append(qid + ': listed twice')
        seen.add(qid)
        if qid not in Q:
            bad.append(qid + ': not in the bank')
            continue
        if e['k'] not in KINDS:
            bad.append(qid + ': unknown kind ' + e['k'])
        got = e['calc']()
        want = e['value']
        if isinstance(want, tuple):
            ok = tuple(sp.nsimplify(z) for z in got) == tuple(sp.nsimplify(z) for z in want)
        else:
            ok = sp.simplify(sp.nsimplify(got) - sp.nsimplify(want)) == 0
        if not ok:
            bad.append('%s: worked out %s, the note says %s' % (qid, got, want))
        mc, key = official(qid, Q)
        if mc:
            if e['choice'] != key:
                bad.append('%s: the note picks %s, College Board’s answer is %s' % (qid, e['choice'], key))
        else:
            if e['choice']:
                bad.append(qid + ': a letter for a typed-in question')
            elif isinstance(want, tuple) or not any(abs(float(form_value(f)) - float(sp.nsimplify(want))) < 0.0006 for f in key):
                bad.append('%s: %s is not among the accepted answers %s' % (qid, want, key))
        txt = e['show'] or show_text(want)
        if not txt or txt not in e['n']:
            bad.append('%s: the note does not state %r' % (qid, txt))
        if re.search(r'(?<![A-Za-z])-(?=[\d(x])', e['n']) or ' - ' in e['n']:
            bad.append(qid + ': a hyphen used as a minus sign')
        if len(e['n']) > 240:
            bad.append(qid + ': note longer than 240 characters')
    for kd in KINDS:
        n = sum(1 for e in E if e['k'] == kd)
        if n < (1 if kd.startswith('x-') else 4):
            bad.append('%s: only %d questions' % (kd, n))
    return bad


def payload():
    order = {kd: i for i, kd in enumerate(KINDS)}
    rows = sorted(E, key=lambda e: order[e['k']])
    return {'kinds': KINDS, 'qs': {e['id']: {'k': e['k'], 'n': e['n']} for e in rows}}


def main():
    Q = {row[0]: row for row in json.load(open(os.path.join(BUILD, 'mdata.json'), encoding='utf-8'))['qs']}
    bad = check(Q)
    if bad:
        print('\n'.join(bad))
        sys.exit(1)
    data = payload()
    text = json.dumps(data, ensure_ascii=False, indent=1) + '\n'
    if '--check' in sys.argv:
        cur = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        if cur != text:
            print('src/build/mfirst.json is out of date: run python3 src/math/shortcut_first.py')
            sys.exit(1)
        print('all %d shortcut-first questions check out' % len(E))
        return
    open(OUT, 'w', encoding='utf-8').write(text)
    counts = {kd: sum(1 for e in E if e['k'] == kd) for kd in KINDS}
    print('wrote', OUT, len(E), 'questions', counts)


if __name__ == '__main__':
    main()
