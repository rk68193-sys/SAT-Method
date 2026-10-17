"""Source-backed additions from full question/rationale reading.

Examples cite committed original q/r images. Calculator entries are authored
suggestions, not claims of runtime verification. Review progress is recorded in
src/build/reviews/algebra.json; no claim of completeness is made here.
"""
TYPE_CORRECTIONS = {
    '3a3b95df': 'lf-eval',
    '1b1deebe': 'sys-solve',
    'd4572f55': 'lf-table',
    '686b7244': 'le2-interpret',
    'ee846db7': 'le2-interpret',
    '1087f6c4': 'le2-interpret',
    '979c6ebc': 'sys-solve',
    '64c85440': 'inq-model',
}
SOURCE_NOTES = {
    '1e11190a': {
        'page': 1031,
        'title': 'The berry calculation gives B, despite the rationale label C',
        'text': 'The original question lists B as 5 pints and C as 8 pints. The rationale correctly computes 5 pints of blackberries but labels the answer C and rejects B. It also calls D the raspberry count, although the system gives 4 pints of raspberries (A), not 12 (D). The committed and uploaded PDF answer keys correctly give B.',
        'entry': 'Use r=4 and b=5: 5.50(4)+3(5)=37 and 6.50(4)+8(5)=66. The requested blackberry count is 5, choice B.'
    },
    '153ee763': {
        'page': 967,
        'title': 'Check the zero coefficient before dividing',
        'text': 'The original rationale divides x(1-7p)=-28 by 1-7p and then calls the resulting quotient equation false when 1-7p=0. That quotient is undefined there, and the division is not equivalent at that parameter. The final answer 1/7 is correct.',
        'entry': 'Keep (-3+21p)x=84. Set -3+21p=0 to get p=1/7; the original equation then reads 0=84, so no x works.'
    },
    'ee7b1de1': {
        'page': 845,
        'title': 'The candle solution has a subtraction typo before the correct bound',
        'text': 'The original rationale correctly obtains 980+6.70l<=2200, then says subtracting 980 gives 6.70l<=2200. The right side should be 1220. The following bound l<=182.09 and final answer 182 use the correct subtraction.',
        'entry': 'Compute (2200-980)/6.70=182.0895...; 182 large and 18 small candles cost 2199.40 dollars. 183 large with at least 17 small cost 2206.10 dollars.'
    },
    'bf5f80c6': {
        'page': 811,
        'title': 'The worked coordinates establish A, despite the rationale label D',
        'text': 'The original question asks which point satisfies y<-4x+4. Choice A is (-4,0), and 0<20 is true. Choice D is (2,-1), and -1<-4 is false. The original rationale says choice D but correctly checks (-4,0), then incorrectly rejects A. The committed answer and uploaded PDF key are A and are correct; this is a rationale answer-letter mismatch.',
        'entry': 'Substitute each candidate into the inequality. A: 0<20 is true. B: 5<4 is false. C: 1<-4 is false. D: -1<-4 is false.'
    },
    '71189542': {
        'page': 673,
        'title': 'The 38 is a deficit of people, not a count of tents',
        'text': 'The alternate explanation says “each of these 38 tents” after calculating a 38-person capacity deficit. The correct calculation immediately following it divides 38 by 2 to obtain 19 two-person tents. The answer C and the main elimination solution are correct.',
        'entry': 'Read the deficit as 38 people. Each replacement of a four-person tent by a two-person tent removes two places, so 38/2=19 tents.'
    },
    '64c85440': {
        'page': 677,
        'title': 'The intended parking interval assumes the curb is fully allocated',
        'text': 'The official solution obtains 15 through 18 spaces by dividing the 135-foot curb by the permitted widths 9 through 7.5 feet. The lower bound 15 uses an implicit full-use assumption: if unused curb were allowed, fewer than 15 spaces could also be placed. Read D under the intended full-curb layout.',
        'entry': 'For a layout allocating all 135 feet to n equal-width standard spaces, 7.5<=135/n<=9 gives 15<=n<=18, with integer n.'
    }
}
CASES = [
    {'type': 'inq-sys', 'title': 'Describe every possible output after eliminating an input', 'ids': ['830120b0'],
     'spot': 'A system asks for all possible y-coordinates, rather than for one feasible point.',
     'hand': 'From 2x>5, x>5/2. From y>2x-1, x<(y+1)/2. Such an x exists exactly when 5/2<(y+1)/2, or y>4. This proves both that every solution has y>4 and that every y>4 can occur.',
     'calculator': 'Optional illustration: y=5 permits 2.5<x<3, so x=2.75 works. Boundary y=4 would require x>2.5 and x<2.5 simultaneously. These samples illustrate the exact interval argument.',
     'check': 'A necessary lower bound alone does not establish all possible values. Show the remaining input interval is nonempty for every output in the claimed set.'},
    {'type': 'lf-eval', 'title': 'Match the complete function input', 'ids': ['0b0fa68b'],
     'spot': 'A rule is stated as f(cx)=x-8, while a separate value is given at the input 2.',
     'hand': 'The output f(2)=35 means x-8=35, so the rule parameter x must be43. Its function input is then c*43=2, giving c=2/43. Equivalently set u=cx to obtain f(u)=u/c-8.',
     'calculator': 'Optional arithmetic: 2/(35+8). Verify the candidate by calculating 2/(2/43)-8=35. Define f(u)=u/(2/43)-8 only after solving the parameter relationship.',
     'check': 'The x in f(cx) is not the input itself. Substituting x=2 would evaluate f(2c), rather than the given f(2).'},
    {'type': 'sys-solve', 'title': 'Parameterize the entire common line', 'ids': ['979c6ebc'],
     'spot': 'A system has equivalent equations and asks which point lies on both for every real parameter r.',
     'hand': 'Divide 28x+24y=20 by 4 to see that both equations are 7x+6y=5. Choose y=r and solve x=(5-6r)/7. Thus ((5-6r)/7,r) describes every point on the common line.',
     'calculator': 'Optional numeric checks: use r=0 and r=7, giving (5/7,0) and (-37/7,7). These checks reject incorrect choices; substitution 7((5-6r)/7)+6r=5 proves the family.',
     'check': 'The coordinate assigned to r matters. If x=r instead, y=(5-7r)/6. Do not read one graph intersection as the entire solution set.'},
    {'type': 'sys-solve', 'title': 'Eliminate an unknown compound term to recover a parameter', 'ids': ['1b1deebe'],
     'spot': 'The system ax+by=72 and 6x+2by=56 intersects at (4,y), with a and b unknown.',
     'hand': 'Subtract twice the first equation from the second: (6-2a)x=-88. Insert the known x=4 to get 6-2a=-22 and a=14. Neither b nor the intersection y-coordinate is needed.',
     'calculator': 'Optional arithmetic: (56-2*72)/4=-22, then (6+22)/2=14. Sliders for both unknown coefficients add work and do not establish a unique answer.',
     'check': 'The premise guarantees a consistent intersection. Here by=-16, so b cannot be zero; graphing arbitrary b=0 would contradict the premise.'},
    {'type': 'lf-table', 'title': 'A symbolic output offset cancels in the slope', 'ids': ['d4572f55','3008cfc3'],
     'spot': 'A linear table contains a constant added to every output, or a common unknown shift in inputs.',
     'hand': 'For d4572f55, points (-34,t),(-17,t+23),(0,t+46) give slope ((t+23)-t)/17=23/17 and intercept t+46. For 3008cfc3 the input difference (k+7)-k=7 gives slope -4; moving five units back from (k,13) gives intercept output 33.',
     'calculator': 'Use numerical differences 23/17 or (-15-13)/7 after canceling the shared symbol by hand. A numeric regression cannot infer a unique symbolic offset from unspecified t.',
     'check': 'An arbitrary value of the offset is an illustration, not a proof for all offsets. The exact x=0 table row exposes the symbolic y-intercept.'},
    {'type': 'sys-solve', 'title': 'Treat repeated scaled quantities as whole unknowns', 'ids': ['edc1b7b7'],
     'spot': 'Equations repeat groups such as 8x and 7y, and the question asks for their combination.',
     'hand': 'Let u=8x and v=7y. Then 2u+4v=12 and -2u+4v=12. Adding gives 8v=24, so v=3; substitution gives u=0. The requested 8x+7y is u+v=3.',
     'calculator': 'Graph 2x+4y=12 and -2x+4y=12 only if x and y are explicitly relabeled as u and v; their intersection (0,3) is in grouped coordinates.',
     'check': 'A calculator point from the relabeled equations is not the original (x,y)=(0,3/7). Keep the variable definitions visible.'},
    {'type': 'inq-maxmin', 'title': 'A minimum count makes heavy items consume only the upgrade budget', 'ids': ['f224df07'],
     'spot': 'At least 10 packages, each 100 or 120 pounds, must fit within 1100 pounds.',
     'hand': 'Ten light packages weigh 1000 pounds. Replacing one by a heavy package adds 20 pounds. The remaining 100 pounds allow five upgrades. Five heavy plus five light packages meet both bounds, so five heavy packages are attainable and maximal.',
     'calculator': 'Optional: (1100-10*100)/(120-100)=5. Verify 5*120+5*100=1100 and 5+5=10.',
     'check': 'The baseline argument needs nonnegative integer counts and must establish attainability. Dividing the total capacity by 120 alone ignores the minimum package count.'}
]

