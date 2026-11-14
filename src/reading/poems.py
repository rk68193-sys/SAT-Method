"""Build src/build/poems.json: the "Poems and stories" section of Step 2 (Chunk).

Every number in that section is counted here from build/bank.json: how many reading questions are built on a poem or
on a story (a novel, short story or play), which jobs they ask, how often College Board rates them Hard, how often a
poem's line ends in the middle of a sentence, how the answers to the overall-structure questions on poems are built,
and what the main idea and main purpose answers on poems and stories are about. The labels that take judgment (which
answers describe a turn, which are about a feeling) are listed below by question id, and --check fails if the bank
holds a question of that kind the lists do not cover. The advice is written for this site.

Two habits a prep book suggests for fiction are left out because the bank does not back them: slowing down (the story
questions are rated Hard less often than the rest) and looking at the first and last lines for the main point (in the
annotated story questions those lines hold the evidence about as often as chance gives for passages this short).

    python3 -I src/reading/poems.py           writes build/poems.json
    python3 -I src/reading/poems.py --check   checks that file is current and that every rule below holds
"""
import html, json, re, sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'build' / 'poems.json'
BANK = ROOT / 'build' / 'bank.json'

POEM_INTRO = re.compile(r'\bpoem\b', re.I)
STORY_INTRO = re.compile(r'(?:’s |the )(?:(?:circa |early |late )?\d{4}s? )?(?:novel|short story|story|play|novella)\b', re.I)
QUOTE_POEM = re.compile(r'is an? (?:(?:circa |early |late )?\d{4}s? )?poem\b')
QUOTE_STORY = re.compile(r'is an? (?:(?:circa |early |late )?\d{4}s? )?(?:novel|short story|story|play|novella)\b')

# Overall-structure questions on a poem: the answers that read "this, then that", and what the others describe.
TURN = ['14b7dced', 'acb852e7', 'f2c48e47']
NO_TURN = {'97360a00': 'one extended comparison', 'c7265342': 'a series of images'}

# Main idea and main purpose questions: is the right answer about what the speaker or a character feels, wants,
# thinks or is like? Poems: all of them. Stories: the first list yes; the second describes a scene or an action.
POEM_FEELING = ['213a25d1', '5eda42a3', '5f56fdec', '9c759a09', 'ad4f7362', 'adbcbce0', 'b69d821d', 'c4900368']
STORY_FEELING = ['03c9f327', '19688783', '1d9a09c0', '1e85caa9', '2b085bc6', '3a1f02b0', '48e4021d', '57485f5e', '668f75cb',
                 '7a0e31ea', '7f0be746', '7ffae38a', 'aa7fc89b', 'd5600e74', 'd563bf65', 'd9e55268', 'ea971260', 'edbc6cca', 'fb8b56bc']
STORY_OTHER = ['0a04cac5', '69d662af', '6f5fc289', '8d88740e', 'a2be625e', 'b0f7541b', 'e5da61f1', 'e677fa6c']

# The questions the advice points to.
EX_TURN = 'acb852e7'                  # "Black Finger": a cypress against the sky, then a question about what it means
EX_IMAGE = ['b7f79059', '2fdfe002']   # "Hymn III" (the mind is like a flower), "Thoughts in a Zoo" (people caged like the lion)
EX_FEEL = ['57485f5e', '7a0e31ea', '3a1f02b0']   # Heidi, Francie, Mary
OLD = 1925                            # "published before" year for the old-wording line

# Titles that the patterns below cannot read off the introduction.
TITLE_FIX = {'ad4f7362': ('Aeneid', 'Virgil, translated by John Dryden', '1697')}

JOB_ORDER = ['Quotation', 'Purpose or structure', 'Main idea', 'Detail', 'Word']
JOB_SHOWN = {'Quotation': 'Quotation', 'Purpose or structure': 'Purpose or structure', 'Main idea': 'Main idea', 'Detail': 'Detail', 'Word': 'Words in context'}


def plain(t):
    return html.unescape(re.sub(r'<[^>]+>', '', t))


