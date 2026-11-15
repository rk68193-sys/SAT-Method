"""python3 -I src/check/head.py index.html
The page's <head>: the description, the canonical address, and the link-preview tags (Open Graph), whose picture must be in
the repository at the size link previews use (1200 x 630). Exits 1 on any problem."""
import os, re, struct, sys

page = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
root = os.path.dirname(os.path.abspath(page))
head = open(page, encoding='utf-8').read(300000).split('</head>')[0]
bad = []

def tag(attr, name):
    m = re.search(r'<meta\s+' + attr + r'="' + re.escape(name) + r'"\s+content="([^"]*)"', head)
    return m.group(1) if m else None

SITE = 'https://satsprint.org/'
if not tag('name', 'description'):
    bad.append('no description')
if not re.search(r'<link rel="canonical" href="' + re.escape(SITE) + '">', head):
    bad.append('no canonical link to ' + SITE)
for p in ['og:type', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt']:
    if not tag('property', p):
        bad.append('no ' + p)
if tag('name', 'twitter:card') != 'summary_large_image':
    bad.append('twitter:card is not summary_large_image')
img = tag('property', 'og:image') or ''
if not img.startswith(SITE):
    bad.append('og:image is not a full address on ' + SITE + ': ' + img)
else:
    f = os.path.join(root, img[len(SITE):])
    if not os.path.isfile(f):
        bad.append('the preview picture is missing: ' + f)
    else:
        with open(f, 'rb') as fh:
            sig = fh.read(24)
        if sig[:8] != b'\x89PNG\r\n\x1a\n':
            bad.append('the preview picture is not a PNG')
        else:
            w, h = struct.unpack('>II', sig[16:24])
            if (w, h) != (1200, 630) or tag('property', 'og:image:width') != str(w) or tag('property', 'og:image:height') != str(h):
                bad.append('the preview picture is %dx%d; it and its tags should say 1200x630' % (w, h))
        if os.path.getsize(f) > 1000000:
            bad.append('the preview picture is over 1 MB')
for p in ['og:title', 'og:description']:
    v = tag('property', p) or ''
    if len(v) > (90 if p == 'og:title' else 300):
        bad.append(p + ' is long enough to be cut off: ' + str(len(v)) + ' characters')

if bad:
    print('FAIL\n' + '\n'.join(bad))
    sys.exit(1)
print('head ok: description, canonical, Open Graph and a 1200x630 picture')
