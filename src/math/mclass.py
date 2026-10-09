import json,re,collections as C
SK={'Linear equations in one':'le1','Linear functions':'lf','Linear equations in two':'le2','Systems of two linear':'sys','Linear inequalities in one':'inq',
'Equivalent expressions':'eqx','Nonlinear equations in':'nle','Nonlinear functions':'nlf',
'Ratios, rates,':'rat','Ratios, rates, proportional':'rat','Percentages':'pct','One-variable data:':'1vd','Two-variable data:':'2vd','Probability and':'prb','Inference from sample':'inf','Evaluating statistical':'stc',
'Area and volume':'av','Lines, angles, and':'lat','Right triangles and':'rtt','Circles':'cir'}
# ordered rules: (type, stem-regex, rationale-regex or None). first match wins; last rule per skill is the fallback.
R={
'le1':[('le1-count',r'how many solutions|no solution|infinitely many|exactly one solution',None),
       ('le1-model',r'which equation|equation represents|equation can|must be true',None),
       ('le1-word',r'\b(he|she|they|cost|each|total|pounds|dollars|perimeter|books|tickets|minutes|hours|people|students)\b',None),
       ('le1-solve',r'',None)],
'lf':[('lf-interpret',r'interpretation|what does .{0,40}represent|which of the following does|represent in',None),
      ('lf-intercept',r'intercept',None),
      ('lf-model',r'(represents?|models?|gives?|estimates?) (the|this)? ?(total|situation|cost|amount|number|charge|distance|value)|which (equation|function) (represents|gives|models)|dollars|cost|fee|charge|per |each',None),
      ('lf-table',r'table',None),
      ('lf-graph',r'graph|shown',None),
      ('lf-build',r'which equation defines|slope|contains the points|passes through',None),
      ('lf-eval',r'',None)],
'le2':[('le2-parallel',r'parallel|perpendicular',None),
       ('le2-interpret',r'interpretation|what does .{0,40}represent',None),
       ('le2-model',r'represents? (this|the) (situation|relationship)|which equation (represents|best represents|could)|equation represents',None),
       ('le2-intercept',r'intercept|slope',None),
       ('le2-point',r'lies on|passes through|point|table|graph|shown',None),
       ('le2-solve',r'',None)],
'sys':[('sys-count',r'no solution|infinitely many|exactly one|how many solutions|at least one solution|solutions? does',None),
       ('sys-model',r'which (system|of the following systems)|systems? of equations (could|describes|represents)|graphs? represents',None),
       ('sys-graph',r'graph|shown|intersect',None),
       ('sys-word',r'\b(cost|dollars|tickets|pounds|grams|total|sold|each|people|students|minutes)\b',None),
       ('sys-solve',r'',None)],
'inq':[('inq-graph',r'shaded|graph',None),
       ('inq-point',r'is a solution|point|ordered pair|table|which of the following (could|is|are).{0,30}(value|solution)|could be',None),
       ('inq-maxmin',r'greatest|least|maximum|minimum|most|fewest',None),
       ('inq-model',r'',None)],
'eqx':[('eqx-coef',r'constants?|where .{0,20} (is|are) (a )?(positive )?(integer|constant)',r'coefficient'),
       ('eqx-exp',r'positive values of|exponent|root',r'exponent|radical|root'),
       ('eqx-rational',r'',r'common denominator|denominator|least common'),
       ('eqx-rewrite',r'',None)],
'nle':[('nle-literal',r'in terms of|correctly expresses',None),
       ('nle-count',r'how many|no real|exactly one|distinct real|real solutions?|no solution',None),
       ('nle-sum',r'sum of the solutions|product of the solutions|sum of all solutions',None),
       ('nle-system',r'system|intersect|ordered pair',None),
       ('nle-sign',r'positive solution|negative solution|positive value|negative value|greater of|lesser of|smallest|largest',None),
       ('nle-radical',r'',r'square both sides|squaring both sides|extraneous|square root'),
       ('nle-solve',r'',None)],
'nlf':[('nlf-transform',r'shift|translat|reflect',None),
       ('nlf-vertex',r'vertex|maximum|minimum|greatest value|least value|highest|reach its',None),
       ('nlf-exp-int',r'(interpretation|represent).{0,200}|.{0,0}',r'exponential|percent|% |each year|doubl|decay|growth factor'),
       ('nlf-exp',r'percent|%|doubl|half|halv|decay|exponential|each (year|day|month|hour|minute)|every|preceding|previous|growth',None),
       ('nlf-height',r'height|ground|launch|dropped|thrown|kicked',None),
       ('nlf-interpret',r'interpretation|represent in|what does',None),
       ('nlf-zeros',r'x-intercept|zeros?|crosses the x|factor of|intersects the x|x-coordinate',None),
       ('nlf-yint',r'y-intercept|intersects the y',None),
       ('nlf-graph',r'graph|shown|table',None),
       ('nlf-geom',r'area|volume|width|length|rectangle|prism|square',None),
       ('nlf-eval',r'',None)],
'rat':[('rat-density',r'densit',None),
       ('rat-convert',r'in grams|in kilograms|in pounds|in ounces|equivalent to .{0,30}(inches|feet|yards|miles|meters|centimeters|ounces|quarts|cups|gallons|liters|seconds|minutes|hours)|how many .{0,25}(are|is) (equivalent|in)|, in (feet|inches|miles|yards|meters|centimeters|kilometers|seconds|minutes|hours)|per (second|minute|hour)|fathom|what is .{0,40}(speed|depth|distance).{0,10} in ',None),
       ('rat-square',r'square (feet|yards|miles|inches|meters|centimeters|kilometers)|cubic (feet|yards|inches|meters|centimeters)',None),
       ('rat-ratio',r'ratio|proportional',None),
       ('rat-rate',r'speed|rate|per |each|at this',None),
       ('rat-other',r'',None)],
'pct':[('pct-change',r'increase|decrease|greater than|less than|more than|discount|reduced|sale|markup|percent change|net',None),
       ('pct-of',r'',None)],
'1vd':[('1vd-change',r'remov|added|add|replaced|new data|sixth|outlier|if .{0,40} (were|is) (changed|increased)',None),
       ('1vd-spread',r'standard deviation|range|spread|interquartile',None),
       ('1vd-median',r'median',None),
       ('1vd-mean',r'mean|average',None),
       ('1vd-read',r'',None)],
'2vd':[('2vd-predict',r'predict|line of best fit .{0,60}(at|for|when)|closest to the .{0,20}value|estimate',None),
       ('2vd-slope',r'interpretation|slope|represent',None),
       ('2vd-model',r'model|which (equation|of the following equations)|best fit|type of function|function best|describes the function|relationship',None),
       ('2vd-rate',r'rate of change|increase|decrease',None),
       ('2vd-read',r'',None)],
'prb':[('prb-given',r'given that|of those|of the .{0,60}(who|that|with)|if (a|one|the) .{0,80}(who|that|is|was) .{0,40}(selected|chosen)|what fraction of|what percent of|is selected at random, what',None),
       ('prb-simple',r'',None)],
'inf':[('inf-moe',r'margin of error|plausible|between .{0,20} and',None),
       ('inf-estimate',r'',None)],
'stc':[('stc-general',r'largest (population|group)|generaliz|applied|represent the',None),
       ('stc-design',r'',None)],
'av':[('av-scale',r'times (the|each|its)|scale|increased by|doubled|tripled|each side length|copy|similar',None),
      ('av-surface',r'surface area',None),
      ('av-volume',r'volume|cubic|cylinder|cone|sphere|prism|pyramid|cube',None),
      ('av-perimeter',r'perimeter',None),
      ('av-area',r'',None)],
'lat':[('lat-similar',r'similar|congruent|dilat|correspond|scale factor',None),
       ('lat-parallel',r'parallel',None),
       ('lat-lines',r'intersect|vertical angles|line|extended',None),
       ('lat-triangle',r'',None)],
'rtt':[('rtt-complement',r'',r'complementary|sin\w* .{0,40} cos|cos\w* .{0,40} sin|90 ?°? ?−'),
       ('rtt-trig',r'sin|cos|tan|radians',None),
       ('rtt-special',r'30|45|60|isosceles right|equilateral|square|inscribed',None),
       ('rtt-similar',r'similar|parallel|correspond',None),
       ('rtt-trig2',r'',r'^.{0,400}\b(sine|cosine|tangent|sin|cos|tan)\b'),
       ('rtt-pythag',r'',None)],
'cir':[('cir-radians',r'radian|degree',None),
       ('cir-arc',r'\barc\b|sector|central angle|circumference|minor|major',None),
       ('cir-tangent',r'tangent',None),
       ('cir-transform',r'shift|translat|same center|same radius|times the radius|twice the radius|greater than the radius',None),
       ('cir-build',r'which (of the following )?equations? (represents|defines|is)|equation of the circle|is an equation',None),
       ('cir-read',r'center|radius|diameter|xy-plane|equation',None),
       ('cir-geo',r'',None)],
}
def classify(q):
    k=SK[q['skill']]; s=q['stem'].lower(); r=q['rat'].lower()
    for t,sp,rp in R[k]:
        if sp=='' and rp is None: return k,t
        if rp is not None and sp in ('',r'(interpretation|represent).{0,200}|.{0,0}'):
            if t=='nlf-exp-int':
                if re.search(r'interpretation|what does|represent',s) and re.search(rp,s+' '+r[:300]): return k,t
                continue
            if re.search(rp,r): return k,('rtt-trig' if t=='rtt-trig2' else t)
            continue
        if re.search(sp,s) or (rp and re.search(rp,r)): return k,t
    return k,R[k][-1][0]
if __name__=='__main__':
    qs=json.load(open('math.json'))
    cnt=C.Counter(); hard=C.Counter()
    for q in qs:
        k,t=classify(q); q['sk']=k; q['type']=t; cnt[t]+=1; hard[t]+=q['diff']=='Hard'
    for k in R:
        tot=sum(cnt[t] for t,_,_ in R[k]); print(f'## {k} {tot}')
        for t,_,_ in R[k]: print(f'   {t:16} {cnt[t]:4}  hard {hard[t]:3} {100*hard[t]/max(cnt[t],1):3.0f}%')
    json.dump(qs,open('math.json','w'))
