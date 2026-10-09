exec(open('verify.py').read())
import math
# swap the constant for x: discriminant as a graph in the constant
z=sp.solve(sp.Eq((x-2)**2-220,0),x); rec('46308566','swap q for x: graph y=(x-2)^2-220; largest integer x where y<0', (z, math.floor(max(z).evalf()-1e-9)))
z=sp.solve(sp.Eq(x**2-4*676,0),x); rec('1fe32f7d','swap b for x: graph y=x^2-4(676); largest integer x where y<0', (z, math.floor(max(z).evalf()-1e-9)-(1 if max(z)==int(max(z)) else 0)))
rec('301faf80','graph y=x(2x+5) and y=462; positive crossing', [v for v in sp.solve(sp.Eq(x*(2*x+5),462),x) if v>0])
import numpy as np
rec('d8789a4c','list sqrt([4,6,8,10]); the whole number wins', list(np.round(np.sqrt([4,6,8,10]),4)))
rec('0b46bad5','made-up numbers a=1, b=2: x+2y=2 → slope −1/2, y-intercept 1', (-0.5, 1))
rec('9afe2370','decreasing by a fixed percent means 0 < 1+r < 1', '-1<r<0')
for q,v in R.items(): print(q, v)
json.dump({q:[v[0],str(v[1]),v[2]] for q,v in R.items()},open('ver4.json','w'))
