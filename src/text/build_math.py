"""Rebuild every Math question as flowing text with its mathematics kept as drawn.

usage: build_math.py math-export.pdf out-folder [--only id,id,...] [--jobs N]

usage on the site: build_math.py export.pdf m/t --report=/somewhere/report.json

Writes, in out-folder:
  <id>.js        SATQ("<id>", {q: html, c: {A..D: html} or absent, r: html})   one small file per question
  _glyphs.js     SATG("<path id=...>...")    every distinct symbol outline, once
and src/build/mtext.json (which questions kept their picture, and why), and a report: per question, ok or the reasons it
was held back, sizes, and the words of the question.

A question is written only when it passes every check: the headings were found, every piece of text and every drawing on
its pages was placed exactly once, a multiple-choice question has exactly four choices, and the printed answer agrees with
the site's key. Anything else keeps its picture on the site."""
import sys, os, json, re, time
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import qbx, render

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))


def index(doc):
    out = []
    for pno in range(len(doc)):
        for b in doc[pno].get_text('blocks'):
            m = re.match(r'\s*Question ID:?\s*([0-9a-f]{8})', b[4])
            if m:
                out.append([m.group(1), pno])
    for i, q in enumerate(out):
        q.append(out[i + 1][1] if i + 1 < len(out) else len(doc))
    return out


def norm_answer(s):
    return re.sub(r'\s+', '', s.replace('−', '-').replace('–', '-')).lower()


def check_answer(printed, key, mc):
    """Does the answer printed in the export agree with the site's key?"""
    if printed is None:
        return True                      # older typed-answer questions print no answer line
    if mc:
        return printed.strip() == key
    have = set(norm_answer(x) for x in printed.split(','))
    want = set(norm_answer(x) for x in key)
    return bool(have & want)


DOC = None
KEYS = None


def start(pdf, keys):
    global DOC, KEYS
    DOC = pymupdf.open(pdf)
    KEYS = keys


