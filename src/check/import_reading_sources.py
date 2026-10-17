#!/usr/bin/env python3
"""Restore figure and grammar practice cards from the official question-bank PDF.

Usage: python src/check/import_reading_sources.py --pdf bank.pdf --parsed parsed.json
The PDF is an input only and is never copied into the website.
"""
import argparse, bisect, io, json, re, subprocess
from pathlib import Path
import fitz
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[2]
def read(name):
    return json.loads((ROOT/'src/build'/f'{name}.json').read_text())
def lines(page):
    groups = {}
    for w in page.get_text('words'):
        groups.setdefault((w[5], w[6]), []).append(w)
    return [(' '.join(w[4] for w in ws), min(w[1] for w in ws), max(w[3] for w in ws)) for ws in groups.values()]
def render(doc, spans, target):
    pieces = []
    for pn, top, bottom in spans:
        page = doc[pn]
        pix = page.get_pixmap(matrix=fitz.Matrix(1.7,1.7), clip=fitz.Rect(12,top,page.rect.width-12,bottom), alpha=False)
        im = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
        box = ImageChops.difference(im,Image.new('RGB',im.size,'white')).getbbox()
        if box:
            im = im.crop((0, max(0,box[1]-12),im.width,min(im.height,box[3]+12)))
            pieces.append(im)
    assert pieces, target
    width = max(im.width for im in pieces)
    out = Image.new('RGB',(width,sum(im.height for im in pieces)+12*(len(pieces)-1)), 'white')
    y=0
    for im in pieces:
        out.paste(im,(0,y));y+=im.height+12
    out=out.resize((1000,round(out.height*1000/out.width)),Image.Resampling.LANCZOS)
    target.parent.mkdir(parents=True,exist_ok=True)
    out.save(target,'WEBP',quality=88)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--pdf',required=True);ap.add_argument('--parsed',required=True);args=ap.parse_args()
    data,rdata,bank=read('data'),read('rdata'),read('bank')
    parsed={x['id']:x for x in json.loads(Path(args.parsed).read_text())}
    doc=fitz.open(args.pdf)
    # pdftotext preserves physical page breaks, including rationale continuations.
    raw = subprocess.check_output(['pdftotext', '-layout', args.pdf, '-']).decode()
    starts = {}
    for pn, page_text in enumerate(raw.split('\f')):
        m = re.search(r'Question ID:\s*([0-9a-f]{8})', page_text)
        if m:
            starts[m[1]] = pn
    ordered=sorted(starts.values())
    existing={x['id'] for x in bank['reading']}|{x['qid'] for x in rdata['examples']}
    figures={}
    for group in rdata['sets']:
        for s in group['sets']:
            if s['name'] in ('Table','Graph','Table or graph: plain look-up'):
                for diff,ids in s['byDiff'].items():
                    for qid in ids:
                        if qid not in existing: figures[qid]=(diff,s['name'])
    concepts={x['id']:x for x in data['concepts']}
    grammar={}
    for qid,(uid,_) in data['qi'].items():
        concept=concepts[data['uses'][uid]['c']]
        if concept['part'] in ('A','B') and qid not in data['ex']:
            diff=next(z[1] for v in data['uses'][uid]['v'] for z in v['ids'] if z[0]==qid)
            grammar[qid]=({'E':'Easy','M':'Medium','H':'Hard'}[diff],uid,concept['part'])
    assert len(figures)==131,len(figures)
    assert len(grammar)==335,len(grammar)
    results={'figures':[],'grammar-sources':[]}
    for kind,items in [('figures',figures),('grammar-sources',grammar)]:
        for qid,meta in sorted(items.items()):
            src=parsed[qid]; start=starts[qid]; end=ordered[bisect.bisect_right(ordered,start)] if bisect.bisect_right(ordered,start)<len(ordered) else len(doc)
            marks=[]
            for pn in range(start,end):
                for text,top,bottom in lines(doc[pn]):
                    if text.strip()=='Question': marks.append(('q',pn,top,bottom))
                    elif text.startswith('Correct Answer:'): marks.append(('a',pn,top,bottom))
                    elif text.strip()=='Rationale': marks.append(('r',pn,top,bottom))
            qmark=next(m for m in marks if m[0]=='q');amark=next(m for m in marks if m[0]=='a');rmark=next(m for m in marks if m[0]=='r')
            qspans=[(pn,qmark[3]+5 if pn==qmark[1] else 12,amark[2]-6 if pn==amark[1] else doc[pn].rect.height-12) for pn in range(qmark[1],amark[1]+1)]
            rspans=[(pn,rmark[3]+5 if pn==rmark[1] else 12,doc[pn].rect.height-12) for pn in range(rmark[1],end)]
            qsrc=f'rw/q/{qid}.webp';rsrc=f'rw/r/{qid}.webp'
            render(doc,qspans,ROOT/qsrc);render(doc,rspans,ROOT/rsrc)
            # Original choices are visible in the question image; empty labels avoid duplication.
            im=lambda path,label:f'<img src="{path}" alt="{label}" loading="lazy" style="max-width:100%;height:auto">'
            rec={'id':qid,'d':meta[0],'job':'figure' if kind=='figures' else 'grammar','jn':'Table or graph' if kind=='figures' else 'Grammar','intro':'','s':[im(qsrc,'Source question '+qid)],'tx':None,'q':'Choose the best answer.','ch':{k:'' for k in 'ABCD'},'ans':src['ans'],'why':{src['ans']:im(rsrc,'Official explanation '+qid)},'pages':list(range(start+1,end+1)),'qsrc':qsrc,'rsrc':rsrc}
            if kind=='grammar-sources':rec.update(p=meta[2],unit=meta[1])
            results[kind].append(rec)
        path=ROOT/'src/build'/f'{kind}.json';path.write_text(json.dumps(results[kind],ensure_ascii=False,separators=(',',':'))+'\n')
        assert {x['id'] for x in results[kind]}==set(items)
        print(f'{kind}: {len(results[kind])} cards')
if __name__=='__main__':main()
