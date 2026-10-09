import json,os,sys
from PIL import Image, ImageOps
from multiprocessing import Pool
K=130/72.0
qs=json.load(open('mgeo.json'))
OUT='mimg'; os.makedirs(OUT+'/q',exist_ok=True); os.makedirs(OUT+'/r',exist_ok=True)
X0,X1=int(14*K),int(598*K)
LUT=[min(255,round(v/17)*17) for v in range(256)]   # 16 grey levels
_cache={}
def page(pi):
    if pi not in _cache:
        if len(_cache)>6: _cache.clear()
        _cache[pi]=Image.open('pg/p-%04d.png'%(pi+1)).convert('L')
    return _cache[pi]
def trim(im):
    inv=ImageOps.invert(im).point(lambda v:255 if v>40 else 0)
    bb=inv.getbbox()
    if not bb: return None
    x0,y0,x1,y1=bb
    return im.crop((0,max(0,y0-6),im.width,min(im.height,y1+6)))
def region(pi,y0pt,y1pt):
    im=page(pi); y0=max(0,int(y0pt*K)); y1=min(im.height,int(y1pt*K)) if y1pt else im.height
    if y1<=y0: return None
    return trim(im.crop((X0,y0,X1,y1)))
def span(start,end):
    """start=(page,y) end=(page,y) inclusive pages"""
    parts=[]
    sp,sy=start; ep,ey=end
    for pi in range(sp,ep+1):
        a=sy if pi==sp else 0
        b=ey if pi==ep else None
        r=region(pi,a,b)
        if r is not None: parts.append(r)
    return parts
def stack(parts,gap=14):
    parts=[p for p in parts if p is not None]
    if not parts: return None
    w=max(p.width for p in parts); h=sum(p.height for p in parts)+gap*(len(parts)-1)
    im=Image.new('L',(w,h),255); y=0
    for p in parts: im.paste(p,(0,y)); y+=p.height+gap
    # crop right whitespace
    inv=ImageOps.invert(im).point(lambda v:255 if v>40 else 0); bb=inv.getbbox()
    if bb: im=im.crop((0,0,min(w,bb[2]+8),h))
    return im.point(LUT)
def job(q):
    L=q['labs']; qid=q['id']; last=q['pages'][-1]
    Q=L['Question']; R=L['Rationale']
    out={}
    if 'Answer' in L:
        A=L['Answer']; stemend=(A[0],A[1]-3)
        endc=L.get('Correct',R); chend=(endc[0],endc[1]-3)
        parts=span((Q[0],Q[2]+2),stemend)+span((A[0],A[2]+2),chend)
    else:
        endc=L.get('Correct',R)
        parts=span((Q[0],Q[2]+2),(endc[0],endc[1]-3))
    qi=stack(parts); 
    ri=stack(span((R[0],R[2]+2),(last,None)),gap=6)
    for kind,im in (('q',qi),('r',ri)):
        if im is None: out[kind]=None; continue
        im.save(f'{OUT}/{kind}/{qid}.webp',lossless=True,method=4)
        out[kind]=[im.width,im.height]
    return qid,out
if __name__=='__main__':
    sel=qs if len(sys.argv)<2 else [q for q in qs if q['id'] in sys.argv[1:]]
    with Pool(4) as p: res=dict(p.map(job,sel,chunksize=20))
    json.dump(res,open('mimg_dims.json' if len(sys.argv)<2 else 'mimg_test.json','w'))
    print(len(res), sum(1 for v in res.values() if not v['q'] or not v['r']),'missing')
