import re,json,collections as C
t=open('math.txt',encoding='utf-8').read()
bl=re.split(r'(?=Question ID: [0-9a-f]{8})',t)[1:]
DOM=['Problem-Solving and Data Analysis','Geometry and Trigonometry','Advanced Math','Algebra']
qs=[]
for b in bl:
    qid=b[13:21]
    head=b[:1500]
    m=re.search(r'\n\s*SAT\s+Math\s+(.*?)\n',head)
    line=m.group(1) if m else ''
    diff=re.search(r'(Easy|Medium|Hard)\s*$',line)
    parts=re.split(r'\s{2,}',line.strip())
    q=re.search(r'\nQuestion\s*\n(.*?)\n\s*(?:Answer|Correct Answer:|Rationale)',b,re.S)
    ca=re.search(r'Correct Answer:\s*(.*?)\n',b)
    rat=b.split('Rationale',1)[1] if 'Rationale' in b else ''
    choices='\nA. ' in b.split('Correct Answer:')[0]
    qs.append(dict(id=qid,meta=parts,diff=diff.group(1) if diff else None,stem=re.sub(r'\s+',' ',q.group(1)) if q else '',
      ans=ca.group(1).strip() if ca else '',mcq=choices,rat=re.sub(r'\s+',' ',rat)))
json.dump(qs,open('math.json','w'))
print(len(qs)); print(C.Counter(len(q['meta']) for q in qs)); print(qs[0]['meta'])
print(C.Counter(q['diff'] for q in qs))
