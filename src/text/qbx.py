"""Rebuild questions from College Board's question-bank PDF export as flowing content.

The export is printed from a web page. Prose is real text. Mathematics is not: newer questions draw every symbol as a
vector outline, older ones place small pictures in the line. This module reads one question's pages and returns its
parts (the question, the choices, the answer, the rationale) as blocks of tokens: text, inline graphics that keep their
size and their position on the baseline, display equations, and figures. Nothing is recognised or retyped: text comes
from the text layer and every graphic is carried over as drawn, so the result says what the page says.

Used by build_rw.py and build_math.py. Needs PyMuPDF (pip install pymupdf)."""
import re
import pymupdf

EM = 8.25                 # body text is 11 CSS px, which prints as 8.25 pt
ASC, DESC = 7.6, 2.13     # ascender and descender of that text, in pt
LEFT, RIGHT = 18.0, 594.0
VSTEP = 1000.0            # each further page of a question is laid below the one before, this far down
AXIS = 2.5                # the middle of a line of mathematics sits about this far above the baseline
TEXT_FLAGS = pymupdf.TEXT_PRESERVE_WHITESPACE | pymupdf.TEXT_INHIBIT_SPACES
LETTER = re.compile(r'^\s*([A-D])\.\s?')      # a choice's letter


class Box:
    __slots__ = ('x0', 'y0', 'x1', 'y1')

    def __init__(self, x0, y0, x1, y1):
        self.x0, self.y0, self.x1, self.y1 = x0, y0, x1, y1

    @property
    def w(self): return self.x1 - self.x0

    @property
    def h(self): return self.y1 - self.y0

    @property
    def cx(self): return (self.x0 + self.x1) / 2

    @property
    def cy(self): return (self.y0 + self.y1) / 2

    def add(self, o):
        self.x0, self.y0, self.x1, self.y1 = min(self.x0, o.x0), min(self.y0, o.y0), max(self.x1, o.x1), max(self.y1, o.y1)

    def near(self, o, dx, dy):
        return self.x0 - dx <= o.x1 and o.x0 - dx <= self.x1 and self.y0 - dy <= o.y1 and o.y0 - dy <= self.y1

    def holds(self, o, pad=0.0):
        return self.x0 - pad <= o.cx <= self.x1 + pad and self.y0 - pad <= o.cy <= self.y1 + pad


def union(boxes):
    b = Box(boxes[0].x0, boxes[0].y0, boxes[0].x1, boxes[0].y1)
    for o in boxes[1:]:
        b.add(o)
    return b


class Span:
    """A run of text in one font."""
    kind = 't'

    def __init__(self, text, box, base, font, page, chars):
        self.text, self.box, self.base, self.font, self.page, self.chars = text, box, base, font, page, chars
        self.used = False
        self.under = False


class Gfx:
    """One drawn path, or one placed picture."""

    def __init__(self, kind, box, page, data):
        self.kind, self.box, self.page, self.data = kind, box, page, data      # kind: 'v' vector path, 'i' picture
        self.used = False
        self.seed = False


