exec(open('verify.py').read())
s1=sp.solve(sp.Rational(3,2)*y-sp.Rational(1,4)*x-(sp.Rational(2,3)-sp.Rational(3,2)*y),y)[0]
s2=sp.solve(sp.Rational(1,2)*x+sp.Rational(3,2)-(p*y+sp.Rational(9,2)),y)[0]
rec('ff501705','slide the constant until the lines are parallel',sp.solve(sp.diff(s1,x)-sp.diff(s2,x),p))
rec('e6cb2402','slide the constant until the lines are parallel',sp.solve(3*k-sp.Rational(48,17),k))
xs=np.linspace(-50,50,200001); ys=9*(8/7)**(xs+1)-2
rec('f01108a8','legal made-up numbers a=8, b=2, c=1; count crossings',int(np.sum(np.diff(np.sign(ys))!=0)))
rec('fc3d783a','slide b until the parabola touches the line',[v for v in sp.solve(sp.Eq(b**2/16,sp.Rational(9,4)),b) if v>0])
L=1+np.sqrt(np.array([8,10,20,40])); rec('ba0edc30','list the four choices; look for 0',list(np.round(L**2-2*L-9,6)))
rec('91e7ea5e','graph; click the x-intercepts',sp.solve(2*(x-4)**2-32,x))
bb=13-sp.Rational(75,7); rec('b8f13a3a','define b from the intercept, then a = 320/7 ÷ b',sp.Rational(320,7)/bb)
for q,v in R.items(): print(q, v)
json.dump({q:[v[0],str(v[1]),v[2]] for q,v in R.items()},open('ver1.json','w'))
