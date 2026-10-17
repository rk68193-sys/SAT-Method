"""Rebuild reviewed teaching while preserving original questions and answer keys."""
import collections,json
from pathlib import Path
from mclass import R
from mcontent import SKILLS,TYPES
from probability import REVIEWED
from strategies import BY_TYPE
from review_catalog import TYPE_CORRECTIONS,CASES,SOURCE_NOTES,BRIDGES,WORKED
root=Path(__file__).resolve().parents[2];path=root/'src/build/mdata.json'
data=json.loads(path.read_text());old=data['order']
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
for key,value in data['skills'].items():
 value.update(SKILLS[key]);value['types']=[t for t,_,_ in R[key] if t!='rtt-trig2']
data.update(strategies=BY_TYPE,source_cases=CASES,source_notes=SOURCE_NOTES,bridges=BRIDGES,worked=WORKED)
data['probability_review']={'assignments':REVIEWED,'scope':'49 question and solution OCR reviews, with ambiguous figures checked visually. These editorial groups do not predict future-test frequencies. No repeated-draw/replacement/binomial family was identified.'}
path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
print('Refreshed',len(data['qs']),'questions,',len(order),'types,',len(CASES),'deeper cases,',len(SOURCE_NOTES),'source notes')
