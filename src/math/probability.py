"""Editorial probability types, based on all 49 bank questions and solutions.

Calculator expressions are arithmetic suggestions, not live Desmos verification.
"""

GROUPS = {'prb-given': ['e1ad3d41', '46545dd6', '912cd125', 'ed6b7e5f', '014c47ab', 'f8696cd8'],
 'prb-joint': ['b1b5300b', '0301c5dc'],
 'prb-complement': ['d89c1513', '0ae37ff3', '1fc4f47b', '30db8f77'],
 'prb-count': ['585de39a', '1dcea480', '38a9ac45'],
 'prb-missing': ['b680e76d', 'd4413871'],
 'prb-pooled': ['e438ec3f', '89ff6a0a', '6a715bed', 'b6569d0e', 'f496d2c0', '89f20d9e'],
 'prb-percent': ['5dc386fb'],
 'prb-counting': ['9ce8cbbe'],
 'prb-symbolic': ['2a08d878'],
 'prb-closest': ['a3384df0'],
 'prb-simple': ['eccbf957',
                '1353b86e',
                '16cea46c',
                '47624288',
                '60caadfd',
                'e5b5fbdd',
                '2905ded0',
                '2df8f293',
                'ec7b0eb8',
                '79201024',
                '12dbe3de',
                '589cd7a6',
                'a478f9f5',
                'dae79de4',
                '1b8e412e',
                'b8150b17',
                'c943acba',
                '0a99e5bb',
                '4e527894',
                '46b2e169',
                'ecf8d15f',
                'e9ed719f']}

REVIEWED = {'e1ad3d41': 'prb-given',
 '46545dd6': 'prb-given',
 '912cd125': 'prb-given',
 'ed6b7e5f': 'prb-given',
 '014c47ab': 'prb-given',
 'f8696cd8': 'prb-given',
 'b1b5300b': 'prb-joint',
 '0301c5dc': 'prb-joint',
 'd89c1513': 'prb-complement',
 '0ae37ff3': 'prb-complement',
 '1fc4f47b': 'prb-complement',
 '30db8f77': 'prb-complement',
 '585de39a': 'prb-count',
 '1dcea480': 'prb-count',
 '38a9ac45': 'prb-count',
 'b680e76d': 'prb-missing',
 'd4413871': 'prb-missing',
 'e438ec3f': 'prb-pooled',
 '89ff6a0a': 'prb-pooled',
 '6a715bed': 'prb-pooled',
 'b6569d0e': 'prb-pooled',
 'f496d2c0': 'prb-pooled',
 '89f20d9e': 'prb-pooled',
 '5dc386fb': 'prb-percent',
 '9ce8cbbe': 'prb-counting',
 '2a08d878': 'prb-symbolic',
 'a3384df0': 'prb-closest',
 'eccbf957': 'prb-simple',
 '1353b86e': 'prb-simple',
 '16cea46c': 'prb-simple',
 '47624288': 'prb-simple',
 '60caadfd': 'prb-simple',
 'e5b5fbdd': 'prb-simple',
 '2905ded0': 'prb-simple',
 '2df8f293': 'prb-simple',
 'ec7b0eb8': 'prb-simple',
 '79201024': 'prb-simple',
 '12dbe3de': 'prb-simple',
 '589cd7a6': 'prb-simple',
 'a478f9f5': 'prb-simple',
 'dae79de4': 'prb-simple',
 '1b8e412e': 'prb-simple',
 'b8150b17': 'prb-simple',
 'c943acba': 'prb-simple',
 '0a99e5bb': 'prb-simple',
 '4e527894': 'prb-simple',
 '46b2e169': 'prb-simple',
 'ecf8d15f': 'prb-simple',
 'e9ed719f': 'prb-simple'}

