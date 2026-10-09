import json, os, sys
b = os.path.dirname(os.path.abspath(__file__))
S = os.path.dirname(b)
shell = open(os.path.join(b, 'shell.html'), encoding='utf-8').read()
css = open(os.path.join(b, 'app.css'), encoding='utf-8').read()
parts = ['core.js', 'grammar.js', 'reading.js', 'para.js', 'drills.js', 'practice.js', 'start.js', 'lookup.js', 'math.js', 'home.js', 'boot.js']
js = "(function () {\n  'use strict';\n" + ''.join(open(os.path.join(b, p), encoding='utf-8').read() for p in parts) + "}());\n"
open(os.path.join(b, 'bundle.js'), 'w', encoding='utf-8').write(js)
data = json.load(open(os.path.join(S, 'build', 'data.json'), encoding='utf-8'))
data['reading'] = json.load(open(os.path.join(S, 'build', 'rdata.json'), encoding='utf-8'))
bankp = os.path.join(S, 'build', 'bank.json')
data['bank'] = json.load(open(bankp, encoding='utf-8')) if os.path.exists(bankp) else {'notes': [], 'trans': []}
annp = os.path.join(S, 'build', 'ann.json')
data['ann'] = json.load(open(annp, encoding='utf-8')) if os.path.exists(annp) else {}
mp = os.path.join(S, 'build', 'mdata.json')
data['math'] = json.load(open(mp, encoding='utf-8'))
np_ = os.path.join(S, 'build', 'notes-page.json')
if os.path.exists(np_): data['ann']['notesPage'] = json.load(open(np_, encoding='utf-8'))
blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
assert '</script' not in js.lower() and '</script' not in css.lower()
out = shell.replace('/*__CSS__*/', css, 1).replace('/*__JS__*/', js, 1).replace('/*__DATA__*/', blob, 1)
assert '/*__' not in out
dest = sys.argv[1]
os.makedirs(os.path.dirname(dest), exist_ok=True)
open(dest, 'w', encoding='utf-8').write(out)
print('wrote', dest, len(out.encode('utf-8')), 'bytes; data', len(blob.encode('utf-8')), '; <title> at', out.find('<title>'))
