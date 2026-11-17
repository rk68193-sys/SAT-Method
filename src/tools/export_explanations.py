"""Export reviewed explanations; --release explicitly enables the approved production hosts."""
from pathlib import Path
import argparse,hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
def read(name):return json.loads((ROOT/'src/build'/f'{name}.json').read_text(encoding='utf-8'))
def fingerprint(q):
    return hashlib.sha256(json.dumps({k:q[k] for k in ('id','answer','difficulty','skill','source')},ensure_ascii=False,sort_keys=True).encode()).hexdigest()
def catalog():
    out={}
    def put(subject,q,priority):
        key=subject+':'+q['id'];old=out.get(key)
        if old:
            assert old['answer']==q['answer'],(key,'conflicting keys')
            if old['_priority']>=priority:return
        q['_priority']=priority;q['subject']=subject;out[key]=q
    bank=read('bank')
    for name in ('reading','notes','trans'):
        for s in bank[name]:put('rw',dict(id=s['id'],answer=s['ans'],difficulty=s['d'],skill=s.get('job',name),source=s),2)
    for name in ('figures','grammar-sources'):
        for s in read(name):put('rw',dict(id=s['id'],answer=s['ans'],difficulty=s['d'],skill=s.get('unit',s.get('job',name)),source=s),3)
    for qid,s in read('data')['ex'].items():put('rw',dict(id=qid,answer=s['a'],difficulty=s['d'],skill=s['u'],source=s),1)
    for s in read('rdata')['examples']:put('rw',dict(id=s['qid'],answer=s['ans'],difficulty=s['diff'],skill=s['job'],source=s),1)
    math=read('mdata')
    for s in math['qs']:put('m',dict(id=s[0],answer=s[4],difficulty=['Easy','Medium','Hard'][s[2]],skill=math['order'][s[1]],source=s),3)
    return out
def section(body,label,following):
    m=re.search(r'^\*\*'+re.escape(label)+r'\.\*\* ([\s\S]*?)(?=^\*\*(?:'+following+r')\.\*\*)',body,re.M)
    return m[1].strip() if m else None
def export(ledger,selection,resolutions=None):
    current=catalog();items={};manifest=[]
    assert selection.get('state') in ('planning','local-review'),'Use an explicit local review selection'
    for selected in selection['items']:
        qid=selected['question_id'];subject='m' if selected['subject']=='Math' else 'rw';key=subject+':'+qid
        assert key not in items,(key,'duplicate selection')
        q=current[key];r=ledger[qid];sha=fingerprint(q)
        assert r['status']=='reviewed_draft' and '**Source follow-up.**' not in r['body'],(key,'unresolved source')
        assert sha==selected['source_sha256']==r['source_sha256'],(key,'stale source')
        assert q['answer']==selected['official_answer'],(key,'changed answer')
        if '**Source resolution.**' in r['body']:
            assert selected.get('source_resolution'),(key,'resolved draft requires its source display')
        text=section(r['body'],'Proposed explanation','Try a variation|Review judgment')
        assert text and len(text)<16000 and '\0' not in text,(key,'invalid explanation')
        variation=section(r['body'],'Try a variation','Review judgment');v=None
        if selected.get('variation'):
            v=selected['variation']
            assert set(v)=={'prompt','answer'} and all(isinstance(x,str) and x.strip() for x in v.values()),(key,'invalid structured variation')
        elif variation:
            if 'Answer:' in variation:
                prompt,answer=variation.split('Answer:',1)
                assert prompt.strip() and answer.strip(),(key,'empty variation')
                v=dict(prompt=prompt.strip(),answer=answer.strip())
            else:
                # Earlier reviewed entries explain a variation in one statement. Keep that
                # format explicitly; do not invent a hidden answer by splitting a sentence.
                v=dict(worked=variation)
        source=None
        if selected.get('source_resolution'):
            resolution=(resolutions or {}).get('items',{}).get(qid)
            assert resolution and resolution['original_source_sha256']==sha,(key,'missing or stale source resolution')
            assert resolution['official_answer']==q['answer'],(key,'resolution changed key')
            resolution_sha=hashlib.sha256(json.dumps({k:resolution[k] for k in ('original_source_sha256','evidence_sha256','display')},ensure_ascii=False,sort_keys=True).encode()).hexdigest()
            assert resolution_sha==resolution['resolution_sha256']==selected['source_resolution'],(key,'changed resolution evidence or display')
            source=resolution['display']
            assert source['kind'] in ('editorial','restored') and source['note'] and source['blocks'],(key,'invalid source display')
            for block in source['blocks']:
                assert block and all(set(run)<=set(('text','u','b','i','blank')) and isinstance(run.get('text'),str) for run in block),(key,'invalid source runs')
        revision=hashlib.sha256((text+'\0'+json.dumps(dict(variation=v,source=source),ensure_ascii=False,sort_keys=True)).encode()).hexdigest()[:12]
        items[key]=dict(subject=subject,id=qid,answer=q['answer'],revision=revision,
            paragraphs=[p.strip() for p in re.split(r'\n\s*\n',text) if p.strip()],variation=v)
        if source:items[key]['source']=source
        manifest.append(dict(key=key,source_sha256=sha,revision=revision,
            review_status=r['status'],release_approval=r['user_approval'],scope='local review only',
            source_resolution=selected.get('source_resolution'),
            structured_variation_override=bool(selected.get('variation'))))
    assert len(items)==selection.get('expected_count',18) and 0<len(items)<=3770,'Selection coverage mismatch'
    return dict(schema=1,mode='local-pilot',enabled=True,items=items),dict(schema=1,scope='local review only',items=manifest)
def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--ledger',required=True,type=Path);p.add_argument('--selection',required=True,type=Path)
    p.add_argument('--output',type=Path,default=ROOT/'src/build/explanations.json')
    p.add_argument('--manifest',required=True,type=Path);p.add_argument('--check',action='store_true')
    p.add_argument('--resolutions',type=Path)
    p.add_argument('--release',action='store_true',help='Export the user-authorized production collection')
    a=p.parse_args();payload,manifest=export(json.loads(a.ledger.read_text(encoding='utf-8')),json.loads(a.selection.read_text(encoding='utf-8')),json.loads(a.resolutions.read_text(encoding='utf-8')) if a.resolutions else None)
    if a.release:
        payload['mode']='released';manifest['scope']='production release authorized by user'
        for item in manifest['items']:item.update(scope='production release',release_approval='authorized_by_user_in_chat')
    text=json.dumps(payload,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n'
    if a.check:assert a.output.read_text(encoding='utf-8')==text,'Explanation export is out of date'
    else:
        a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(text,encoding='utf-8')
        a.manifest.parent.mkdir(parents=True,exist_ok=True);a.manifest.write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print(json.dumps(dict(entries=len(payload['items']),scope=payload['mode'],bytes=len(text.encode()),check=a.check)))
if __name__=='__main__':main()
