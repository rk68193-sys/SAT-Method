"""Turn the blocks from qbx.py into HTML.

Text becomes text. A group of drawn symbols becomes one inline SVG, sized in em and set on the baseline exactly where it
was printed, so it scales with the page's font and follows its color. Each distinct symbol outline is kept once, in a
shared library, and placed with <use>. A placed picture (the older questions' formulas) becomes an inline image. A figure
or table is cropped from the page as a picture."""
import base64, hashlib, html, io, re
import pymupdf
from PIL import Image
from qbx import EM, VSTEP, Box, is_rule


def num(v, places=2):
    s = '%.*f' % (places, v)
    if '.' in s:
        s = s.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def points(d):
    pts = []
    for it in d['items']:
        if it[0] == 're':
            r = it[1]; pts += [(r.x0, r.y0), (r.x1, r.y1)]
        elif it[0] == 'qu':
            q = it[1]; pts += [(q.ul.x, q.ul.y), (q.ur.x, q.ur.y), (q.ll.x, q.ll.y), (q.lr.x, q.lr.y)]
        else:
            pts += [(p.x, p.y) for p in it[1:]]
    return pts


def path_d(d, ox, oy, k=1.0, places=2):
    """SVG path data for one PyMuPDF drawing: origin moved to (ox, oy), then scaled by k."""
    out, cur = [], None

    def f(v):
        return num(v, places)
    for it in d['items']:
        t = it[0]
        if t == 're':
            r = it[1]
            out.append('M%s %sh%sv%sh%sz' % (f((r.x0 - ox) * k), f((r.y0 - oy) * k), f(r.width * k), f(r.height * k), f(-r.width * k)))
            cur = None
        elif t == 'qu':
            q = it[1]
            out.append('M%s %sL%s %sL%s %sL%s %sz' % (f((q.ul.x - ox) * k), f((q.ul.y - oy) * k), f((q.ur.x - ox) * k), f((q.ur.y - oy) * k),
                                                         f((q.lr.x - ox) * k), f((q.lr.y - oy) * k), f((q.ll.x - ox) * k), f((q.ll.y - oy) * k)))
            cur = None
        else:
            p0 = it[1]
            if cur is None or abs(cur.x - p0.x) > 0.005 or abs(cur.y - p0.y) > 0.005:
                out.append('M%s %s' % (f((p0.x - ox) * k), f((p0.y - oy) * k)))
            if t == 'l':
                out.append('L%s %s' % (f((it[2].x - ox) * k), f((it[2].y - oy) * k)))
                cur = it[2]
            elif t == 'c':
                out.append('C%s %s %s %s %s %s' % (f((it[2].x - ox) * k), f((it[2].y - oy) * k), f((it[3].x - ox) * k), f((it[3].y - oy) * k), f((it[4].x - ox) * k), f((it[4].y - oy) * k)))
                cur = it[4]
    return ''.join(out)


UNIT = 100.0      # every symbol outline is stored in a box this big, in whole numbers


class Library:
    """Every distinct symbol outline in the bank, stored once at one size."""

    def __init__(self):
        self.index = {}
        self.paths = []
        self.uses = 0

    def add(self, d):
        """Returns (id, x, y, scale) to place this drawing: the outline's own top-left corner on the page and its size."""
        pts = points(d)
        x0 = min(p[0] for p in pts); y0 = min(p[1] for p in pts)
        size = max(max(p[0] for p in pts) - x0, max(p[1] for p in pts) - y0, 0.01)
        k = UNIT / size
        pd = path_d(d, x0, y0, k, 0)
        key = (pd, bool(d.get('even_odd')))
        if key not in self.index:
            # named by its own shape, so separate runs (and separate worker processes) agree on the name
            self.index[key] = hashlib.sha1((pd + ('e' if key[1] else '')).encode()).hexdigest()[:10]
            self.paths.append(key)
        self.uses += 1
        return self.index[key], x0, y0, size / UNIT

    def defs(self):
        return ''.join('<path id="G%s" d="%s"%s/>' % (self.index[k], k[0], ' fill-rule="evenodd"' if k[1] else '') for k in self.paths)


class Ctx:
    def __init__(self, doc, first_page, lib):
        self.doc, self.first, self.lib = doc, first_page, lib
        self.counts = {'svg': 0, 'img': 0, 'fig': 0, 'glyphs': 0}


