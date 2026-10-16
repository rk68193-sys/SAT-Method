import json,re,collections as C
from mclass import R,SK,classify
from mcontent import DOMAINS,SKILLS,TYPES
qs=json.load(open('math.json')); geo={g['id']:g for g in json.load(open('mgeo.json'))}
dims=json.load(open('mimg_dims.json')); nar=json.load(open('mimg_narrow.json'))
order=[t for k in R for t,_,_ in R[k] if t!='rtt-trig2']
missing=[t for t in order if t not in TYPES]; assert not missing, missing
extra=[t for t in TYPES if t not in order]; assert not extra, extra
def forms(s):
    out=[]
    for x in re.split(r',|\bor\b',s):
        x=x.strip().replace('−','-')
        if re.fullmatch(r'-?\d*\.?\d+(/\d+)?',x): out.append(x)
    return out
D='EMH'; rows=[]; stats=C.Counter(); probs=[]
for q in qs:
    k,t=classify(q); g=geo[q['id']]
    mc='Answer' in g['labs']
    ans=q['ans']
    if mc:
        if not re.fullmatch('[A-D]',ans or ''):
            m=re.search(r'Choice ([A-D]) is correct',q['rat']); ans=m.group(1) if m else None
        a=ans
    else:
        f=forms(ans) if ans else []
        if not f:
            m=re.search(r'Note that (.*?) (?:are|is) (?:all )?(?:examples|an example) of ways? to enter',q['rat'])
            if m: f=forms(m.group(1).replace(' and ',', '))
            if not f:
                m=re.search(r'The correct answer is (-?[\d,]*\.?\d+(?:/\d+)?)\b',q['rat'])
                if m: f=forms(m.group(1).replace(',',''))
        a=f or None
    if a is None: probs.append(q['id'])
    dm=dims[q['id']]
    nq=nar[q['id']].get('qn') or [0,0]; nr=nar[q['id']].get('rn') or [0,0]
    rows.append([q['id'],order.index(t),D.index(q['diff'][0]),1 if mc else 0,a,dm['q'][0],dm['q'][1],dm['r'][0],dm['r'][1],nq[0],nq[1],nr[0],nr[1]])
    q['_t']=t;q['_k']=k;q['_mc']=mc
print('no answer key:',len(probs),probs[:10])
# stats
sk={}
for k in R:
    L=[q for q in qs if q['_k']==k]
    sk[k]=dict(n=len(L),E=sum(q['diff']=='Easy' for q in L),M=sum(q['diff']=='Medium' for q in L),H=sum(q['diff']=='Hard' for q in L),g=sum(not q['_mc'] for q in L))
ty={}
for t in order:
    L=[q for q in qs if q['_t']==t]
    ty[t]=dict(n=len(L),E=sum(q['diff']=='Easy' for q in L),M=sum(q['diff']=='Medium' for q in L),H=sum(q['diff']=='Hard' for q in L))
# trigger phrases with measured precision (stem text)
TRIG=[('line of best fit','2vd'),('scatterplot','2vd'),('margin of error','inf'),('median','1vd'),('which inequality','inq'),('hypotenuse','rtt'),('right circular','av'),('circle in the xy-plane','cir'),('correctly expresses','nle'),('the linear function','lf'),('probability','prb'),('radians','cir'),('surface area','av'),('density','rat'),('the expression','eqx'),('is equivalent to','eqx'),('perpendicular','le2'),('in terms of','nle'),('vertex','nlf'),('system of equations','sys'),('no solution','sys'),('infinitely many solutions','sys'),('parallel','lat')]
trig=[]
for p,k in TRIG:
    hit=[q for q in qs if p in q['stem'].lower()]
    if not hit: continue
    c=sum(q['_k']==k for q in hit)
    trig.append([p,k,len(hit),round(100*c/len(hit))])
