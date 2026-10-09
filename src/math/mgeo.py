import re,json,collections as C
h=open('mbbox.html',encoding='utf-8').read()
pages=h.split('<page ')[1:]
lines=[]  # per page list of (ymin,ymax,xmin,text)
for p in pages:
    L=[]
    for m in re.finditer(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>',p,re.S):
        words=re.findall(r'>([^<]*)</word>',m.group(5))
        L.append((float(m.group(2)),float(m.group(4)),float(m.group(1)),' '.join(words)))
    L.sort()
    lines.append(L)
qs=[]
for pi,L in enumerate(lines):
    for (y0,y1,x0,t) in L:
        m=re.match(r'Question ID: ([0-9a-f]{8})$',t)
        if m: qs.append({'id':m.group(1),'page':pi,'y':y0})
# assign labels
for i,q in enumerate(qs):
    end_page = qs[i+1]['page'] if i+1<len(qs) else len(lines)
    if i+1<len(qs) and qs[i+1]['page']==q['page']: print('two on one page',q['id'])
    q['pages']=list(range(q['page'], max(end_page, q['page']+1)))
    labs={}
    for pi in q['pages']:
        for (y0,y1,x0,t) in lines[pi]:
            if x0>40: continue
            for lab in ['Question','Answer','Rationale']:
                if t==lab and lab not in labs: labs[lab]=(pi,y0,y1)
            if t.startswith('Correct Answer:') and 'Correct' not in labs: labs['Correct']=(pi,y0,y1,t)
    q['labs']=labs
miss=C.Counter()
for q in qs:
    for k in ['Question','Correct','Rationale']:
        if k not in q['labs']: miss[k]+=1
print(len(qs),'missing',miss, 'with Answer label',sum('Answer' in q['labs'] for q in qs))
print(C.Counter(len(q['pages']) for q in qs))
cross=[]
print('question/choices cross a page',len(cross),cross[:5])
json.dump(qs,open('mgeo.json','w'))
