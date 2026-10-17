"""Theme tokens for the site. Writes the token block at the top of site/app.css.
Light is the default; with no saved choice the site follows the device (light or dark)."""
import re, sys
COMMON_LIGHT = dict(
  ok='#15803D', ok_soft='#DCFCE7', bad='#BE123C', bad_soft='#FFE4E9', warn='#B45309', warn_text='#92400E',
  rw='#BE185D', rw_soft='#FDF2F8', rw_line='#FBCFE8', math='#1D4ED8', math_soft='#EFF6FF', math_line='#BFDBFE',
  des='#166534', des_soft='#E8F5EC', img_filter='none', img_blend='multiply', backdrop='rgba(10, 10, 20, .5)', scheme='light')
COMMON_DARK = dict(
  ok='#4ADE80', ok_soft='#12301F', bad='#FB7185', bad_soft='#3B1424', warn='#FBBF24', warn_text='#FCD34D',
  rw='#F472B6', rw_soft='#2A1421', rw_line='#5B2342', math='#60A5FA', math_soft='#111D33', math_line='#1E3A66',
  des='#86EFAC', des_soft='#13291B', img_filter='invert(1) hue-rotate(180deg) brightness(.9)', img_blend='screen', backdrop='rgba(0, 0, 0, .65)', scheme='dark')
def soft_shadow(rgb, a1, a2): return f'0 1px 2px rgba({rgb}, {a1}), 0 4px 16px -6px rgba({rgb}, {a2})'
THEMES = {
 'light': dict(COMMON_LIGHT, paper='#FFFFFF', card='#FFFFFF', sunk='#F4F4F6', ink='#0A0A0A', ink2='#3F3F46', muted='#62626B', line='#E6E6EA', line_strong='#CFCFD6',
   pencil='#6D28D9', pencil_text='#5B21B6', hl='#F1ECFF', hl_ink='#2E1065', act='#0A0A0A', act_ink='#FFFFFF', act_hover='#2A2A30', focus='#6D28D9',
   d1='#E4E4E7', d2='#A1A1AA', d3='#27272A', grad='linear-gradient(135deg, #0A0A0A, #2A2A30)', on_grad='#FFFFFF', aura='transparent',
   shadow=soft_shadow('15, 15, 25', '.04', '.10'), shadow_lg=soft_shadow('15, 15, 25', '.05', '.16'), btn_shadow='none', glass='rgba(255, 255, 255, .9)'),
 'dark': dict(COMMON_DARK, paper='#0B0B10', card='#16161D', sunk='#1F1F28', ink='#F4F4F5', ink2='#D4D4D8', muted='#A1A1AA', line='#2A2A33', line_strong='#42424D',
   pencil='#A78BFA', pencil_text='#C4B5FD', hl='#2E2257', hl_ink='#F5F3FF', act='#F4F4F5', act_ink='#0B0B10', act_hover='#D4D4D8', focus='#C4B5FD',
   d1='#3A3A44', d2='#7A7A86', d3='#E4E4E7', grad='linear-gradient(135deg, #F4F4F5, #D4D4D8)', on_grad='#0B0B10', aura='transparent',
   shadow='0 1px 2px rgba(0, 0, 0, .4)', shadow_lg='0 2px 4px rgba(0, 0, 0, .4), 0 14px 36px -14px rgba(0, 0, 0, .7)', btn_shadow='none', glass='rgba(11, 11, 16, .88)'),
 'purple': dict(COMMON_LIGHT, paper='#F7F2FF', card='#FFFFFF', sunk='#F0E8FF', ink='#23193D', ink2='#3E335F', muted='#675D86', line='#E6DBFA', line_strong='#C9B6F2',
   pencil='#8B5CF6', pencil_text='#6D28D9', hl='#EBDDFF', hl_ink='#2E1065', act='#6D28D9', act_ink='#FFFFFF', act_hover='#5B21B6', focus='#7C3AED',
   d1='#DCCDFC', d2='#A07CF5', d3='#4C1D95', grad='linear-gradient(135deg, #6D28D9 0%, #7E22CE 55%, #A21CAF 100%)', on_grad='#FFFFFF', aura='rgba(167, 139, 250, .42)',
   shadow=soft_shadow('76, 29, 149', '.06', '.18'), shadow_lg=soft_shadow('109, 40, 217', '.06', '.30'), btn_shadow='0 6px 18px -8px rgba(109, 40, 217, .55)', glass='rgba(250, 246, 255, .85)'),
 'blue': dict(COMMON_LIGHT, paper='#F2F7FF', card='#FFFFFF', sunk='#E8F0FD', ink='#0F1B33', ink2='#2C3B57', muted='#55637E', line='#DCE6F7', line_strong='#B5C8EC',
   pencil='#2563EB', pencil_text='#1D4ED8', hl='#DBE8FF', hl_ink='#0B2A6B', act='#1D4ED8', act_ink='#FFFFFF', act_hover='#1E40AF', focus='#2563EB',
   d1='#CFE0FB', d2='#6E9BEA', d3='#1E3A8A', grad='linear-gradient(135deg, #1E40AF 0%, #1D4ED8 50%, #0369A1 100%)', on_grad='#FFFFFF', aura='rgba(96, 165, 250, .32)',
   shadow=soft_shadow('30, 64, 175', '.06', '.16'), shadow_lg=soft_shadow('29, 78, 216', '.06', '.26'), btn_shadow='0 6px 18px -8px rgba(29, 78, 216, .5)', glass='rgba(242, 247, 255, .88)'),
 'pink': dict(COMMON_LIGHT, paper='#FFF4F8', card='#FFFFFF', sunk='#FDE8F0', ink='#33101F', ink2='#5A2A3E', muted='#7D5566', line='#F6DCE6', line_strong='#EDB6CB',
   pencil='#DB2777', pencil_text='#BE185D', hl='#FCE0EC', hl_ink='#63102F', act='#BE185D', act_ink='#FFFFFF', act_hover='#9D174D', focus='#DB2777',
   d1='#FAD1E1', d2='#E879A8', d3='#831843', grad='linear-gradient(135deg, #9D174D 0%, #BE185D 50%, #BE123C 100%)', on_grad='#FFFFFF', aura='rgba(244, 114, 182, .26)',
   shadow=soft_shadow('157, 23, 77', '.06', '.16'), shadow_lg=soft_shadow('190, 24, 93', '.06', '.24'), btn_shadow='0 6px 18px -8px rgba(190, 24, 93, .5)', glass='rgba(255, 244, 248, .88)'),
 'green': dict(COMMON_LIGHT, paper='#F1FAF4', card='#FFFFFF', sunk='#E4F4EA', ink='#0E2618', ink2='#2B4636', muted='#516A5B', line='#D5EBDD', line_strong='#A9D5B8',
   pencil='#16A34A', pencil_text='#166534', hl='#D7F2E1', hl_ink='#0B3B1E', act='#15803D', act_ink='#FFFFFF', act_hover='#166534', focus='#15803D',
   d1='#CBEBD6', d2='#5FBF83', d3='#14532D', grad='linear-gradient(135deg, #166534 0%, #15803D 50%, #0F766E 100%)', on_grad='#FFFFFF', aura='rgba(74, 222, 128, .24)',
   shadow=soft_shadow('21, 128, 61', '.06', '.14'), shadow_lg=soft_shadow('21, 128, 61', '.06', '.22'), btn_shadow='0 6px 18px -8px rgba(21, 128, 61, .45)', glass='rgba(241, 250, 244, .88)'),
}
ORDER = ['paper','card','sunk','ink','ink2','muted','line','line_strong','pencil','pencil_text','hl','hl_ink','act','act_ink','act_hover','focus',
  'ok','ok_soft','bad','bad_soft','warn','warn_text','d1','d2','d3','grad','on_grad','aura','shadow','shadow_lg','btn_shadow','glass',
  'rw','rw_soft','rw_line','math','math_soft','math_line','des','des_soft','img_filter','img_blend','backdrop']
