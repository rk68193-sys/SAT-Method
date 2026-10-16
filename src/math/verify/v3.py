exec(open('verify.py').read())
import numpy as np
X=np.array([-4,-19/5,-18/5]); Y=np.array([0,1,2]); m,bb=np.polyfit(X,Y,1)
rec('e9908930','table regression y1~mx1+b, then subtract 13', (round(m,6), round(bb,6), 'h = %gx + %g' % (round(m,6), round(bb-13,6))))
m,bb=np.polyfit([0,11],[0,10],1); rec('58c7daed','regression through the two points', (round(m,6), round(bb,6)))
# pick numbers: rename x -> a; a=2, w=3
A=2; W=3; V=-W/(150*A); choices={'A':-150*V*A,'B':-150*V/A,'C':-A/(150*V),'D':V+150*A}
rec('4e18fc5d','made-up numbers (x renamed a=2, w=3); which choice returns w=3', [k for k,v in choices.items() if abs(v-W)<1e-9])
rec('bd87bc09','sin B = 5/13 with hypotenuse 26 -> 10, 24, 26', sp.sqrt(26**2-10**2))
rec('f67e4efc','graph y=5πx² and y=45π; intersection', [v for v in sp.solve(sp.Eq(5*sp.pi*x**2,45*sp.pi),x) if v>0])
rec('0231050d','percent change (new-old)/old', 100*(40-10)/40)
rec('a5b069b4','median(L)', float(np.median([4,10,18,4,4,5,6,5])))
rec('db422e7f','slope of 4y+8x=6 is -2; perpendicular 1/2', sp.Rational(1,2))
Lc=np.array([2,1-np.sqrt(11),0.5+np.sqrt(11),(1+np.sqrt(11))/2]); rec('6ce95fc8','list the four choices: 2L^2-2-(2L+3)', list(np.round(2*Lc**2-2-(2*Lc+3),9)))
for q,v in R.items(): print(q, v)
json.dump({q:[v[0],str(v[1]),v[2]] for q,v in R.items()},open('ver3.json','w'))
