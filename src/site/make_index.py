import importlib.util, os, sys
src, dest = sys.argv[1], sys.argv[2]
pre = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="A free SAT study site: Reading and Writing routines and grammar lessons, and Math lessons, question types, shortcuts and 1,925 real practice questions with College Board's answers.">
<meta name="theme-color" content="#FFFFFF">
<link rel="canonical" href="https://satsprint.org/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SAT Sprint">
<meta property="og:title" content="SAT Sprint: free SAT practice, one step at a time">
<meta property="og:description" content="Reading and Writing routines and grammar lessons, Math lessons and shortcuts, a study plan, and 1,925 real practice questions with College Board's answers. Free, no account needed.">
<meta property="og:url" content="https://satsprint.org/">
<meta property="og:image" content="https://satsprint.org/icons/og.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="SAT Sprint: free SAT practice for Reading and Writing and Math, with a sample question answered right.">
<meta name="twitter:card" content="summary_large_image">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon.svg" type="image/svg+xml">
<link rel="icon" href="icons/icon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="SAT Sprint">
'''
open(dest, 'w', encoding='utf-8').write(pre + open(src, encoding='utf-8').read())
# the prize list for the clubhouse's database (catalog.py), published beside the page as catalog.json
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('catalog', os.path.join(here, 'catalog.py'))
cat = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cat)
open(os.path.join(os.path.dirname(os.path.abspath(dest)), 'catalog.json'), 'w', encoding='utf-8').write(cat.text(open(os.path.join(here, 'prizes.js'), encoding='utf-8').read()))
