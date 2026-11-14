"""Checks every Math drill card in src/build/mdrills.json against its printed math, independently of the generator.

It reads the math as a student sees it (the HTML in the prompt and the choices), turns it into sympy expressions, and
checks the answer key: the number of solutions, which form prints the value asked for, that exactly one choice is
equivalent to the expression or equation, and the slope and percent answers.

Needs sympy (pip install sympy). Run: python3 -I src/check/mdrills_check.py
"""
import json, os, re, sys
from fractions import Fraction as Fr
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(HERE), 'build', 'mdrills.json')
T = standard_transformations + (implicit_multiplication_application,)
x, y, a, b, n, t = sp.symbols('x y a b n t', real=True)
POS = {k: sp.Symbol(k, positive=True) for k in 'xyabnt'}
NAMES = {'x': x, 'y': y, 'a': a, 'b': b, 'n': n, 't': t, 'sqrt': sp.sqrt, 'cbrt': sp.cbrt}


def text(h):
    """Printed HTML -> plain math text that sympy can read."""
    s = h
    for _ in range(3):
        s = re.sub(r'<span class="fr"><span>([^<]*(?:<sup>[^<]*</sup>[^<]*)*)</span><span>([^<]*(?:<sup>[^<]*</sup>[^<]*)*)</span></span>', r'((\1)/(\2))', s)
    s = re.sub(r'<sup>([^<]*)</sup>', r'**(\1)', s)
    s = re.sub(r'<[^>]+>', '', s)
    s = s.replace('−', '-').replace('·', '*').replace('×', '*').replace('÷', '/').replace('²', '**2')
    s = re.sub(r'√(\d+)', r'sqrt(\1)', s)
    s = re.sub(r'∛(\d+)', r'cbrt(\1)', s)
    s = re.sub(r'∜(\d+)', r'(\1)**(1/4)', s)
    return s.strip()


def ex(s, names=None):
    return parse_expr(s, local_dict=names or NAMES, transformations=T)


def eq(s, names=None):
    s = re.sub(r'^[fh]\((x|t)\)\s*=\s*', '', s.strip())
    if '=' in s:
        l, r = s.split('=')
        return sp.Eq(ex(l, names), ex(r, names), evaluate=False)
    return ex(s, names)


def nsol(lines):
    """'0', '1', '2' or 'inf' for one equation in x, or a system in x and y."""
    eqs = [eq(text(l)) for l in lines]
    if len(eqs) == 1:
        d = sp.expand(eqs[0].lhs - eqs[0].rhs)
        if d == 0:
            return 'inf'
        sols = sp.solveset(d, x, domain=sp.S.Reals)
        if sols == sp.S.EmptySet:
            return '0'
        return str(len(sols)) if isinstance(sols, sp.FiniteSet) else '?'
    sols = sp.solve([e.lhs - e.rhs for e in eqs], [x, y], dict=True)
    if not sols:
        return '0'
    if any(len(s) < 2 for s in sols):
        return 'inf'
    real = [s for s in sols if all(v.is_real for v in s.values())]
    return str(len(real))


def nums(s):
    return [Fr(v) for v in re.findall(r'-?\d+(?:/\d+)?', s.replace('−', '-'))]


fails = []


def fail(card, msg):
    fails.append('%s: %s' % (card['id'], msg))


def check_count(cards):
    for c in cards:
        lines = re.findall(r'<p class="mxl">(.*?)</p>', c['p'])
        got = nsol(lines)
        if got != c['a']:
            fail(c, 'key %s but the printed equations have %s solutions: %s' % (c['a'], got, ' / '.join(lines)))


