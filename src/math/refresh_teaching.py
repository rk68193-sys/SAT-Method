"""Rebuild reviewed teaching while preserving original questions and answer keys."""
import collections,json
from pathlib import Path
from mclass import R
from mcontent import SKILLS,TYPES
from probability import REVIEWED
from mpatcontent import TYPE_DESMOS,DESMOS,GOTCHAS,DGROUPS,HABITS,PATTERNS,RARE
from strategies import BY_TYPE
from review_catalog import TYPE_CORRECTIONS,CASES,SOURCE_NOTES,BRIDGES,WORKED
root=Path(__file__).resolve().parents[2];path=root/'src/build/mdata.json'
data=json.loads(path.read_text());old=data['order']; old_types=data['types']
order=[t for rules in R.values() for t,_,_ in rules if t!='rtt-trig2']
assert set(order)==set(TYPES)
assert set(BY_TYPE)==set(order)-{t for t in order if t.startswith('prb-')}
counts=collections.defaultdict(collections.Counter)
for row in data['qs']:
 kind=TYPE_CORRECTIONS.get(row[0],REVIEWED.get(row[0],old[row[1]]))
 row[1]=order.index(kind);counts[kind]['n']+=1;counts[kind]['EMH'[row[2]]]+=1
known={q[0] for q in data['qs']}
assert set(REVIEWED)<=known and len(REVIEWED)==49
assert set(TYPE_CORRECTIONS)<=known
for case in CASES:assert set(case['ids'])<=known,case
for qid in SOURCE_NOTES:assert qid in known,qid
data['order']=order
data['types']={kind:dict(TYPES[kind],skill=skill,**{k:counts[kind][k] for k in ['n','E','M','H']}) for skill,rules in R.items() for kind,_,_ in rules if kind!='rtt-trig2'}
for kind, value in data['types'].items():
 move,text=TYPE_DESMOS[kind]
 value.update(dmove=move,dtext=text)
data.update(desmos=DESMOS,gotchas=GOTCHAS,dgroups=DGROUPS,habits=HABITS)
ver=json.loads((root/'src/math/verified.json').read_text())
proof={x for m in DESMOS for x in m['proof']}|{x for p in PATTERNS for x in p['proof']}|{x for r in RARE for x in r['proof']}
assert proof<=set(ver),proof-set(ver)
data.update(verified={k:dict(how=v[0],got=v[1]) for k,v in ver.items()},nver=len(ver))
# Keep upstream pattern memberships; update their teaching-type summaries.
teach={p['id']:p for p in PATTERNS}; rare={r['key']:r for r in RARE}
for r in data.get('rare', []): r.update(rare[r['key']])
for i, pattern in enumerate(data.get('patterns', [])):
 pattern.update(teach[pattern['id']])
 members=[q for q in data['qs'] if len(q)>13 and q[13] >> i & 1]
 counts_by_type=collections.Counter(order[q[1]] for q in members)
 pattern['types']=[t for t,n in counts_by_type.most_common() if n>=3][:12]
for key,value in data['skills'].items():
 value.update(SKILLS[key]);value['types']=[t for t,_,_ in R[key] if t!='rtt-trig2']
data.update(strategies=BY_TYPE,source_cases=CASES,source_notes=SOURCE_NOTES,bridges=BRIDGES,worked=WORKED)
data['probability_review']={'assignments':REVIEWED,'scope':'49 question and solution OCR reviews, with ambiguous figures checked visually. These editorial groups do not predict future-test frequencies. No repeated-draw/replacement/binomial family was identified.'}
path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
print('Refreshed',len(data['qs']),'questions,',len(order),'types,',len(CASES),'deeper cases,',len(SOURCE_NOTES),'source notes')
