"""Merge the deep pass (every math question read from its image) into the site's math data.

usage: python3 mdeep.py <mdata.json from mbuild.py> <out mdata.json>

Reads deep/an/<skill>.json (templates per skill), deep/ver/<skill>.json (checks), deep/tx/<id>.json
(transcriptions), deep/qc/<id>.json (second check of each question's routes) and deep/final/*.json
(cross-skill findings), and adds:
  tm   templates: the reused question patterns inside each type, with tells, method and examples
  qs   each row gets the question's template index as column 14; types are re-filed where a template
       shows a question sits in the wrong type, and type counts are recomputed
  qx   per question: [best route (0 hand, 1 Desmos, 2 either), Desmos route, hand route, question text]
  fix  verified corrections to earlier assumptions; prob, dfeat, fam: probability atlas, Desmos feature
       index and cross-skill families, when the final synthesis has written them
"""
import json, os, re, sys, glob, collections

HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
D = HERE + 'deep/'
src, out = sys.argv[1], sys.argv[2]
md = json.load(open(src, encoding='utf-8'))
T = md['types']
ORDER = md['order']
rows = md['qs']
rowby = {r[0]: r for r in rows}
qtype = {r[0]: ORDER[r[1]] for r in rows}
qskill = {r[0]: T[ORDER[r[1]]]['skill'] for r in rows}
qdiff = {r[0]: 'EMH'[r[2]] for r in rows}

def load(p, default=None):
    try:
        return json.load(open(p, encoding='utf-8'))
    except (OSError, ValueError):
        return default

def clean(s):
    return re.sub(r'\s+', ' ', str(s or '')).strip()

# ---------- templates ----------
tm, tm_of, refmap = [], {}, {}
problems = []
for sk in md['skills']:
    an = load(D + f'an/{sk}.json')
    if not an:
        problems.append(f'{sk}: no analysis'); continue
    ver = load(D + f'ver/{sk}.json', {}) or {}
    vt = {t['key']: t for t in ver.get('templates', [])}
    for t in an['templates']:
        ids = [i for i in t['ids'] if i in rowby and qskill[i] == sk]
        ids = [i for i in ids if i not in tm_of]
        if not ids:
            continue
        key = re.sub(r'[^a-z0-9]+', '-', (sk + '-' + t['key']).lower()).strip('-')
        while any(x['k'] == key for x in tm):
            key += 'x'
        pt = t.get('parent_type')
        if pt not in T or T[pt]['skill'] != sk:
            pt = collections.Counter(qtype[i] for i in ids).most_common(1)[0][0]
        m = t.get('method') or {}
        v = vt.get(t['key'])
        cnt = collections.Counter(qdiff[i] for i in ids)
        ex = [i for i in (t.get('examples') or []) if i in ids] or ids[:2]
        entry = {
            'k': key, 's': sk, 'nm': clean(t['name']), 'pt': pt, 'nw': bool(t.get('is_new')),
            'n': len(ids), 'E': cnt['E'], 'M': cnt['M'], 'H': cnt['H'],
            'tl': [clean(x) for x in t.get('tells', []) if clean(x)][:5], 'ask': clean(t.get('ask')),
            'b': {'desmos': 1, 'hand': 0}.get(str(m.get('best', '')).lower(), 2), 'rl': clean(m.get('rule')),
            'ds': [clean(x) for x in m.get('desmos', []) if clean(x)], 'hd': [clean(x) for x in m.get('hand', []) if clean(x)],
            'sd': m.get('secs_desmos'), 'sh': m.get('secs_hand'),
            'tr': [[clean(z['trap']), z.get('n', 0)] for z in t.get('traps', []) if clean(z.get('trap'))][:4],
            'ex': ex[:3], 'iso': bool(t.get('isomorph')), 'ok': (v.get('method_ok') if v else t.get('method_ok')),
        }
        idx = len(tm)
        tm.append(entry)
        refmap[f"{sk}/{t['key']}"] = key
        for i in ids:
            tm_of[i] = idx