def page_atoms(page, k):
    """Text spans and graphics of one page, moved down k pages."""
    dy = k * VSTEP
    spans, gfx = [], []
    for b in page.get_text('rawdict', flags=TEXT_FLAGS)['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                chars = [(c['c'], c['bbox'][0], c['bbox'][2]) for c in s['chars']]
                text = ''.join(c[0] for c in chars)
                if not text.strip():
                    continue
                x0, y0, x1, y1 = s['bbox']
                spans.append(Span(text, Box(x0, y0 + dy, x1, y1 + dy), s['origin'][1] + dy, s['font'], k, chars))
    for g in page.get_drawings():
        r = g['rect']
        if r.width <= 0 and r.height <= 0:
            continue
        fill = g.get('fill')
        if g['type'] == 'f' and fill is not None and min(fill) > 0.985:
            continue                                   # white backgrounds
        gfx.append(Gfx('v', Box(r.x0, r.y0 + dy, r.x1, r.y1 + dy), k, g))
    for im in page.get_image_info(xrefs=True):
        x0, y0, x1, y1 = im['bbox']
        if x1 - x0 < 0.5 or y1 - y0 < 0.5:
            continue
        gfx.append(Gfx('i', Box(x0, y0 + dy, x1, y1 + dy), k, im))
    return spans, gfx


def is_rule(g):
    """A thin filled rectangle: a fraction bar, a root's bar, an underline, a table line."""
    if g.kind != 'v':
        return False
    d = g.data
    return d['type'] in ('f', 'fs') and all(it[0] == 're' for it in d['items']) and (g.box.h < 1.3 or g.box.w < 1.3)


def is_glyph(g):
    """A filled outline the size of a symbol, as MathJax draws them."""
    if g.kind != 'v':
        return False
    d = g.data
    if d['type'] not in ('f', 'fs') or d.get('fill') is None or max(d['fill']) > 0.2:
        return False
    return g.box.w < 60 and g.box.h < 60 and any(it[0] in ('c', 'qu', 'l') for it in d['items'])


class Line:
    def __init__(self, base):
        self.base = base
        self.spans = []
        self.gfx = []
        self.tokens = []        # filled by tokens(): ('t', text, under) | ('g', [Gfx], Box)

    @property
    def box(self):
        return union([s.box for s in self.spans] + [g.box for g in self.gfx])

    def build(self):
        items = [(s.box.x0, 0, s) for s in self.spans] + [(g.box.x0, 1, g) for g in self.gfx]
        items.sort(key=lambda t: (t[0], t[1]))
        out = []          # ['t', text, underlined, x0, x1] | ['g', [Gfx], Box]
        for _, k, it in items:
            if k == 0:
                out.append(['t', it.text, it.under, it.box.x0, it.box.x1])
            elif out and out[-1][0] == 'g' and it.box.x0 - out[-1][2].x1 < 14:
                out[-1][1].append(it); out[-1][2].add(it.box)
            else:
                out.append(['g', [it], Box(it.box.x0, it.box.y0, it.box.x1, it.box.y1)])
        # the page leaves a gap where a space is meant but the text layer does not always carry the space
        for i in range(len(out) - 1):
            a, b = out[i], out[i + 1]
            if a[0] == 't' and b[0] == 't' and not a[1].endswith(' ') and not b[1].startswith(' ') and b[3] - a[4] > 1.7:
                a[1] += ' '
            elif a[0] == 't' and b[0] == 'g' and not a[1].endswith(' ') and b[2].x0 - a[4] > 1.7:
                a[1] += ' '
            elif a[0] == 'g' and b[0] == 't' and not b[1].startswith(' ') and b[3] - a[2].x1 > 1.7:
                b[1] = ' ' + b[1]
        tok = []
        for t in out:
            if t[0] == 't' and tok and tok[-1][0] == 't' and tok[-1][2] == t[2]:
                tok[-1][1] += t[1]
            elif t[0] == 't':
                tok.append(['t', t[1], t[2]])
            else:
                tok.append(t)
        self.tokens = tok

    def first_width(self):
        """Width of the first piece that cannot be broken: could it have fitted at the end of the line above?"""
        items = [(s.box.x0, s) for s in self.spans] + [(g.box.x0, g) for g in self.gfx]
        items.sort(key=lambda t: t[0])
        x0 = items[0][0]
        end = x0
        for _, it in items:
            if isinstance(it, Span):
                for c, a, b in it.chars:
                    if c == ' ' and a > x0 + 0.5:
                        return max(end, a) - x0
                    end = max(end, b)
            else:
                end = max(end, it.box.x1)
        return end - x0


def split_sections(spans):
    """The bold headings that divide a question. Returns {name: y} and the answer text."""
    by_y = {}
    for s in spans:
        by_y.setdefault(round(s.base), []).append(s)
    heads, answer = {}, None
    for s in spans:
        t = s.text.strip()
        if s.box.x0 > LEFT + 1.5:
            continue
        alone = len(by_y[round(s.base)]) == 1
        if t in ('Question', 'Answer', 'Rationale') and alone and t not in heads:
            heads[t] = s
        elif t.startswith('Correct Answer:') and 'Correct' not in heads:
            heads['Correct'] = s
            answer = ' '.join(x.text for x in sorted(by_y[round(s.base)], key=lambda z: z.box.x0)).split(':', 1)[1].strip()
    return heads, answer


def figures(gfx, spans, top, bottom, merge=True):
    """Graphs, diagrams and tables: connected groups of strokes, boxes and rules, with everything drawn inside them."""
    seeds = []
    for g in gfx:
        if g.used or not (top <= g.box.cy < bottom):
            continue
        if g.kind == 'i':
            # a tall picture standing alone is a figure; one with prose beside it is a formula in the sentence
            if g.box.h > 34 and not level_with_text(g, spans, Box(0, 0, 0, 0)):
                seeds.append(g)
        elif not is_glyph(g) or is_rule(g):
            seeds.append(g)
    seeds.sort(key=lambda g: g.box.x0)
    parent = list(range(len(seeds)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for i, a in enumerate(seeds):
        for j in range(i + 1, len(seeds)):
            b = seeds[j]
            if b.box.x0 - 2.0 > a.box.x1:
                break
            if a.box.near(b.box, 2.0, 2.0):
                parent[find(i)] = find(j)
    groups = {}
    for i, g in enumerate(seeds):
        groups.setdefault(find(i), []).append(g)
    # first settle which groups are figures and claim their parts, so that neighbours cannot take each other's lines
    found = []
    for members in groups.values():
        box = union([g.box for g in members])
        if box.h > 16 or any(g.kind == 'i' for g in members):
            for g in members:
                g.used = True
            found.append((members, box))
    if merge:
        # a graph and its legend, or a plot and its axis, are one figure: join parts that follow closely with no prose between
        found.sort(key=lambda f: f[1].y0)
        joined = []
        for members, box in found:
            if joined:
                pm, pb = joined[-1]
                prose = any(not s.used and pb.y1 - 2 < s.base < box.y0 + 8 and s.box.x0 < LEFT + 3 and len(s.text.strip()) > 2 for s in spans)
                if box.y0 - pb.y1 < 70 and not prose:
                    pm.extend(members); pb.add(box)
                    continue
            joined.append((members, box))
        found = joined

    def label(s, core, box):
        """Text that belongs to the figure although it stands outside its lines: axis names, tick labels, a legend's words."""
        if s.box.x0 < LEFT + 3:
            return False                                # at the margin: a choice's letter or prose
        if core.y0 - 2 <= s.box.cy <= core.y1 + 2 and core.x0 - 45 <= s.box.cx <= core.x1 + 45:
            return True                                 # beside the plot
        if not (core.x0 - 18 <= s.box.cx <= core.x1 + 18 and core.y0 - 18 <= s.box.cy <= core.y1 + 34):
            return False
        row = [o for o in spans if not o.used and abs(o.base - s.base) < 3 and not box.holds(o.box, 2.0)]
        if any(len(o.text.strip()) > 6 or o.box.x0 < LEFT + 3 for o in row):
            return False                                # a line of words, not labels
        if s.box.cy < core.y0 and any(not o.used and 6 < s.base - o.base < 17 and o.box.x0 > LEFT + 30 and len(o.text.strip()) > 6 for o in spans):
            return False                                # the last line of a centred title above the figure
        return True
    out = []
    for members, box in found:
        core = Box(box.x0, box.y0, box.x1, box.y1)
        grew = True
        while grew:                                     # take in symbols that belong to the figure
            grew = False
            for g in gfx:
                if g.used or not (top <= g.box.cy < bottom):
                    continue
                if box.holds(g.box, 3.0) or (core.holds(g.box, 14.0) and not level_with_text(g, spans, core)):
                    members.append(g); g.used = True; box.add(g.box); grew = True
        inside = [s for s in spans if not s.used and top <= s.base < bottom and (box.holds(s.box, 2.0) or label(s, core, box))]
        for s in inside:
            s.used = True
        if inside:
            box.add(union([s.box for s in inside]))
        out.append({'kind': 'fig', 'box': box, 'page': members[0].page, 'label': ' '.join(s.text.strip() for s in sorted(inside, key=lambda s: (round(s.base), s.box.x0))).replace('\ufffd', '')})
    return out


def level_with_text(g, spans, fig):
    """Is this graphic part of a line of prose (words beside it at its height, outside the figure)?
    A letter or a number alone beside it is a label, not prose."""
    n = 0
    for s in spans:
        if s.used or fig.holds(s.box, 2.0):
            continue
        if abs(g.box.cy - (s.base - AXIS)) < 9.6:
            if s.box.x0 < LEFT + 1.5 and LETTER.match(s.text):
                return True                             # a choice's letter: the graphic is that choice
            n += len(s.text.strip())
    return n > 8


def underlines(gfx, spans, top, bottom):
    """A thin rule just under text is an underline; mark the text and drop the rule."""
    for g in gfx:
        if g.used or not is_rule(g) or g.box.h > 1.3 or not (top <= g.box.cy < bottom):
            continue
        hit = [s for s in spans if not s.used and 0.4 < g.box.cy - s.base < 3.2 and s.box.x0 < g.box.x1 - 1 and s.box.x1 > g.box.x0 + 1]
        if not hit:
            continue
        covered = sum(min(s.box.x1, g.box.x1) - max(s.box.x0, g.box.x0) for s in hit)
        if covered < 0.8 * g.box.w:
            continue
        g.used = True
        for s in hit:
            split_under(s, g.box.x0, g.box.x1, spans)


def split_under(s, x0, x1, spans):
    """Mark the part of a span between x0 and x1 as underlined, splitting the span if only part of it is."""
    inside = [(c, a, b) for c, a, b in s.chars if (a + b) / 2 >= x0 - 0.3 and (a + b) / 2 <= x1 + 0.3]
    if len(inside) == len(s.chars):
        s.under = True
        return
    before = [(c, a, b) for c, a, b in s.chars if (a + b) / 2 < x0 - 0.3]
    after = [(c, a, b) for c, a, b in s.chars if (a + b) / 2 > x1 + 0.3]
    parts = [(before, False), (inside, True), (after, False)]
    first = True
    for chars, under in parts:
        if not chars:
            continue
        box = Box(chars[0][1], s.box.y0, chars[-1][2], s.box.y1)
        if first:
            s.text, s.chars, s.box, s.under = ''.join(c[0] for c in chars), chars, box, under
            first = False
        else:
            n = Span(''.join(c[0] for c in chars), box, s.base, s.font, s.page, chars)
            n.under = under
            spans.append(n)


def centred(line):
    """A short line set in from both margins: a title over a table or a graph."""
    b = line.box
    return b.x0 - LEFT > 30 and RIGHT - b.x1 > 30


def clusters(gs):
    """Symbols that touch or nearly touch: a base with its exponent, a fraction with its bar. Returns [(members, box)]."""
    gs = sorted(gs, key=lambda g: g.box.x0)
    parent = list(range(len(gs)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for i, a in enumerate(gs):
        for j in range(i + 1, len(gs)):
            b = gs[j]
            if b.box.x0 - 1.5 > a.box.x1:
                break
            if a.box.near(b.box, 1.5, 0.9):
                parent[find(i)] = find(j)
    groups = {}
    for i, g in enumerate(gs):
        groups.setdefault(find(i), []).append(g)
    return [(m, union([g.box for g in m])) for m in groups.values()]


def layout(spans, gfx, top, bottom, merge=True):
    """Blocks for everything between two heights: paragraphs, display equations and figures, in reading order."""
    figs = figures(gfx, spans, top, bottom, merge)
    underlines(gfx, spans, top, bottom)
    text = sorted([s for s in spans if not s.used and top <= s.base < bottom], key=lambda s: s.base)
    lines = []
    for s in text:
        if lines and abs(lines[-1].base - s.base) < 3.0:
            lines[-1].spans.append(s)
        else:
            lines.append(Line(s.base))
            lines[-1].spans.append(s)
        s.used = True
    free = []
    todo = [g for g in gfx if not g.used and top <= g.box.cy < bottom]
    # drawn symbols go as attached clusters; placed pictures (the older formulas) each stand for themselves
    units = clusters([g for g in todo if g.kind == 'v']) + [([g], g.box) for g in todo if g.kind == 'i']
    for members, cbox in units:
        best, dist = None, 1e9
        for l in lines:
            d = abs(cbox.cy - (l.base - AXIS))
            if d < dist:
                best, dist = l, d
        # part of a line of text when it is level with it; otherwise it stands alone
        if best is not None and dist < 9.6:
            best.gfx.extend(members)
            for g in members:
                g.used = True
        else:
            free.extend(members)
    # graphics level with no text: display equations. Group into rows by height.
    free.sort(key=lambda g: g.box.cy)
    rows = []
    for g in free:
        g.used = True
        if rows and g.box.y0 < rows[-1]['box'].y1 + 2.5 and g.box.y1 > rows[-1]['box'].y0 - 2.5:
            rows[-1]['gfx'].append(g); rows[-1]['box'].add(g.box)
        else:
            rows.append({'kind': 'eq', 'gfx': [g], 'box': Box(g.box.x0, g.box.y0, g.box.x1, g.box.y1)})
    # a row can still be the tall part of a neighbouring text line (a big fraction): attach when they overlap in height
    eqs = []
    for r in rows:
        host = None
        for l in lines:
            if r['box'].y0 < l.base + DESC and r['box'].y1 > l.base - ASC:
                host = l
                break
        if host is not None:
            host.gfx.extend(r['gfx'])
        else:
            eqs.append(r)
    for l in lines:
        l.build()
    things = [(l.base - ASC, 'line', l) for l in lines] + [(e['box'].y0, 'eq', e) for e in eqs] + [(f['box'].y0, 'fig', f) for f in figs]
    things.sort(key=lambda t: t[0])
    blocks, para = [], None
    prev = None
    for _, kind, it in things:
        if kind != 'line':
            para = None
            prev = None
            if kind == 'eq':
                mid = abs(it['box'].cx - (LEFT + RIGHT) / 2) < 24 and it['box'].x0 > LEFT + 30
                blocks.append({'t': 'eq', 'centre': mid, 'gfx': it['gfx'], 'box': it['box']})
            else:
                blocks.append({'t': 'fig', 'box': it['box'], 'page': it['page'], 'label': it['label']})
            continue
        new = para is None
        if not new:
            box, pbox = it.box, prev.box
            extra = max(0.0, pbox.y1 - (prev.base + DESC)) + max(0.0, (it.base - ASC) - box.y0)
            early = pbox.x1 + it.first_width() + 2.4 < RIGHT - 3
            across = int(it.base // VSTEP) != int(prev.base // VSTEP)
            if across:
                new = early and pbox.x1 < RIGHT - 60      # a new page: only a clearly short last line ends the paragraph
            elif it.base - prev.base > 21.5 + extra:
                new = True                              # a blank line
            elif early and pbox.x1 < RIGHT - 150 and it.tokens and it.tokens[0][0] == 't':
                new = True                              # the line above stopped well short: a line break
            elif box.x0 > LEFT + 8 and pbox.x0 < LEFT + 3:
                new = True
            if centred(it) and centred(prev) and abs(box.cx - pbox.cx) < 8 and not across and it.base - prev.base < 21.5 + extra:
                new = False                             # the lines of a centred title
        if new:
            para = {'t': 'p', 'lines': [it], 'indent': it.box.x0 - LEFT, 'centre': centred(it)}
            blocks.append(para)
        else:
            para['lines'].append(it)
        prev = it
    return blocks


def read_question(doc, first, last):
    """One question, from its first page up to (not including) page `last`."""
    spans, gfx = [], []
    for k, pno in enumerate(range(first, last)):
        s, g = page_atoms(doc[pno], k)
        spans += s
        gfx += g
    heads, answer = split_sections(spans)
    out = {'answer': answer, 'problems': []}
    if 'Question' not in heads or 'Rationale' not in heads:
        out['problems'].append('headings missing: ' + ','.join(sorted(heads)))
        return out
    yq, yr = heads['Question'].base, heads['Rationale'].base
    yc = heads['Correct'].base if 'Correct' in heads else yr      # some older typed-answer questions print no answer line
    ya = heads['Answer'].base if 'Answer' in heads else None
    for h in heads.values():
        h.used = True
    if 'Correct' in heads:
        for s in spans:                                 # the rest of the answer line
            if abs(s.base - yc) < 3:
                s.used = True
    # the meta table and everything above the Question heading is page furniture
    for s in spans:
        if s.base < yq - 1:
            s.used = True
    for g in gfx:
        if g.box.cy < yq - 4:
            g.used = True
    bottom = max([s.box.y1 for s in spans] + [g.box.y1 for g in gfx]) + 5
    out['q'] = layout(spans, gfx, yq + 3, (ya if ya is not None else yc) - 6)
    out['ch'] = None
    if ya is not None:
        blocks = layout(spans, gfx, ya + 3, yc - 6, merge=False)     # each choice's graph is its own
        out['ch'] = split_choices(blocks, out['problems'])
    out['r'] = layout(spans, gfx, yr + 3, bottom)
    left = [s for s in spans if not s.used] + [g for g in gfx if not g.used]
    if left:
        out['problems'].append('%d items not placed' % len(left))
    out['pages'] = [first, last]
    return out


def block_span(b):
    """Top and bottom of a block."""
    if b['t'] == 'p':
        return b['lines'][0].base - ASC, b['lines'][-1].base + DESC
    return b['box'].y0, b['box'].y1


def split_choices(blocks, problems):
    """The four choices. Each has its letter at the left margin; a table or graph may start above its letter."""
    letters = []          # [y of the letter's line, letter, blocks]
    rest = []
    for b in blocks:
        if b['t'] != 'p':
            rest.append(b)
            continue
        cur = None
        for l in b['lines']:
            tok = l.tokens
            m = LETTER.match(tok[0][1]) if tok and tok[0][0] == 't' and l.box.x0 < LEFT + 3 else None
            if m:
                tok[0][1] = tok[0][1][m.end():]
                if not tok[0][1].strip():
                    tok.pop(0)
                cur = {'t': 'p', 'lines': [l] if tok else [], 'indent': 0}
                letters.append([l.base, m.group(1), [cur]])
            elif cur is not None and cur['lines'] and l.box.x0 < LEFT + 30 and tok and tok[0][0] == 't':
                cur['lines'].append(l)
            else:
                cur = None
                rest.append({'t': 'p', 'lines': [l], 'indent': l.box.x0 - LEFT})
    for b in rest:
        y0, y1 = block_span(b)
        owner = None
        for L in letters:
            if y0 - 8 <= L[0] <= y1 + 8:
                owner = L
                break
        if owner is None:
            before = [L for L in letters if L[0] < y0]
            owner = before[-1] if before else None
        if owner is None:
            problems.append('part of a choice stands before any letter')
        else:
            owner[2].append(b)
    ch = {}
    for y, letter, bl in letters:
        bl = [b for b in bl if b['t'] != 'p' or b['lines']]
        bl.sort(key=lambda b: block_span(b)[0])
        if letter in ch:
            problems.append('letter %s twice' % letter)
        ch[letter] = bl
    if sorted(ch) != ['A', 'B', 'C', 'D']:
        problems.append('choices found: ' + ''.join(sorted(ch)))
    return ch


def audit(blocks, short_ok=False):
    """Signs that a layout went wrong even though everything was placed: reasons to keep the picture instead.
    short_ok: a one- or two-letter paragraph is fine here (a choice can be the word "is")."""
    out = []
    for b in blocks:
        if b['t'] != 'p':
            continue
        words = ''.join(t[1] for l in b['lines'] for t in l.tokens if t[0] == 't').strip()
        has_g = any(t[0] == 'g' for l in b['lines'] for t in l.tokens)
        if not short_ok and not has_g and 0 < len(words) <= 2 and not words.isdigit():
            out.append('stray text %r' % words)
        if '\ufffd' in words:
            out.append('a character the export does not name')
        for l in b['lines']:
            for t in l.tokens:
                if t[0] != 'g':
                    continue
                box = t[2]
                if box.y1 < l.base - ASC + 0.5 or box.y0 > l.base + DESC - 0.3:
                    out.append('symbols off the line')
                if box.h > 46:
                    out.append('very tall expression in a sentence')
    return out