# Further findings from the final 141 full question/rationale reads.
SOURCE_NOTES.update({
    'daad7c32': {
        'page': 1102,
        'title': 'The reverse spring rate is not the variable w',
        'text': 'The original rationale correctly selects D: the spring length increases 2 centimeters per newton. Its explanation of distractor C says this describes the value w. In fact C describes the reverse rate, the increase in weight per centimeter, which is 1/2 newton per centimeter. The variable w is the weight itself. The answer D is unchanged.',
        'entry': 'For L=30+2w, delta L/delta w=2 cm/N. Solving w=(L-30)/2 gives delta w/delta L=1/2 N/cm.'
    },
    'a1fd2304': {
        'page': 1146,
        'title': 'The mixture equation conserves salt, not total solution volume',
        'text': 'The original rationale calls volume times concentration the total amount of saline solution. Those products measure the salt contribution; total solution volume is x+3 liters. The subsequent salt-balance equation and answer 1.5 liters are correct.',
        'entry': 'Use 0.10(3)+0.25x=0.15(3+x). For x=1.5, salt contributions sum to0.675, equal to0.15(4.5); the mixture volume is4.5 liters.'
    }
})

CASES.extend([
    {'type': 'sys-count', 'title': 'Check a third constraint at the sole existing intersection', 'ids': ['27f5fff3'],
     'spot': 'A graph of two intersecting lines is supplemented with a third linear equation.',
     'hand': 'The original two lines intersect only at(8,2). Any point satisfying all three must first satisfy those two, so(8,2) is the only candidate. The added equation x+4y=-16 fails there because8+4(2)=16, not-16. Thus the full system has zero solutions.',
     'calculator': 'Optional illustration: graph y=2, x+4y=16, and x+4y=-16. The original pair meet at(8,2); the third line misses that point. Direct substitution proves the failure without relying on plotted precision.',
     'check': 'Three pairwise intersections do not establish one common intersection. This shortcut assumes the original two equations have exactly one common point; coincident originals require another consistency check.'},
    {'type': 'sys-graph', 'title': 'Match the solution set rather than matching the original lines', 'ids': ['2704399f'],
     'spot': 'A replacement system is requested to have the same solution as a graphed system.',
     'hand': 'The original lines intersect at(3/2,0). The very different equations x=3/2 and y=0 have exactly that one common solution, so they form a valid replacement system. Neither replacement equation needs to describe an original line.',
     'calculator': 'Optional: graph x=3/2 and y=0 to see their common point. Inspect the original graph independently before deciding that its intersection has the same coordinates.',
     'check': 'Matching a system solution is weaker than making each equation equivalent to an original equation. Preserve both coordinate order and the requirement that the replacement system has no additional solutions.'},
    {'type': 'le1-word', 'title': 'Conserve the solute when the mixture volume changes', 'ids': ['a1fd2304'],
     'spot': 'An unknown amount of one concentration is added to a known amount to reach a target concentration.',
     'hand': 'Let x be liters of25% solution added to3 liters of10% solution. Salt before mixing is0.25x+0.10(3); the final volume is x+3 and target salt is0.15(x+3). Equating these gives0.10x=0.15 and x=1.5 liters.',
     'calculator': 'Optional: graph y=0.25x+0.30 and y=0.15(x+3), reading x=1.5. Verify0.675/4.5=0.15 after solving.',
     'check': 'The final solution amount is x+3, not x. Concentration times volume measures the solute contribution under the stated mixture model; do not equate concentrations directly or average them without volume weights.'},
    {'type': 'lf-model', 'title': 'Count only the units beyond the first price tier', 'ids': ['bbf9e5ce','67d63e19','36ab4122'],
     'spot': 'The first fixed number of people, days, or hours has one price and later units have another.',
     'hand': 'For n museum visitors, the first25 cost21(25), and only n-25 cost14 each. Thus f(n)=525+14(n-25)=14n+175 on n>=25. Similarly, d rental days cost52+26(d-1); ten work hours cost8p+1.5p(10-8).',
     'calculator': 'Optional arithmetic: for26 visitors compute21*25+14*(26-25)=539. For two rental days compute52+26*(2-1)=78. Test the first-tier endpoint before trusting an expanded formula.',
     'check': 'Charging the second rate on every unit double-counts the tier already included. The constant175 is an adjustment in the expanded formula, not a real museum charge for zero visitors; the model has a restricted domain.'}
])
