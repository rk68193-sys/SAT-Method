import os, sys, json
import numpy as np
from PIL import Image
from multiprocessing import Pool
W = 380           # target width in image pixels (shown at 1/1.12 → about 340 CSS px)
SP = 7            # space between word pieces
def runs(mask, mingap):
    """runs of True separated by gaps >= mingap; returns list of (a, b) half-open"""
    out = []; i = 0; n = len(mask)
    idx = np.flatnonzero(mask)
    if not len(idx): return out
    a = idx[0]; prev = idx[0]
    for k in idx[1:]:
        if k - prev > mingap: out.append((a, prev + 1)); a = k
        prev = k
    out.append((a, prev + 1)); return out
def reflow(im):
    a = np.asarray(im)
    ink = a < 190
    bands = runs(ink.any(axis=1), 2)
    if not bands: return None
    hs = sorted(b - t for t, b in bands); med = hs[len(hs) // 2]
    paras = []; cur = []; prev_b = None
    for t, b in bands:
        if prev_b is not None and t - prev_b > 12: paras.append(cur); cur = []
        h = b - t
        row = ink[t:b]
        cols = row.any(axis=0)
        x0, x1 = np.flatnonzero(cols)[[0, -1]]
        if h > 2.6 * med or (x1 - x0) > 0 and h > 1.9 * med and not False:
            pieces = [(x0, x1 + 1)] if h > 2.6 * med else runs(cols, 4)
        else:
            pieces = runs(cols, 4)
        cur.append([(t, b, p0, p1) for p0, p1 in pieces])
        prev_b = b
    paras.append(cur)
    # pack
    lines = []   # each: list of (img, w, h)
    for para in paras:
        line = []; lw = 0
        for band in para:
            for (t, b, p0, p1) in band:
                piece = im.crop((p0, t, p1, b)); w, h = piece.size
                if w > W:
                    piece = piece.resize((W, max(1, round(h * W / w))), Image.LANCZOS); w, h = piece.size
                need = w if not line else lw + SP + w
                if line and need > W:
                    lines.append(line); line = []; lw = 0; need = w
                line.append(piece); lw = need
        if line: lines.append(line)
        lines.append('gap')
    if lines and lines[-1] == 'gap': lines.pop()
    LG, PG = 8, 20
    H = 0
    for ln in lines: H += PG if ln == 'gap' else max(p.size[1] for p in ln) + LG
    out = Image.new('L', (W, H), 255); y = 0
    for ln in lines:
        if ln == 'gap': y += PG; continue
        lh = max(p.size[1] for p in ln); x = 0
        for p in ln:
            out.paste(p, (x, y + (lh - p.size[1]) // 2)); x += p.size[0] + SP
        y += lh + LG
    # trim
    arr = np.asarray(out) < 190; ys = np.flatnonzero(arr.any(axis=1)); xs = np.flatnonzero(arr.any(axis=0))
    return out.crop((0, max(0, ys[0] - 4), min(W, xs[-1] + 6), min(H, ys[-1] + 5)))
def job(args):
    kind, qid = args
    src = f'mimg/{kind}/{qid}.webp'; im = Image.open(src).convert('L')
    if im.width <= W + 10:
        return qid, kind, [im.width, im.height], False
    r = reflow(im)
    os.makedirs(f'mimg/{kind}n', exist_ok=True)
    r.save(f'mimg/{kind}n/{qid}.webp', lossless=True, method=4)
    return qid, kind, list(r.size), True
if __name__ == '__main__':
    ids = sys.argv[1:] or [f[:-5] for f in os.listdir('mimg/q')]
    jobs = [(k, i) for i in ids for k in ('q', 'r')]
    with Pool(4) as p: res = p.map(job, jobs, chunksize=16)
    out = {}
    for qid, kind, size, made in res: out.setdefault(qid, {})[kind + 'n'] = size if made else None
    json.dump(out, open('mimg_narrow.json' if len(sys.argv) < 2 else 'mimg_narrow_test.json', 'w'))
    print(len(out), sum(1 for v in out.values() if v.get('qn')), 'narrow q images')