def group_svg(ctx, gfx, box, base):
    """Inline SVG for a group of vector paths. base is the text baseline, or None for a display equation."""
    pad = 0.4
    x0, y0, w, h = box.x0 - pad, box.y0 - pad, box.w + 2 * pad, box.h + 2 * pad
    parts = []
    for g in sorted(gfx, key=lambda g: g.box.x0):
        d = g.data
        oy = g.page * VSTEP
        if d['type'] == 's':
            pd = path_d(d, x0, y0 - oy)
            if pd:
                parts.append('<path d="%s" fill="none" stroke="currentColor" stroke-width="%s"/>' % (pd, num(d.get('width') or 0.5)))
        elif is_rule(g) or all(it[0] == 're' for it in d['items']):
            pd = path_d(d, x0, y0 - oy)
            if pd:
                parts.append('<path d="%s"/>' % pd)
        else:
            gid, gx, gy, k = ctx.lib.add(d)
            parts.append('<use href="#G%s" transform="translate(%s %s) scale(%s)"/>' % (gid, num(gx - x0), num(gy + oy - y0), num(k, 4)))
            ctx.counts['glyphs'] += 1
    ctx.counts['svg'] += 1
    style = 'width:%sem;height:%sem' % (num(w / EM), num(h / EM))
    if base is not None:
        style += ';vertical-align:%sem' % num(-(box.y1 + pad - base) / EM)
    return '<svg class="mx" viewBox="0 0 %s %s" style="%s" role="img" aria-label="expression">%s</svg>' % (num(w), num(h), style, ''.join(parts))


def image_html(ctx, g, base):
    """A placed picture from the page (an older question's formula), as an inline image at its printed size."""
    doc = ctx.doc
    info = g.data
    try:
        pix = pymupdf.Pixmap(doc, info['xref'])
        sm = doc.extract_image(info['xref']).get('smask')
        if sm:
            pix = pymupdf.Pixmap(pix, pymupdf.Pixmap(doc, sm))
        if pix.colorspace is not None and pix.colorspace.n > 3:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        data = pix.tobytes('png')
    except Exception:
        page = doc[ctx.first + g.page]
        oy = g.page * VSTEP
        data = page.get_pixmap(clip=pymupdf.Rect(g.box.x0, g.box.y0 - oy, g.box.x1, g.box.y1 - oy), dpi=220).tobytes('png')
    ctx.counts['img'] += 1
    style = 'width:%sem;height:%sem' % (num(g.box.w / EM), num(g.box.h / EM))
    if base is not None:
        style += ';vertical-align:%sem' % num(-(g.box.y1 - base) / EM)
    return '<img class="mx mxi" alt="expression" style="%s" src="data:image/png;base64,%s">' % (style, base64.b64encode(data).decode())


def figure_bytes(ctx, block, quality=82, scale=2.6):
    """A figure or table cropped from the page: (webp bytes, pixel width, pixel height, width in em)."""
    box = block['box']
    page = ctx.doc[ctx.first + block['page']]
    oy = block['page'] * VSTEP
    pad = 3
    clip = pymupdf.Rect(max(0, box.x0 - pad), box.y0 - oy - pad, min(612, box.x1 + pad), box.y1 - oy + pad)
    pm = page.get_pixmap(clip=clip, matrix=pymupdf.Matrix(scale, scale), alpha=False)
    im = Image.frombytes('RGB', (pm.width, pm.height), pm.samples)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=quality, method=6)
    ctx.counts['fig'] += 1
    return buf.getvalue(), pm.width, pm.height, clip.width / EM


def figure_html(ctx, block, src=None):
    data, w, h, em = figure_bytes(ctx, block)
    alt = block.get('label') or ''
    alt = ('Figure. Text in it: ' + alt) if alt else 'Figure'
    if src is None:
        src = 'data:image/webp;base64,' + base64.b64encode(data).decode()
    else:
        src = src(data)
    return '<img class="mfig" alt="%s" width="%d" height="%d" style="width:%sem" src="%s">' % (html.escape(alt[:400], quote=True), w, h, num(em), src)


SPACES = re.compile(r'[ \t ]+')


def text_html(t):
    return html.escape(SPACES.sub(' ', t), quote=False)


