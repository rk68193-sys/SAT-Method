"""Notes on the bank's 40 "most nearly mean" questions, written for this site.

qid -> (first: the sense most readers give the word with no sentence around it,
        other: wrong choices that are real meanings of the word, just not the one this sentence uses,
        second: True when the sentence uses a sense other than `first`)
The word asked about and the right answer come from the question bank itself.
"""
SECOND = {
    '05575bca': ('not hard to the touch', ['B'], True),            # soft: Gentle; Sensitive is also a sense
    '0f040c50': ('to smear over a surface', ['D'], True),            # spread: Extended; Coated
    '10a409bd': ('to set up or plan', ['B', 'C'], False),            # arranged: Organized; Ranked, Scheduled
    '1695391a': ('impossible to stop', [], False),                   # "I couldn't be stopped": talked all the time
    '213248f7': ('merely or just', [], True),                        # simply: Easily
    '2c82068f': ('particular', [], False),                           # specific
    '3566120b': ('to last or keep going', ['B'], True),              # endure: Tolerate; Persist
    '359902ae': ('single; only one', ['A'], True),                   # a singular: An extraordinary; A lonely
    '37219ba2': ('easy to understand', ['B', 'C'], True),            # clear: Transparent
    '3bd32343': ('kindness toward others', ['A', 'B'], True),        # consideration: Calculation
    '417f8dfa': ('included as a highlight', [], False),              # featured: Displayed
    '4480fae9': ('being given something', [], True),                 # receiving: Hearing
    '45a109a3': ('interrupted or moved out of place', ['A', 'D'], True),  # disturbed: Alarmed
    '5d48f889': ('mixed together', [], False),                       # mingled: Combined
    '6286dd96': ('to make something new', [], False),                # invent: Create
    '62a18353': ('to make friends again', ['C', 'D'], True),         # reconcile ... to: get to accept
    '6557f7fc': ('to book or set aside', [], True),                  # reserve: Constraint
    '6cf906fc': ('giving cover or protection', [], False),           # sheltering: Protective
    '7f935017': ('to make something happen by wishing for it', ['A'], True),  # manifest: Perceptible
    '82b7c3b2': ('having a mark or stain on it', ['C', 'D'], True),  # marked: Priced
    '84ece3f6': ('supposed without proof', ['C', 'D'], True),        # assumed: Acquired (took on); Imitated, Speculated
    '84f9b577': ('gathers', [], False),                              # collects
    '9671d61d': ('made a picture', ['B', 'D'], True),           # drew: Pulled
    '9aa44886': ('how good something is', ['A'], True),              # quality: Characteristic
    '9b22bf7b': ('to find out', ['A', 'D'], True),              # determine: Dictate
    '9ccf463e': ('waving someone over', ['B'], True),                # beckoning: Inviting
    'a0777403': ('finishing', [], False),                            # completing
    'aa7ae735': ('stretching out an arm', [], True),                 # reaching: Arriving at
    'ab1bd603': ('to think about', ['C', 'D'], True),           # consider: Take into account and follow
    'b11bb2a3': ('empty', ['A'], False),                             # a void: An empty
    'b4c6cff6': ('replies to', ['A', 'B', 'C'], True),               # answers: Fulfills
    'b622fb78': ('to copy by following lines', ['C', 'D'], True),  # trace: Evidence
    'ba974387': ('imaginable', [], False),                           # conceivable
    'be94c9fc': ('arguing about', ['A'], True),                 # disputing: Providing resistance to
    'c2c26e20': ('an idea put forward for others to consider', ['B'], True),  # suggestion: Trace
    'cf9a3f34': ('stretching an arm toward', ['A', 'D'], False),     # reaching across to: Stretching toward
    'e1e89221': ('not smooth to the touch', ['B', 'C', 'D'], True),  # rough: Harsh
    'e3ffb854': ('held up from below', ['B', 'D'], False),          # supported: Held up; Encouraged, Defended
    'e459076b': ('shrank, or agreed by contract', ['A'], True), # contracted: Developed
    'edd64a4a': ('to find out', ['B', 'D'], True),              # determine: Choose
}
