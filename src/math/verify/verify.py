import json, numpy as np, sympy as sp
d=json.load(open('mdata.json')); KEY={r[0]:r[4] for r in d['qs']}
x,y,p,k,b,a,c,t=sp.symbols('x y p k b a c t')
R={}
def rec(q, technique, got): R[q]=(technique, got, KEY[q])
