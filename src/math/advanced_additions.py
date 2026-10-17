"""New findings from full Advanced Math question and rationale review."""
TYPE_CORRECTIONS = {
    '301faf80': 'nle-solve',
    'f65288e8': 'nle-solve',
    '4a0d0399': 'nlf-yint',
    '768b60d2': 'nlf-yint',
    'cc6ccd71': 'nlf-zeros',
    '95d1c344': 'nlf-yint',
    'ffdfe1e1': 'nlf-exp',
    'dd3b1e1a': 'nlf-yint',
    '35e05e19': 'nlf-geom',
    '821e724e': 'nlf-yint',
    '5da5c665': 'nle-sign',
}
SOURCE_NOTES = {
    '203774bc': {
        'page': 218,
        'title': 'Middle-term split has reversed signs',
        'text': 'The source rewrites 2y²+11y-546 as 2y²+28y-39y-546, whose middle coefficient is -11. The next factorization is correct for the original polynomial; the split must instead be -28y+39y. The key 14 remains correct.',
        'entry': 'Use 2y²-28y+39y-546=2y(y-14)+39(y-14)=(2y+39)(y-14). Positive integer y=14 and x=39.'
    },
    '00165291': {
        'page': 160,
        'title': 'Equal root equations do not imply equal selected roots',
        'text': 'The alternate rationale says that a is equal to c because 2a²-31a+105=0 and 2c²-31c+105=0 represent the same equation. This implication is false: a and c may be different roots, and the given integer/noninteger conditions require a=5 and c=21/2. The answer 15.5 and primary derivation are correct.',
        'entry': 'Both parameters belong to the root set {5,21/2}. Select a=5 using integrality and c=21/2 using nonintegrality, then add.'
    },
    '4e18fc5d': {
        'page': 3,
        'title': 'Positivity conditions contradict the equation',
        'text': 'The source states that v, w, and x are distinct positive numbers, but v=-w/(150x) is negative whenever w and x are positive. Thus no triple satisfies all conditions. The formal rearrangement w=-150vx (choice A) is algebraically correct.',
        'entry': 'Multiply by -150x for x nonzero to obtain w=-150vx. Flag the inconsistent positivity premise rather than silently treating it as satisfiable.'
    }
}
CASES = []

SOURCE_NOTES.update({
 '22fd3e1f': {'page':237,'title':'Distractor check uses an excluded input','text':'The source rejects choice A by evaluating at x=0 although the question restricts x>3. The answer D is correct; the counterexample should respect the stated domain.','entry':'Factor and cancel x-3 only for allowed inputs. At x=4, the original expression and D equal28/5 whereas A equals1/5.'},
 '29ed5d39': {'page':302,'title':'Rationale solves a different equation','text':'The question gives p=20+16/n with p>20, but the entire source derivation uses p=9+14/n and p>9. Choice D remains correct for the actual question.','entry':'Subtract20 to obtain p-20=16/n, multiply by nonzero n, and divide by positive p-20: n=16/(p-20).'},
 'c6e85cd7': {'page':293,'title':'Incorrect decimal entry example','text':'The exact answer7/24 and main exponent derivation are correct, but the source lists0.219 as a valid answer. It is not a rounding or truncation of7/24.','entry':'Equate exponents8c=7/3, so c=7/24≈0.2916667. Use7/24 or an appropriately rounded decimal.'},
 '2d1614a1': {'page':313,'title':'Distractor explanation changes the growth interval','text':'The main solution correctly identifies factor1.04 every18months from exponent(2/3)t, but the choice B explanation incorrectly says the factor1.04 applies each year.','entry':'Over18months=3/2years the exponent increases by1, hence4% growth per18months. The annual factor is1.04^(2/3).'}
})

SOURCE_NOTES['5edc8c98'] = {'page':424,'title':'Factored expansion drops the leading coefficient on the constant term','text':'The source expands64(x-p)(x-q)=0 as64x²-64(p+q)x+pq=0. The final term must be64pq. The subsequent x-coefficient comparison and answer1/16 remain correct, as does the alternate derivation.','entry':'Use64x²-64(p+q)x+64pq=0. Compare x-coefficients to obtain p+q=(16a+4b)/64=(4a+b)/16.'}

SOURCE_NOTES['b73ee6cf'] = {'page':498,'title':'Distractor explanation calls a decay impossible','text':'Choice A is50,000=60,000(0.03)^t. Its explanation says decreasing from60,000 to50,000 is impossible given the growth factor. This equation actually uses a decay factor0.03 and does have a positive time solution; it simply models the wrong initial value, direction, and rate. The correct answer D is unchanged.','entry':'Use target=initial*(1+rate)^time:60,000=50,000(1.03)^t. Reject A because it describes97% decay starting at60,000.'}

SOURCE_NOTES['08d03fe4'] = {'page':499,'title':'Displayed forms are not equivalent and rationale changes the base','text':'The original question image labels50*2^(x+1),80*2^x,128*2^(x-1),205*2^(x-2) as equivalent forms. Their values atx=1 are200,160,128,102.5, so that premise is false. The rationale instead uses128*(1.6)^(x-1). C still displays its own valuef(1)=128 as coefficient.','entry':'Read C atx=1:128*2^0=128. Flag the inconsistent equivalence premise and base mismatch; do not silently rewrite the source forms.'}
