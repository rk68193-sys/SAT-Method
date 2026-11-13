"""Build src/build/vocab.json: the word list, the positive-or-negative check, second meanings and the
words used in purpose and structure choices. Every count is taken from src/build/bank.json.

    python3 -I src/reading/vocab.py
"""
import collections, html, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from vocab_defs import DEFS        # noqa: E402
from vocab_second import SECOND    # noqa: E402
from vocab_func import FUNC        # noqa: E402

# words whose prefix makes them look unfavorable although they are not
NEG_LOOK = ['innocuous', 'discern', 'discernible', 'discretion', 'disparate', 'dispassionately', 'disseminate', 'distinct',
            'impartial', 'imperceptible', 'inconspicuousness', 'indisputable', 'inexpensive', 'infallible', 'invulnerable',
            'unassailable', 'unassuming', 'unbiased', 'unbothered by', 'uncontroversial', 'undeniable', 'unmistakable',
            'unobtrusive', 'unpretentious']


def clean(t):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', html.unescape(t))).strip()


def head(w):
    return re.sub(r'^(a|an) ', '', w)


def forms(v):
    f = {v, v + 's', v + 'ed', v + 'd', v + 'ing'}
    if v.endswith('e'):
        f |= {v[:-1] + 'ing', v[:-1] + 'ed'}
    if v.endswith('y'):
        f |= {v[:-1] + 'ies', v[:-1] + 'ied'}
    if v.endswith('t') or v.endswith('p'):
        f |= {v + v[-1] + 'ed', v + v[-1] + 'ing'}
    return f


def build():
    bank = json.load(open(os.path.join(SRC, 'build', 'bank.json'), encoding='utf-8'))
    word_qs = [x for x in bank['reading'] if x['job'] == 'word']
    fill = [x for x in word_qs if 'most logical and precise' in x['q']]
    mean = [x for x in word_qs if x not in fill]
    assert len(fill) == 220 and len(mean) == 40, (len(fill), len(mean))

    # the word list
    info = collections.OrderedDict()
    for x in fill:
        for k in 'ABCD':
            w = clean(x['ch'][k]); h = head(w)
            assert h in DEFS, 'no definition for ' + h
            e = info.setdefault(h, {'n': 0, 'r': 0, 'q': [], 'f': []})
            e['n'] += 1
            e['q'].append(x['id'])
            if w != h and w not in e['f']:
                e['f'].append(w)
            if k == x['ans']:
                e['r'] += 1
    unused = sorted(set(DEFS) - set(info))
    assert not unused, unused
    words = [[h, DEFS[h][0], DEFS[h][1], e['n'], e['r'], e['q']] + ([e['f']] if e['f'] else []) for h, e in sorted(info.items(), key=lambda kv: kv[0].lower())]

    # the positive-or-negative check, on every fill-in question
    charged = removable = removed = 0
    dist = collections.Counter()
    for x in fill:
        ch = {k: DEFS[head(clean(x['ch'][k]))][1] for k in 'ABCD'}
        a = ch[x['ans']]
        if not a:
            continue
        charged += 1
        r = sum(1 for k in 'ABCD' if ch[k] and ch[k] != a)
        dist[r] += 1
        if r:
            removable += 1
            removed += r
    right_twice = sorted(h for h, e in info.items() if e['r'] > 1)
    stats = {'fill': len(fill), 'heads': len(info), 'offeredTwice': sum(1 for e in info.values() if e['n'] > 1),
             'rightHeads': sum(1 for e in info.values() if e['r'] > 0), 'rightTwice': right_twice,
             'charged': charged, 'neutral': len(fill) - charged, 'removable': removable, 'removed': removed,
             'removedDist': {str(k): v for k, v in sorted(dist.items())},
             'pos': sum(1 for e in words if e[2] == 'p'), 'neg': sum(1 for e in words if e[2] == 'n')}
    for h in NEG_LOOK:
        assert h in info and DEFS[h][1] != 'n', h

    # second meanings: the 40 "most nearly mean" questions
    second = []
    for x in sorted(mean, key=lambda x: (x['d'] != 'Easy', x['d'] != 'Medium', x['id'])):
        first, other, sec = SECOND[x['id']]
        m = re.search(r'[“"]([^”"]+)[”"]', x['q'])
        w = m.group(1)
        sents = [clean(s) for s in x['s']]
        def norm(t):
            return t.lower().replace('’', "'")
        key = w.split()[-1] if w.lower().startswith(('a ', 'an ')) else w
        hit = [s for s in sents if norm(key) in norm(s)]
        assert len(hit) >= 1, (x['id'], w)
        second.append({'id': x['id'], 'd': x['d'], 'w': w, 'k': x['ans'], 'ch': {k: clean(x['ch'][k]) for k in 'ABCD'},
                       'first': first, 'other': other, 'sec': sec, 'sent': hit[0]})
    assert len(second) == 40

    # the words that purpose, structure, main idea and two-text choices use
    fq = [x for x in bank['reading'] if x['job'] in ('structure', 'main', 'cross')]
    nchoice = 0
    fstat = {v: [0, 0] for v in FUNC}
    kinds = {'strong': [0, 0], 'plain': [0, 0]}      # choices with a position-taking word, and choices with none
    for x in fq:
        for k in 'ABCD':
            nchoice += 1
            ws = set(re.findall(r'[a-z]+', clean(x['ch'][k]).lower()))
            hit = [v for v in FUNC if ws & forms(v)]
            for v in hit:
                fstat[v][0] += 1
                if k == x['ans']:
                    fstat[v][1] += 1
            g = kinds['strong' if any(FUNC[v][1] == 'p' for v in hit) else 'plain']
            g[0] += 1
            g[1] += k == x['ans']
    func = [[v, FUNC[v][0], FUNC[v][1], fstat[v][0], fstat[v][1]] for v in sorted(FUNC)]
    fsum = {'q': len(fq), 'choices': nchoice, 'strongN': kinds['strong'][0], 'strongR': kinds['strong'][1],
            'plainN': kinds['plain'][0], 'plainR': kinds['plain'][1]}
    for f in func:
        assert f[3] > 0, 'never used in the bank: ' + f[0]
    return {'words': words, 'stats': stats, 'negLook': NEG_LOOK, 'second': second, 'func': func, 'funcStats': fsum}


if __name__ == '__main__':
    out = build()
    dest = os.path.join(SRC, 'build', 'vocab.json')
    with open(dest, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')
    s = out['stats']
    print('wrote', dest, '·', len(out['words']), 'words ·', s['charged'], 'charged answers ·', s['removable'], 'questions where the check removes a choice ·',
          len(out['second']), 'meaning questions ·', len(out['func']), 'function words')
    print(json.dumps(s))
    print(json.dumps(out['funcStats']))
