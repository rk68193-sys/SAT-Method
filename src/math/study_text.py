"""Hand-written "Recognize it" lines for the Math study methods (Learn > Expanded types).

The study methods come from an imported pack (import_study_pack.py writes build/mstudy.json). For 127 of the 249
methods the pack's "Recognize it" line was only a template: the method's title followed by "Identify the requested
quantity and match the conditions in the original page before choosing this method." That tells a student nothing
about how to spot the method. Each line below says what the bank's own questions of that method look like: what is
given, and what is asked. They were written for this site after reading every question filed under the method.

The pack's "Why it works" lines had a different problem: 14 sentences were shared among 47 methods (one covered 9
area and volume methods), and some said only that a step keeps an equation or expression equivalent. WHY replaces
those, and others for rules students often forget, with the reason behind the rule and a small worked example.

assemble.py lays these lines over the imported ones, so importing the pack again keeps them.

    python3 -I src/math/study_text.py           writes build/mstudy_text.json
    python3 -I src/math/study_text.py --check   checks that file is current and that every rule below holds
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'build' / 'mstudy_text.json'
TEMPLATE = 'Identify the requested quantity and match the conditions in the original page before choosing this method.'

RECOGNIZE = {
    # Linear equations in one variable
    'L1-identity': 'A linear equation with one or two unknown constants, said to have infinitely many solutions. The question asks for a constant, never for x.',
    'L1-no_solution': 'A linear equation with an unknown constant, said to have no solution. The question asks for that constant, or for what must be true of the constants.',
    'L1-one_solution': 'A linear equation with an unknown constant, said to have exactly one solution. The question asks which value the constant cannot be.',
    'L1-word_model': 'A story with one unknown amount: a fixed part plus a repeated part (a fee plus so much per month), a total split into parts, or a supply used up at a steady rate. The question asks for the matching equation or expression, or for the unknown.',
    'L1-fractions': 'One linear equation with fractions in it, such as x/4 + 2 = 5 or (2/3)(x − 6) = 8. The question asks for the solution.',
    'L1-solve': 'One linear equation with no story and no unknown constants. The question asks for the value of x, or of an expression such as 2x + 1, that makes it true.',
    'L1-rate_interpret': 'An equation models a story, and the question asks what one of its numbers means (“the best interpretation of 2”), or which expression stands for a quantity in the story.',
    # Linear functions
    'LF-inverse': 'A linear function or model and one output, such as f(x) = 20 or a total cost of $50. The question asks which input gives that output.',
    'LF-table': 'A table of x and y values that change at a steady rate. The question asks for the equation of the line, a missing value in the table, or which table fits a given rule.',
    'LF-two_points': 'Two points on the graph of a linear function, or two values such as f(0) = 3 and f(7) = 31. The question asks for the equation that defines the function.',
    'LF-graph': 'A graphed line, usually in a context such as cost per mile or volume against temperature. The question asks for a value read off the line, the amount per unit, or the matching equation.',
    'LF-rate': 'A story with a starting amount and a steady change: a fee plus so much per hour or day, a deposit each week, a height rising so many feet per second. The question asks for the function, its value at some point, or the rate itself.',
    'LF-evaluate': 'A linear function or formula and an input, such as f(4) or the cost for 12 months. The question asks for the output; a few give two outputs and ask for the rule.',
    # Linear equations in two variables
    'L2-perpendicular': 'One line, given by its equation or its graph, and a second line perpendicular to it. Most questions ask for the second line’s slope; a few ask for its equation or for another perpendicular pair.',
    'L2-parallel': 'One line, given by an equation or a graph, and a second line parallel to it, sometimes through a given point. The question asks for the second line’s slope or equation, or for a missing coordinate on it.',
    'L2-translation': 'A line or linear graph is shifted up or down (“translated down 5 units”). The question asks for an intercept of the shifted line.',
    'L2-x_intercept': 'A line known by where it crosses the axes: two of the x-intercept, the y-intercept and the slope are given, and the question asks for the third or for a constant in the equation.',
    'L2-y_intercept': 'The question asks where a line crosses the y-axis: the y-intercept of a graph or equation, what it means in the story (often a starting amount), or the equation with a given slope and y-intercept.',
    'L2-interpret': 'A total made of two kinds of things, such as 5.48x + 7.30y = 1,000, or a linear relationship shown in a story, table or graph. The question asks for the equation, what a number or point means, how much more one kind is worth, or one amount when the other is known.',
    'L2-graph': 'A line in the xy-plane. The question asks which equation matches a graph, the slope of a given equation, or reads a combination off a graph of possible totals.',
    'L2-isolate': 'One equation in two variables, often a mixture or a total such as 2x + 5y = 60. The question gives one variable and asks for the other, or asks which table or form fits the equation.',
    'L2-two_point_recover': 'Points on a line are given: two points, a table of two points, or a slope and one point. The question asks for the equation of the line, its y-intercept, or a missing coordinate.',
    # Systems of linear equations
    'SYS-infinite': 'A system of two linear equations with an unknown constant, or with the second equation missing, said to have infinitely many solutions. The question asks for the constant or a possible second equation.',
    'SYS-none': 'A system of two linear equations said to have no solution, or a question about how many solutions it has. It asks for a constant, a possible second equation, or the number of solutions.',
    'SYS-unique': 'One equation of a system is given, and the system has exactly one solution (or at least one). The question asks which second equation is possible.',
    'SYS-graph_equations': 'Two lines are graphed, and the question asks which system of equations they show.',
    'SYS-graph_intersection': 'Two lines and the point where they cross: the solution read off a graph, which graph shows a system, how many points the graphs share, or a constant found from a given intersection point.',
    'SYS-word_model': 'Two unknown amounts with two facts about them, such as the number of tickets sold and the money they brought in. The question asks for the system of equations or for one of the amounts.',
    'SYS-target': 'A system of two equations, and the question asks for a combination such as x + y, x − y or 8x + 7y, not for x or y alone.',
    # Linear inequalities
    'INEQ-graph': 'A shaded region in the xy-plane. The question asks which inequality it shows, which point lies in it, or a constant in its inequality.',
    'INEQ-system': 'Two or more inequalities, or a story that becomes them, and some candidate points. The question asks which point satisfies all of them, or which system fits the story.',
    'INEQ-integer': 'A story about whole numbers (consecutive integers, a whole number of hours) that becomes an inequality. The question asks for the inequality, or for the largest or smallest whole number that works.',
    'INEQ-model': 'A story with bounds: an amount between two values, a total under a limit, or one cost less than another. The question asks which inequality fits.',
    'INEQ-solve': 'One inequality to solve or test, or a quantity said to vary between two values. The question asks for the solution set, a point that satisfies it, or the inequality for the range.',
    'INEQ-table_points': 'The answer choices are tables of x and y values. The question asks which table holds only solutions to the given inequality or system of inequalities.',
    # Area and volume
    'AREA-scaling': 'Two similar figures, or one figure scaled by a factor, with matching measures given in a table or in words (two perimeters, two areas). The question asks for a length, perimeter, area or volume of the other figure.',
    'AREA-surface': 'A box or rectangular prism with its edge lengths given. The question asks for its surface area, sometimes for a box without a lid.',
    'AREA-sphere': 'A sphere with its radius given, and the question asks for its volume.',
    'AREA-cone': 'A cone with its volume and one other measure given (its height or its base area). The question asks for the radius or the slant height.',
    'AREA-cylinder': 'A cylinder with its radius, diameter or base circumference given, or a second cylinder with a scaled radius and height. The question asks for a volume or the new dimensions.',
    'AREA-pyramid': 'A pyramid with its base dimensions and height given, and the question asks for its volume.',
    'AREA-prism': 'A prism or rectangular solid with some dimensions, and sometimes its volume, given. The question asks for the volume or for the missing edge, height or base area.',
    'AREA-circle': 'A circle with its radius, diameter, circumference or area given, or three points that fix it. The question asks for another of these measures, or compares the circle with a square.',
    'AREA-triangle': 'A triangle with lengths given in words, on a grid or in a figure. The question asks for its area, a missing base or leg from the area, or a missing side from the perimeter.',
    'AREA-rectangle': 'A square, cube or cylinder whose lengths are given or tied to another length (sides k times as long, a radius 25% longer, a height 4 more than the radius). The question asks for a side, a volume or the factor between areas.',
    'AREA-pyramid_height': 'A square pyramid with its total surface area and the area of its four side faces given. The question asks for its height.',
    # Lines, angles and triangles
    'ANG-similarity': 'Two triangles (or quadrilaterals) said to be similar, or a figure where two triangles share their angles. The question asks for a side or angle in one of them, or what extra fact proves them similar or congruent.',
    'ANG-parallel': 'Parallel lines cut by another line, or a segment drawn parallel to a side of a triangle. The question asks for an angle, a length, or which fact proves two lines parallel. Congruent and dilated triangles, whose matching angles are equal, are here too.',
    'ANG-isosceles': 'A triangle with two equal sides (marked in the figure or stated, such as AB = BC) or an equilateral triangle. The question asks for an angle, or which angle or scale factor is possible.',
    'ANG-exterior': 'A figure where the angle you need sits outside a triangle, made by extending a side or by a line crossing two parallel lines. The question asks for that angle or for x in it.',
    'ANG-angles': 'Angles in a triangle or where lines cross: two angles of a triangle, or vertical and straight-line angles at an intersection. The question asks for another angle; a few ask for a length or a ratio in the same figure.',
    'ANG-congruence': 'Two triangles said to be congruent, with some side lengths given. The question asks for a matching length.',
    'ANG-shadow': 'Two upright objects cast shadows at the same time of day. Three of the four heights and shadow lengths are given, and the question asks for the fourth.',
    # Right triangles and trigonometry
    'TRIG-complement': 'A sine set equal to a cosine for two acute angles, or angles given in terms of each other. The question asks for the value that makes the two angles add to 90°, or for an equivalent expression.',
    'TRIG-special30': 'A triangle with angles of 30°, 60° and 90°, or an equilateral triangle with its height or perimeter given. The question asks for a side, the perimeter or the height.',
    'TRIG-special45': 'An isosceles right triangle (angles of 45°, 45° and 90°), or a square inside a circle. The question asks for a side, the hypotenuse or the perimeter.',
    'TRIG-similar_altitude': 'A right triangle with a segment drawn from the right angle perpendicular to the longest side. The question asks for a length in one of the smaller triangles.',
    'TRIG-pythagoras': 'A right triangle with two sides known, in a figure or in words, or hidden in a shape (an isosceles right triangle, a triangle inside a circle). The question asks for the third side, the equation linking the sides, or a perimeter or radius.',
    'TRIG-area': 'A right triangle, or a shape built from triangles, whose area needs a height or side that is not given yet.',
    # Circles
    'CIR-complete_square': 'A circle’s equation written out, with x², y² and plain x and y terms instead of the (x − h)² form. The question asks for the center, the radius, or a value that depends on them.',
    'CIR-arc': 'A circle with a central angle and its arc. Some of the arc length, the angle, the radius and the circumference are given, and the question asks for another.',
    'CIR-radian': 'An angle given in degrees and asked in radians, or given in radians and asked in degrees.',
    'CIR-circle': 'A circle given by its equation, or by its center and points on it. The question asks for the diameter, the equation after a shift, a length to a point, or which point lies inside.',
    'CIR-unit_circle': 'The sine, cosine or tangent of an angle given in radians, or a point on the unit circle tied to an angle.',
    'CIR-coordinate_range': 'A circle’s equation and a point on the circle with one coordinate unknown. The question asks which value that coordinate could, or could not, be.',
    'CIR-diameter_endpoints': 'The endpoints of a diameter, or one endpoint and the center, are given. The question asks for the circle’s equation, a constant in it, or the other endpoint.',
    'CIR-translation': 'A circle’s equation, and the circle is moved left, right, up or down, sometimes with a new radius. The question asks for the new equation or a constant in it.',
    'CIR-axis_tangent': 'The question asks which circle touches an axis at exactly one point.',
    # Ratios, rates and units
    'RATE-density': 'A mass given in one unit and asked in another (kilograms to grams), or the total mass of some identical objects scaled to a different number of them.',
    'RATE-speed': 'A distance or speed given in one unit and asked in another (furlongs to feet, kilometers per hour to meters per second), or a constant speed with a time or distance to find.',
    'RATE-conversion': 'An amount in one unit asked in another (quarts to fluid ounces, inches to yards), usually with the conversion given, or two ratios set equal, as in a scale model.',
    'RATE-ratio': 'A ratio such as 3 to 5 between two amounts, with one amount given. The question asks for the other amount or an expression for it.',
    'RATE-unit_rate': 'An amount per unit (posters per minute, dollars per pound, millimeters every 3 months) or a total over a number of units. The question asks for the amount per unit, the total for a new number of units, or the rate in other units.',
    # Percentages
    'PCT-successive': 'Two percent changes in a row, such as a markup and then a discount, or an increase followed by a decrease. The question asks for the overall percent change or the final price.',
    'PCT-exponential': 'A value that gains or loses the same percent of itself each year, or a percent decrease read between two years on a graph.',
    'PCT-reverse': 'One percent change: a tax added, a discount taken or a share removed. The question asks for the amount after the change, or works back from what is left.',
    'PCT-comparison': 'One number described as a percent greater or less than another, sometimes in a chain (A is 20% more than B, B is 10% less than C). The question asks for a number, a multiplier, or how many times one is another.',
    'PCT-change': 'Two values of the same quantity, before and after (a wage in two years, an old and a new bill). The question asks for the percent increase or decrease, or uses it to find a value.',
    'PCT-partwhole': 'A part described as a percent of a whole (a tip as 15% of the bill, this year’s enrollment as a percent of last year’s). The question asks for the part, the whole or an expression for it.',
    # One-variable data
    'DATA-stddev': 'Two data sets in lists, dot plots, histograms or a table. The question asks which has the larger or smaller standard deviation, or which summary stays the same after a value changes.',
    'DATA-transform': 'A data set changed by adding to, subtracting from or scaling its values. The question asks which of the mean, median, range or standard deviation changes.',
    'DATA-missing_mean': 'A table of averages, or a data set that gains one value. The question compares means or medians.',
    'DATA-median': 'A list, table, dot plot or box plot of values. The question asks for the median, or compares medians between two sets or after a change.',
    'DATA-boxplot': 'Box plots for two groups. The question asks about their medians, ranges or quartiles.',
    'DATA-range': 'A list or table of values, and the question asks for the range: the largest value minus the smallest.',
    'DATA-frequency': 'A bar graph, dot plot or frequency table. The question asks how many values fall in a category, the largest or smallest value, which table matches a list, or what can be worked out from the counts.',
    # Two-variable data and models
    'FIT-residual': 'A scatterplot with a line of best fit. The question asks how far an actual point is from the line, or how many points lie above or below it.',
    'FIT-interpret': 'A scatterplot with a line of best fit. The question asks which equation matches the line, or what its slope means in context.',
    'FIT-correlation': 'A scatterplot or table, and the question asks about the relationship or the model that fits it: linear or exponential, rising or falling, an approximate slope or constant, a predicted value, or the line after the data change.',
    'FIT-nonlinear': 'Data with a curve drawn through them, such as a quadratic for stopping distance. The question asks for a value the curve predicts.',
    'FIT-predict': 'A graph or table of data, often with a line or curve of best fit. The question asks for a predicted value, the best model, the slope, where the graph rises or falls most, or whether it grows linearly or exponentially.',
    # Probability, inference and study design
    'PROB-complement': 'A two-way table or a list of counts. The question asks for a probability or a count, often with “not,” “but not” or “given that.”',
    'PROB-union': 'Outcomes in several categories (colors of cubes, ages in a table, numbers in a set). The question asks for the probability of a combined group, such as “neither blue nor yellow” or “even and less than some number.”',
    'PROB-simple': 'A count of the outcomes you want and a total: one roll of a die, a planet picked at random, a defective item in a shipment. The question asks for the probability.',
    'INF-population': 'A random sample with a count, percent or mean, and the size of the whole group. The question asks for an estimate for the whole group.',
    'EXP-causation': 'A study that randomly assigns its subjects to treatments. The question asks what conclusion about cause and effect it supports.',
    'EXP-sampling': 'A survey or study described by how its sample was chosen. The question asks how far the results can be generalized, or which conclusion they support.',
    # Equivalent expressions
    'EQV-radical': 'An expression with roots or fractional exponents, such as √(x³) or x^(2/3). The question asks for an equivalent form or a value.',
    'EQV-exponents': 'Powers of the same base multiplied, divided or raised to a power. The question asks for an equivalent expression or for the exponent that makes two forms match.',
    'EQV-difference_squares': 'A square minus a square, such as 9x² − 16, or a product like (x − 3)(x + 3). The question asks for an equivalent form or a constant.',
    'EQV-coefficient': 'An equation that is true for all x, or two expressions said to be equivalent, with unknown constants in them. The question asks for a constant or a product of constants.',
    'EQV-factor': 'A polynomial, and the question asks which expression is a factor of it.',
    'EQV-expand': 'An expression with products or parentheses to multiply out and like terms to collect, sometimes after two expressions are defined (if A = … and B = …, what is 2A − B?). The question asks for an equivalent form.',
    'EQV-complete_square': 'A quadratic expression with answer choices in the form a(x − h)² + k. The question asks which one is equivalent.',
    'EQV-gcf': 'An expression whose terms all share a number or a power of x. The question asks for an equivalent factored form, or which expressions are factors.',
    # Nonlinear equations
    'NEQ-discriminant': 'The question asks how many real solutions a quadratic equation has, or for a constant that gives it none or exactly one. A line meeting a parabola at exactly one point is the same question.',
    'NEQ-root_sum': 'A quadratic, or a product of factors, set equal to zero. The question asks for the sum or the product of the solutions, not the solutions themselves.',
    'NEQ-radical': 'An equation with the unknown under a square root. The question asks for a solution, the solution set, or a constant tied to the solutions.',
    'NEQ-absolute': 'An equation with an absolute value, such as |x − 5| = 3, or its graph with a line. The question asks for a solution, the positive solution, or the sum of the solutions.',
    'NEQ-rational': 'An equation with the unknown in a denominator, or a formula with fractions to be solved for one of its variables. The question asks for the solution or for an equivalent expression for that variable.',
    'NEQ-nonlinear_system': 'A system where one equation is a quadratic or another curve, given as equations or as a graph. The question asks for a solution, the point where the graphs meet, or how many points they share.',
    'NEQ-factor': 'A quadratic or higher-power equation with no story. The question asks for a solution (often the positive or negative one), how many solutions there are, or a value built from a solution.',
    'NEQ-inequality': 'An inequality with answer choices that rearrange it. The question asks which one is equivalent.',
    # Nonlinear functions
    'NF-transformation': 'A graph or function that is shifted up, down, left or right, or a model that changes in a second part of an experiment. The question asks for the new graph or equation, or a constant in it.',
    'NF-vertex': 'A graphed quadratic, and the question asks for its vertex.',
    'NF-exponential_initial': 'An exponential model or story with a starting amount, such as the value of equipment or a count of bacteria over time. The question asks for the starting amount, the value at some time, the equation, or how long it takes to double.',
    'NF-exponential_parameters': 'A table or two points from an exponential relationship. The question asks for the function that fits, a constant in it, or when it reaches a value.',
    'NF-roots': 'A graph, a factored function or a table, and the question asks for an x-intercept (a zero) or which expression must be a factor.',
    'NF-table': 'A table of values and a curved rule or graph. The question asks which table, equation or graph matches.',
    'NF-parameter': 'A nonlinear function with unknown constants and a point, graph or condition it must meet. The question asks for a constant, or how many times the graph reaches a value or crosses the x-axis.',
    'NF-evaluate': 'A nonlinear function rule, graph or formula and an input. The question asks for the output; a few ask for the graph of the rule, or for the rule from a description.',
    'NF-interpret': 'A nonlinear model in context (a ball’s height, a value that shrinks each year, an area). The question asks what a number, point, intercept or vertex means, or what a statement such as “f(5) is about 120” says.',
    'NF-y_intercept': 'The question asks where a curve crosses the y-axis: its y-intercept, the value at x = 0 (often a starting height), or a constant found from a given y-intercept.',
    'NF-time_units': 'An exponential model in one time unit (years), and the question asks for the same model in another (months or quarter years), or for the growth rate per year.',
    'NF-rational': 'A function with the variable in a denominator. The question asks for a value of the function, or which graph shows it after a change.',
    'NF-radical': 'A function or formula with a square root or a square in it, such as a dropped object’s height. The question asks for a value, the input that gives an output, a constant, or when the object hits the ground.',
    'NF-quadratic_form': 'A quadratic and several equivalent forms of it. The question asks which form shows the maximum, minimum, intercept or zeros as a number in the equation.',
}

# "Why it works" lines that replace imported ones. The pack shared one generic sentence among several methods (one
# covered 9 area and volume methods), and some lines only said a step keeps things equivalent. Each line below gives
# the reason behind its own method's rule, with a small worked example, so a student can rebuild the rule from it.
WHY = {
    # Linear equations in one variable
    'L1-word_model': 'An equation says two descriptions of the same quantity are equal, so both sides must count the same thing in the same units. A $40 down payment plus $15 a month for m months is 40 + 15m dollars; if the total is $250, then 40 + 15m = 250.',
    'L1-fractions': 'Multiplying every term by a number that each denominator divides clears the fractions and keeps both sides equal. In x/4 + 2 = 5, multiplying each term by 4 gives x + 8 = 20, so x = 12; in (2/3)(x − 6) = 8, multiplying by 3/2 gives x − 6 = 12, so x = 18.',
    'L1-solve': 'Doing the same thing to both sides keeps them equal, so no step changes the solution. In 3x + 5 = 20, subtracting 5 gives 3x = 15 and dividing by 3 gives x = 5; putting 5 back in, 3(5) + 5 = 20 confirms it.',
    'L1-rate_interpret': 'In an equation such as h = 2n + 6, the coefficient of a variable is how much the total changes when that variable goes up by 1, and the constant is the amount when the variable is 0. So 2 is the growth each year and 6 the starting height.',
    'L1-solve.equivalent': 'Adding the same number to both sides, or multiplying both sides by the same nonzero number, cannot change which x makes an equation true. So 2x + 6 = 10 has the same solution as x + 3 = 5 (divide by 2) and as 2x = 4 (subtract 6).',
    'L1-target_expression.scale': 'Multiplying both sides of a true equation by the same number keeps it true. If 3x = 12, doubling both sides gives 6x = 24 directly, with no need to find x first.',
    # Linear functions
    'LF-inverse': 'Finding the input runs the function backward: undo its steps in reverse order. If f(x) = 8x − 72 and f(x) = 0, add 72 and then divide by 8 to get x = 9. You solve for the input instead of plugging the output in.',
    'LF-two_points': 'Between any two points on a line, the rise over the run is the same, so two points fix the slope: from (0, 3) to (7, 31) the output rises 28 over 7 steps, a slope of 4. The point with x = 0 gives the intercept, so f(x) = 4x + 3.',
    'LF-evaluate': 'A function rule is a recipe: replace every x with the input and calculate. For f(x) = 25x + 30, f(2) = 25 × 2 + 30 = 80. Two known outputs give the rule instead: the slope is the change in output divided by the change in input.',
    # Linear equations in two variables
    'L2-graph': 'Every point on a line makes its equation true, so two clear points identify it. Setting x = 0 gives the y-intercept and y = 0 the x-intercept: for 2x + 5y = 10 they are (0, 2) and (5, 0), and the slope is −2/5.',
    'L2-two_point_recover': 'The slope between any two points of a line is the same, so (y₂ − y₁)/(x₂ − x₁) gives it, and putting one point into y = mx + b gives b. Through (1, 5) and (3, 9): m = 4/2 = 2, and 5 = 2(1) + b gives b = 3.',
    # Systems of linear equations
    'SYS-graph_equations': 'A line matches an equation only if every point on the line makes the equation true. Two points you can read exactly, such as the intercepts, test each choice: a choice that fails at either point is out.',
    'SYS-graph_intersection': 'The point where two graphs cross lies on both, so its coordinates make both equations true at once: it is the solution. Lines that never cross (parallel lines) give no solution; lines that lie on top of each other give infinitely many.',
    'SYS-eliminate.cancel': 'If both equations are true, their sum is true too, and opposite terms cancel in it. From x + y = 10 and x − y = 4, adding gives 2x = 14, so x = 7 and then y = 3. When a variable has the same coefficient in both, subtracting removes it instead.',
    'SYS-eliminate.scale': 'Multiplying a true equation by a number leaves it true, so you can make one variable’s coefficients match first. In 2x + 3y = 12 and x − y = 1, multiplying the second by 3 gives 3x − 3y = 3; adding cancels y: 5x = 15, so x = 3 and y = 2.',
    'SYS-none': 'Lines with the same slope and different intercepts never meet. For 2x + 3y = 5 and 4x + 6y = 7, doubling the first gives 4x + 6y = 10, and 4x + 6y cannot be both 10 and 7, so there is no solution: the x and y parts match but the constants do not.',
    'SYS-infinite': 'If one equation is the other multiplied by a number, both describe the same line, so every point on it solves both. 4x + 6y = 10 is 2x + 3y = 5 doubled. So to find a missing constant, make every coefficient and the constant grow by the same factor.',
    # Linear inequalities
    'INEQ-graph': 'The boundary line is where the two sides are equal; every point on one side makes the inequality true and every point on the other makes it false. So one test point, such as (0, 0), shows which side is shaded. A solid line means the boundary counts (≤ or ≥).',
    'INEQ-system': 'A point solves a system only if it makes every inequality true at once; on a graph, that is where the shaded regions overlap. So substitute the point into each inequality: one false statement rules it out.',
    'INEQ-model': 'The wording sets the direction: “at most,” “no more than” and “cannot exceed” mean ≤; “at least” and “no fewer than” mean ≥; “between” means two inequalities at once. The total itself is built as in an equation: a fixed part plus a rate times a count.',
    'INEQ-solve': 'An inequality is solved with the same moves as an equation, with one exception: multiplying or dividing by a negative number flips the sign. So −2x < 6 becomes x > −3; check with x = 0, where −2(0) = 0 is indeed less than 6.',
    'INEQ-table_points': 'A table works only if every one of its rows satisfies the inequality, so a single failing row rules the whole table out. Check one row of each table, then finish checking only the tables that survive.',
    # Area and volume
    'AREA-surface': 'A box has six rectangular faces in three matching pairs (top and bottom, front and back, left and right), so its surface area is 2(lw + lh + wh). A box with no lid loses one face of the six.',
    'AREA-sphere': 'A sphere’s volume is (4/3)πr³, a formula on the reference sheet. Because the radius is cubed, a sphere with twice the radius holds 2³ = 8 times as much.',
    'AREA-cone': 'A cone holds exactly one third of the cylinder with the same base and height, so V = (1/3)πr²h. With the volume and one other measure known, one unknown is left; the slant height then comes from the right triangle of radius, height and slant.',
    'AREA-cylinder': 'A cylinder is a stack of identical circles, so its volume is the base area times the height: V = πr²h. A circumference C gives r = C ÷ (2π) first. Doubling the radius multiplies the volume by 4, because r is squared.',
    'AREA-pyramid': 'A pyramid holds exactly one third of the box (prism) with the same base and height, so its volume is (1/3) × base area × height.',
    'AREA-prism': 'A prism is a stack of identical copies of its base, so its volume is base area × height, which is l × w × h for a box. Knowing the volume and all but one dimension, divide by the known ones to leave the missing one.',
    'AREA-circle': 'A circle’s area is πr² and its circumference 2πr, so the radius unlocks everything: from a diameter, halve it; from a circumference, divide by 2π; from an area, divide by π and take the square root.',
    'AREA-triangle': 'Two copies of a triangle fit together into a rectangle (or parallelogram) with the same base and height, so the triangle’s area is (1/2) × base × height, with the height at a right angle to the base. A perimeter is just the three sides added.',
    'AREA-rectangle': 'Area and volume multiply lengths: a square’s area is s × s, a cube’s volume s × s × s, a cylinder’s πr² × h. So sides k times as long give a perimeter k times as long but an area k² times as large. When a length is described from another (25% longer, 4 more), put that in before multiplying.',
    # Right triangles and trigonometry
    'TRIG-pythagoras': 'The squares built on the two legs of a right triangle together have the same area as the square on the hypotenuse: a² + b² = c². With legs 6 and 8, c² = 36 + 64 = 100, so c = 10; for a missing leg, subtract instead: b² = c² − a².',
    'TRIG-area': 'The two legs of a right triangle are perpendicular, so one is the base and the other the height: area = (1/2) × leg × leg. When a leg is missing, the Pythagorean theorem or a trigonometric ratio supplies it first.',
    'TRIG-complement': 'The two acute angles of a right triangle add to 90°, and the side opposite one is the side adjacent to the other. So the sine of one angle is the cosine of the other: sin 30° = cos 60°, and sin x° = cos(90 − x)°. In radians the two angles add to π/2.',
    # Circles
    'CIR-circle': 'Every point on a circle is the same distance r from the center (h, k), so by the distance formula (x − h)² + (y − k)² = r². The number on the right is the radius squared: 49 means a radius of 7 and a diameter of 14.',
    'CIR-translation': 'Moving a circle moves its center and leaves its radius alone. Shifting right 3 adds 3 to h, so (x − h)² becomes (x − h − 3)²; shifting down 2 subtracts 2 from k. Only a change in size changes r².',
    'CIR-complete_square': 'Adding the same numbers to both sides keeps the equation true: x² + 6x + y² − 4y = 12 becomes (x² + 6x + 9) + (y² − 4y + 4) = 12 + 9 + 4, which is (x + 3)² + (y − 2)² = 25, a circle with center (−3, 2) and radius 5. Each added number is half the coefficient, squared.',
    # Ratios, rates and units
    'RATE-density': 'One kilogram is 1,000 grams, so a mass in kilograms times 1,000 gives grams. For identical objects, the mass of one is the total divided by the count, and any other count weighs that single mass times the new count.',
    'RATE-speed': 'Distance = speed × time, because a speed says how far you go in each unit of time. To change units, multiply by a fraction worth 1, such as (1,000 meters)/(1 kilometer), arranged so the unit you are leaving cancels.',
    'RATE-conversion': 'A fact such as 1 quart = 32 fluid ounces makes (32 fluid ounces)/(1 quart) equal to 1, so multiplying by it changes the units but not the amount: 3 quarts = 3 × 32 = 96 fluid ounces. Equal ratios work alike: if a/b = c/d, then ad = bc.',
    'RATE-ratio': 'A ratio of 3 to 5 means the two amounts are 3 parts and 5 parts of the same size. If the first amount is 12, each part is 12 ÷ 3 = 4, so the second amount is 5 × 4 = 20.',
    'RATE-unit_rate': 'A unit rate is the amount for one unit, so any other amount is the unit rate times the number of units. If 12 posters print in 3 minutes, that is 4 posters per minute, or 4 × 60 = 240 per hour.',
    'RATE-units_squared.area': 'A square foot is a square 12 inches on each side, so it holds 12 × 12 = 144 square inches, not 12. An area conversion uses the length conversion twice: 1 square mile is 1,760 × 1,760 = 3,097,600 square yards.',
    # Percentages
    'PCT-exponential': 'Losing 20% of the current value leaves 80% of it, so each year multiplies the value by 0.8, and two years multiply it by 0.8 × 0.8 = 0.64. A percent decrease between two readings is (old − new) ÷ old × 100.',
    'PCT-comparison': '“A is 20% greater than B” means A = B + 0.20B = 1.20B, and “20% less” means 0.80B; the number after “than” is the base. In a chain, multiply the factors: 20% more than a number that is 10% less than C is 1.20 × 0.90C = 1.08C.',
    'PCT-change': 'Percent change compares the change with the starting value: (new − old) ÷ old × 100. From 40 to 50 is a change of 10, and 10 is 25% of 40; from 50 back to 40 is only 20%, because the starting value is now 50.',
    'PCT-partwhole': 'Percent means “per hundred,” so 15% of a bill is 15/100 of it: 0.15 × $78.20 = $11.73. The same equation, part = (percent ÷ 100) × whole, gives the whole when the part is known.',
    'PCT-successive': 'Each change acts on the amount left by the one before, so the multipliers multiply: a 20% markup and then 10% off gives 1.20 × 0.90 = 1.08, a net increase of 8%, not 10%. Adding or subtracting the percents themselves gives the wrong answer.',
    'PCT-reverse': 'A percent change multiplies the original: a 5% tax on $20 gives 20 × 1.05 = $21, and 20% off $50 leaves 50 × 0.80 = $40. Going back from the new amount divides by the same multiplier: $40 ÷ 0.80 = $50, not $40 × 1.20 = $48.',
    # One-variable data
    'DATA-missing_mean': 'A mean is the total shared out equally, so adding a value above the mean pulls it up and a value below pulls it down. A median moves only if the new value lands on the other side of the middle, since it depends on order, not size.',
    'DATA-frequency': 'A frequency is how many times a value occurs, so a value with frequency 4 appears 4 times in the list and the number of values is the sum of the frequencies. Bar heights and table entries give these counts directly.',
    # Equivalent expressions
    'EQV-exponents': 'An exponent counts repeated factors: x³ · x² = (x · x · x)(x · x) = x⁵, so multiplying powers of the same base adds the exponents. Dividing cancels factors, so x⁵ ÷ x² = x³, and (x²)³ is three copies of x · x, which is x⁶.',
    'EQV-exponents.negative': 'Dividing x³ by x⁵ cancels three factors of x and leaves 1/(x · x), which is 1/x². Subtracting the exponents gives x⁻² for the same quotient, so x⁻² means 1/x²: a negative exponent is the reciprocal of the positive power.',
    'EQV-factor': 'Factoring undoes multiplying out. Since (x + a)(x + b) = x² + (a + b)x + ab, two numbers that multiply to the constant and add to the middle coefficient give the factors: x² + 5x + 6 = (x + 2)(x + 3). Multiplying back checks it.',
    'EQV-gcf': 'Factoring out a common factor is distributing in reverse: 6x² + 9x = 3x · 2x + 3x · 3 = 3x(2x + 3). Every term must contain the factor, and multiplying back out gives the original, which checks it.',
    'EQV-expand': 'Distributing multiplies every term inside the parentheses by the factor outside, because a(b + c) means a copies of b + c. So 3(x − 4) − 2(x + 1) = 3x − 12 − 2x − 2 = x − 14: the minus in front of the 2 changes the sign of both terms it multiplies.',
    'EQV-rational.add': 'Fractions add only when they count pieces of the same size, so rewrite each over a common denominator first: 1/x + 1/(x + 1) = (x + 1)/(x(x + 1)) + x/(x(x + 1)) = (2x + 1)/(x(x + 1)).',
    'EQV-complete_square': 'Since (x + 3)² = x² + 6x + 9, the expression x² + 6x is 9 short of a perfect square: x² + 6x + 5 = (x + 3)² − 9 + 5 = (x + 3)² − 4. Half the x coefficient goes in the parentheses and its square is taken back out, so the value never changes.',
    # Nonlinear equations
    'NEQ-nonlinear_system': 'At a solution both equations hold, so you can replace y in one with its expression from the other. Setting x² = 2x + 3 gives x² − 2x − 3 = 0, so x = 3 or x = −1: a line can meet a parabola at two points, one point or none.',
    'NEQ-factor': 'A product is 0 only when one of its factors is 0, so (x − 3)(x + 5) = 0 has the solutions 3 and −5. Move every term to one side first; when the quadratic will not factor neatly, the quadratic formula gives the same solutions.',
    'NEQ-root_sum.combine_roots': 'For ax² + bx + c = 0 the solutions add to −b/a and multiply to c/a, so a sum or product of solutions from two equations can be built from those numbers without finding a single solution.',
    'NEQ-nonlinear_system.target': 'When the question asks for x + y, x − y or xy, look at the equations before solving: adding, subtracting or factoring them often produces that exact combination. If x + y = 7 and x² − y² = 21, then x − y = 21 ÷ 7 = 3, because x² − y² = (x + y)(x − y).',
    # Nonlinear functions
    'NF-vertex': 'A parabola is symmetric about the vertical line through its vertex, which is its highest or lowest point. On a graph, read the vertex where the curve turns; in f(x) = a(x − h)² + k it is (h, k), because the squared term is 0 there and positive everywhere else.',
    'NF-exponential_initial': 'Any number raised to the power 0 is 1, so at t = 0 the model a · b^t equals a: the number in front is the starting amount. In f(t) = 500 · 2^(t/30), the amount doubles every 30 minutes, because t must grow by 30 to raise the exponent by 1.',
    'NF-exponential_parameters': 'In f(x) = a · b^x, each step of 1 in x multiplies the output by b, so dividing two outputs cancels a. If f(1) = 6 and f(2) = 18, then b = 18 ÷ 6 = 3 and a = 6 ÷ 3 = 2, so f(x) = 2 · 3^x, and f(0) = 2 is the starting value.',
    'NF-evaluate': 'Substitute the input everywhere x appears, then follow the order of operations: powers, then multiplication, then addition. For f(x) = x² − 3x, f(−2) = (−2)² − 3(−2) = 4 + 6 = 10; brackets around a negative input keep its sign.',
    'NF-interpret': 'In f(t) = 1,200(0.9)^t, the input t is years and the output is a population, so f(5) ≈ 709 says the population is about 709 after 5 years. The number in front is the value at t = 0, and the base 0.9 means 10% fewer each year.',
}


def payload():
    return {'recognize': {k: RECOGNIZE[k] for k in sorted(RECOGNIZE)}, 'why': {k: WHY[k] for k in sorted(WHY)}}


def problems():
    study = json.loads((ROOT / 'build' / 'mstudy.json').read_text(encoding='utf-8'))
    methods = {m['id']: m for m in study['methods']}
    bad = []
    for key in list(RECOGNIZE) + list(WHY):
        if key not in methods:
            bad.append('%s is not a study method' % key)
    for mid, m in methods.items():
        if TEMPLATE in m['recognition_pattern'] and mid not in RECOGNIZE:
            bad.append('%s still has only the template cue' % mid)
    for kind, lines, field in (('cue', RECOGNIZE, 'recognition_pattern'), ('why line', WHY, 'why_it_works')):
        seen = {}
        for mid, m in methods.items():
            text = lines.get(mid, m[field])
            if text in seen:
                bad.append('%s and %s have the same %s' % (seen[text], mid, kind))
            seen[text] = mid
    for mid, text in list(RECOGNIZE.items()) + list(WHY.items()):
        if 'Identify the requested quantity' in text or 'original page' in text:
            bad.append('%s: template wording' % mid)
    for lines, low, high in ((RECOGNIZE, 40, 280), (WHY, 80, 320)):
        for mid, text in lines.items():
            if not low <= len(text) <= high:
                bad.append('%s: %d characters' % (mid, len(text)))
    for mid, text in list(RECOGNIZE.items()) + list(WHY.items()):
        if not text.endswith(('.', '.”')):
            bad.append('%s: does not end a sentence' % mid)
        if '  ' in text or text != text.strip():
            bad.append('%s: stray spaces' % mid)
        if re.search(r'\*|sqrt\(|\bpi\b|<=|>=', text):
            bad.append('%s: calculator notation; write ×, √, π, ≤ or ≥' % mid)
        # a minus sign is "−"; an ASCII hyphen may only join words (x-plane, 30-60-90 style names)
        for m in re.finditer(r'-', text):
            before, after = text[m.start() - 1:m.start()], text[m.end():m.end() + 1]
            if not (before.isalnum() and after.isalpha()):
                bad.append('%s: hyphen used as a minus sign near %r' % (mid, text[max(0, m.start() - 8):m.end() + 8]))
    return bad


def main():
    bad = problems()
    if bad:
        sys.exit('\n'.join(bad))
    text = json.dumps(payload(), ensure_ascii=False, indent=1) + '\n'
    if '--check' in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding='utf-8') != text:
            sys.exit('build/mstudy_text.json is out of date: run python3 -I src/math/study_text.py')
        print('all %d written cues and %d why lines check out; no study method shows the template or shares a line' % (len(RECOGNIZE), len(WHY)))
        return
    OUT.write_text(text, encoding='utf-8')
    print('wrote %d cues and %d why lines to %s' % (len(RECOGNIZE), len(WHY), OUT.relative_to(ROOT.parent)))


if __name__ == '__main__':
    main()