trig.sort(key=lambda r:(-r[3],-r[2]))
tot=dict(n=len(qs),E=sum(q['diff']=='Easy' for q in qs),M=sum(q['diff']=='Medium' for q in qs),H=sum(q['diff']=='Hard' for q in qs),g=sum(not q['_mc'] for q in qs))
types={t:dict(TYPES[t],skill=t.split('-')[0] if not t.startswith(('1vd','2vd')) else t[:3],**ty[t]) for t in order}
for t in types: types[t]['skill']=[k for k in R if any(x==t for x,_,_ in R[k])][0]
skills={k:dict(SKILLS[k],**sk[k],types=[t for t,_,_ in R[k] if t!='rtt-trig2']) for k in R}
data=dict(domains=DOMAINS,skills=skills,types=types,order=order,qs=rows,trig=trig,tot=tot)
json.dump(data,open('mdata.json','w'),ensure_ascii=False,separators=(',',':'))
import os; print('mdata bytes',os.path.getsize('mdata.json'),tot)
print(trig)
# ---- facts for the start page
grid=[r for r in rows if not r[3]]
fr=sum(1 for r in grid if any('/' in f for f in r[4])); ng=sum(1 for r in grid if any(f.startswith('-') for f in r[4]))
sol=[q for q in qs if re.search(r'how many solutions|no solution|infinitely many solutions|exactly one solution|how many (distinct )?real solutions|no real solutions?|exactly one (distinct )?real',q['stem'],re.I)]
sc=C.Counter(q['_k'] for q in sol)
vx=[q for q in qs if q['_t']=='nlf-vertex']
cir=[q for q in qs if q['_k']=='cir']; ceq=sum(q['_t'] in ('cir-read','cir-build','cir-transform') for q in cir)
facts=dict(grid=len(grid),gridFrac=fr,gridNeg=ng,sol=len(sol),solHard=sum(q['diff']=='Hard' for q in sol),solSys=sc['sys'],solOne=sc['le1'],solNon=sc['nle'],
  vx=len(vx),vxHard=sum(q['diff']=='Hard' for q in vx),cir=len(cir),cirEq=ceq,mc=len(rows)-len(grid),
  mcLetters={d:dict(C.Counter(r[4] for r in rows if r[3] and r[2]==i)) for i,d in enumerate('EMH')})
data['facts']=facts
json.dump(data,open('mdata.json','w'),ensure_ascii=False,separators=(',',':'))
print(facts)
# ---- patterns, rare patterns, Desmos playbook
from mpatterns import P as PRULES, rare as RRULES
from mpatcontent import PATTERNS, RARE, DESMOS, GOTCHAS, TYPE_DESMOS
ver=json.load(open('verified.json'))
pids=[p['id'] for p in PATTERNS]
assert set(pids)<=set(PRULES), set(pids)-set(PRULES)
byid={q['id']:q for q in qs}
for q in qs: q['k'],q['t']=q['_k'],q['_t']
mask={}
for q in qs:
    m=0
    for i,pid in enumerate(pids):
        if PRULES[pid](q): m|=1<<i
    mask[q['id']]=m
for r in rows: r.append(mask[r[0]])
pats=[]
for i,p in enumerate(PATTERNS):
    L=[q for q in qs if mask[q['id']]>>i&1]
    tc=C.Counter(q['_t'] for q in L)
    pats.append(dict(p,n=len(L),E=sum(q['diff']=='Easy' for q in L),M=sum(q['diff']=='Medium' for q in L),H=sum(q['diff']=='Hard' for q in L),
        skills=sorted({q['_k'] for q in L},key=lambda k:-sum(1 for q in L if q['_k']==k)),types=[t for t,_ in tc.most_common() if tc[t]>=3][:12]))
rares=[]
for r in RARE:
    L=[q for q in qs if RRULES[r['key']](q)]
    rares.append(dict(r,n=len(L),H=sum(q['diff']=='Hard' for q in L),ids=[q['id'] for q in L]))
moves={m['id']:m for m in DESMOS}
for p in pats:
    for d in p['desmos']: assert d in moves,d
for t in order:
    assert t in TYPE_DESMOS, t
    mv,txt=TYPE_DESMOS[t]; assert mv is None or mv in moves,(t,mv)
    types[t]['dmove']=mv; types[t]['dtext']=txt
allproof={x for m in DESMOS for x in m['proof']}|{x for p in PATTERNS for x in p['proof']}|{x for r in RARE for x in r['proof']}
missing=[x for x in allproof if x not in ver]; assert not missing, missing
data.update(patterns=pats,rare=rares,desmos=DESMOS,gotchas=GOTCHAS,verified={k:dict(how=v[0],got=v[1]) for k,v in ver.items()},nver=len(ver))
data['bankHard']=round(100*tot['H']/tot['n'])
json.dump(data,open('mdata.json','w'),ensure_ascii=False,separators=(',',':'))
print('patterns',[(p['id'],p['n'],round(100*p['H']/p['n'])) for p in pats]); print('mdata bytes',os.path.getsize('mdata.json'))