TYPES = {'prb-simple': {'name': 'One feature: count over total',
                'spot': 'A single draw asks for one color, category, sign, or row/column total.',
                'steps': ['Name the entire group being sampled. “At random” describes the selection; it does '
                          'not shrink this group.',
                          'Count every member with the requested feature, adding across rows or columns if '
                          'needed.',
                          'Divide that count by the group total. Give a decimal or fraction when percent is '
                          'excluded.'],
                'trap': 'A two-way table does not automatically make the question conditional. A row total '
                        'can be the numerator over the grand total.',
                'desmos': 'Optional arithmetic: type 13/(13+37). Desmos cannot choose the group for you.',
                'worked': ['46b2e169',
                           'There are 13 red pens and 37 blue pens. The total is 50, so '
                           'P(red)=13/(13+37)=13/50=0.26. The denominator is all pens, not just the 37 blue '
                           'pens.']},
 'prb-given': {'name': 'One restricted row or column',
               'spot': '“Given that”, “of the”, or “if the person works in…” names the group you may choose '
                       'from.',
               'steps': ['Read the restriction first and mark that row or column.',
                         'Add within that restricted group to get the denominator.',
                         'Use only the wanted members inside that same group as the numerator.'],
               'trap': 'Reversing the condition changes the denominator: P(master’s | HR) differs from P(HR '
                       '| master’s).',
               'desmos': 'Optional: 2/(4+2) evaluates the HR example. The reading decision comes first.',
               'worked': ['f8696cd8',
                          'The condition is Human Resources. HR has 4 bachelor’s and 2 master’s employees, '
                          'so its total is 6. The wanted count is 2: P(master’s | HR)=2/6=1/3. Using 2/8 '
                          'would reverse the condition; 2/15 would describe a joint event.']},
 'prb-joint': {'name': 'Two features on one selection',
               'spot': 'One object must satisfy both descriptions; the selection is still from the whole '
                       'table.',
               'steps': ['Find the intersection cell where both descriptions hold.',
                         'Add all disjoint cells if the grand total is not printed.',
                         'Divide the intersection count by the grand total.'],
               'trap': '“Camping but no bicycle paths” is two features of one park, not a condition that '
                       'limits selection to camping parks. Do not multiply probabilities without evidence of '
                       'independence.',
               'desmos': 'Optional: 5/(20+5+8+4).',
               'worked': ['0301c5dc',
                          'Five parks have camping facilities and no bicycle paths. All parks total '
                          '20+5+8+4=37, so the probability is 5/37. The tempting 5/25 would apply only if '
                          'the selected park were already known to have camping.']},
 'prb-complement': {'name': 'Not, neither, or the remaining category',
                    'spot': 'The requested category is excluded from other named categories, or is the '
                            'leftover group.',
                    'steps': ['Keep the sampling group fixed.',
                              'For “not A”, subtract A’s count or probability from the total or 1. For '
                              '“neither blue nor yellow”, count every remaining color.',
                              'If a count is requested, multiply the remaining probability by the total.'],
                    'trap': 'A remaining probability such as 0.28 is not the requested number of people. '
                            'Subtract category probabilities only when those categories cannot overlap.',
                    'desmos': 'Optional: (1-0.48-0.24)*350.',
                    'worked': ['1fc4f47b',
                               'Each customer is in exactly one of theaters A, B, C. P(C)=1-0.48-0.24=0.28. '
                               'With 350 customers, C contains 0.28×350=98 customers. The answer is 98, not '
                               '28.']},
 'prb-count': {'name': 'Turn a probability or rate into a count',
               'spot': 'The question gives a chance and total but asks “how many”, or gives a daily rate '
                       'before asking for a fraction.',
               'steps': ['Write wanted count = probability × matching total.',
                         'Use the total from the correct date and retain units such as millions.',
                         'If a rate must first produce a count, multiply rate × time, then divide by the '
                         'named whole. Round only as requested.'],
               'trap': 'A probability is a fraction, not a count. Extra historical totals may be irrelevant.',
               'desmos': 'Optional: 0.43*97 gives 41.71; round to 42 only because the question requests the '
                         'nearest integer.',
               'worked': ['585de39a',
                          'September has 97 million subscribers and MTN’s probability is 0.43. Thus '
                          'p=0.43×97=41.71 million, so p rounds to 42. The earlier 83-million total is not '
                          'the September denominator.']},
 'prb-missing': {'name': 'Recover a missing cell or total',
                 'spot': 'A table contains a question mark or x, sometimes together with a known '
                         'probability.',
                 'steps': ['If the whole is known, subtract all the other disjoint cells from it. Do not '
                           'subtract margins as well as their cells.',
                           'If a probability is known, write wanted count / restricted total = given '
                           'probability. Include x in that total if it belongs there.',
                           'Solve and check that the reconstructed counts satisfy the table and '
                           'probability.'],
                 'trap': 'Do not use the grand total when the given chance applies only to one row.',
                 'desmos': 'Optional equation check: 2/(10+8) equals 1/9. Solve the short equation by hand.',
                 'worked': ['d4413871',
                            'Only rhesus-negative people may be selected. Their row total is 7+2+1+x=10+x, '
                            'and 2 have type B. Therefore 2/(10+x)=1/9, so 18=10+x and x=8. The '
                            'positive-rhesus row is irrelevant.']},
 'prb-pooled': {'name': 'A condition spans several rows or categories',
                'spot': '“At least”, “not in group 2”, or a condition across repeated rows requires '
                        'combining several cells.',
                'steps': ['Translate the condition into all eligible categories, including boundary values.',
                          'Add or build the eligible counts; multiply each per-row count by its number of '
                          'rows before pooling.',
                          'Inside that eligible group, add the wanted counts and divide by the eligible '
                          'total. Percentages may replace counts when they share one whole.'],
                'trap': 'Do not average group probabilities: groups can contribute different numbers of '
                        'eligible objects. “At least 10” includes both 10–19 and 20+.',
                'desmos': 'Optional: (5*9)/(6*8+5*9). Parentheses keep the full eligible sum in the '
                          'denominator.',
                'worked': ['e438ec3f',
                           'Among trees at least 20 feet tall, birches contribute 6×8=48 and maples '
                           'contribute 5×9=45. There are 93 eligible trees, so P(maple | tall)=45/93=15/31. '
                           'Using 9/(8+9) ignores the different numbers of rows.']},
 'prb-percent': {'name': 'A conditional percent',
                 'spot': '“What percent of states with…” restricts the denominator and asks for percent '
                         'units.',
                 'steps': ['Identify the group following “of”.',
                           'Divide the wanted subset by that group’s total.',
                           'Multiply by 100 and round the percent to the requested precision.'],
                 'trap': '6/50=12% uses all states. A conditional percent here uses only the 45 sales-tax '
                         'states.',
                 'desmos': 'Optional: 100*6/(39+6), then round the displayed percent to one decimal place.',
                 'worked': ['5dc386fb',
                            'The states with a sales tax number 39+6=45. Of these, 6 have no income tax. The '
                            'requested percent is (6/45)×100=13.333…%, or 13.3% to the nearest tenth.']},
 'prb-counting': {'name': 'Count integers satisfying every condition',
                  'spot': 'A randomly chosen integer must be even and within a stated range.',
                  'steps': ['Count all possible integers in the original set; endpoints matter.',
                            'Count only integers satisfying every requested property. Listing a short '
                            'pattern can establish the count.',
                            'Divide qualifying count by original set size unless the question explicitly '
                            'conditions on a subset.'],
                  'trap': '“Even and at most 50” does not change the denominator to 50 when selection is '
                          'from 1 through 160.',
                  'desmos': 'Optional arithmetic: 25/160. No combinatorics command is needed for this bank’s '
                            'question.',
                  'worked': ['9ce8cbbe',
                             'The set has 160 numbers, 1 through 160. Favorable numbers are 2,4,…,50, which '
                             'gives 25 outcomes. Therefore P(even and at most 50)=25/160=5/32, not 25/50.']},
 'prb-symbolic': {'name': 'Write probability with a variable',
                  'spot': 'Counts include a letter and the answer is requested “in terms of” that letter.',
                  'steps': ['Use the variable count for the wanted category.',
                            'Add all categories to form the total, keeping the expression symbolic.',
                            'Write wanted / total; test a small positive value if choices look similar.'],
                  'trap': 'Wanted / other is a ratio of categories, not a probability. The total must '
                          'include the wanted category too.',
                  'desmos': 'No calculator needed. As a check, setting n=12 should give 1/2.',
                  'worked': ['2a08d878',
                             'There are n nonfiction books and 12 fiction books. The total is n+12, so '
                             'P(nonfiction)=n/(n+12). The expression n/12 compares nonfiction to fiction '
                             'instead of to all books.']},
 'prb-closest': {'name': 'Closest to a fraction of a subgroup',
                 'spot': 'A category’s count should be closest to a stated fraction of a restricted total.',
                 'steps': ['Find the total of the named subgroup.',
                           'Multiply this total by the target fraction.',
                           'Compare each eligible category count with that target using absolute '
                           'differences.'],
                 'trap': 'Use the total female population, not the exhibit total, and compare female counts '
                         'rather than each species’ female percentage.',
                 'desmos': 'Optional: 180/3 gives the target 60. Compare distances 1,33,6,20.',
                 'worked': ['a3384df0',
                            'One third of the 180 female penguins is 60. Female counts are 59 chinstrap,27 '
                            'emperor,54 gentoo,40 macaroni. Their distances from 60 are 1,33,6,20, so '
                            'chinstrap is closest.']}}