NAME = {'ink2': 'ink-2'}
def block(t, indent='  '):
    d = THEMES[t]
    lines = [f"{indent}--{NAME.get(k, k.replace('_', '-'))}: {d[k]};" for k in ORDER]
    lines.append(f"{indent}color-scheme: {d['scheme']};")
    return '\n'.join(lines)
FONTS = '''  --display: "DM Sans", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --body: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --quote: "Literata", Georgia, "Times New Roman", serif;
  --mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --top-h: 4rem;'''
def css():
    out = ['/* ---------- themes: Light is the default; with no saved choice the site follows the device. ---------- */',
           ':root {\n' + block('light') + '\n' + FONTS + '\n}',
           '@media (prefers-color-scheme: dark) {\n  :root:not([data-theme]) {\n' + block('dark', '    ') + '\n  }\n}']
    for t in ['light', 'dark', 'purple', 'blue', 'pink', 'green']:
        out.append(f':root[data-theme="{t}"] {{\n' + block(t) + '\n}')
    return '\n'.join(out) + '\n'
import re
def lum(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4 for x in c]
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]
def ratio(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + .05) / (lb + .05)
# text color, background color: every pair the page uses for words
PAIRS = [('ink', 'paper'), ('ink2', 'paper'), ('muted', 'paper'), ('muted', 'card'), ('muted', 'sunk'), ('ink2', 'sunk'), ('ink', 'sunk'),
  ('act_ink', 'act'), ('act_ink', 'act_hover'), ('pencil_text', 'paper'), ('pencil_text', 'hl'), ('hl_ink', 'hl'), ('ok', 'paper'), ('ok', 'ok_soft'),
  ('bad', 'paper'), ('bad', 'bad_soft'), ('warn_text', 'paper'), ('des', 'des_soft'), ('des', 'card'),
  ('rw', 'paper'), ('rw', 'card'), ('rw', 'rw_soft'), ('ink2', 'rw_soft'), ('math', 'paper'), ('math', 'card'), ('math', 'math_soft'), ('ink2', 'math_soft')]
def check():
    bad = []
    for t, d in THEMES.items():
        for a, b in PAIRS:
            r = ratio(d[a], d[b])
            if r < 4.5:
                bad.append(f'{t}: {a} on {b} = {r:.2f}')
        for stop in re.findall(r'#[0-9A-Fa-f]{6}', d['grad']):
            r = ratio(d['on_grad'], stop)
            if r < 4.5:
                bad.append(f'{t}: on_grad on gradient {stop} = {r:.2f}')
    return bad
if __name__ == '__main__':
    low = check()
    if low:
        sys.exit('contrast below 4.5:1\n' + '\n'.join(low))
    p = sys.argv[1]
    s = open(p, encoding='utf-8').read()
    mark = '/* ---------- themes:'
    start = s.index(mark) if mark in s else s.index(':root {'); end = s.index('*, *::before, *::after')
    s = s[:start] + css() + '\n' + s[end:]
    open(p, 'w', encoding='utf-8').write(s)
    print('tokens written', len(css()))
