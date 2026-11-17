"""Theme tokens for the site. Writes the token block at the top of site/app.css.
Light is the default; with no saved choice the site follows the device (light or dark).
  python3 -I src/tools/themes.py src/site/app.css                  the token block
  python3 -I src/tools/themes.py --prizes src/site/prize-themes.css the prize themes
  python3 -I src/tools/themes.py --fxpal src/site/fx.js             the prize themes' colors for swatches and previews (FX_PAL)
Each refuses to write while any pair of colors is below 4.5:1."""
import json, re, sys
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

# Prize themes: won in crates (src/site/prizes.js), never sold. Same tokens and the same contrast check as the themes above;
# their CSS goes to site/prize-themes.css (python3 -I src/tools/themes.py --prizes src/site/prize-themes.css), not into app.css.
PRIZE = {
 # ---------------- common ----------------
 'prize-graphite': dict(COMMON_LIGHT, paper='#F5F5F2', card='#FFFFFF', sunk='#ECECE6', ink='#1C1C1A', ink2='#3D3D39', muted='#5E5E58', line='#E2E2DB', line_strong='#C8C8BF',
   pencil='#52525B', pencil_text='#3F3F46', hl='#E8E8E1', hl_ink='#1C1C1A', act='#2E2E2B', act_ink='#FFFFFF', act_hover='#1C1C1A', focus='#52525B',
   d1='#E2E2DB', d2='#9C9C93', d3='#2E2E2B', grad='linear-gradient(135deg, #2E2E2B, #4A4A46)', on_grad='#FFFFFF', aura='transparent'),
 'prize-sunrise': dict(COMMON_LIGHT, paper='#FFF6F0', card='#FFFFFF', sunk='#FFEADF', ink='#2E1A10', ink2='#573828', muted='#765344', line='#F8DDCD', line_strong='#EEBFA5',
   pencil='#EA580C', pencil_text='#9A3412', hl='#FFE6D5', hl_ink='#5C230A', act='#C2410C', act_ink='#FFFFFF', act_hover='#9A3412', focus='#EA580C',
   d1='#FED9C4', d2='#F59E6B', d3='#9A3412', grad='linear-gradient(135deg, #9A3412 0%, #C2410C 55%, #BE123C 100%)', on_grad='#FFFFFF', aura='rgba(251, 146, 60, .24)'),
 'prize-ocean': dict(COMMON_LIGHT, paper='#F0FAFA', card='#FFFFFF', sunk='#E0F3F3', ink='#0B2626', ink2='#24464A', muted='#4B676A', line='#D2EBEB', line_strong='#A3D5D5',
   pencil='#0D9488', pencil_text='#0F766E', hl='#D6F5F0', hl_ink='#0B3B36', act='#0F766E', act_ink='#FFFFFF', act_hover='#115E59', focus='#0D9488',
   d1='#CDEFEB', d2='#4FBFB3', d3='#134E4A', grad='linear-gradient(135deg, #115E59 0%, #0F766E 50%, #0E7490 100%)', on_grad='#FFFFFF', aura='rgba(45, 212, 191, .22)'),
 'prize-highlighter': dict(COMMON_LIGHT, paper='#FFFDF2', card='#FFFFFF', sunk='#FDF8DC', ink='#1A1A12', ink2='#3D3B2A', muted='#625F47', line='#F1EBC8', line_strong='#DFD48E',
   pencil='#CA8A04', pencil_text='#854D0E', hl='#FEF08A', hl_ink='#1A1A12', act='#FACC15', act_ink='#1A1A12', act_hover='#EAB308', focus='#A16207',
   d1='#FEF3C7', d2='#FACC15', d3='#854D0E', grad='linear-gradient(135deg, #FDE047, #FACC15)', on_grad='#1A1A12', aura='rgba(250, 204, 21, .25)'),
 # Rocks & Gems: red-rock sand with turquoise; Forecast: a soft gray sky
 'prize-sandstone': dict(COMMON_LIGHT, paper='#FAF3E8', card='#FFFDF8', sunk='#F3E8D6', ink='#2A1D12', ink2='#4D3A2A', muted='#6E5A48', line='#EADCC6', line_strong='#D9C3A2',
   pencil='#B4532A', pencil_text='#8F3D1B', hl='#F8E3CF', hl_ink='#4A1E0B', act='#0F7C86', act_ink='#FFFFFF', act_hover='#0B5F67', focus='#0F7C86',
   d1='#F1E2CC', d2='#D19A6A', d3='#8F3D1B', grad='linear-gradient(135deg, #8F3D1B 0%, #B4532A 50%, #0F7C86 100%)', on_grad='#FFFFFF', aura='rgba(180, 83, 42, .16)'),
 'prize-overcast': dict(COMMON_LIGHT, paper='#F1F4F8', card='#FFFFFF', sunk='#E6EBF2', ink='#141B26', ink2='#334052', muted='#566275', line='#DDE3EC', line_strong='#BCC7D6',
   pencil='#4F6D9A', pencil_text='#3B5680', hl='#DDE6F3', hl_ink='#16243D', act='#3B5680', act_ink='#FFFFFF', act_hover='#2C4266', focus='#4F6D9A',
   d1='#DCE3EE', d2='#8BA0BE', d3='#2C4266', grad='linear-gradient(135deg, #2C4266 0%, #3B5680 55%, #4B5E7A 100%)', on_grad='#FFFFFF', aura='rgba(100, 116, 139, .18)'),
 # ---------------- rare ----------------
 'prize-library': dict(COMMON_LIGHT, paper='#FBF7EF', card='#FFFDF8', sunk='#F3ECDF', ink='#2A1D17', ink2='#4A3A31', muted='#6B5A4F', line='#E9DFCF', line_strong='#D6C6AE',
   pencil='#8B2635', pencil_text='#7A1F2B', hl='#F5E6D3', hl_ink='#4A1A20', act='#7A1F2B', act_ink='#FFFFFF', act_hover='#5E1720', focus='#8B2635',
   d1='#EEDFD0', d2='#C08A7A', d3='#5E1720', grad='linear-gradient(135deg, #5E1720 0%, #7A1F2B 55%, #8A4B14 100%)', on_grad='#FFFFFF', aura='rgba(139, 38, 53, .14)'),
 'prize-varsity': dict(COMMON_LIGHT, paper='#F5F6FA', card='#FFFFFF', sunk='#EAECF3', ink='#141A33', ink2='#333B5C', muted='#575F7D', line='#DFE2EC', line_strong='#C1C7DA',
   pencil='#B7861F', pencil_text='#7C5A0F', hl='#FFF1C7', hl_ink='#3D2C05', act='#1E2A5A', act_ink='#FFFFFF', act_hover='#141D42', focus='#B7861F',
   d1='#E3E6F0', d2='#8B95BD', d3='#1E2A5A', grad='linear-gradient(135deg, #141D42 0%, #1E2A5A 60%, #2B3A78 100%)', on_grad='#FFFFFF', aura='rgba(234, 179, 8, .16)'),
 'prize-chalkboard': dict(COMMON_DARK, paper='#1E2B24', card='#26352D', sunk='#2F4037', ink='#F1F5EE', ink2='#D7E0D3', muted='#AEBDAC', line='#34473C', line_strong='#4A6155',
   pencil='#FDE68A', pencil_text='#FDE68A', hl='#3D4A2C', hl_ink='#FFF7D6', act='#F1F5EE', act_ink='#1E2B24', act_hover='#D7E0D3', focus='#FDE68A',
   d1='#33473B', d2='#6F8D7C', d3='#E2EBDD', grad='linear-gradient(135deg, #F1F5EE, #D7E0D3)', on_grad='#1E2B24', aura='transparent'),
 'prize-blueprint': dict(COMMON_DARK, paper='#0E2A52', card='#133566', sunk='#1A3F75', ink='#F0F6FF', ink2='#D2E2F7', muted='#A9C1E0', line='#23497F', line_strong='#3A639C',
   pencil='#7DD3FC', pencil_text='#BAE6FD', hl='#1E4A82', hl_ink='#F0F9FF', act='#F0F6FF', act_ink='#0E2A52', act_hover='#D2E2F7', focus='#7DD3FC',
   d1='#22497F', d2='#5F8BC4', d3='#E0ECFB', grad='linear-gradient(135deg, #F0F6FF, #D2E2F7)', on_grad='#0E2A52', aura='transparent',
   math='#93C5FD'),
 # Rocks & Gems: deep blue stone with flecks of gold; Forecast: bright and icy
 'prize-lapis': dict(COMMON_DARK, paper='#0C1240', card='#131A52', sunk='#1A2262', ink='#F3F4FF', ink2='#D6DAF5', muted='#A3AAD6', line='#232C6B', line_strong='#36408A',
   pencil='#E8B84A', pencil_text='#F5D27E', hl='#3A3014', hl_ink='#FFF6DA', act='#E8B84A', act_ink='#1A1404', act_hover='#D19E2E', focus='#F5D27E',
   d1='#232C6B', d2='#5A64B8', d3='#F5D27E', grad='linear-gradient(120deg, #F5D27E 0%, #E8B84A 50%, #A5B4FC 100%)', on_grad='#141024', aura='rgba(232, 184, 74, .22)'),
 'prize-snowday': dict(COMMON_LIGHT, paper='#F4FAFD', card='#FFFFFF', sunk='#E7F3F9', ink='#0B1E2B', ink2='#24404F', muted='#4A6575', line='#D6EAF3', line_strong='#A9D2E6',
   pencil='#0284C7', pencil_text='#075985', hl='#D9F0FB', hl_ink='#082F49', act='#075985', act_ink='#FFFFFF', act_hover='#0C4A6E', focus='#0284C7',
   d1='#D3EDF9', d2='#5DB7E3', d3='#0C4A6E', grad='linear-gradient(135deg, #0C4A6E 0%, #0369A1 55%, #4338CA 100%)', on_grad='#FFFFFF', aura='rgba(125, 211, 252, .3)'),
 # ---------------- epic ----------------
 'prize-lamplight': dict(COMMON_DARK, paper='#0F1424', card='#171D33', sunk='#1F2640', ink='#F5F1E8', ink2='#DDD6C6', muted='#ABA392', line='#262E4A', line_strong='#3A4466',
   pencil='#F59E0B', pencil_text='#FCD34D', hl='#3A2E12', hl_ink='#FFF4D6', act='#FBBF24', act_ink='#1A1405', act_hover='#F59E0B', focus='#FCD34D',
   d1='#262E4A', d2='#8A7240', d3='#FDE68A', grad='linear-gradient(135deg, #FCD34D, #F59E0B)', on_grad='#1A1405', aura='rgba(251, 191, 36, .18)'),
 'prize-arcade': dict(COMMON_DARK, paper='#0D0A1A', card='#171230', sunk='#201942', ink='#F8F5FF', ink2='#DCD4F5', muted='#A99FCB', line='#2A2150', line_strong='#3F3370',
   pencil='#22D3EE', pencil_text='#67E8F9', hl='#3B1747', hl_ink='#FDE7FF', act='#F472B6', act_ink='#14051A', act_hover='#EC4899', focus='#22D3EE',
   d1='#2A2150', d2='#8B5CF6', d3='#F0ABFC', grad='linear-gradient(135deg, #F472B6 0%, #C084FC 50%, #22D3EE 100%)', on_grad='#14051A', aura='rgba(244, 114, 182, .22)'),
 'prize-aurora': dict(COMMON_DARK, paper='#071A1F', card='#0D252C', sunk='#133038', ink='#EFFBF8', ink2='#CDEBE4', muted='#93B8B0', line='#18363E', line_strong='#2A4E58',
   pencil='#5EEAD4', pencil_text='#99F6E4', hl='#1C3B47', hl_ink='#E6FFFA', act='#5EEAD4', act_ink='#04201C', act_hover='#2DD4BF', focus='#99F6E4',
   d1='#18363E', d2='#3BA597', d3='#CCFBF1', grad='linear-gradient(135deg, #5EEAD4 0%, #86EFAC 45%, #C4B5FD 100%)', on_grad='#04201C', aura='rgba(94, 234, 212, .2)'),
 # ---------------- legendary ----------------
 'prize-gold': dict(COMMON_DARK, paper='#0A0907', card='#15130E', sunk='#1E1B14', ink='#FBF6E9', ink2='#E3DAC2', muted='#AFA58A', line='#2A2619', line_strong='#403A26',
   pencil='#E0B54A', pencil_text='#F2D27A', hl='#3A2F12', hl_ink='#FFF6D9', act='#E0B54A', act_ink='#1A1405', act_hover='#C99A2E', focus='#F2D27A',
   d1='#2A2619', d2='#9C7F35', d3='#F2D27A', grad='linear-gradient(135deg, #F7E3A1 0%, #E0B54A 50%, #B8862B 100%)', on_grad='#1A1405', aura='rgba(224, 181, 74, .22)'),
 # ---------------- living themes (animated accents and backgrounds) ----------------
 'prize-holo': dict(COMMON_LIGHT, paper='#F7F6FD', card='#FFFFFF', sunk='#EFEDFA', ink='#16142B', ink2='#36335A', muted='#5A577E', line='#E4E1F5', line_strong='#C9C4EA',
   pencil='#7C3AED', pencil_text='#5B21B6', hl='#ECE6FF', hl_ink='#2E1065', act='#1E1B4B', act_ink='#FFFFFF', act_hover='#312E81', focus='#7C3AED',
   d1='#E4E1F5', d2='#A5B4FC', d3='#3730A3', grad='linear-gradient(110deg, #FBCFE8 0%, #C7D2FE 25%, #A5F3FC 50%, #BBF7D0 75%, #FDE68A 100%)', on_grad='#1E1B4B', aura='rgba(167, 139, 250, .3)'),
 'prize-nebula': dict(COMMON_DARK, paper='#0B0820', card='#15112E', sunk='#1E1840', ink='#F5F3FF', ink2='#DDD6FE', muted='#A9A2CF', line='#2A2352', line_strong='#40367A',
   pencil='#C084FC', pencil_text='#E9D5FF', hl='#3B1D5E', hl_ink='#FAF5FF', act='#E879F9', act_ink='#1A0526', act_hover='#D946EF', focus='#E9D5FF',
   d1='#2A2352', d2='#7C5BD6', d3='#F0ABFC', grad='linear-gradient(120deg, #F0ABFC 0%, #C4B5FD 50%, #93C5FD 100%)', on_grad='#1A0526', aura='rgba(192, 132, 252, .3)'),
 'prize-synthwave': dict(COMMON_DARK, paper='#120A26', card='#1C1238', sunk='#26184A', ink='#FFF5FB', ink2='#F5D0FE', muted='#B9A3D6', line='#33215E', line_strong='#4C3384',
   pencil='#22D3EE', pencil_text='#67E8F9', hl='#4A1442', hl_ink='#FFE4F3', act='#F472B6', act_ink='#1A0512', act_hover='#EC4899', focus='#67E8F9',
   d1='#33215E', d2='#C0567F', d3='#FDBA74', grad='linear-gradient(90deg, #FDE047 0%, #FB923C 45%, #F472B6 100%)', on_grad='#1A0512', aura='rgba(244, 114, 182, .3)'),
 'prize-inferno': dict(COMMON_DARK, paper='#120806', card='#1E0F0A', sunk='#2A1610', ink='#FFF4EC', ink2='#FED7C3', muted='#C4A08E', line='#3A1E14', line_strong='#57301F',
   pencil='#FB923C', pencil_text='#FDBA74', hl='#4A1D0C', hl_ink='#FFF1E6', act='#F97316', act_ink='#1C0A02', act_hover='#EA580C', focus='#FDBA74',
   d1='#3A1E14', d2='#C2410C', d3='#FDE68A', grad='linear-gradient(90deg, #FDE047 0%, #FB923C 50%, #F43F5E 100%)', on_grad='#1C0A02', aura='rgba(249, 115, 22, .32)'),
 # deep sea: glowing plankton and slow light from far above
 'prize-abyss': dict(COMMON_DARK, paper='#030B18', card='#08162B', sunk='#0D2038', ink='#E6F6FF', ink2='#BFE3F5', muted='#8FB4CC', line='#12304F', line_strong='#1D4870',
   pencil='#22D3EE', pencil_text='#67E8F9', hl='#0E3A4F', hl_ink='#E0FBFF', act='#2DD4BF', act_ink='#03201C', act_hover='#14B8A6', focus='#67E8F9',
   d1='#12304F', d2='#0E7490', d3='#A5F3FC', grad='linear-gradient(120deg, #A5F3FC 0%, #5EEAD4 50%, #C4B5FD 100%)', on_grad='#03201C', aura='rgba(45, 212, 191, .3)'),
 # an old screen: green phosphor, scanlines and a flicker
 'prize-terminal': dict(COMMON_DARK, paper='#030806', card='#07110B', sunk='#0B1A11', ink='#D5FFE0', ink2='#A7F3C0', muted='#6FBF8A', line='#123322', line_strong='#1C4D33',
   pencil='#4ADE80', pencil_text='#86EFAC', hl='#0F3A22', hl_ink='#E6FFEE', act='#22C55E', act_ink='#021208', act_hover='#16A34A', focus='#86EFAC',
   d1='#123322', d2='#15803D', d3='#86EFAC', grad='linear-gradient(90deg, #86EFAC 0%, #4ADE80 50%, #22D3EE 100%)', on_grad='#021208', aura='rgba(74, 222, 128, .3)'),
 # an enchanted wood at night: fireflies, mist and runes
 'prize-enchanted': dict(COMMON_DARK, paper='#0C0718', card='#160E28', sunk='#1F1536', ink='#F7F1FF', ink2='#E2D4FB', muted='#AE9CD0', line='#2B1F48', line_strong='#433169',
   pencil='#A3E635', pencil_text='#D9F99D', hl='#2E1F4F', hl_ink='#F7FEE7', act='#A3E635', act_ink='#142004', act_hover='#84CC16', focus='#D9F99D',
   d1='#2B1F48', d2='#7C3AED', d3='#D9F99D', grad='linear-gradient(120deg, #D9F99D 0%, #A7F3D0 40%, #C4B5FD 100%)', on_grad='#142004', aura='rgba(163, 230, 53, .28)'),
 # a haunted night: moon, fog, bats
 'prize-haunted': dict(COMMON_DARK, paper='#0D0A14', card='#17121F', sunk='#201A2B', ink='#F3EEF9', ink2='#D8CCE8', muted='#A596BC', line='#2A2238', line_strong='#40355A',
   pencil='#FB923C', pencil_text='#FDBA74', hl='#3A2210', hl_ink='#FFF1E0', act='#F97316', act_ink='#1A0B02', act_hover='#EA580C', focus='#FDBA74',
   d1='#2A2238', d2='#9A3412', d3='#FDBA74', grad='linear-gradient(120deg, #FDBA74 0%, #FB923C 50%, #C4B5FD 100%)', on_grad='#1A0B02', aura='rgba(249, 115, 22, .28)'),
 # something from below: tentacles and spores
 'prize-eldritch': dict(COMMON_DARK, paper='#04100E', card='#0A1B18', sunk='#102622', ink='#E8FFF8', ink2='#BFEFE0', muted='#86B8A8', line='#143630', line_strong='#1F5248',
   pencil='#C084FC', pencil_text='#E9D5FF', hl='#2B1A4A', hl_ink='#FAF5FF', act='#C4B5FD', act_ink='#12062B', act_hover='#A78BFA', focus='#E9D5FF',
   d1='#143630', d2='#0F766E', d3='#99F6E4', grad='linear-gradient(120deg, #99F6E4 0%, #C4B5FD 55%, #F0ABFC 100%)', on_grad='#12062B', aura='rgba(167, 139, 250, .3)'),
 # a lantern festival at dusk
 'prize-lanterns': dict(COMMON_DARK, paper='#0E0B24', card='#181436', sunk='#221D48', ink='#FFF7EA', ink2='#F1DFC4', muted='#B5A7C9', line='#2C2556', line_strong='#453B7C',
   pencil='#FBBF24', pencil_text='#FDE68A', hl='#43300B', hl_ink='#FFF8DC', act='#FBBF24', act_ink='#1F1403', act_hover='#F59E0B', focus='#FDE68A',
   d1='#2C2556', d2='#B45309', d3='#FDE68A', grad='linear-gradient(120deg, #FDE68A 0%, #FDBA74 50%, #F9A8D4 100%)', on_grad='#1F1403', aura='rgba(251, 191, 36, .28)'),
 # a city at night, and mountains before dawn
 'prize-metropolis': dict(COMMON_DARK, paper='#070B18', card='#0E1426', sunk='#151D36', ink='#F2F5FF', ink2='#D3DAF2', muted='#98A3C7', line='#1C2747', line_strong='#2C3B69',
   pencil='#FBBF24', pencil_text='#FDE68A', hl='#3F2F0A', hl_ink='#FFF8DC', act='#FBBF24', act_ink='#1F1403', act_hover='#F59E0B', focus='#FDE68A',
   d1='#1C2747', d2='#B45309', d3='#FDE68A', grad='linear-gradient(120deg, #FDE68A 0%, #F9A8D4 55%, #A5B4FC 100%)', on_grad='#1F1403', aura='rgba(251, 191, 36, .26)'),
 'prize-summit': dict(COMMON_DARK, paper='#120E1E', card='#1B162C', sunk='#251E3B', ink='#FFF4F1', ink2='#F3D9D6', muted='#B9A4B8', line='#2F2748', line_strong='#473B6B',
   pencil='#FDA4AF', pencil_text='#FECDD3', hl='#4A1D2B', hl_ink='#FFF1F2', act='#FDA4AF', act_ink='#2A0A12', act_hover='#FB7185', focus='#FECDD3',
   d1='#2F2748', d2='#BE123C', d3='#FECDD3', grad='linear-gradient(120deg, #FECDD3 0%, #FDBA74 50%, #C4B5FD 100%)', on_grad='#2A0A12', aura='rgba(253, 164, 175, .28)'),
 # Rocks & Gems: a black opal full of fire, and a cavern of giant glowing crystals; Forecast: a storm cloud with lightning inside
 'prize-opal': dict(COMMON_DARK, paper='#08090F', card='#11131C', sunk='#181B27', ink='#F2F5FA', ink2='#D3D9E6', muted='#9AA3B8', line='#20242F', line_strong='#323848',
   pencil='#F9A8D4', pencil_text='#FBCFE8', hl='#3B1D33', hl_ink='#FFF1F8', act='#A5F3FC', act_ink='#06131A', act_hover='#67E8F9', focus='#A5F3FC',
   d1='#20242F', d2='#2DD4BF', d3='#F9A8D4', grad='linear-gradient(120deg, #67E8F9 0%, #86EFAC 35%, #FDE68A 65%, #F9A8D4 100%)', on_grad='#0B0B14', aura='rgba(94, 234, 212, .26)'),
 'prize-thunderhead': dict(COMMON_DARK, paper='#0A0E18', card='#111726', sunk='#182033', ink='#EEF2FA', ink2='#CED6E6', muted='#97A2BA', line='#202940', line_strong='#323E5C',
   pencil='#A5B4FC', pencil_text='#C7D2FE', hl='#252D58', hl_ink='#EEF2FF', act='#C7D2FE', act_ink='#0B1024', act_hover='#A5B4FC', focus='#C7D2FE',
   d1='#202940', d2='#6366F1', d3='#E0E7FF', grad='linear-gradient(120deg, #E0E7FF 0%, #A5B4FC 50%, #7DD3FC 100%)', on_grad='#0B1024', aura='rgba(165, 180, 252, .26)'),
 'prize-cavern': dict(COMMON_DARK, paper='#09060F', card='#120D1D', sunk='#1A132A', ink='#F7F2FF', ink2='#DED4F4', muted='#A89BC6', line='#251C3A', line_strong='#3A2D58',
   pencil='#67E8F9', pencil_text='#A5F3FC', hl='#2B1D52', hl_ink='#F5F3FF', act='#C4B5FD', act_ink='#140A2B', act_hover='#A78BFA', focus='#A5F3FC',
   d1='#251C3A', d2='#8B5CF6', d3='#A5F3FC', grad='linear-gradient(120deg, #A5F3FC 0%, #C4B5FD 50%, #F0ABFC 100%)', on_grad='#140A2B', aura='rgba(196, 181, 253, .3)'),
 # Radiant: a lighthouse over a dark sea, with lamp-gold buttons
 'prize-beacon': dict(COMMON_DARK, paper='#06121F', card='#0B1B2D', sunk='#10243A', ink='#EEF4FB', ink2='#CCD9E8', muted='#93A8BF', line='#1B324B', line_strong='#2A4766',
   pencil='#F5B547', pencil_text='#FCD9A0', hl='#3A2A0E', hl_ink='#FFF6E0', act='#F5B547', act_ink='#1C1204', act_hover='#E89F2A', focus='#FCD9A0',
   d1='#1B324B', d2='#B7791F', d3='#FDE3A7', grad='linear-gradient(120deg, #FDE3A7 0%, #F5B547 50%, #93C5FD 100%)', on_grad='#1C1204', aura='rgba(245, 181, 71, .26)'),
 # Wildlands: a pale sky with drifting clouds, a lily pond, dunes at night and a frozen lake
 'prize-clouds': dict(COMMON_LIGHT, paper='#EEF6FD', card='#FFFFFF', sunk='#E2EEF9', ink='#0C1E33', ink2='#2B415C', muted='#4F6580', line='#D5E4F2', line_strong='#AAC4DF',
   pencil='#0284C7', pencil_text='#075985', hl='#DCEEFB', hl_ink='#0C2E4A', act='#0369A1', act_ink='#FFFFFF', act_hover='#075985', focus='#0284C7',
   d1='#D5E8F8', d2='#7DB9E8', d3='#0C4A6E', grad='linear-gradient(135deg, #075985 0%, #0369A1 55%, #4338CA 100%)', on_grad='#FFFFFF', aura='rgba(125, 211, 252, .28)'),
 'prize-pond': dict(COMMON_LIGHT, paper='#EEF7F1', card='#FFFFFF', sunk='#E1F0E6', ink='#0D2419', ink2='#2A4537', muted='#4C665A', line='#D3E8DA', line_strong='#A6CFB4',
   pencil='#DB2777', pencil_text='#9D174D', hl='#FCE7F3', hl_ink='#500724', act='#0F766E', act_ink='#FFFFFF', act_hover='#115E59', focus='#DB2777',
   d1='#CFEADB', d2='#5DB58A', d3='#14532D', grad='linear-gradient(135deg, #115E59 0%, #0F766E 55%, #BE185D 100%)', on_grad='#FFFFFF', aura='rgba(244, 114, 182, .2)'),
 'prize-dunes': dict(COMMON_DARK, paper='#110C1C', card='#1A1328', sunk='#241A36', ink='#FFF6EA', ink2='#F2DFC6', muted='#BBA8B4', line='#2E2242', line_strong='#47365F',
   pencil='#FDBA74', pencil_text='#FED7AA', hl='#43260F', hl_ink='#FFF4E6', act='#FB923C', act_ink='#1F0A02', act_hover='#F97316', focus='#FED7AA',
   d1='#2E2242', d2='#C2410C', d3='#FED7AA', grad='linear-gradient(120deg, #FED7AA 0%, #FB923C 50%, #C084FC 100%)', on_grad='#1F0A02', aura='rgba(251, 146, 60, .26)'),
 'prize-thinice': dict(COMMON_DARK, paper='#020912', card='#081522', sunk='#0E1F30', ink='#EEF7FF', ink2='#CBE3F4', muted='#93B1C7', line='#132A40', line_strong='#21425F',
   pencil='#A5F3FC', pencil_text='#CFFAFE', hl='#0E3343', hl_ink='#F0FDFF', act='#A5F3FC', act_ink='#031418', act_hover='#67E8F9', focus='#CFFAFE',
   d1='#132A40', d2='#0E7490', d3='#CFFAFE', grad='linear-gradient(120deg, #F0F9FF 0%, #A5F3FC 45%, #6EE7B7 100%)', on_grad='#031418', aura='rgba(165, 243, 252, .26)'),
 # Curiosities: glowing mushrooms in the dark
 'prize-mycelium': dict(COMMON_DARK, paper='#07080F', card='#0F1220', sunk='#161A2C', ink='#ECFDF5', ink2='#C7E9DD', muted='#93B3A8', line='#1C2236', line_strong='#2D3550',
   pencil='#5EEAD4', pencil_text='#99F6E4', hl='#13323A', hl_ink='#E6FFFA', act='#F0ABFC', act_ink='#2A0730', act_hover='#E879F9', focus='#99F6E4',
   d1='#1C2236', d2='#0F766E', d3='#99F6E4', grad='linear-gradient(120deg, #99F6E4 0%, #A5F3FC 40%, #F0ABFC 100%)', on_grad='#2A0730', aura='rgba(94, 234, 212, .26)'),
 # Royal Court: a manuscript page, a cathedral at evening
 'prize-vellum': dict(COMMON_LIGHT, paper='#FBF5E6', card='#FFFDF7', sunk='#F3EAD3', ink='#2A1B0E', ink2='#4A3724', muted='#6B5640', line='#E8DCC0', line_strong='#CDB98D',
   pencil='#B91C1C', pencil_text='#991B1B', hl='#FBE3D0', hl_ink='#431407', act='#1E3A8A', act_ink='#FFFFFF', act_hover='#1E40AF', focus='#B91C1C',
   d1='#EADFC4', d2='#C9A85C', d3='#7C2D12', grad='linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #1E3A8A 100%)', on_grad='#FFFFFF', aura='rgba(217, 119, 6, .2)'),
 'prize-vespers': dict(COMMON_DARK, paper='#0E0A0C', card='#191215', sunk='#231A1E', ink='#FBF3EA', ink2='#E6D5C8', muted='#B49C90', line='#2E2126', line_strong='#4A353D',
   pencil='#FCA5A5', pencil_text='#FECACA', hl='#3F1420', hl_ink='#FFF1F2', act='#FCD34D', act_ink='#1C1303', act_hover='#FBBF24', focus='#FECACA',
   d1='#2E2126', d2='#9F1239', d3='#FDE68A', grad='linear-gradient(120deg, #FDE68A 0%, #FCA5A5 50%, #93C5FD 100%)', on_grad='#1C1303', aura='rgba(252, 211, 77, .24)'),
 # 8-Bit: a handheld's green screen, a dungeon, the last castle in a storm
 'prize-pocket': dict(COMMON_LIGHT, paper='#DCE8B8', card='#EEF5D2', sunk='#CADBA0', ink='#12260F', ink2='#27401F', muted='#3B5229', line='#BFD193', line_strong='#93AD62',
   pencil='#2F5D1E', pencil_text='#1F4514', hl='#C2D98A', hl_ink='#0F2A0A', act='#1F4514', act_ink='#EEF5D2', act_hover='#17360E', focus='#2F5D1E',
   d1='#C6D99A', d2='#7FA04A', d3='#1F4514', grad='linear-gradient(135deg, #17360E 0%, #1F4514 55%, #2F5D1E 100%)', on_grad='#EEF5D2', aura='rgba(47, 93, 30, .2)', ok='#166534'),
 'prize-dungeon': dict(COMMON_DARK, paper='#0C0A14', card='#151226', sunk='#1D1934', ink='#F1EEFF', ink2='#D5CFF0', muted='#A198C4', line='#272145', line_strong='#3D3468',
   pencil='#FB923C', pencil_text='#FDBA74', hl='#3D2410', hl_ink='#FFF1E0', act='#FBBF24', act_ink='#1A1203', act_hover='#F59E0B', focus='#FDBA74',
   d1='#272145', d2='#B45309', d3='#FDE68A', grad='linear-gradient(120deg, #FDE68A 0%, #FB923C 50%, #A78BFA 100%)', on_grad='#1A1203', aura='rgba(251, 146, 60, .26)'),
 'prize-stormkeep': dict(COMMON_DARK, paper='#080A16', card='#101428', sunk='#171C38', ink='#EEF2FF', ink2='#CBD3F0', muted='#96A0C8', line='#1E2548', line_strong='#313B6C',
   pencil='#F87171', pencil_text='#FCA5A5', hl='#3B1220', hl_ink='#FFF1F2', act='#A5B4FC', act_ink='#0B0E24', act_hover='#818CF8', focus='#FCA5A5',
   d1='#1E2548', d2='#B91C1C', d3='#C7D2FE', grad='linear-gradient(120deg, #C7D2FE 0%, #A5B4FC 45%, #F87171 100%)', on_grad='#0B0E24', aura='rgba(165, 180, 252, .26)'),
 # Radiant: a library at midnight, lamp-gold on old wood
 'prize-stacks': dict(COMMON_DARK, paper='#0F0A07', card='#1A120C', sunk='#241910', ink='#FBF4E6', ink2='#E8D9BF', muted='#B8A283', line='#30210F', line_strong='#4D371C',
   pencil='#5EEAD4', pencil_text='#99F6E4', hl='#123A36', hl_ink='#E6FFFA', act='#F5B547', act_ink='#1C1204', act_hover='#E89F2A', focus='#99F6E4',
   d1='#30210F', d2='#B7791F', d3='#FDE3A7', grad='linear-gradient(120deg, #FDE3A7 0%, #F5B547 50%, #5EEAD4 100%)', on_grad='#1C1204', aura='rgba(245, 181, 71, .26)'),
 # Cipher: newsprint with a red pencil, a darkroom under the safelight, a puzzle box of inlaid wood
 'prize-crossword': dict(COMMON_LIGHT, paper='#F5F2E9', card='#FFFEFA', sunk='#ECE7DA', ink='#1A1A18', ink2='#3A3935', muted='#5C5950', line='#E0DACB', line_strong='#C2B9A3',
   pencil='#B91C1C', pencil_text='#991B1B', hl='#FBE7C6', hl_ink='#3B2A06', act='#1A1A18', act_ink='#FFFFFF', act_hover='#34332E', focus='#B91C1C',
   d1='#E7E1D2', d2='#A8A08A', d3='#2A2A26', grad='linear-gradient(135deg, #1A1A18 0%, #3A3935 60%, #7F1D1D 100%)', on_grad='#FFFFFF', aura='rgba(185, 28, 28, .14)', ok='#166534'),
 'prize-darkroom': dict(COMMON_DARK, paper='#120808', card='#1C0E0E', sunk='#261313', ink='#FDF0EC', ink2='#EBD4CC', muted='#C2A096', line='#331A18', line_strong='#4D2724',
   pencil='#F87171', pencil_text='#FCA5A5', hl='#3F1414', hl_ink='#FFF1F2', act='#FB923C', act_ink='#1C0A02', act_hover='#F97316', focus='#FCA5A5',
   d1='#331A18', d2='#B91C1C', d3='#FECACA', grad='linear-gradient(120deg, #FECACA 0%, #FCA5A5 45%, #FDBA74 100%)', on_grad='#2A0A06', aura='rgba(248, 113, 113, .26)'),
 'prize-puzzlebox': dict(COMMON_DARK, paper='#120C08', card='#1C140E', sunk='#261B12', ink='#FBF2E6', ink2='#E9DAC4', muted='#BBA386', line='#33251A', line_strong='#4E3826',
   pencil='#5EEAD4', pencil_text='#99F6E4', hl='#123A36', hl_ink='#E6FFFA', act='#E8B04B', act_ink='#1C1204', act_hover='#D69A2E', focus='#99F6E4',
   d1='#33251A', d2='#B7791F', d3='#FDE3A7', grad='linear-gradient(120deg, #FDE3A7 0%, #E8B04B 50%, #5EEAD4 100%)', on_grad='#1C1204', aura='rgba(232, 176, 75, .26)'),
 # Pop-Up: construction paper, a circus tent at night
 'prize-cutpaper': dict(COMMON_LIGHT, paper='#FFF8EE', card='#FFFFFF', sunk='#FBEEDC', ink='#2B1D12', ink2='#4A3527', muted='#6E5644', line='#F1E2CE', line_strong='#E0C6A6',
   pencil='#C2410C', pencil_text='#9A3412', hl='#FFE3D2', hl_ink='#4A1A08', act='#2E7D4F', act_ink='#FFFFFF', act_hover='#24653F', focus='#C2410C',
   d1='#F6E3CB', d2='#E9A86F', d3='#7A3410', grad='linear-gradient(135deg, #2E7D4F 0%, #24653F 55%, #1E5A6E 100%)', on_grad='#FFFFFF', aura='rgba(228, 87, 46, .18)'),
 'prize-bigtop': dict(COMMON_DARK, paper='#0D0A1A', card='#171229', sunk='#201A38', ink='#FFF7ED', ink2='#F1DCC8', muted='#BFA9B4', line='#2A2244', line_strong='#433868',
   pencil='#F87171', pencil_text='#FCA5A5', hl='#3A1420', hl_ink='#FFF1F2', act='#FACC15', act_ink='#1A1203', act_hover='#EAB308', focus='#FCA5A5',
   d1='#2A2244', d2='#DC2626', d3='#FDE68A', grad='linear-gradient(120deg, #FDE68A 0%, #FCA5A5 50%, #F87171 100%)', on_grad='#1A0A06', aura='rgba(250, 204, 21, .26)'),
 # Radiant: an astronomical clock, gold on deep blue
 'prize-astro': dict(COMMON_DARK, paper='#070B1C', card='#0F1530', sunk='#161E40', ink='#F2F4FF', ink2='#D3D9F5', muted='#9EA8D6', line='#1C2550', line_strong='#2E3A72',
   pencil='#FCD34D', pencil_text='#FDE68A', hl='#3A300E', hl_ink='#FFF7D6', act='#FCD34D', act_ink='#141005', act_hover='#FBBF24', focus='#FDE68A',
   d1='#1C2550', d2='#B7791F', d3='#FDE68A', grad='linear-gradient(120deg, #FDE68A 0%, #FCD34D 45%, #93C5FD 100%)', on_grad='#141005', aura='rgba(252, 211, 77, .26)'),
}
def finish(d):
    """fill the shadow and glass tokens the prize palettes leave out, from the light or dark theme they build on"""
    base = THEMES['light' if d['scheme'] == 'light' else 'dark']
    out = dict(d)
    for k in ('shadow', 'shadow_lg', 'btn_shadow', 'glass'):
        out.setdefault(k, base[k])
    if d['scheme'] == 'light':
        out['glass'] = 'rgba(%d, %d, %d, .88)' % tuple(int(d['paper'][i:i + 2], 16) for i in (1, 3, 5))
    return out
