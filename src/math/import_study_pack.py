"""Import derived teaching methods and calculator checks, preserving the bank.

Usage: python src/math/import_study_pack.py /path/to/questionbank-study-data-v2.json
Original question/choice/solution transcriptions and PDF exports are not copied.
"""
import argparse,collections,hashlib,json
from pathlib import Path

def build(pack,bank):
    current={r[0]:r for r in bank['qs']}
    assert set(current)=={q['id'] for q in pack['questions']},'Question IDs differ from the existing Math bank'
    skills={'L1':'le1','LF':'lf','L2':'le2','SYS':'sys','INEQ':'inq','AREA':'av','ANG':'lat','TRIG':'rtt','CIR':'cir','RATE':'rat','PCT':'pct','DATA':'1vd','FIT':'2vd','PROB':'prb','INF':'inf','EXP':'stc','EQV':'eqx','NEQ':'nle','NF':'nlf'}
    questions={};by_legacy=collections.defaultdict(set)
    for q in pack['questions']:
        row=current[q['id']]
        if row[3]:assert row[4]==q['answer_choice'],f"Answer key mismatch for {q['id']}"
        item={'method':q['method_id'],'family':q['family_id'],'skill':skills[q['skill_code']],'difficulty':q['difficulty']}
        if q.get('reviewed_notation_note'):item['note']=q['reviewed_notation_note']
        if q.get('has_curated_shortcut'):item['hand']=q['quick_worked_solution']
        c=q['calculator']
        if c['mode']!='not_computed':
            item['calculator']={k:c[k] for k in ['mode','input_readable','desmos_latex','local_result','explanation','answer_comparison']}
            item['calculator']['verification']='individual' if c['desmos_verification']['status']=='observed_individually' else 'batch'
        questions[q['id']]=item
        by_legacy[bank['order'][row[1]]].add(q['method_id'])
    methods=[]
    for m in pack['methods']:
        item={k:m[k] for k in ['id','title','recognition_pattern','why_it_works','detailed_steps','calculator_method','common_trap','when_hand_is_faster','representative_id','question_ids','question_count']}
        codes=collections.Counter(questions[i]['skill'] for i in item['question_ids'])
        item['skill']=codes.most_common(1)[0][0]
        assert item['skill'] in bank['skills'],item['skill']
        item['checks']=sum('calculator' in questions[i] for i in item['question_ids'])
        methods.append(item)
    families={f['id']:{'ids':f['question_ids'],'note':f['grouping_note']} for f in pack['families'] if f['count']>1}
    result={'version':2,'title':'Expanded Math methods','methods':methods,'questions':questions,'families':families,'by_legacy_type':{k:sorted(v) for k,v in by_legacy.items()},'scopes':pack['calculator_scope_labels'],'coverage':pack['coverage'],'evidence':{'calculator':'https://www.desmos.com/calculator','method':'20 lists compared by maximum absolute normalized difference; one corrected shifted-vertex input checked individually.','maximum_normalized_difference':2.9411764706e-15,'scope':'This verifies arithmetic, not every model setup or the complete source solution.','graph_question':'841ef26c','graph_image':'m/study/shifted-vertex.png'}}
    assert len(methods)==249 and len(questions)==1925
    assert sum('calculator' in q for q in questions.values())==998
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pack',type=Path)
    parser.add_argument('--bank',type=Path,default=Path(__file__).resolve().parents[1]/'build/mdata.json')
    parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'build/mstudy.json')
    args=parser.parse_args()
    raw=args.pack.read_bytes();pack=json.loads(raw);bank=json.loads(args.bank.read_text(encoding='utf-8'))
    result=build(pack,bank);result['source_sha256']=hashlib.sha256(raw).hexdigest()
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print(f"Imported {len(result['methods'])} methods, {len(result['questions'])} memberships, 998 scoped calculator checks; existing grading preserved.")