def check_form(cards):
    for c in cards:
        v = t if 'h(t)' in c['o'][0][1] else x
        forms = {o[0]: text(o[1]) for o in c['o']}
        exprs = {k: sp.expand(ex(re.sub(r'^[fh]\((x|t)\)\s*=\s*', '', f))) for k, f in forms.items()}
        if len(set(exprs.values())) != 1:
            fail(c, 'the three forms are not the same function: %s' % forms)
            continue
        f = exprs['std']
        A, B, C = sp.Poly(f, v).all_coeffs()
        h = -B / (2 * A)
        k = f.subs(v, h)
        zeros = sorted(sp.solve(f, v))
        printed = {kk: set(nums(re.sub(r'^[fh]\((x|t)\)\s*=\s*', '', forms[kk]).replace('**(2)', '').replace('**2', ''))) for kk in forms}
        key = c['a']
        ask = c['ask']
        need = {'vertex': {abs(Fr(str(h))), abs(Fr(str(k)))}, 'ext': {abs(Fr(str(k)))}, 'axis': {abs(Fr(str(h)))},
                'zeros': {abs(Fr(str(z))) for z in zeros}, 'yint': {abs(Fr(str(C)))}}[ask]
        shows = [kk for kk in forms if need <= {abs(q) for q in printed[kk]}]
        if shows != [key]:
            fail(c, 'asks %s; printed in %s, key %s' % (ask, shows, key))
        if ask in ('vertex', 'ext') and 'maximum' in c['p'] and A > 0:
            fail(c, 'asks for a maximum of a parabola that opens up')
        if ask == 'ext' and 'minimum' in c['p'] and A < 0:
            fail(c, 'asks for a minimum of a parabola that opens down')


def equivalent(e1, e2):
    p = {s: sp.Symbol(str(s), positive=True) for s in (e1.free_symbols | e2.free_symbols)}
    return sp.simplify(e1.subs(p) - e2.subs(p)) == 0


def check_exp(cards):
    for c in cards:
        prompt = ex(text(re.search(r'<p class="mxl">(.*?)</p>', c['p']).group(1)))
        good = [o[0] for o in c['o'] if equivalent(prompt, ex(text(o[1])))]
        if good != [c['a']]:
            fail(c, 'choices equal to the prompt: %s, key %s' % (good, c['a']))


def solset(e):
    d = sp.together(e.lhs - e.rhs)
    num_, den = sp.fraction(d)
    sols = sp.solveset(num_, x, domain=sp.S.Reals)
    if den.free_symbols:
        sols = sols - sp.solveset(den, x, domain=sp.S.Reals)
    return sols


def check_frac(cards):
    for c in cards:
        e0 = eq(text(re.search(r'<p class="mxl">(.*?)</p>', c['p']).group(1)))
        s0 = solset(e0)
        good = []
        for o in c['o']:
            e1 = eq(text(o[1]))
            if '/' in text(o[1]):
                fail(c, 'a choice still has a fraction: %s' % o[1])
            if solset(e1) == s0:
                good.append(o[0])
        if good != [c['a']]:
            fail(c, 'choices with the same solutions as the prompt: %s, key %s' % (good, c['a']))


def check_slope(cards):
    for c in cards:
        if 'water tank' in c['p']:
            y1, x1, y2, x2 = [int(v) for v in re.findall(r'(\d+) liters after (\d+) minute', c['p'])[0] + re.findall(r'(\d+) liters after (\d+) minute', c['p'])[1]]
        else:
            pts = [Fr(v) for v in re.findall(r'-?\d+', text(c['p']))]
            x1, y1, x2, y2 = pts
        m = Fr(y2 - y1, x2 - x1)
        val = {o[0]: sp.nsimplify(ex(text(o[1]))) for o in c['o']}
        good = [k for k, v in val.items() if v == sp.Rational(m.numerator, m.denominator)]
        if good != [c['a']]:
            fail(c, 'slope %s; matching choices %s, key %s' % (m, good, c['a']))


def mult(v):
    return Fr(v.replace('−', '-'))