def kind(x):
    s = ' '.join(x['s'])
    if POEM_INTRO.search(x['intro']):
        return 'poem'
    if STORY_INTRO.search(x['intro']):
        return 'story'
    if x['job'] == 'quote' and QUOTE_POEM.search(s):
        return 'poem'
    if x['job'] == 'quote' and QUOTE_STORY.search(s):
        return 'story'
    return ''


def is_main(x):
    return x['job'] == 'main' or (x['job'] == 'structure' and re.search(r'main purpose|overall purpose', x['q']))


def line_ends(t):
    """The character before each line mark ( / ) in a text: a sentence ends at the line only after . ! or ?"""
    t = plain(t)
    out = []
    for m in re.finditer(r'\s/\s', t):
        before = t[:m.start()].rstrip().rstrip('”’"\')]—')
        out.append(before[-1:])
    return out


def title_of(x):
    if x['id'] in TITLE_FIX:
        return TITLE_FIX[x['id']]
    s = plain(' '.join(x['s']))
    m = (re.search(r'text is (?:adapted )?(?:from )?(?P<author>[^’]+?)’s (?:circa )?(?P<year>\d{4}) poem “(?P<title>[^”]+?)[.,]?”', x['intro'])
         or re.search(r'from the (?P<year>\d{4}) poem “(?P<title>[^”]+?)[.,]?” by (?P<author>[^,.]+)', x['intro'])
         or re.search(r'^“(?P<title>[^”]+)” is an? (?P<year>(?:early |late |circa )?\d{4}s?) poem by (?P<author>[^,.]+?)(?:[,.]| from )', s))
    return (m.group('title'), m.group('author').strip(), m.group('year')) if m else None


def pct(a, b):
    return round(100 * a / b)


def numbers(bank):
    poems = [x for x in bank if kind(x) == 'poem']
    stories = [x for x in bank if kind(x) == 'story']
    rest = [x for x in bank if not kind(x)]
    hard = lambda xs: sum(x['d'] == 'Hard' for x in xs)
    ends = []
    for x in poems:
        ends += line_ends(' '.join(x['s'])) if x['job'] != 'quote' else [e for t in x['ch'].values() for e in line_ends(t)]
    year = lambda x: int(re.search(r'\b(1[5-9]\d\d|20[0-2]\d)\b', x['intro']).group(1))
    return {
        'poem': len(poems), 'poemPassage': sum(x['job'] != 'quote' for x in poems), 'poemQuote': sum(x['job'] == 'quote' for x in poems),
        'story': len(stories), 'storyPassage': sum(x['job'] != 'quote' for x in stories), 'storyQuote': sum(x['job'] == 'quote' for x in stories),
        'rest': len(rest), 'poemHard': pct(hard(poems), len(poems)), 'storyHard': pct(hard(stories), len(stories)), 'restHard': pct(hard(rest), len(rest)),
        'jobs': {j: sum(x['jn'] == j for x in poems + stories) for j in JOB_ORDER},
        'lines': len(ends), 'runOn': sum(e not in '.!?' for e in ends),
        'struct': len(TURN) + len(NO_TURN), 'turn': len(TURN),
        'poemMain': len(POEM_FEELING), 'storyMain': len(STORY_FEELING) + len(STORY_OTHER), 'storyFeeling': len(STORY_FEELING),
        'storyOld': sum(year(x) < OLD for x in stories if x['job'] != 'quote'), 'poemOld': sum(year(x) < OLD for x in poems if x['job'] != 'quote'),
    }