def line_pieces(ctx, line):
    """[('t', html) | ('m', html)] for one line."""
    out = []
    for tok in line.tokens:
        if tok[0] == 't':
            s = text_html(tok[1])
            out.append(('t', s, tok[2]))
        else:
            vec = [g for g in tok[1] if g.kind == 'v']
            pics = [g for g in tok[1] if g.kind == 'i']
            if vec and not pics:
                out.append(('m', group_svg(ctx, vec, tok[2], line.base)))
            else:
                pieces = [(g.box.x0, image_html(ctx, g, line.base)) for g in pics]
                if vec:
                    vb = Box(min(g.box.x0 for g in vec), min(g.box.y0 for g in vec), max(g.box.x1 for g in vec), max(g.box.y1 for g in vec))
                    pieces.append((vb.x0, group_svg(ctx, vec, vb, line.base)))
                out.append(('m', ''.join(p[1] for p in sorted(pieces, key=lambda p: p[0]))))
    return out


LEAD = re.compile(r'^[^ ]+')
TAIL = re.compile(r'[^ ]+$')


def para_html(ctx, block):
    pieces = []
    for l in block['lines']:
        lp = line_pieces(ctx, l)
        if pieces and lp:
            a, b = pieces[-1], lp[0]
            a_sp = a[0] == 't' and a[1].endswith(' ')
            b_sp = b[0] == 't' and b[1].startswith(' ')
            if not a_sp and not b_sp and not (a[0] == 't' and a[1].endswith('-')):
                pieces.append(('t', ' ', False))
        pieces += lp
    # merge neighbouring text of the same kind
    merged = []
    for p in pieces:
        if p[0] == 't' and merged and merged[-1][0] == 't' and merged[-1][2] == p[2]:
            merged[-1] = ('t', merged[-1][1] + p[1], p[2])
        else:
            merged.append(p)
    # punctuation, a bracket or a hyphenated word that touches an expression stays with it when the line wraps
    out = []
    i, n = 0, len(merged)
    while i < n:
        p = merged[i]
        if p[0] != 'm':
            out.append(p)
            i += 1
            continue
        pre = ''
        if out and out[-1][0] == 't' and not out[-1][2]:
            m = TAIL.search(out[-1][1])
            if m:
                pre = m.group(0)
                out[-1] = ('t', out[-1][1][:m.start()], False)
        body = p[1]
        i += 1
        while i < n and merged[i][0] == 't' and not merged[i][2] and merged[i][1] and not merged[i][1].startswith(' '):
            lead = LEAD.search(merged[i][1]).group(0)
            body += lead
            rest = merged[i][1][len(lead):]
            if rest:
                merged[i] = ('t', rest, False)
                break
            i += 1
            if i < n and merged[i][0] == 'm':
                body += merged[i][1]
                i += 1
            else:
                break
        out.append(('m', '<span class="nw">' + pre + body + '</span>' if (pre or body != p[1]) else body))
    s = ''.join(('<span class="uline">' + p[1] + '</span>') if (p[0] == 't' and p[2]) else p[1] for p in out)
    return re.sub(r' {2,}', ' ', s).strip()


def blocks_html(ctx, blocks, fig_src=None):
    out = []
    for b in blocks:
        if b['t'] == 'p':
            s = para_html(ctx, b)
            if s:
                out.append(('<p class="cap">' if b.get('centre') else '<p>') + s + '</p>')
        elif b['t'] == 'eq':
            vec = [g for g in b['gfx'] if g.kind == 'v']
            pics = sorted([g for g in b['gfx'] if g.kind == 'i'], key=lambda g: g.box.x0)
            inner = ''
            if vec:
                vb = b['box'] if not pics else Box(min(g.box.x0 for g in vec), min(g.box.y0 for g in vec), max(g.box.x1 for g in vec), max(g.box.y1 for g in vec))
                inner += group_svg(ctx, vec, vb, None)
            inner += ''.join(image_html(ctx, g, None) for g in pics)
            out.append('<p class="meq%s">%s</p>' % (' c' if b['centre'] else '', inner))
        else:
            out.append('<p class="mfigp">' + figure_html(ctx, b, fig_src) + '</p>')
    return ''.join(out)


def plain_text(blocks):
    """The words only, for searching and for checks. ▯ stands for an expression."""
    out = []
    for b in blocks:
        if b['t'] == 'p':
            out.append(' '.join(''.join(t[1] if t[0] == 't' else '▯' for t in l.tokens).strip() for l in b['lines']))
        elif b['t'] == 'eq':
            out.append('▯')
        else:
            out.append('[figure]')
    return SPACES.sub(' ', ' ¶ '.join(out)).strip()
