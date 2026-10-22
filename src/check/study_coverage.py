"""Check complete membership, grade preservation, and calculator-scope records."""
import collections,json,re,sys
from pathlib import Path
r=Path(__file__).resolve().parents[2]
bank=json.loads((r/'src/build/mdata.json').read_text(encoding='utf-8'))
study=json.loads((r/'src/build/mstudy.json').read_text(encoding='utf-8'))
ids={q[0] for q in bank['qs']};methods={m['id']:m for m in study['methods']}
assert len(ids)==1925 and set(study['questions'])==ids
assert len(methods)==249
members=[qid for m in methods.values() for qid in m['question_ids']]
assert collections.Counter(members)==collections.Counter(ids)
for m in methods.values():
    assert m['representative_id'] in m['question_ids']
    assert len(m['question_ids'])==m['question_count']
    assert len(m['detailed_steps'])>=3 and m['why_it_works'] and m['calculator_method']
for qid,q in study['questions'].items():
    assert qid in methods[q['method']]['question_ids']
    assert not {'question_text','choices','source_worked_solution'}&q.keys()
    if 'calculator' in q:
        c=q['calculator'];assert c['mode'] in study['scopes'] and c['desmos_latex']
        assert c['answer_comparison']['status']!='needs_source_review'
counts=collections.Counter(q.get('calculator',{}).get('mode','not_computed') for q in study['questions'].values())
assert counts['question_computed']==382 and counts['source_step_check']==528 and counts['not_computed']==927
assert sum(n for k,n in counts.items() if k!='not_computed')==998
assert study['questions']['841ef26c']['calculator']['local_result']==-13
for f in study['families'].values():assert len(f['ids'])>1 and set(f['ids'])<=ids
if len(sys.argv)>1:
    def data(path):return json.loads(re.search(r'<script type="application/json" id="sprint-data">(.*?)</script>',Path(path).read_text(encoding='utf-8'),re.S).group(1))
    before=data(sys.argv[1]);after=data(r/'index.html');after.pop('mathStudy');assert before==after,'An existing data section changed'
print('PASS: 249 types; all 1925 unique memberships; 998 scoped checks; source bank and grade records preserved.')