PRIZE = {k: finish(v) for k, v in PRIZE.items()}
ORDER = ['paper','card','sunk','ink','ink2','muted','line','line_strong','pencil','pencil_text','hl','hl_ink','act','act_ink','act_hover','focus',
  'ok','ok_soft','bad','bad_soft','warn','warn_text','d1','d2','d3','grad','on_grad','aura','shadow','shadow_lg','btn_shadow','glass',
  'rw','rw_soft','rw_line','math','math_soft','math_line','des','des_soft','img_filter','img_blend','backdrop']
NAME = {'ink2': 'ink-2'}
def block(t, indent='  '):
    d = THEMES[t] if t in THEMES else PRIZE[t]
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
    for t, d in list(THEMES.items()) + list(PRIZE.items()):
        for a, b in PAIRS:
            r = ratio(d[a], d[b])
            if r < 4.5:
                bad.append(f'{t}: {a} on {b} = {r:.2f}')
        for stop in re.findall(r'#[0-9A-Fa-f]{6}', d['grad']):
            r = ratio(d['on_grad'], stop)
            if r < 4.5:
                bad.append(f'{t}: on_grad on gradient {stop} = {r:.2f}')
    return bad
def prize_css():
    return '/* ---------- prize themes (written by src/tools/themes.py --prizes; do not edit by hand) ---------- */\n' + '\n'.join(
        ':root[data-theme="' + t + '"] {\n' + block(t) + '\n}' for t in PRIZE) + '\n'
