"""Checks the Algebra foundations cards (D.mdrills.found). Called from mdrills_check.py with its parsing helpers.

Each card's question line says what kind of answer it wants:
  "Which is equal to it?"           exactly one choice is equivalent to the printed expression
  "What is x?"                      exactly one choice is the solution (or "No solution" when every candidate fails)
  "What is the value of <expr>?"    exactly one choice is the value the printed equations force on <expr>
  "Solve for <v>."                  exactly one choice is the printed formula solved for <v>
"""
import re
import sympy as sp


def check(cards, fail, text, ex, eq, solset, equivalent):
    for c in cards:
        boxes = re.findall(r'<p class="mxl">(.*?)</p>', c['p'])
        q = re.sub(r'<[^>]+>', '', re.search(r'<p class="dask">(.*?)</p>', c['p']).group(1))
        opts = {o[0]: o[1] for o in c['o']}
        good = []
        if q == 'Which is equal to it?':
            e0 = ex(text(boxes[0]))
            good = [k for k, v in opts.items() if equivalent(e0, ex(text(v)))]
        elif q == 'What is x?':
            x = sp.Symbol('x', real=True)
            sols = solset(eq(text(boxes[0])))
            for k, v in opts.items():
                if v == 'No solution':
                    if sols == sp.S.EmptySet:
                        good.append(k)
                elif isinstance(sols, sp.FiniteSet) and len(sols) == 1 and sp.nsimplify(ex(text(v))) == list(sols)[0]:
                    good.append(k)
        elif q.startswith('What is the value of '):
            want = ex(text(re.search(r'<p class="dask">What is the value of (.*?)\?</p>', c['p']).group(1)))
            eqs = [eq(text(b)) for b in boxes]
            syms = sorted(set().union(*[e.free_symbols for e in eqs]), key=str)
            sol = sp.solve([e.lhs - e.rhs for e in eqs], syms, dict=True)
            for k, v in opts.items():
                val = sp.nsimplify(ex(text(v)))
                if sol and len(sol) == 1 and len(sol[0]) == len(syms):
                    hit = sp.simplify(want.subs(sol[0]) - val) == 0
                else:
                    # one equation in two unknowns: the expression is fixed when want - val is a multiple of lhs - rhs
                    d0 = sp.expand(eqs[0].lhs - eqs[0].rhs)
                    ratio = sp.simplify(sp.expand(want - val) / d0)
                    hit = len(eqs) == 1 and ratio.is_number and ratio != 0
                if hit:
                    good.append(k)
        elif q.startswith('Solve for '):
            name = q[len('Solve for '):].rstrip('.')
            e0 = eq(text(boxes[0]))
            v = [s_ for s_ in e0.free_symbols if str(s_) == name][0]
            target = sp.solve(e0.lhs - e0.rhs, v)
            for k, o in opts.items():
                e1 = eq(text(o))
                if str(e1.lhs) == name and len(target) == 1 and sp.simplify(e1.rhs - target[0]) == 0:
                    good.append(k)
        else:
            fail(c, 'no check for the question "%s"' % q)
            continue
        if good != [c['a']]:
            fail(c, '%s: matching choices %s, key %s' % (q, good, c['a']))
