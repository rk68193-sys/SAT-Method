# Building the site

`index.html` is assembled from the files in this folder.

## Site
- `site/*.js`, `site/app.css`, `site/shell.html`: the page. Each `.js` file is a slice of one script, joined in the order listed in `site/assemble.py`. `math.js` is the Math section; `home.js` is the Home page and the two-level navigation; `boot.js` is the router.
- `build/*.json`: the data embedded in the page (`data.json` grammar catalog, `rdata.json` reading routine, `bank.json` practice bank, `ann.json` annotations and drills, `notes-page.json`, `mdata.json` Math).

```
python3 -I src/site/assemble.py out/page.html      # the page without the html/head wrapper
python3 -I src/site/make_index.py out/page.html index.html
```

## Math data and images
Made from College Board's SAT Math question bank export (`questionbank-export-2026-10-8.pdf`, 2,030 pages, 1,925 questions; not included). Run the scripts in `src/math/` from one working folder that holds the PDF text, in this order:

1. `pdftotext -layout bank.pdf math.txt` then `mparse.py`: labels, stems, answers and explanation text per question (`math.json`).
2. `pdftotext -bbox-layout bank.pdf mbbox.html` then `mgeo.py`: where each question's Question / Answer / Correct Answer / Rationale headings sit (`mgeo.json`).
3. `pdftoppm -r 130 -gray -png bank.pdf pg/p`, then `mcrop.py`: crops each question (stem and choices) and its explanation into `mimg/q` and `mimg/r`.
4. `mreflow.py`: cuts each image into lines and words and re-wraps them into a 380-pixel column for phones (`mimg/qn`, `mimg/rn`).
5. `mbuild.py` writes `mdata.json`. It uses `mclass.py` (question types), `mcontent.py` (lessons and type cards), `mpatterns.py` (the rules that tag each question with the big patterns, and the rare patterns), `mpatcontent.py` (pattern cards, the Desmos playbook, the Desmos line for every type) and `verified.json`.

## Verified examples
`verified.json` lists the 52 bank questions that were solved with the Desmos moves and checked against College Board's answer key (all matched). The checks are in `math/verify/` (`v1.py` to `v4.py`): each question's numbers were read from its image and the Desmos step was reproduced with sympy and numpy. Every question cited on the Big patterns and Desmos pages must be in this file; `mbuild.py` stops if one is not.

Copy `mdata.json` into `src/build/` and the four image folders into `m/`.

## Checks
`node src/check/smoke.js index.html 390` (Reading and Writing) and `node src/check/msmoke.js index.html 390 light` (Math) load every view, look for script errors, failed requests and sideways scrolling, and run a practice set. `node src/check/text.js index.html out.txt` dumps every page's visible text (with all collapsible parts open) for a spelling check; the site uses American spelling, and quoted College Board passages are left exactly as printed.
