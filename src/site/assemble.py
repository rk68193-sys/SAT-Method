import hashlib, json, os, sys
b = os.path.dirname(os.path.abspath(__file__))
S = os.path.dirname(b)
shell = open(os.path.join(b, 'shell.html'), encoding='utf-8').read()
css = open(os.path.join(b, 'app.css'), encoding='utf-8').read()
parts = ['core.js', 'grammar.js', 'reasoning.js', 'data-patterns.js', 'review-findings.js', 'reading.js', 'vocab.js', 'para.js', 'drills.js', 'practice.js', 'start.js', 'lookup.js', 'math.js', 'mfound.js', 'math-text.js', 'math-study.js', 'math-track.js', 'module-core.js', 'math-module.js', 'msheet.js', 'rw-track.js', 'rw-module.js', 'plan.js', 'habit.js', 'data.js', 'account.js', 'hub.js', 'home.js', 'boot.js']
js = "(function () {\n  'use strict';\n" + ''.join(open(os.path.join(b, p), encoding='utf-8').read() for p in parts) + "}());\n"
open(os.path.join(b, 'bundle.js'), 'w', encoding='utf-8').write(js)
data = json.load(open(os.path.join(S, 'build', 'data.json'), encoding='utf-8'))
data['reading'] = json.load(open(os.path.join(S, 'build', 'rdata.json'), encoding='utf-8'))
reviewp = os.path.join(S, 'build', 'review-findings.json')
if os.path.exists(reviewp): data['reviewFindings'] = json.load(open(reviewp, encoding='utf-8'))
bankp = os.path.join(S, 'build', 'bank.json')
data['bank'] = json.load(open(bankp, encoding='utf-8')) if os.path.exists(bankp) else {'notes': [], 'trans': []}
for filename, key in [('figures.json', 'figures'), ('grammar-sources.json', 'grammarSources')]:
    extra = os.path.join(S, 'build', filename)
    if os.path.exists(extra): data['bank'][key] = json.load(open(extra, encoding='utf-8'))
annp = os.path.join(S, 'build', 'ann.json')
data['ann'] = json.load(open(annp, encoding='utf-8')) if os.path.exists(annp) else {}
mp = os.path.join(S, 'build', 'mdata.json')
data['math'] = json.load(open(mp, encoding='utf-8'))
study_path = os.path.join(S, 'build', 'mstudy.json')
data['mathStudy'] = json.load(open(study_path, encoding='utf-8'))
text_path = os.path.join(S, 'build', 'mtext.json')
if os.path.exists(text_path):
    mt = json.load(open(text_path, encoding='utf-8'))
    data['mathText'] = {'on': mt.get('on', 0), 'held': mt.get('held', [])}
    # The page asks for every file in m/t with one stamp made from all of them, so that it never puts a question from
    # one rebuild with the symbol library of another: the symbols are numbered afresh on every rebuild, and a question
    # drawn with another rebuild's library shows the wrong symbols (π as d, % as g). A device keeps these files, so the
    # stamp changing is what makes it fetch the new ones.
    mt_dir = os.path.join(os.path.dirname(S), 'm', 't')
    if data['mathText']['on']:
        assert os.path.isdir(mt_dir), 'the question files (m/t) are needed to stamp them: ' + mt_dir
        stamp = hashlib.sha1()
        for name in sorted(n for n in os.listdir(mt_dir) if n.endswith('.js')):
            stamp.update(name.encode('utf-8') + b'\0' + open(os.path.join(mt_dir, name), 'rb').read() + b'\0')
        data['mathText']['v'] = stamp.hexdigest()[:10]
vocab_path = os.path.join(S, 'build', 'vocab.json')
if os.path.exists(vocab_path): data['vocab'] = json.load(open(vocab_path, encoding='utf-8'))
mnotin_path = os.path.join(S, 'build', 'mnotin.json')
if os.path.exists(mnotin_path): data['mnotin'] = json.load(open(mnotin_path, encoding='utf-8'))
mdrills_path = os.path.join(S, 'build', 'mdrills.json')
if os.path.exists(mdrills_path):
    data['mdrills'] = {k: [{f: c[f] for f in ('id', 'p', 'o', 'a', 'x', 'r')} for c in v] for k, v in json.load(open(mdrills_path, encoding='utf-8')).items()}
np_ = os.path.join(S, 'build', 'notes-page.json')
if os.path.exists(np_): data['ann']['notesPage'] = json.load(open(np_, encoding='utf-8'))
acct_path = os.path.join(S, 'build', 'account.json')
data['account'] = json.load(open(acct_path, encoding='utf-8')) if os.path.exists(acct_path) else {'url': '', 'key': ''}
blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
assert '</script' not in js.lower() and '</script' not in css.lower()
out = shell.replace('/*__CSS__*/', css, 1).replace('/*__JS__*/', js, 1).replace('/*__DATA__*/', blob, 1)
assert '/*__' not in out
dest = sys.argv[1]
os.makedirs(os.path.dirname(dest), exist_ok=True)
open(dest, 'w', encoding='utf-8').write(out)
print('wrote', dest, len(out.encode('utf-8')), 'bytes; data', len(blob.encode('utf-8')), '; <title> at', out.find('<title>'))

