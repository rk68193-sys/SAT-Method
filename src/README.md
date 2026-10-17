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
5. `mbuild.py` (uses `mclass.py` for the question types and `mcontent.py` for the lessons and type cards): writes `mdata.json`.

Copy `mdata.json` into `src/build/` and the four image folders into `m/`.

## Checks
`node src/check/smoke.js index.html 390` (Reading and Writing) and `node src/check/msmoke.js index.html 390 light` (Math) load every view, look for script errors, failed requests and sideways scrolling, and run a practice set.


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
