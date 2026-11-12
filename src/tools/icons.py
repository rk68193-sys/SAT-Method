"""Draws the app icons: the site's mark, a white check on a near-black rounded square.

    python3 -I src/tools/icons.py icons

Writes icon.svg, icon-192.png, icon-512.png, icon-maskable-512.png (full-bleed, the mark inside the safe zone) and
apple-touch-icon.png (180, full-bleed: iOS rounds the corners itself). Needs Pillow.
"""
import os
import sys

from PIL import Image, ImageDraw

INK, PAPER = (10, 10, 10, 255), (255, 255, 255, 255)
# the check from the header mark, in its 24-unit box
CHECK = [(6.5, 12.5), (10.3, 16.3), (17.5, 8.0)]
STROKE = 2.6


def draw(size, bleed, scale):
    """bleed: fill the whole square (the device masks it). scale: the mark's share of the square."""
    k = 4                                    # draw large, then shrink, for smooth edges
    n = size * k
    img = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if bleed:
        d.rectangle([0, 0, n, n], fill=INK)
    else:
        d.rounded_rectangle([0, 0, n - 1, n - 1], radius=round(n * 0.22), fill=INK)
    unit = n * scale / 24.0
    off = (n - 24 * unit) / 2.0
    pts = [(off + x * unit, off + y * unit) for x, y in CHECK]
    w = max(1, round(STROKE * unit))
    d.line(pts, fill=PAPER, width=w, joint='curve')
    for x, y in pts:                         # round caps and a round join
        d.ellipse([x - w / 2.0, y - w / 2.0, x + w / 2.0, y + w / 2.0], fill=PAPER)
    return img.resize((size, size), Image.LANCZOS)


SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5.3" fill="#0A0A0A"/><path d="M6.5 12.5l3.8 3.8 7.2-8.3" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(3 3) scale(.75)"/></svg>
'''


def main(out):
    os.makedirs(out, exist_ok=True)
    draw(192, False, 0.75).save(os.path.join(out, 'icon-192.png'), optimize=True)
    draw(512, False, 0.75).save(os.path.join(out, 'icon-512.png'), optimize=True)
    draw(512, True, 0.56).save(os.path.join(out, 'icon-maskable-512.png'), optimize=True)
    draw(180, True, 0.68).convert('RGB').save(os.path.join(out, 'apple-touch-icon.png'), optimize=True)
    with open(os.path.join(out, 'icon.svg'), 'w', encoding='utf-8') as f:
        f.write(SVG)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'icons')