def one(job):
    qid, first, last = job
    lib = render.Library()
    ctx = render.Ctx(DOC, first, lib)
    rec = {'id': qid, 'pages': last - first, 'problems': []}
    try:
        res = qbx.read_question(DOC, first, last)
        rec['problems'] += res['problems']
        key = KEYS.get(qid)
        if key is None:
            rec['problems'].append('not on the site')
        if 'q' in res and key is not None:
            mc = key['mc']
            if mc and not res['ch']:
                rec['problems'].append('no choices found')
            if not mc and res['ch']:
                rec['problems'].append('choices on a typed-answer question')
            if not check_answer(res['answer'], key['a'], mc):
                rec['problems'].append('answer %r differs from the key %r' % (res['answer'], key['a']))
            body = {'q': render.blocks_html(ctx, res['q'])}
            if res['ch']:
                body['c'] = {k: render.blocks_html(ctx, v) for k, v in sorted(res['ch'].items())}
                if any(not v for v in body['c'].values()):
                    rec['problems'].append('an empty choice')
            body['r'] = render.blocks_html(ctx, res['r'])
            if not body['q']:
                rec['problems'].append('empty question')
            if not body['r']:
                rec['problems'].append('empty rationale')
            warn = qbx.audit(res['q']) + qbx.audit(res['r'])
            for v in (res['ch'] or {}).values():
                warn += qbx.audit(v, short_ok=True)
            rec['problems'] += sorted(set(warn))
            rec['text'] = render.plain_text(res['q'])
            rec['counts'] = ctx.counts
            rec['body'] = body
    except Exception as e:                                   # one bad page must not stop the run
        rec['problems'].append('error: %s: %s' % (type(e).__name__, e))
    rec['lib'] = [(lib.index[k], k[0], k[1]) for k in lib.paths]
    return rec


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    opts = dict(a[2:].split('=', 1) if '=' in a else (a[2:], '1') for a in sys.argv[1:] if a.startswith('--'))
    pdf, out = args[0], args[1]
    md = json.load(open(os.path.join(ROOT, 'src', 'build', 'mdata.json'), encoding='utf-8'))
    keys = {r[0]: {'mc': bool(r[3]), 'a': r[4]} for r in md['qs']}
    doc = pymupdf.open(pdf)
    jobs = index(doc)
    doc.close()
    if 'only' in opts:
        want = set(opts['only'].split(','))
        jobs = [j for j in jobs if j[0] in want]
    os.makedirs(out, exist_ok=True)
    t0 = time.time()
    with Pool(int(opts.get('jobs', 4)), start, (pdf, keys)) as pool:
        recs = pool.map(one, jobs, chunksize=8)
    # one library for the whole bank. The same symbol is drawn with tiny differences from place to place (a unit or two
    # in a box of 100), so outlines that agree within that are one symbol; then each gets a short name.
    lib, first = {}, []
    for r in recs:
        for h, d, eo in r.pop('lib'):
            if h not in lib:
                lib[h] = (d, eo)
                first.append(h)
    number = re.compile(r'-?\d+')
    same, reps, order = {}, {}, []
    for h in first:
        d, eo = lib[h]
        shape = (number.sub('#', d), eo)
        nums = [int(x) for x in number.findall(d)]
        for rep, rn in reps.setdefault(shape, []):
            if all(abs(a - b) <= 2 for a, b in zip(nums, rn)):
                same[h] = rep
                break
        else:
            reps[shape].append((h, nums))
            same[h] = h
            order.append(h)
    pos = {h: i for i, h in enumerate(order)}
    short = {h: format(pos[same[h]], 'x') for h in first}
    use = re.compile(r'#G([0-9a-f]{10})')
    report, written, size = [], 0, 0
    for r in recs:
        body = r.pop('body', None)
        ok = body is not None and not r['problems']
        r['ok'] = ok
        if ok:
            s = json.dumps(body, ensure_ascii=False, separators=(',', ':'))
            s = use.sub(lambda m: '#G' + short[m.group(1)], s).replace('</', '<\\/')
            data = 'SATQ("%s",%s);\n' % (r['id'], s)
            with open(os.path.join(out, r['id'] + '.js'), 'w', encoding='utf-8') as f:
                f.write(data)
            r['bytes'] = len(data.encode('utf-8'))
            written += 1
            size += r['bytes']
        report.append(r)
    defs = ''.join('<path id="G%s" d="%s"%s/>' % (short[h], lib[h][0], ' fill-rule="evenodd"' if lib[h][1] else '') for h in order)
    with open(os.path.join(out, '_glyphs.js'), 'w', encoding='utf-8') as f:
        f.write('SATG(%s);\n' % json.dumps(defs))
    json.dump(report, open(opts.get('report', os.path.join(out, 'report.json')), 'w', encoding='utf-8'), ensure_ascii=False)
    if 'only' not in opts:
        # what the site needs to know: which questions kept their picture, and why
        held = {r['id']: r['problems'] for r in report if not r['ok']}
        json.dump({'on': 1, 'held': sorted(held), 'why': held}, open(os.path.join(ROOT, 'src', 'build', 'mtext.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
        # a question that no longer passes must not leave an old file behind
        keep = set(r['id'] + '.js' for r in report if r['ok'])
        for name in os.listdir(out):
            if name.endswith('.js') and name != '_glyphs.js' and name not in keep:
                os.remove(os.path.join(out, name))
    bad = [r for r in report if not r['ok']]
    print('questions', len(report), '| written', written, '| held back', len(bad), '| %.1f MB of question files' % (size / 1e6), '| library', len(order), 'outlines, %.0f KB' % (len(defs) / 1e3), '| %.0f s' % (time.time() - t0))
    kinds = {}
    for r in bad:
        for p in r['problems']:
            k = re.sub(r'\d+', 'N', p)[:60]
            kinds.setdefault(k, []).append(r['id'])
    for k, ids in sorted(kinds.items(), key=lambda t: -len(t[1])):
        print('  %4d  %s   e.g. %s' % (len(ids), k, ' '.join(ids[:4])))


if __name__ == '__main__':
    main()
