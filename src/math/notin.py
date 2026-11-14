"""Topics that some SAT prep books teach, checked against every Math question in the bank.
Writes src/build/mnotin.json for "What the bank never asks" on Math → Start here, and stops if the bank says otherwise.

The files in m/t/ hold the words of each question, its choices and College Board's explanation. Expressions there
are drawn, so this reads words only, but an explanation names the idea it uses in words ("imaginary", "logarithm",
"long division"), so a topic that no explanation names is not in the bank. The two questions kept as pictures were
read by eye: a520ba07 is a cube root and 8493fd10 is a circle's equation.

    python3 -I src/math/notin.py
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PICTURES = {'a520ba07': 'a cube root', '8493fd10': 'a circle given by its equation'}

# id, name, words that would appear if a question used it, what the page says, questions that use the words for
# something else (with what they are about)
NONE = [
    ('complex', 'Complex numbers and i', r'imaginary|complex',
     'No question, choice or explanation mentions an imaginary or complex number.', {}),
    ('log', 'Logarithms', r'logarithm',
     'No question uses one. Exponential questions are answered by reading the model, or by graphing it.', {}),
    ('matrix', 'Matrices and vectors', r'matri(x|ces)|vector', 'None at all.', {}),
    ('count', 'Permutations, combinations and factorials', r'permutation|factorial|how many (different )?ways|arrangements of',
     'No question asks how many ways something can be arranged or chosen. Probability questions divide one count by another, usually from a table.', {}),
    ('conic', 'Ellipses, hyperbolas, and a parabola’s focus and directrix', r'ellipse|hyperbola|\bfoc(us|i)\b|directrix',
     'The circle is the only one of these curves in the bank.', {}),
    ('trig', 'Sine waves, and the laws of sines and cosines', r'amplitude|sinusoid|periodic|law of (sines|cosines)',
     '', {}),
    ('remainder', 'The remainder theorem', r'remainder',
     'No question asks for the remainder when a polynomial is divided.', {'114ae8a9': 'the rest of a train trip'}),
]
RARE = [
    ('division', 'Polynomial division', r'long division|dividing the two polynomials', ['89fc23af'],
     'One Hard question asks which expression equals (x² − 2x − 5) ÷ (x − 3). The answer is x + 1 − 2/(x − 3). College Board’s explanation rewrites the top in terms of the bottom, and names long division only as another way.'),
    ('sequence', 'Sequences', r'\bsequence', ['2c6f214f'],
     'One Hard question: each term is a fixed multiple of the one before. That is an exponential function, so the exponential lessons cover it.'),
]
# a factor of a polynomial, asked in the question itself (not a scale factor or "increases by a factor")
FACTOR_Q = r'(is|be|are|\(are\)) a factor of|has a factor of|factor of the polynomial'


def texts():
    d = json.load(open(os.path.join(ROOT, 'src', 'build', 'mdata.json'), encoding='utf-8'))
    ty = {r[0]: (d['order'][r[1]], 'EMH'[r[2]]) for r in d['qs']}
    full, stem = {}, {}
    folder = os.path.join(ROOT, 'm', 't')
    for f in sorted(os.listdir(folder)):
        if not f.endswith('.js') or f.startswith('_'):
            continue
        s = open(os.path.join(folder, f), encoding='utf-8').read().replace('\\/', '/').replace('\\"', '"')
        s = re.sub(r'<img[^>]*>|<svg.*?</svg>', ' ', s, flags=re.S)
        s = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s))
        full[f[:-3]] = s
        m = re.search(r'"q":"(.*?)","c":', s)
        stem[f[:-3]] = m.group(1) if m else ''
    missing = sorted(set(ty) - set(full))
    if missing != sorted(PICTURES):
        sys.exit('questions without text: %s; expected only %s' % (missing, sorted(PICTURES)))
    return d, ty, full, stem


def main():
    d, ty, full, stem = texts()
    hits = lambda rx, where: sorted(i for i, s in where.items() if re.search(rx, s, re.I))
    out = {'n': len(d['qs']), 'none': [], 'rare': [], 'keep': []}
    trig = hits(r'\b(sine|cosine|sin|cos|tan|tangent of)\b', full)
    trig_types = sorted({ty[i][0] for i in trig})
    if any(not t.startswith(('rtt-', 'cir-')) for t in trig_types):
        sys.exit('a question outside right triangles and circles mentions sine, cosine or tangent: %s' % trig_types)
    for tid, name, rx, why, other in NONE:
        h = hits(rx, full)
        if h != sorted(other):
            sys.exit('%s: the bank has %s, expected only %s' % (name, h, sorted(other)))
        if tid == 'trig':
            why = 'Every one of the %d questions that mention sine, cosine or tangent is about a right triangle or a circle.' % len(trig)
        out['none'].append({'id': tid, 'name': name, 'why': why})
    for tid, name, rx, expect, why in RARE:
        h = hits(rx, full)
        if h != expect:
            sys.exit('%s: the bank has %s, expected %s' % (name, h, expect))
        out['rare'].append({'id': tid, 'name': name, 'why': why, 'qs': h})
    fq = hits(FACTOR_Q, stem)
    out['keep'].append({'id': 'factor', 'name': 'Factors and zeros of a polynomial', 'qs': fq,
                        'why': 'The factor theorem, the one piece of the remainder theorem the bank uses: if p(a) = 0, then x − a is a factor of p, and the other way round. %d questions ask about a factor of a polynomial. Two of them give only a table of values or points on the graph, and the factors come straight from the zeros.' % len(fq)})
    if len(fq) < 5:
        sys.exit('expected several factor questions, found %s' % fq)
    path = os.path.join(ROOT, 'src', 'build', 'mnotin.json')
    json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('%d topics with no question, %d rare, factor questions %s' % (len(out['none']), len(out['rare']), ' '.join(fq)))


if __name__ == '__main__':
    main()
