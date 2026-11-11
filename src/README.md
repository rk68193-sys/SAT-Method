# Building the site

`index.html` is assembled from the files in this folder.

## Site
- `site/*.js`, `site/app.css`, `site/shell.html`: the page. Each `.js` file is a slice of one script, joined in the order listed in `site/assemble.py`. `math.js` is the Math section; `home.js` is the Home page, the navigation (subjects, tabs, "On this page" line, footer), the Appearance menu and the Suggest page; `boot.js` is the router.
- `hub.js` is the Learn overview of each subject (`buildHub`, with `hubIndex` gathering every lesson, type, rule and term into one list to search) and the sample question on Home (`htryShow`). The section bar is in `home.js`: every page in `SUBJ` names its group, `renderSecnav` draws the four groups and `renderSubnav` the pages of the current one.
- `plan.js` is shared by both subjects: the starting check's estimate and its wording (`diagEstimate`, saved in `store.s.diag`), spaced repeats (`store.s.sr[subject][id] = [step, due]`, updated by `srNote` wherever an answer is saved), and the study plan (`#plan`; settings and today's tasks in `store.s.plan`). `PSUB` at the top is the one place that tells the plan how each subject stores results, lists its types and starts a set.
- `module-core.js` is the timed-module engine both subjects share: the clock, movement between questions, marks for review, the list of every question and the check before finishing. `rw-module.js` is the Reading and Writing module (it draws the ordinary question cards and stops a click from revealing the answer); `rw-track.js` gives every Reading and Writing question a type (a reading set or a grammar rule) and draws that subject's map (`#rw-map`) and trap report from the practice records in `store.t`, `store.r` and `store.b`. Module scores are in `store.s.rwmodules`.
- `math-track.js` is the mastery map (`#m-map`), the "What went wrong?" prompt and the trap report; `math-module.js` is the timed module and the calculator panel. Both read the last attempt per question from `store.m`; reasons for misses are in `store.x`, and module scores in `store.s.modules`.
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

## Questions as text
`src/text/` rebuilds questions from College Board's PDF exports (not included). It needs PyMuPDF and Pillow.

```
python3 -I src/text/build_math.py math-export.pdf m/t --report=/tmp/report.json    # m/t/<id>.js, m/t/_glyphs.js, src/build/mtext.json
python3 -I src/text/build_rw.py rw-export.pdf            # report only
python3 -I src/text/build_rw.py rw-export.pdf --write    # rewrites figures.json and grammar-sources.json, crops into rw/f/
```

- `qbx.py` reads one question's pages: text spans from the text layer, every drawn path and placed picture. It finds the headings, groups strokes, boxes and rules into figures (with their labels), sets the remaining symbols on the line of text they are level with, and returns paragraphs, display equations and figures in reading order, plus `audit()` warnings.
- `render.py` writes HTML: text as text, a group of symbols as an inline SVG sized in em and placed on the baseline, older picture-formulas as inline images, figures as WebP crops. Each distinct symbol outline is stored once at one size and placed with `<use>`.
- `build_math.py` runs every Math question in parallel, merges the symbol library (outlines that agree within two units in a box of 100 are one symbol), checks each answer against the key in `mdata.json`, and writes only the questions that pass. `build_rw.py` does the same for the Reading and Writing questions that were pictures, splitting the rationale by choice. Both can be rerun; a rerun starts from the same state as a first run.
- On the site, `math-text.js` loads a question's file when it comes near the screen and replaces the placeholder; `mImg()` in `math.js` returns the placeholder or, for a held-back question, the picture (`mPic()`).

## Checks
`node src/check/nav.js index.html 390` answers the sample questions on Home (and checks nothing is saved), then walks the section bar in both subjects: which tab and which second-row page is marked for each address, the Learn overviews and their search, and that a visited page keeps its place.

`node src/check/qtext.js index.html 390` opens rebuilt questions in both subjects: text and drawn expressions in a Math question, its explanation, the choices inside the answer buttons, grading, the printed-page viewer, a held-back question keeping its picture, lesson examples filling in only when opened, and the Reading and Writing grammar and table cards with their explanations and "as printed" links. It also counts the converted questions.

`node src/check/rw-practice.js` runs without browser dependencies. It checks unique R&W membership, shared history across lesson/bank views, untimed versus paced results, legacy saved records, review of uncertain correct answers, retained review notes, and availability of the notes before a drill answer.

`node src/check/smoke.js index.html 390` (Reading and Writing) and `node src/check/msmoke.js index.html 390 light` (Math) load every view, look for script errors, failed requests and sideways scrolling, and run a practice set. `node src/check/mtrack.js index.html 390` sits a whole timed module (cross-out, mark for review, the question list, the calculator panel, finishing with a blank), reviews a miss and records a reason, then checks the mastery map, the trap report and the retry sets; add a folder as a third argument to save screenshots. `node src/check/plan.js index.html 390` fixes the page's date, takes the starting check in both subjects (its make-up, order and the rough range against a second copy of the rule), then follows a study plan across two days: day one for a new student, an added set, misses coming back the next day, kept progress, 30-minute and one-section plans, the final week and deleting the plan. `node src/check/rwtrack.js index.html 390` does the same for Reading and Writing: a whole 27-question module in the test's order, review of a miss and of a blank, a one-tap cause, then the map, the trap report and the retry sets. `node src/check/suggest.js index.html` tries the Appearance menu, the Suggest form, My notes and the footer; `node src/check/skip.js index.html` the skip link. `node src/check/tshots.js index.html 390 dark shots home suggest` saves screenshots in any theme (`light`, `dark`, `purple`, `blue`, `pink`, `green`, `auto-light`, `auto-dark`). `node src/check/text.js index.html out.txt` dumps every page's visible text (with all collapsible parts open) for a spelling check; the site uses American spelling, and quoted College Board passages are left exactly as printed.


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


## Importing the expanded Math study pack

`math/import_study_pack.py /path/to/questionbank-study-data-v2.json` produces `build/mstudy.json`. It imports authored methods, memberships, variant suggestions, and scoped calculator records. It excludes full source transcriptions and preserves `mdata.json` and its grading keys. `site/math-study.js` adds the catalogue, type practice, lesson links, and post-answer calculator feedback. The assembler embeds the derived data as `D.mathStudy`.

Run `python src/check/study_coverage.py` and `node --check src/site/bundle.js` after rebuilding. An optional argument to `study_coverage.py` is a previous assembled page; it checks every original data section remains exactly equal. Browser QA uses the existing site through its UI.
