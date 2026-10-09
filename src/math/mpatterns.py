import json,re,collections as C
from mclass import classify
S=lambda q,p: re.search(p,q['stem'],re.I)
RT=lambda q,p: re.search(p,q['rat'][:1200],re.I)
# master patterns: membership by type and/or cue
P={
'plug':   lambda q: q['t'] in ('lf-eval','nlf-eval','le2-point','nlf-yint','le2-solve','inq-point','lf-build','nlf-graph','lf-intercept') or bool(S(q,r'passes through|lies on|contains the point')) or bool(RT(q,r'^.{0,250}substitut')),
'cross':  lambda q: q['t'] in ('le1-solve','nle-solve','nle-sign','nle-radical','nle-system','sys-solve','sys-graph','sys-word','nlf-height','av-volume','inq-maxmin','le1-word') or bool(RT(q,r'intersect')),
'constant': lambda q: bool(S(q,r'\bconstants?\b')),
'disguise': lambda q: q['t'] in ('eqx-rewrite','eqx-coef','eqx-exp','eqx-rational') or bool(S(q,r'infinitely many|for all|true for all|equivalent')),
'count':  lambda q: bool(S(q,r'how many (distinct )?(real )?solutions|no (real )?solutions?\b|infinitely many solutions|exactly one (distinct )?(real )?solution|at least one solution|how many times does the graph|intersect .{0,20}(how many|exactly)|at how many points')),
'multiplier': lambda q: q['t'] in ('pct-of','pct-change','rat-convert','rat-square','nlf-exp','nlf-exp-int','av-scale') ,
'rate':   lambda q: q['t'] in ('lf-model','lf-interpret','lf-table','lf-graph','lf-build','le2-intercept','le2-parallel','2vd-slope','2vd-rate','rat-rate','2vd-predict','2vd-model') or bool(RT(q,r'^.{0,300}(slope|rate of change)')),
'ratio':  lambda q: q['t'] in ('lat-similar','rtt-similar','rtt-trig','rtt-complement','cir-arc','inf-estimate','rat-ratio','rat-density','rat-other','prb-simple') or bool(RT(q,r'proportion')),
'twofacts': lambda q: q['t'] in ('sys-word','sys-model') or (q['k'] in ('le2','le1','sys','pct','rat') and bool(S(q,r'mixture|solution .{0,20}(percent|by mass|by weight)|tickets|coins|total of .{0,40} (and|for)'))),
'form':   lambda q: q['t'] in ('nlf-vertex','nlf-zeros','nlf-exp-int','lf-interpret','cir-read','cir-build','cir-transform','le2-intercept','nlf-transform','le2-interpret','nlf-interpret'),
'symmetry': lambda q: q['t'] in ('nlf-vertex','nle-sum','nlf-height') or bool(RT(q,r'axis of symmetry|midpoint of the x-intercepts|halfway')),
'whole':  lambda q: q['k'] in ('prb','1vd','inf') or q['t'] in ('pct-of','pct-change'),
'pythag': lambda q: q['t'] in ('rtt-pythag','rtt-special','rtt-trig','cir-read','cir-build','cir-tangent','cir-transform') or bool(RT(q,r'pythag|distance formula')),
}
rare={
'chained percents': lambda q: q['k']=='pct' and (len(re.findall(r'\bThe number\b|\bthe number\b',q['stem']))>=2 or bool(S(q,r'is .{0,6} of the (sum|number)'))) and q['diff']!='Easy',
'sum/product of solutions': lambda q: bool(S(q,r'(sum|product) of (the|all) solutions')),
'extraneous (square both sides)': lambda q: q['t']=='nle-radical',
'sin x = cos(90-x)': lambda q: q['t']=='rtt-complement',
'tangent ⟂ radius': lambda q: q['t']=='cir-tangent',
'expanded circle equation (vertex trick)': lambda q: q['k']=='cir' and bool(RT(q,r'complet\w+ the square')),
'doubling / half-life time': lambda q: bool(S(q,r'double|doubles|half|halves|half-life')) and q['k'] in ('nlf','nle'),
'constants known only by conditions (made-up numbers)': lambda q: bool(S(q,r'constants? (such that|where|and)|positive constants|where [a-z] ?>|[a-z] ?< ?[a-z]')) and bool(S(q,r'which of the following (must|could|is)|how many times|must be true')),
'integer conditions (test a list)': lambda q: bool(S(q,r'integer')),
'mixtures and concentrations': lambda q: bool(S(q,r'mixture|saline|alloy|by mass|by weight|acid')) ,
'radians and degrees': lambda q: q['t']=='cir-radians',
'shifted graphs': lambda q: q['t'] in ('nlf-transform','cir-transform'),
'surface area': lambda q: q['t']=='av-surface',
'study design / generalizing': lambda q: q['k']=='stc',
}

if __name__=='__main__':
    qs=json.load(open('math.json'))
    for q in qs: q['k'],q['t']=classify(q)
    res={}
    for name,f in P.items():
        L=[q for q in qs if f(q)]; h=sum(q['diff']=='Hard' for q in L)
        res[name]=dict(n=len(L),H=h,E=sum(q['diff']=='Easy' for q in L),skills=dict(C.Counter(q['k'] for q in L).most_common()),types=dict(C.Counter(q['t'] for q in L).most_common()))
        print(f'{name:11} {len(L):4}  {100*len(L)/1925:4.1f}%  Hard {100*h/max(len(L),1):3.0f}%  skills {len(res[name]["skills"])}: {list(res[name]["skills"].items())[:7]}')
    cov=sum(1 for q in qs if any(f(q) for f in P.values())); print('covered by at least one master pattern:',cov, round(100*cov/1925,1))
    mult=C.Counter(sum(1 for f in P.values() if f(q)) for q in qs); print('patterns per question',sorted(mult.items()))
    # rare patterns
    rr={}
    for name,f in rare.items():
        L=[q for q in qs if f(q)]; h=sum(q['diff']=='Hard' for q in L)
        rr[name]=dict(n=len(L),H=h,ids=[q['id'] for q in L])
        print(f'  rare {name:52} {len(L):3}  Hard {h:3} ({100*h/max(len(L),1):3.0f}%)  {[q["id"] for q in L][:5]}')
    json.dump(dict(master=res,rare=rr),open('patstats.json','w'))
    
