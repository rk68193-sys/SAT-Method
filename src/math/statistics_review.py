"""Review additions from all 195 statistics and inference questions.

Pages are one-based; calculator entries are suggestions, not live verification.
"""

SOURCE_NOTES = {'85939da5': {'page': 1215,
              'title': 'A margin of error does not make interval values equally likely',
              'text': 'The official explanation correctly forms 27%–33% from 30% ± 3 percentage points, but '
                      'then says any value in that interval is equally likely. The margin of error alone '
                      'supplies no uniform probability distribution over the population percentage. The '
                      'keyed answer D, that 35% is doubtful, remains the intended conclusion.',
              'entry': 'Use the interval as a range of plausible population percentages; do not assign equal '
                       'probabilities to its points or say values outside it are impossible.'},
 '6a305cd0': {'page': 1610,
              'title': 'The interval is plausible, not guaranteed',
              'text': 'The official rationale says the population mean “will fall” between 34 and 40. A '
                      'sample mean of 37 with margin 3 supports that interval as plausible; it does not '
                      'guarantee coverage. Choice C is the intended best answer. The explanations for '
                      'choices A and B also discuss values below 34 or above 40, although the printed '
                      'choices compare with 37.',
              'entry': 'Read C as the plausible interval 37 ± 3 = [34,40]. Neither a direction from 37 nor '
                       'exact certainty follows.'}}