def payload():
    bank = json.loads(BANK.read_text(encoding='utf-8'))['reading']
    by = {x['id']: x for x in bank}
    n = numbers(bank)
    t = lambda q: '<a href="#rq-' + q + '">“' + title_of(by[q])[0] + '”</a>'
    intro = ('%d reading questions are built on a poem and %d on a novel, a short story or a play. Most ask for a purpose or a structure, '
             'what a word means, or a quotation that fits a claim. They are not the hard ones: College Board rates %d%% of the poem questions '
             'and %d%% of the story questions Hard, against %d%% of the other reading questions, and question type by question type they are '
             'rated Hard about as often as the rest or less often.') % (n['poem'], n['story'], n['poemHard'], n['storyHard'], n['restHard'])
    poem = [
        '<b>Read by sentence, not by line.</b> The test prints a poem with its line breaks, but the thought runs on past them: where the bank '
        'marks the breaks, %d of %d lines end in the middle of a sentence. Pause where the punctuation tells you to, and put each sentence in '
        'plain words before you read the next.' % (n['runOn'], n['lines']),
        '<b>Find the turn.</b> A short poem often does one thing and then another: a scene, then what the speaker makes of it; a charge, then '
        'an answer. A <em>but</em>, a <em>then</em>, a dash or a sudden question often marks the spot. %d of the %d questions on a poem’s '
        'overall structure have a right answer of the form “this, then that,” and in each of them all four choices take that form, so find '
        'the turn first and check both halves. In %s the speaker describes a cypress against a gold sky, then asks what it means.'
        % (n['turn'], n['struct'], t(EX_TURN)),
        '<b>Name the speaker’s attitude.</b> Ask how the speaker feels about what the poem shows, and whether the feeling changes at the turn. '
        'All %d main idea and main purpose questions on a poem have a right answer about a feeling or a view: longing, regret, praise, '
        'encouragement.' % n['poemMain'],
        '<b>When an image stands for an idea, say the idea plainly and stay close to the words.</b> The right answer translates the picture '
        'and adds nothing. In %s the mind is like a flower because both thrive when they are fed and wilt when they are not, and the answer '
        'says just that: it needs proper nourishment to thrive. One wrong choice takes the poem’s dew and rain literally and says the mind '
        'draws strength from the weather. In %s people are caged like the lion, and the answer is that they have hopes their limits keep them '
        'from reaching.' % (t(EX_IMAGE[0]), t(EX_IMAGE[1])),
    ]
    story = [
        '<b>Read for what a character feels, wants or is like.</b> That is the Feeling tag, and most story questions turn on it: in %d of the '
        '%d main idea and main purpose questions on a story, the right answer is about what a character feels, wants, thinks or is like '
        '(%s, %s, %s). Most of the rest describe a scene or what someone does or says.'
        % (n['storyFeeling'], n['storyMain'], '<a href="#rq-%s">Heidi is delighted by a picture</a>' % EX_FEEL[0],
           '<a href="#rq-%s">Francie is set on a goal</a>' % EX_FEEL[1], '<a href="#rq-%s">Mary is happy in the garden</a>' % EX_FEEL[2]),
        '<b>Translate the old wording as you go.</b> %d of the %d story passages and %d of the %d poem passages come from works published before %d. '
        'Swap in plain words as you read; <a href="#names">Names, brackets and old words</a> shows how.'
        % (n['storyOld'], n['storyPassage'], n['poemOld'], n['poemPassage'], OLD),
    ]
    poems = [x for x in bank if kind(x) == 'poem']
    groups = []
    for j in JOB_ORDER:
        xs = sorted((x for x in poems if x['jn'] == j), key=lambda x: title_of(x)[0].lower().lstrip('“'))
        if xs:
            groups.append({'job': JOB_SHOWN[j], 'items': [[x['id'], title_of(x)[0], title_of(x)[1], title_of(x)[2], x['d']] for x in xs]})
    return {'title': 'Poems and stories', 'intro': intro, 'poemHead': 'A poem: four moves', 'poem': poem, 'storyHead': 'A story', 'story': story,
            'listHead': 'The %d poem questions' % n['poem'], 'list': groups, 'n': n}