if __name__ == '__main__':
    low = check()
    if low:
        sys.exit('contrast below 4.5:1\n' + '\n'.join(low))
    if sys.argv[1] == '--prizes':
        open(sys.argv[2], 'w', encoding='utf-8').write(prize_css())
        print('prize themes written', len(PRIZE))
        sys.exit(0)
    if sys.argv[1] == '--fxpal':
        pal = {t: {k: PRIZE[t][k] for k in ('paper', 'card', 'ink', 'line', 'act', 'act_ink', 'ok', 'ok_soft')} for t in PRIZE}
        line = '  var FX_PAL = ' + json.dumps(pal, separators=(',', ':')) + ';'
        s = open(sys.argv[2], encoding='utf-8').read()
        s2, n = re.subn(r'^  var FX_PAL = \{.*\};$', lambda m: line, s, count=1, flags=re.M)
        if n != 1:
            sys.exit('no FX_PAL line in ' + sys.argv[2])
        open(sys.argv[2], 'w', encoding='utf-8').write(s2)
        print('FX_PAL written', len(pal))
        sys.exit(0)
    p = sys.argv[1]
    s = open(p, encoding='utf-8').read()
    mark = '/* ---------- themes:'
    start = s.index(mark) if mark in s else s.index(':root {'); end = s.index('*, *::before, *::after')
    s = s[:start] + css() + '\n' + s[end:]
    open(p, 'w', encoding='utf-8').write(s)
    print('tokens written', len(css()))
