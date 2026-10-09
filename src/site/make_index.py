import sys
src, dest = sys.argv[1], sys.argv[2]
pre = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="A free SAT study site: Reading and Writing routines and grammar lessons, and Math lessons, question types, shortcuts and 1,925 real practice questions with College Board's answers.">
'''
open(dest, 'w', encoding='utf-8').write(pre + open(src, encoding='utf-8').read())