def problems():
    bad = []
    bank = json.loads(BANK.read_text(encoding='utf-8'))['reading']
    by = {x['id']: x for x in bank}
    poems = [x for x in bank if kind(x) == 'poem']
    stories = [x for x in bank if kind(x) == 'story']
    # every poem in the bank is found: a quotation question that names a poem must match the pattern
    for x in bank:
        if not kind(x) and x['job'] == 'quote' and re.search(r'\bpoem\b', ' '.join(x['s'])) and x['id'] != '20583752':
            bad.append('%s names a poem but is not counted as one' % x['id'])
    # every poem gets a title, an author and a year for the list
    for x in poems:
        if not title_of(x):
            bad.append('%s: no title, author and year found for the poem list' % x['id'])
    # the overall-structure questions on a poem are exactly TURN and NO_TURN, and the turn ones read "this, then that" in every choice
    struct = {x['id'] for x in poems if re.search(r'overall structure', x['q'])}
    if struct != set(TURN) | set(NO_TURN):
        bad.append('overall-structure questions on a poem: %s, labeled %s' % (sorted(struct), sorted(set(TURN) | set(NO_TURN))))
    for q in TURN:
        if q in by and not all(re.search(r'\bthen\b', plain(c)) for c in by[q]['ch'].values()):
            bad.append('%s: not every choice reads “this, then that”' % q)
    for q in NO_TURN:
        if q in by and re.search(r'\bthen\b', plain(by[q]['ch'][by[q]['ans']])):
            bad.append('%s: the answer reads “this, then that” but is labeled as no turn' % q)
    # main idea and main purpose questions are all labeled
    pm = {x['id'] for x in poems if is_main(x)}
    if pm != set(POEM_FEELING):
        bad.append('main idea and main purpose questions on a poem: %s, labeled %s' % (sorted(pm), sorted(POEM_FEELING)))
    sm = {x['id'] for x in stories if is_main(x)}
    if sm != set(STORY_FEELING) | set(STORY_OTHER) or set(STORY_FEELING) & set(STORY_OTHER):
        bad.append('main idea and main purpose questions on a story: %s, labeled %s' % (sorted(sm), sorted(set(STORY_FEELING) | set(STORY_OTHER))))
    # the examples are what the text says they are
    if EX_TURN not in TURN:
        bad.append('the turn example is not a turn question')
    for q in EX_IMAGE:
        if q not in by or kind(by[q]) != 'poem' or by[q]['job'] != 'detail':
            bad.append('%s: the image examples are Detail questions on a poem' % q)
    if 'dew and the rain' not in plain(' '.join(by['b7f79059']['s'])) or 'weather' not in by['b7f79059']['ch']['B'] or by['b7f79059']['ans'] != 'C':
        bad.append('b7f79059: the dew-and-rain wrong choice is not as described')
    for q in EX_FEEL:
        if q not in STORY_FEELING:
            bad.append('%s: the feeling examples come from the story list' % q)
    # the claims in the text hold
    n = numbers(bank)
    if not n['poemHard'] < n['restHard'] or not n['storyHard'] < n['restHard']:
        bad.append('poems and stories are no longer rated Hard less often: %s' % n)
    lit = poems + stories
    rest = [x for x in bank if not kind(x)]
    for j in JOB_ORDER:
        a = [x for x in lit if x['jn'] == j]
        b = [x for x in rest if x['jn'] == j]
        if len(a) >= 10 and b and 100 * sum(x['d'] == 'Hard' for x in a) / len(a) > 100 * sum(x['d'] == 'Hard' for x in b) / len(b) + 6:
            bad.append('%s: poems and stories are rated Hard clearly more often than the rest' % j)
    if n['runOn'] < 0.8 * n['lines']:
        bad.append('line ends: only %d of %d run on' % (n['runOn'], n['lines']))
    if 2 * (n['jobs']['Quotation'] + n['jobs']['Purpose or structure'] + n['jobs']['Word']) <= n['poem'] + n['story']:
        bad.append('Quotation, Purpose or structure and Word questions are no longer most of them: %s' % n['jobs'])
    if n['storyFeeling'] * 2 <= n['storyMain']:
        bad.append('most story main idea answers are no longer about a feeling')
    return bad


def main():
    bad = problems()
    if bad:
        sys.exit('\n'.join(bad))
    text = json.dumps(payload(), ensure_ascii=False, indent=1) + '\n'
    if '--check' in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding='utf-8') != text:
            sys.exit('build/poems.json is out of date: run python3 -I src/reading/poems.py')
        n = json.loads(text)['n']
        print('Poems and stories: %d poem and %d story questions, every count and label checks out' % (n['poem'], n['story']))
        return
    OUT.write_text(text, encoding='utf-8')
    print('wrote %s' % OUT.relative_to(ROOT.parent))


if __name__ == '__main__':
    main()