missing = [r[0] for r in rows if r[0] not in tm_of]
if missing:
    problems.append(f'{len(missing)} questions in no template: {missing[:12]}')

# ---------- re-file types from templates ----------
moved = 0
KEEP_TYPES = '--keep-types' in sys.argv
for i, idx in (() if KEEP_TYPES else tm_of.items()):
    pt = tm[idx]['pt']
    if pt != qtype[i] and T[pt]['skill'] == qskill[i]:
        qtype[i] = pt; moved += 1
# recount types; keep the order, drop empty types
cnt = collections.defaultdict(collections.Counter)
for i, t in qtype.items():
    cnt[t][qdiff[i]] += 1
new_order = [t for t in ORDER if sum(cnt[t].values())]
for t in ORDER:
    c = cnt[t]
    T[t]['n'], T[t]['E'], T[t]['M'], T[t]['H'] = sum(c.values()), c['E'], c['M'], c['H']
dropped = [t for t in ORDER if t not in new_order]
for t in dropped:
    del T[t]
for sk, S in md['skills'].items():
    S['types'] = [t for t in S['types'] if t in T]
pos = {t: i for i, t in enumerate(new_order)}
for r in rows:
    r[1] = pos[qtype[r[0]]]
    while len(r) < 15:
        r.append(-1)
    r[14] = tm_of.get(r[0], -1)
md['order'] = new_order
for e in tm:
    if e['pt'] not in T:
        e['pt'] = collections.Counter(qtype[i] for i in tm_of if tm_of[i] == tm.index(e)).most_common(1)[0][0]

# ---------- per-question routes ----------
qx = {}
bad = 0
for r in rows:
    i = r[0]
    tx = load(D + f'tx/{i}.json')
    if not tx:
        continue
    qc = load(D + f'qc/{i}.json') or {}
    best = str(qc.get('best') or tx.get('best') or '').lower()
    des = qc.get('desmos') if 'desmos' in qc else tx.get('desmos')
    hand = qc.get('hand') if qc.get('hand') else tx.get('hand')
    if qc and qc.get('desmos_ok') is False and not qc.get('desmos'):
        des = None
    if qc and qc.get('hand_ok') is False and not qc.get('hand'):
        hand = None; bad += 1
    text = clean(tx.get('q'))
    if tx.get('ch'):
        text += ' ' + ' '.join(f'{k}) {clean(v)}' for k, v in tx['ch'].items())
    qx[i] = [{'desmos': 1, 'hand': 0}.get(best, 2), clean(des) if des else '', clean(hand) if hand else '', text]

md['tm'] = tm
md['qx'] = qx
def refs(lst):
    out = []
    for r in lst or []:
        r = str(r).strip()
        k = refmap.get(r) or refmap.get(r.replace(' ', ''))
        if k and k not in out:
            out.append(k)
    return out
fix = load(D + 'final/math_fix.json')
if fix is not None:
    md['fix'] = fix if isinstance(fix, list) else fix.get('fixes', fix.get('items', []))
ans = load(D + 'final/math_answers.json')
if ans is not None:
    md['ans'] = ans.get('findings', []) if isinstance(ans, dict) else ans
prob = load(D + 'final/math_prob.json')
if prob is not None:
    md['prob'] = prob
dfeat = load(D + 'final/math_dfeat.json')
if dfeat is not None:
    for f in dfeat.get('features', []):
        f['templates'] = refs(f.get('templates'))
    md['dfeat'] = dfeat
fam = load(D + 'final/math_fam.json')
if fam is not None:
    for f in fam.get('families', []):
        f['templates'] = refs(f.get('templates'))
    md['fam'] = fam
json.dump(md, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'templates {len(tm)} (new {sum(1 for e in tm if e["nw"])}, reused {sum(1 for e in tm if e["iso"])}, method checked ok {sum(1 for e in tm if e["ok"])}, failed {sum(1 for e in tm if e["ok"] is False)})')
print(f'questions with a template {len(tm_of)}/{len(rows)}; re-filed types {moved}; dropped empty types {dropped}; routes {len(qx)} (hand routes rejected {bad})')
for p in problems:
    print('PROBLEM', p)