CASES = [{'type': '1vd-mean',
  'title': 'Bound integer histogram means at the allowed endpoints',
  'ids': ['f8a322d9'],
  'spot': 'Two same-shaped histograms ask for the smallest possible mean difference; each bin is '
          'lower-inclusive and upper-exclusive.',
  'hand': 'Minimize every A value and maximize every B value. A uses 20,30,40,50 with frequencies 3,4,7,9; B '
          'uses 19,29,39,49 with those frequencies. Each paired value differs by 1, so the mean difference '
          'is 1. A 10-unit shift in bin labels does not fix the raw-data mean difference at 10.',
  'calculator': 'Optional: (3*20+4*30+7*40+9*50)/23-(3*19+4*29+7*39+9*49)/23. Do not enter bin midpoints as '
                'exact observations.',
  'check': 'Integers below 20 end at 19. If the data were unrestricted real numbers, that endpoint argument '
           'would change.'},
 {'type': '1vd-mean',
  'title': 'Use divisibility as well as the mean equation',
  'ids': ['190be2fc'],
  'spot': 'A missing positive integer is bounded, and the final mean must itself be an integer.',
  'hand': 'Nine known values have sum 9*42=378. The tenth x must exceed 42 to raise the mean and must be '
          'below 60. Since (378+x)/10 is integral, x ends in 2. The only allowed value is 52, also the '
          'largest value in the completed set.',
  'calculator': 'Optional: (378+52)/10=43. Test constraints after solving; an unrestricted decimal solution '
                'does not meet the integer requirement.',
  'check': '42 would keep the mean unchanged; 62 violates the upper bound. The only valid answer is 52.'},
 {'type': '1vd-change',
  'title': 'Balanced outward changes preserve the sum but increase spread',
  'ids': ['457d2f2c'],
  'spot': 'An odd number of distinct values has equal mean and median; values on each side move outward by '
          'the same amount.',
  'hand': 'There are 13 values below 33 and 13 above. Subtracting 7 thirteen times and adding 7 thirteen '
          'times has net change zero, so sum and mean remain fixed. No value crosses 33, so the median '
          'remains 33. Every changed distance from the unchanged mean increases, so standard deviation '
          'increases.',
  'calculator': 'No calculation is needed. A numerical illustration may show the mechanism, but the equal '
                'counts and unchanged mean prove it for all 27 values.',
  'check': 'The distinct-values condition guarantees exactly 13 values on each side. This is not the same '
           'operation as adding 7 to every value.'},
 {'type': 'stc-general',
  'title': 'The sampling frame can be broader than the displayed table',
  'ids': ['7d68096f', 'b695711c'],
  'spot': 'A study samples one population, then displays only participants meeting a practice threshold.',
  'hand': 'For the question about the study’s largest generalization population, trace the original random '
          'selection. The trivia study samples 55 from all tournament teams, even though its table displays '
          '40. The piano study samples 85 second-year conservatory students in one region, even though its '
          'table displays 75. Keep all original geographic and year restrictions.',
  'calculator': 'No calculator helps identify a sampling frame. Underline the sentence describing random '
                'selection before inspecting the table.',
  'check': 'Answers: all tournament teams; all second-year conservatory piano students in the specified '
           'region. A table-only conditional claim would still concern its displayed subgroup.'},
 {'type': 'inf-estimate',
  'title': 'Scale the winning margin, not just the winner’s votes',
  'ids': ['916ffe9b'],
  'spot': 'An election poll asks “by how many votes” the winner is expected to win.',
  'hand': 'The sample lead is 483-320=163 votes among 803. Expected turnout 6424 is 8 times the sample size. '
          'Scale the lead: 163*8=1304. Alternatively subtract the projected totals 3864-2560.',
  'calculator': 'Optional: 6424*(483-320)/803. The denominator is the entire poll, not only the winner’s '
                'supporters.',
  'check': '3864 estimates Cruz’s votes; 163 is the poll lead; 1304 estimates the election lead.'},
 {'type': '2vd-predict',
  'title': 'Scale both fitted coefficients when all outputs scale',
  'ids': ['2e8027b0'],
  'spot': 'A second data set multiplies every y-coordinate by a fixed positive factor.',
  'hand': 'The original fitted line is approximately y=12+1.5x. Multiplying every output by 3.9 gives '
          'y=46.8+5.85x. Both the intercept and the slope scale; x is unchanged. Select the nearby model '
          'y=46.8+5.9x.',
  'calculator': 'Optional: 3.9*(12+1.5x), then distribute or compare 3.9*12 and 3.9*1.5. Do not refit '
                'invented data points.',
  'check': 'The new line passes approximately through (0,46.8) and (12,117). Scaling only the slope or only '
           'the intercept fails one of these checks.'},
 {'type': '2vd-predict',
  'title': 'A truncated horizontal axis hides the true intercept',
  'ids': ['1e1027a7'],
  'spot': 'The plot starts near x=10; a choice incorrectly uses the visible left-edge height as the '
          'y-intercept.',
  'hand': 'Use points on the fitted line, approximately (12,480) and (24,880). The slope is about 400/12≈33. '
          'Then b=y-mx≈480-33*12=84. The intercept belongs at x=0, even when x=0 is not displayed.',
  'calculator': 'Optional: (880-480)/(24-12), then 480-33*12. Match the level of approximation used by the '
                'offered choices.',
  'check': 'The model d=33t+84 predicts 480 at t=12. A constant term 300 confuses the chart’s visible lower '
           'edge with the intercept.'},
 {'type': '2vd-read',
  'title': 'Average only the observed points meeting the input condition',
  'ids': ['e97fd3f8'],
  'spot': 'A scatterplot statement gives an x-range and asks for the average of the corresponding y-values.',
  'hand': 'For widths between 18 and 48 cm, select the five observed boards at widths 24,24,30,36,42. Their '
          'prices are 10,15,20,30,40 dollars. The mean price is 115/5=23 dollars. Repeated x=24 marks two '
          'distinct boards.',
  'calculator': 'Optional: mean([10,15,20,30,40]). Do not average the widths or substitute points on an '
                'imagined fitted line.',
  'check': 'The subgroup with widths greater than 48 has a different mean, 63.75 dollars; changing the input '
           'filter changes the data being averaged.'},
 {'type': '2vd-model',
  'title': 'Percent of the input is linear; percent of the previous output is exponential',
  'ids': ['9b5b23fc', '58171b5e'],
  'spot': 'Both prompts mention percentages, but they apply the percent to different quantities.',
  'hand': '“201% of x” means f(x)=2.01x, an increasing line. “Increases by 0.49% of its value the previous '
          'year” multiplies the previous output by 1.0049, an increasing exponential. Identify what the '
          'percent is taken of before choosing the model.',
  'calculator': 'Optional comparison: graph 2.01x and 1.0049^x using sensible windows. Model identification '
                'follows from the definition, not the appearance of one small graph window.',
  'check': 'A percentage word alone does not imply exponential change. The recurrence or fixed ratio between '
           'successive outputs is the distinguishing feature.'},
 {'type': '2vd-rate',
  'title': 'Compare annual earnings rather than starting balances',
  'ids': ['af142f8d'],
  'spot': 'One account starts smaller but compounds; another has a larger balance and fixed annual dollar '
          'growth.',
  'hand': 'Account A begins at 500 dollars and first earns 0.06*500=30 dollars. Later yearly interest '
          'exceeds 30 as its balance grows. Account B earns exactly 25 dollars each year. Therefore A earns '
          'more every year even though its initial balance is smaller.',
  'calculator': 'Optional: first-year earnings 0.06*500 versus 25. Comparing total balances alone would '
                'answer a different question.',
  'check': 'The conclusion concerns each year’s increase, not which account has the larger balance on a '
           'particular date.'},
 {'type': '1vd-spread',
  'title': 'Use median, mean, and range together to recover endpoints',
  'ids': ['cf2be18d'],
  'spot': 'An ordered list contains unknown minimum, middle, and maximum values and gives three summary '
          'statistics.',
  'hand': 'Seven values make the fourth value b equal to median 29. A mean of 36 requires sum 252, giving '
          'a+c=90 after subtracting known values. Range 72 gives c-a=72. Add the equations to obtain 2c=162, '
          'so c=81 and a=9.',
  'calculator': 'Optional check: mean([9,26,29,29,31,47,81])=36; 81-9=72. No regression is involved.',
  'check': 'Check the recovered values preserve the stated ascending order. The range is a difference, not '
           'the maximum itself.'}]
