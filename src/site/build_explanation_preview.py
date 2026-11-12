"""Build the small, shareable review page for the 20-explanation pilot."""
import json
from pathlib import Path
from html import escape as esc
ROOT = Path(__file__).resolve().parents[2]
read = lambda f: json.loads((ROOT / 'src/build' / f).read_text())
entries = read('explanation-pilot.json')
bank = {q['id']: q for q in read('bank.json')['reading']}
html = ['''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Simplified explanations · SAT Sprint</title><style>
:root{color-scheme:light dark;font-family:system-ui,sans-serif;line-height:1.65;background:light-dark(#f5f4ee,#171b20);color:light-dark(#202b32,#f1f3f5)}body{max-width:850px;margin:auto;padding:24px}a{color:light-dark(#185a70,#99d7ed)}article{background:light-dark(white,#242b32);padding:clamp(16px,4vw,32px);margin:24px 0;border:1px solid #8887;border-radius:16px;scroll-margin-top:16px}li{margin:8px 0}img{max-width:100%;height:auto;background:white}summary{cursor:pointer;font-weight:600}h1,h2,h3{line-height:1.25}.meta{font-size:.9rem;opacity:.85}.clue{border-left:4px solid #468b93;padding-left:16px}nav{display:flex;gap:18px;flex-wrap:wrap}p,li{overflow-wrap:anywhere}</style>
<header><a href="index.html#home">← Back to SAT Sprint</a><h1>Simplified explanations</h1><p>20 samples: 10 Reading and Writing, 10 Math. Each section has 3 easy, 4 medium and 3 hard questions.</p><p>Look for the key clue, follow the short solution, then check the trap. These explanations are independently written; the questions and answer keys are College Board’s.</p><nav><a href="#rw">Reading and Writing</a><a href="#math">Math</a></nav></header><main>''']
for subject,title in [('rw','Reading and Writing'),('math','Math')]:
 html.append(f'<section id="{subject}"><h2>{title}</h2>')
 for id,e in entries.items():
  if e['subject']!=subject: continue
  html.append(f'<article id="q-{id}"><p class="meta">{esc(e["difficulty"])} · {esc(id)}</p><h3>{esc(e["title"])}</h3>')
  if subject=='rw':
   q=bank[id];html.append(f'<p>{q["intro"]}</p><div>{" ".join(q["s"])}</div><p><b>{q["q"]}</b></p><ol type="A">'+''.join(f'<li>{q["ch"][k]}</li>' for k in 'ABCD')+'</ol>')
  else: html.append(f'<picture><source media="(max-width:720px)" srcset="m/qn/{id}.webp"><img src="m/q/{id}.webp" alt="College Board question {id}; open the practice link for the text version" loading="lazy"></picture>')
  answer=e['answer'] if isinstance(e['answer'],str) else ' or '.join(e['answer'])
  html.append(f'<p><b>Answer: {esc(answer)}</b></p><p class="clue"><b>Key clue:</b> {esc(e["clue"])}</p><ol>'+''.join(f'<li>{esc(s)}</li>' for s in e['steps'])+'</ol>')
  if e.get('wrong'): html.append('<details><summary>Why the other choices fail</summary><ul>'+''.join(f'<li><b>{k}:</b> {esc(v)}</li>' for k,v in e['wrong'].items())+'</ul></details>')
  html.append(f'<p><b>Watch out:</b> {esc(e["trap"])}</p><p><a href="index.html#{"rq" if subject=="rw" else "mq"}-{id}">Try this question in practice</a></p>')
  if subject=='rw': html.append('<details><summary>Compare the original explanation</summary>'+''.join(f'<p><b>{k}:</b> {v}</p>' for k,v in bank[id]['why'].items())+'</details>')
  else: html.append(f'<details><summary>Compare the original explanation</summary><img src="m/r/{id}.webp" alt="Original College Board explanation for {id}" loading="lazy"></details>')
  html.append('</article>')
 html.append('</section>')
html.append('</main></html>')
(ROOT/'explanation-preview.html').write_text('\n'.join(html))
print('Built explanation-preview.html (20 explanations)')
