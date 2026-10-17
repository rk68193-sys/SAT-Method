"""Collect the Reading and Writing deep pass for the site's Patterns page.

usage: python3 rdeep.py <out rwdeep.json>

Reads deep/final/rw_cards.json (verified, student-facing findings per skill), deep/final/rw_flow.json
(findings across skills) and deep/final/rw_fix.json (corrections), keeps only question ids that exist
in the bank, and writes {cards, flow, fix}.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
D = HERE + 'deep/'
bank = {q['id']: q for q in json.load(open(D + 'rw_all.json', encoding='utf-8'))}

def load(p, default):
    try:
        return json.load(open(p, encoding='utf-8'))
    except (OSError, ValueError):
        return default

def clean(s):
    return re.sub(r'\s+', ' ', str(s or '')).strip()

def ids(lst):
    return [i for i in (lst or []) if i in bank]

SK = {'inf': 'Inferences', 'cid': 'Central Ideas and Details', 'coe': 'Command of Evidence', 'wic': 'Words in Context', 'tsp': 'Text Structure and Purpose',
      'ctc': 'Cross-Text Connections', 'trn': 'Transitions', 'bnd': 'Boundaries', 'fss': 'Form, Structure, and Sense', 'rs': 'Rhetorical Synthesis'}
def skill(s):
    s = clean(s)
    if s in SK: return SK[s]
    for v in SK.values():
        if s.lower().startswith(v.lower()[:12]): return v
    return s

cards = load(D + 'final/rw_cards.json', {}).get('cards', [])
flow = load(D + 'final/rw_flow.json', {}).get('findings', [])
fix = load(D + 'final/rw_fix.json', [])
if isinstance(fix, dict):
    fix = fix.get('fixes', fix.get('items', []))
out = {
    'cards': [{'skill': skill(c.get('skill')), 'kind': clean(c.get('kind')), 'title': clean(c.get('title')), 'rule': clean(c.get('rule')),
               'detail': clean(c.get('detail')), 'numbers': clean(c.get('numbers')), 'ids': ids(c.get('ids'))} for c in cards if clean(c.get('title'))],
    'flow': [{'title': clean(f.get('title')), 'kind': clean(f.get('kind')), 'rule': clean(f.get('rule')), 'detail': clean(f.get('detail')),
              'numbers': clean(f.get('numbers')), 'skills': [skill(x) for x in f.get('skills', [])], 'ids': ids(f.get('ids'))} for f in flow if clean(f.get('title'))],
    'fix': [{'skill': skill(f.get('skill')), 'was': clean(f.get('was')), 'now': clean(f.get('now')), 'ev': clean(f.get('ev')), 'ids': ids(f.get('ids'))} for f in fix if clean(f.get('was'))],
}
json.dump(out, open(sys.argv[1], 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('cards', len(out['cards']), 'flow', len(out['flow']), 'fix', len(out['fix']))
