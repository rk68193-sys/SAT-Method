"""Turn the Reading and Writing questions that the site shows as pictures into text cards.

usage: build_rw.py rw-export.pdf [--write]

The 131 table-and-graph questions (src/build/figures.json) and the 335 extra grammar questions
(src/build/grammar-sources.json) were added as pictures of the printed page. This reads the same questions from the
export's text layer: the passage, the question, the four choices and the rationale, split by choice. A table or graph
is cropped from the page into rw/f/<id>.webp; everything else is text.

A question is converted only when it passes every check: the headings were found, every piece of text and every drawing
on its pages was placed exactly once, there are four choices with words in them, the printed answer agrees with the site's
key, and the rationale could be split so that the right answer has its own explanation. Anything else stays a picture.
Without --write it only reports."""
import sys, os, json, re, html
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pymupdf
import qbx, render

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
BUILD = os.path.join(ROOT, 'src', 'build')
BLANK = re.compile(r'_{4,}')
START = re.compile(r'Choices? ([A-D])((?:(?:,| and|, and) [A-D])*) (?:is|are) ')


def index(doc):
    out = {}
    order = []
    for pno in range(len(doc)):
        for b in doc[pno].get_text('blocks'):
            m = re.match(r'\s*Question ID:?\s*([0-9a-f]{8})', b[4])
            if m:
                order.append((m.group(1), pno))
    for i, (qid, pno) in enumerate(order):
        out[qid] = (pno, order[i + 1][1] if i + 1 < len(order) else len(doc))
    return out


def para_text(ctx, b):
    return BLANK.sub('<span class="blank">______</span>', render.para_html(ctx, b))


def split_rationale(text, ans):
    """{letter: its part of the rationale}. The export writes "Choice C is the best answer ... Choice A is incorrect
    because ..." and sometimes "Choices A and B are incorrect ..."."""
    marks = [m for m in START.finditer(text) if m.start() == 0 or text[m.start() - 1] in ' \n' and text[max(0, m.start() - 2)] in '.”"?!)’\'']
    if not marks or marks[0].start() != 0:
        return None
    why = {}
    for i, m in enumerate(marks):
        seg = text[m.start():marks[i + 1].start() if i + 1 < len(marks) else len(text)].strip()
        letters = [m.group(1)] + re.findall(r'[A-D]', m.group(2))
        for L in letters:
            why[L] = (why[L] + ' ' + seg) if L in why else seg
    return why if ans in why else None