def check_pct(cards):
    for c in cards:
        p = re.sub(r'<[^>]+>', '', c['p'])
        right = re.sub(r'<[^>]+>', '', [o[1] for o in c['o'] if o[0] == c['a']][0]).replace('−', '-')
        others = [re.sub(r'<[^>]+>', '', o[1]).replace('−', '-') for o in c['o'] if o[0] != c['a']]
        m = re.match(r'(Increase|Decrease) an amount by (\d+)%', p)
        if m:
            r = Fr(int(m.group(2)), 100)
            want = 1 + r if m.group(1) == 'Increase' else 1 - r
            got = Fr(right.replace('× ', ''))
            if got != want or any(Fr(o.replace('× ', '')) == want for o in others):
                fail(c, 'multiplier %s, key %s' % (want, right))
            continue
        m = re.match(r'An amount (increases|decreases) by (\d+)%, then the new amount (increases|decreases) by (\d+)%', p)
        if m:
            f1 = 1 + (1 if m.group(1) == 'increases' else -1) * Fr(int(m.group(2)), 100)
            f2 = 1 + (1 if m.group(3) == 'increases' else -1) * Fr(int(m.group(4)), 100)
            got = Fr(re.match(r'× ([\d.]+)', right).group(1))
            if got != f1 * f2 or any(Fr(re.match(r'× ([\d.]+)', o).group(1)) == f1 * f2 for o in others):
                fail(c, 'two changes: %s, key %s' % (f1 * f2, right))
            pc = (f1 * f2 - 1) * 100
            if pc and ('%s%% %s' % (abs(pc), 'increase' if pc > 0 else 'decrease')) not in right:
                fail(c, 'overall percent wrong in %s' % right)
            continue
        m = re.match(r'After an? (\d+)% (increase|discount), a price is \$(\d+)', p)
        if m:
            r = Fr(int(m.group(1)), 100)
            orig = Fr(int(m.group(3))) / ((1 + r) if m.group(2) == 'increase' else (1 - r))
            if Fr(right.strip('$')) != orig or any(Fr(o.strip('$')) == orig for o in others):
                fail(c, 'original price %s, key %s' % (orig, right))
            continue
        m = re.match(r'p is (\d+)% (more than|less than|of) q', p)
        if m:
            r = Fr(int(m.group(1)), 100)
            want = {'more than': 1 + r, 'less than': 1 - r, 'of': r}[m.group(2)]
            val = lambda s_: Fr(re.match(r'p = ([\d.]+)q', s_).group(1))
            if val(right) != want or any(val(o) == want for o in others):
                fail(c, 'p = %sq, key %s' % (want, right))
            continue
        m = re.match(r'A value changes from (\d+) to (\d+)', p)
        if m:
            a0, b0 = int(m.group(1)), int(m.group(2))
            pc = Fr(b0 - a0, a0) * 100
            want = '%s%% %s' % (abs(pc), 'increase' if pc > 0 else 'decrease')
            if right != want or want in others:
                fail(c, 'percent change %s, key %s' % (want, right))
            continue
        m = re.match(r'An amount grows by (\d+)% each year for (\d+) years', p)
        if m:
            want = '× (%s)**%s' % (str(float(1 + Fr(int(m.group(1)), 100))).rstrip('0').rstrip('.'), m.group(2))
            got = re.sub(r'<sup>(\d+)</sup>', r'**\1', [o[1] for o in c['o'] if o[0] == c['a']][0])
            if got != want:
                fail(c, 'repeated growth %s, key %s' % (want, got))
            continue
        fail(c, 'no check for this card')


def main():
    d = json.load(open(DATA, encoding='utf-8'))
    check_count(d['count'])
    check_form(d['form'])
    check_exp(d['exp'])
    check_frac(d['frac'])
    check_slope(d['slope'])
    check_pct(d['pct'])
    if 'found' in d:
        from importlib import import_module
        sys.path.insert(0, HERE)
        import_module('found_check').check(d['found'], fail, text, ex, eq, solset, equivalent)
    total = sum(len(v) for v in d.values())
    if fails:
        print('\n'.join(fails))
        print('%d of %d cards fail' % (len(fails), total))
        sys.exit(1)
    print('all %d Math drill cards check out' % total)


if __name__ == '__main__':
    main()
