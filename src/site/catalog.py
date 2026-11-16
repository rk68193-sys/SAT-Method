# The prize list and its rules, read from prizes.js, for the clubhouse's database (src/account/club.sql).
# make_index.py writes it as catalog.json beside index.html, so it is published with the site at satsprint.org/catalog.json,
# and the database copies it from there every 10 minutes. It holds only what the database needs to draw a crate the way
# the page does: each prize's id, tier and series, the odds, prices and limits, the seasons, the sticker pages, the titles
# and the SHA-256 of the owner's link. Nothing here is hand-copied: a prize added to prizes.js is in the next build.
#   python3 -I src/site/catalog.py [src/site/prizes.js] > catalog.json
import json, os, re, sys

KINDS = ('theme', 'fx', 'aura', 'paper', 'streak')


class Lit:
    """Reads one JavaScript literal (an array, object, string, number, true, false or null) from source text. A function
    inside one (as in PZ_TITLES) is read as None, braces and strings included."""

    def __init__(self, s, i):
        self.s, self.i = s, i

    def ws(self):
        s = self.s
        while self.i < len(s):
            if s[self.i] in ' \t\r\n':
                self.i += 1
            elif s.startswith('//', self.i):
                self.i = s.index('\n', self.i)
            elif s.startswith('/*', self.i):
                self.i = s.index('*/', self.i) + 2
            else:
                break

    def value(self):
        self.ws()
        s, c = self.s, self.s[self.i]
        if c == '[':
            return self.array()
        if c == '{':
            return self.obj()
        if c in '\'"':
            return self.string()
        if c == '-' or c.isdigit():
            m = re.compile(r'-?\d+(\.\d+)?([eE][+-]?\d+)?').match(s, self.i)
            self.i = m.end()
            return float(m.group(0)) if ('.' in m.group(0) or 'e' in m.group(0).lower()) else int(m.group(0))
        for word, v in (('true', True), ('false', False), ('null', None)):
            if s.startswith(word, self.i):
                self.i += len(word)
                return v
        if s.startswith('function', self.i):
            self.i = s.index('{', self.i)
            self.skip_block()
            return None
        raise ValueError('not a literal at ' + repr(s[self.i:self.i + 40]))

    def skip_block(self):
        depth, s = 0, self.s
        while True:
            c = s[self.i]
            if c in '\'"':
                self.string()
                continue
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    self.i += 1
                    return
            self.i += 1

    def string(self):
        s, q = self.s, self.s[self.i]
        self.i += 1
        out = []
        while s[self.i] != q:
            c = s[self.i]
            if c == '\\':
                n = s[self.i + 1]
                if n == 'u':
                    out.append(chr(int(s[self.i + 2:self.i + 6], 16)))
                    self.i += 6
                    continue
                out.append({'n': '\n', 't': '\t', 'r': '\r', 'b': '\b', 'f': '\f', 'v': '\v', '0': '\0'}.get(n, n))
                self.i += 2
                continue
            out.append(c)
            self.i += 1
        self.i += 1
        return ''.join(out)

    def array(self):
        self.i += 1
        out = []
        while True:
            self.ws()
            if self.s[self.i] == ']':
                self.i += 1
                return out
            out.append(self.value())
            self.ws()
            if self.s[self.i] == ',':
                self.i += 1

    def obj(self):
        self.i += 1
        out = {}
        while True:
            self.ws()
            if self.s[self.i] == '}':
                self.i += 1
                return out
            if self.s[self.i] in '\'"':
                k = self.string()
            else:
                m = re.compile(r'[\w$]+').match(self.s, self.i)
                k = m.group(0)
                self.i = m.end()
            self.ws()
            assert self.s[self.i] == ':', 'expected : after ' + k
            self.i += 1
            out[k] = self.value()
            self.ws()
            if self.s[self.i] == ',':
                self.i += 1


def read(src, name):
    """The literal a top-level `var NAME = ...` (or `, NAME = ...` in a var list) starts with."""
    m = re.search(r'(?:\bvar|,)\s+' + re.escape(name) + r'\s*=\s*', src)
    if not m:
        raise ValueError(name + ' is not in prizes.js')
    return Lit(src, m.end()).value()


def catalog(src):
    tiers = read(src, 'PZ_TIERS')
    series = [s[0] for s in read(src, 'PZ_SERIES')]
    items = read(src, 'PZ_ITEMS')
    out_items, seen = [], set()
    for r in items:
        key, tier, kind, ser = r[0], r[2], r[3], r[4]
        iid = kind + ':' + key
        if kind not in KINDS or tier not in tiers or (ser not in series and ser != 'any') or iid in seen:
            raise ValueError('a prize the database could not use: ' + repr(r[:5]))
        if not re.fullmatch(r'[a-z0-9-]{1,40}', key):
            raise ValueError('a prize id the database could not use: ' + iid)
        seen.add(iid)
        out_items.append([iid, tier, ser])
    stk = read(src, 'PZ_STK')
    seasons = [[s[2], s[3]] for s in read(src, 'PZ_SEASONS')]
    for months, ids in seasons:
        for iid in ids:
            if iid not in seen:
                raise ValueError('a prize in season that is not in the list: ' + iid)
    return {
        'v': 1,
        'tiers': tiers,
        'odds': read(src, 'PZ_ODDS'),
        'price': read(src, 'PZ_PRICE'), 'freeze': read(src, 'PZ_FREEZE'), 'freezeMax': read(src, 'PZ_FREEZE_MAX'),
        'dupe': read(src, 'PZ_DUPE'), 'pity': read(src, 'PZ_PITY'),
        'earn': read(src, 'PZ_EARN'),
        'series': series,
        'stickers': {k: len(v) for k, v in stk.items()},
        'seasons': seasons,
        'titles': [t[0] for t in read(src, 'PZ_TITLES')],
        'gift': read(src, 'PZ_GIFT'), 'giftCoins': read(src, 'PZ_GIFT_COINS'),
        'items': out_items
    }


def text(src):
    return json.dumps(catalog(src), ensure_ascii=False, separators=(',', ':')) + '\n'


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prizes.js')
    sys.stdout.write(text(open(path, encoding='utf-8').read()))