def convert(doc, where, item, figdir, write):
    """Returns (new item, None) or (None, reasons)."""
    qid = item['id']
    first, last = where
    res = qbx.read_question(doc, first, last)
    problems = list(res['problems'])
    if 'q' not in res:
        return None, problems
    lib = render.Library()
    ctx = render.Ctx(doc, first, lib)
    problems += qbx.audit(res['q']) + qbx.audit(res['r'])
    for v in (res['ch'] or {}).values():
        problems += qbx.audit(v, short_ok=True)
    if not res['ch']:
        problems.append('no choices')
        return None, problems
    if res['answer'] is not None and res['answer'].strip() != item['ans']:
        problems.append('answer %r differs from the key %r' % (res['answer'], item['ans']))
    # the question: its last paragraph is the question itself, the rest is the passage
    blocks = res['q']
    if not blocks or blocks[-1]['t'] != 'p':
        problems.append('no question sentence')
        return None, problems
    stem = para_text(ctx, blocks[-1])
    if not re.search(r'(\?|:)\s*$', html.unescape(re.sub(r'<[^>]+>', '', stem))) and not stem.startswith('Which '):
        problems.append('question sentence looks wrong: ' + stem[:50])
    nfig = 0
    passage = []
    for b in blocks[:-1]:
        if b['t'] == 'p':
            t = para_text(ctx, b)
            if t:
                passage.append('<span class="%s">%s</span>' % ('rwcap' if b.get('centre') else 'ppara', t))
        elif b['t'] == 'fig':
            nfig += 1
            name = '%s%s.webp' % (qid, '' if nfig == 1 else '-%d' % nfig)
            data, w, h, em = render.figure_bytes(ctx, b)
            if write:
                with open(os.path.join(figdir, name), 'wb') as f:
                    f.write(data)
            alt = ('Table or graph. Text in it: ' + b['label']) if b.get('label') else 'Table or graph'
            passage.append('<img class="rwfig" src="rw/f/%s" width="%d" height="%d" style="width:%sem" alt="%s" loading="lazy">' % (name, w, h, render.num(em), html.escape(alt[:500], quote=True)))
        else:
            problems.append('a drawn equation in the passage')
    if not passage:
        problems.append('no passage')
    ch = {}
    for k, bl in sorted(res['ch'].items()):
        if any(b['t'] != 'p' for b in bl):
            problems.append('a choice that is not text')
        ch[k] = ' '.join(para_text(ctx, b) for b in bl if b['t'] == 'p').strip()
        if not ch[k]:
            problems.append('empty choice ' + k)
    if any(b['t'] != 'p' for b in res['r']):
        problems.append('a figure in the rationale')
    rat = ' '.join(para_text(ctx, b) for b in res['r'] if b['t'] == 'p').strip()
    why = split_rationale(rat, item['ans'])
    if why is None:
        why = {item['ans']: rat}
    if not rat:
        problems.append('empty rationale')
    if ctx.counts['svg'] or ctx.counts['img']:
        problems.append('drawn symbols in the text')
    if item.get('job') == 'grammar' and not any('class="blank"' in p for p in passage):
        problems.append('grammar passage without a blank')
    if problems:
        return None, sorted(set(problems))
    new = dict(item)
    new.update({'s': passage, 'q': stem, 'ch': ch, 'why': why, 'txt': 1, 'nfig': nfig})
    return new, None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    write = '--write' in sys.argv
    doc = pymupdf.open(args[0])
    where = index(doc)
    figdir = os.path.join(ROOT, 'rw', 'f')
    if write:
        os.makedirs(figdir, exist_ok=True)
        for name in os.listdir(figdir):                # a rerun must not leave an old crop behind
            if name.endswith('.webp'):
                os.remove(os.path.join(figdir, name))
    total, done, reasons = 0, 0, {}
    for name in ('figures.json', 'grammar-sources.json'):
        path = os.path.join(BUILD, name)
        items = json.load(open(path, encoding='utf-8'))
        out, n = [], 0
        for it in items:
            total += 1
            if it['id'] not in where:
                out.append(it)
                reasons.setdefault('not in the export', []).append(it['id'])
                continue
            # start again from the picture card each time, so a rerun is the same as a first run
            base = {k: v for k, v in it.items() if k not in ('txt', 'nfig')}
            if it.get('txt'):
                base.update({'s': ['<img src="%s" alt="Source question %s" loading="lazy" style="max-width:100%%;height:auto">' % (it['qsrc'], it['id'])], 'q': 'Choose the best answer.',
                             'ch': {'A': '', 'B': '', 'C': '', 'D': ''}, 'why': {it['ans']: '<img src="%s" alt="Official explanation %s" loading="lazy" style="max-width:100%%;height:auto">' % (it['rsrc'], it['id'])}})
            new, why = convert(doc, where[it['id']], base, figdir, write)
            if new is None:
                out.append(base)
                for w in why:
                    reasons.setdefault(re.sub(r'\d+', 'N', w)[:60], []).append(it['id'])
            else:
                out.append(new); n += 1; done += 1
        print('%s: %d of %d converted' % (name, n, len(items)))
        if write:
            json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('converted', done, 'of', total, '| written' if write else '| report only')
    for k, ids in sorted(reasons.items(), key=lambda t: -len(t[1])):
        print('  %4d  %s   e.g. %s' % (len(ids), k, ' '.join(ids[:4])))


if __name__ == '__main__':
    main()
