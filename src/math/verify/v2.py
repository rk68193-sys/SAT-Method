exec(open('verify.py').read())
w=sp.symbols('w'); r=sp.symbols('r')
# regression emulation: solve the identity at sample x values (Desmos regression would return the exact fit, R^2 = 1)
def fit(lhs, rhs, params, xs=(1,2,3,4,5)):
    eqs=[sp.Eq(lhs.subs(x,v), rhs.subs(x,v)) for v in xs]
    return sp.solve(eqs, params, dict=True)
s=fit(20*x**3-9*x**2-2*x+12, (a*x+3)*(5*x**2-b*x+4), [a,b]); rec('371cbf6b','regression y1 ~ (a x1+3)(5x1^2-b x1+4)', [ (d[a],d[b],d[a]*d[b]) for d in s])
s=fit((29*x+102)/(x*(x+51)), p/x+w/(x+51), [p,w]); rec('38c90632','regression y1 ~ p/x1 + w/(x1+51)', s)
s=fit(90*x**5-54*x**4, r*x**4*(15*x-9), [r]); rec('b4a6ed81','regression', s)
s=fit((3*x-23)*(19*x+6), a*x**2+b*x+c, [a,b,c]); rec('ea6d05bb','regression', s)
def cross(e1,e2):
    s=sp.solve([e1,e2],[x,y],dict=True)[0]; return s
s=cross(sp.Eq(x+y,50), sp.Eq(sp.Rational(3,10)*x+sp.Rational(8,10)*y, 25)); rec('7866a908','two lines: x+y=50, 0.3x+0.8y=25; then 0.8y', (s, sp.Rational(8,10)*s[y]))
s=cross(sp.Eq(x+y,30), sp.Eq(12*x+8*y,300)); rec('d7bf55e1','two lines; then 12x', (s, 12*s[x]))
s=cross(sp.Eq(x+y,60), sp.Eq(2*x+4*y,202)); rec('71189542','two lines', s)
# circle center by the vertex trick: vertex of y=x^2+Dx is at x=-D/2, y=-(D/2)^2
def vtx(D): return (-sp.Rational(D)/2, -(sp.Rational(D)/2)**2)
hx,ax=vtx(1); hy,ay=vtx(1); rec('76c73dbf','vertex trick: r^2 = 199/2 + 1/4 + 1/4', sp.sqrt(sp.Rational(199,2)-ax-ay))
rec('2266984b','vertex trick: center = (vertex x of x^2+20x, vertex x of y^2+16y)', (vtx(20)[0], vtx(16)[0]))
rec('1e8ccffd','totals: 8*14.5 - 7*12', 8*14.5-7*12)
L=[43,45,44,43,38,39,40,46,40]; X=list(range(1,60)); M=[(sum(L)+v)/10 for v in X]
rec('190be2fc','list X=[1...59]; mean list; integer above 42', [v for v,m in zip(X,M) if m==int(m) and m>42])
rec('ae05d37b','graph y=40000*2^(x/790) and y=80000; intersection', sp.solve(sp.Eq(40000*2**(x/790),80000),x))
rec('e53add44','4% growth multiplier', 1.04)
rec('722de804','graph y=(x-47)^2 and y=1; add the crossings', sum(sp.solve(sp.Eq((x-47)**2,1),x)))
sol=sp.solve(57*x**2+58*x+1,x); rec('2c05d312','legal numbers a=b=1: product of roots = k', sp.prod(sol))
rec('358f18bc','click the vertex', (24, (x**2-48*x+2304).subs(x,24)))
rec('8e1da169','vertex halfway between 44 and 46', 45)
# radical: Desmos graphs principal root only -> real intersections of y=sqrt(2x+6)+4 and y=x+3
cands=sp.solve(sp.Eq((x-1)**2,2*x+6),x); rec('66bce0c1','graph both sides; Desmos shows only real crossings', [v for v in cands if sp.sqrt(2*v+6)+4==v+3])
pts=[(-14,0),(0,-14),(0,14),(14,0)]; rec('541bef2f','shade both; plot the four points', [P for P in pts if P[1]<=P[0]+7 and P[1]>=-2*P[0]-1])
for q,v in R.items(): print(q, v)
json.dump({q:[v[0],str(v[1]),v[2]] for q,v in R.items()},open('ver2.json','w'))
