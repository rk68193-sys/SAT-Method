exec(open('verify.py').read())
# Moves added from James Lu's Desmos guide: overlay, zeros to factors, table regression, trig in degrees, named points, graph the choices.
def same(e1, e2):
    xs = np.linspace(-20, 20, 4001); f1 = sp.lambdify(x, e1, 'numpy'); f2 = sp.lambdify(x, e2, 'numpy')
    return bool(np.max(np.abs(f1(xs) - f2(xs) + 0 * xs)) < 1e-9)
r5 = sp.sqrt(5)
E = (2*x+5)**2-(x-2)+2*(x+3); C = {'A': 4*x**2+21*x+33, 'B': 4*x**2+21*x+29, 'C': 4*x**2+x+29, 'D': 4*x**2+x+33}
rec('42c71eb5', 'overlay: graph the expression and each choice; the one drawn on top', [kk for kk, v in C.items() if same(E, v)])
C = {'A': (x+r5)**2, 'B': (x-r5)**2, 'C': (x+r5)*(x-r5), 'D': (x+5)*(x-1)}
rec('a05bd3a4', 'overlay: graph x^2-5 and each choice', [kk for kk, v in C.items() if same(x**2-5, v)])
rec('5a7ab8e8', 'overlay: y=66x and y=66x are one line, so infinitely many', same(66*x, 66*x))
rec('69f609b2', 'overlay: y=12(x-3) and y=-3(x+12) cross once', sp.solve(sp.Eq(12*(x-3), -3*(x+12)), x))
z = sp.solve(3*x**2+20*x-63, x)
rec('c3b116d7', 'zeros to factors: x-intercepts of y=3x^2+20x-63', (z, [sp.factor(3*x**2+20*x-63)], {'I x-9': 9 in z, 'II 3x-7': sp.Rational(7, 3) in z}))
m, bb = np.polyfit([1, 2, 3], [-64, 0, 64], 1)
rec('50f4cb9c', 'table regression y1~a x1+b, then a-b', (round(m, 6), round(bb, 6), round(m-bb, 6)))
fits = [np.polyfit([-34, -17, 0], [tt, tt+23, tt+46], 1) for tt in (0, 5)]
rec('d4572f55', 'legal t=0 (and t=5), table regression y1~m x1+b', [(round(f[0], 6), round(f[1], 6)) for f in fits])
bx, la = np.polyfit([1, 2, 3], np.log([2.5e5, 5.0e5, 1.0e6]), 1); A0, B0 = np.exp(la), np.exp(bx)
rec('263f9937', 'table regression y1~a b^x1, then cross with y=5.12e8', (round(A0), round(B0, 6), round(float(np.log(5.12e8/A0)/np.log(B0)), 6)))
bx, la = np.polyfit([1, 2, 3], np.log([9, 36, 144]), 1); A0, B0 = np.exp(la), np.exp(bx)
n = np.array([1, 2, 3]); Cn = {'A': 4*9.0**n, 'B': 4*9.0**(n-1), 'C': 9*4.0**n, 'D': 9*4.0**(n-1)}
rec('2c6f214f', 'table regression y1~a b^x1, then list the choices at n=1,2,3', (round(A0, 6), round(B0, 6), [kk for kk, v in Cn.items() if np.allclose(v, A0*B0**n)]))
X = np.arctan(12/35)
rec('a4c0547f', 'degree mode: X=arctan(12/35), then 24/tan(X) and 24/sin(X)', (round(np.degrees(X), 4), round(24/np.tan(X), 6), round(24/np.sin(X), 6), round(24+24/np.tan(X)+24/np.sin(X), 6)))
res = []
for Q in (60, 70):
    q = np.radians(Q); qs = np.hypot(18/np.tan(q), 18)
    Cq = {'A': 18*np.cos(q), 'B': 18*np.sin(q), 'C': 18/np.cos(q), 'D': 18/np.sin(q)}
    res.append((Q, [kk for kk, v in Cq.items() if abs(v-qs) < 1e-9]))
rec('94f7c9e2', 'legal angle Q=60 then 70 (Q>45 because QR<RS); list the choices', res)
cA, P = (-1, 1), (5, -4); s = -sp.Rational(P[0]-cA[0], P[1]-cA[1])
pts = {'A': (0, sp.Rational(6, 5)), 'B': (4, 7), 'C': (10, 2), 'D': (11, 1)}
rec('858fd1cf', 'points A=(-1,1), P=(5,-4): tangent slope -(P.x-A.x)/(P.y-A.y); which point is on the line', (s, [kk for kk, v in pts.items() if sp.nsimplify(v[1]-P[1]-s*(v[0]-P[0])) == 0]))
d = sp.sqrt((-8+4)**2+(8-5)**2)
rec('82c8325f', 'distance((-4,5),(-8,8)) is the radius', (d, d**2))
cs = {'A': (8, 8), 'B': (8, 4), 'C': (4, 9), 'D': (0, 9)}
rec('9d159400', 'graph all four circles; count y-axis crossings', {kk: len([r for r in sp.solve(sp.Eq((0-h)**2+(y-kk2)**2, 16), y) if r.is_real]) for kk, (h, kk2) in cs.items()})
K = 2; Ck = {'A': 81*K, 'B': 81*K**2, 'C': 9*K, 'D': 9*K**2}
rec('c447367f', 'legal k=2 (k=1 makes A and B look alike); graph each choice, radius should be 18', [kk for kk, v in Ck.items() if v == (9*K)**2])
for q, v in R.items(): print(q, v)
json.dump({q: [v[0], str(v[1]), v[2]] for q, v in R.items()}, open('ver5.json', 'w'))
