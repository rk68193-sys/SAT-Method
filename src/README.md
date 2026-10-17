# Building the site

`index.html` is assembled from the files in this folder.

## Site
- `site/*.js`, `site/app.css`, `site/shell.html`: the page. Each `.js` file is a slice of one script, joined in the order listed in `site/assemble.py`. `math.js` is the Math section; `home.js` is the Home page, the navigation (subjects, tabs, "On this page" line, footer), the Appearance menu and the Suggest page; `boot.js` is the router.
- Colors: every color is a token (`--paper`, `--ink`, `--act`, `--rw`, `--math`, …) set once per theme at the top of `app.css`. `python3 -I src/tools/themes.py src/site/app.css` rewrites that block from the palettes in `themes.py`; it first checks every text/background pair the page uses (and white text on each gradient stop) and stops without writing if one is below 4.5:1 contrast. The chosen theme is saved under the `sat-sprint-theme` key; with none saved the page follows the device's light or dark setting.
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
`node src/check/smoke.js index.html 390` (Reading and Writing) and `node src/check/msmoke.js index.html 390 light` (Math) load every view, look for script errors, failed requests and sideways scrolling, and run a practice set. `node src/check/suggest.js index.html` tries the Appearance menu, the Suggest form, My notes and the footer; `node src/check/skip.js index.html` the skip link. `node src/check/tshots.js index.html 390 dark shots home suggest` saves screenshots in any theme (`light`, `dark`, `purple`, `blue`, `pink`, `green`, `auto-light`, `auto-dark`). `node src/check/text.js index.html out.txt` dumps every page's visible text (with all collapsible parts open) for a spelling check; the site uses American spelling, and quoted College Board passages are left exactly as printed.


## Refreshing the October source review

The complete per-question reading ledgers are in `build/reviews/`. Original PDF exports are not committed. The audit records their hashes and the original repository commit used to check preservation.

```sh
PYTHONDONTWRITEBYTECODE=1 python3 src/math/refresh_teaching.py
PYTHONDONTWRITEBYTECODE=1 python3 src/check/export_review_findings.py
PYTHONDONTWRITEBYTECODE=1 python3 src/check/review_coverage.py /path/to/math.pdf /path/to/reading-writing.pdf
```

Rebuild with the two assembly commands above. The assembler also writes `site/bundle.js` as an intermediate; it is not a source file. To keep intermediates outside the checkout, copy `site/` and `build/` to a temporary parent directory and run its assembler there, then run `make_index.py` on the resulting page.

The browser integration check requires Playwright, a Chromium executable (default `/usr/bin/chromium`, override with `CHROMIUM_EXECUTABLE`), and an HTTP server serving the repository:

```sh
python3 -m http.server 8000
# In another terminal:
node src/check/source-review.js http://127.0.0.1:8000/
```

This checks all Math comparison groups, restored English practice images and grading, source question links, and desktop/mobile layouts. See `REVIEW.md` for the exact review scope.

`check/import_reading_sources.py --pdf /path/to/reading-writing.pdf --parsed /path/to/parsed.json` regenerates the restored English source images and catalogs. It requires PyMuPDF and Pillow. The parsed input must contain the source question IDs, full raw text, and zero-based PDF page indices; it is produced during source extraction. The importer preserves complete questions with choices and source rationales.
