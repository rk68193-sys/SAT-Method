# Building the site

`index.html` is assembled from the files in this folder.

## Site
- `site/*.js`, `site/app.css`, `site/shell.html`: the page. Each `.js` file is a slice of one script, joined in the order listed in `site/assemble.py`. `math.js` is the Math section; `home.js` is the Home page, the navigation (subjects, tabs, "On this page" line, footer), the Appearance menu and the Suggest page; `boot.js` is the router.
- `hub.js` is the Learn overview of each subject (`buildHub`, with `hubIndex` gathering every lesson, type, rule and term into one list to search) and the sample question on Home (`htryShow`). The section bar is in `home.js`: every page in `SUBJ` names its group, `renderSecnav` draws the four groups and `renderSubnav` the pages of the current one.
- `plan.js` is shared by both subjects: the starting check's estimate and its wording (`diagEstimate`, saved in `store.s.diag`), spaced repeats (`store.s.sr[subject][id] = [step, due]`, updated by `srNote` wherever an answer is saved), and the study plan (`#plan`; settings and today's tasks in `store.s.plan`). `PSUB` at the top is the one place that tells the plan how each subject stores results, lists its types and starts a set.
- `habit.js` and `data.js` are shared by both subjects. `habit.js` keeps the day log (`store.s.days['2026-11-12'] = [Math answers, Reading and Writing answers]`), the streak, the calendar and the question of the day; every place that saves an answer calls `noteAnswer(subject, id, ok)`, which schedules the repeat (`srNote`) and counts the day. `data.js` is the page at `#my-data`: what is saved, the backup file (`bkBody`), reading one (`bkParse` and `bkClean`, which keep only plain values, ordinary names and short plain strings; free text is allowed only in notes, suggestions and the "evidence" line, all of which are escaped where shown), adding it to what is here (`bkMerge`) and the offline controls (`offList` is every file a question needs that is not inside the page).
- `account.js` is the optional account (`#account`): signing in and out through a Supabase project's auth addresses with plain `fetch`, and the sync. `save()` in `core.js` calls `acctChanged()`, which sends the saved progress a moment later; `acctOnce` reads the account's row and sends, takes or joins (`bkMerge`), and every send names the row version it replaces. The project address and public key are in `build/account.json` (empty: accounts off, the site unchanged); the table is made by `account/setup.sql`. The session is kept under the `sat-sprint-account` key, apart from the progress, so it is never in a backup file.
- `sw.js` (at the site root, beside `index.html`) is the service worker: the page is fetched from the network first and from its saved copy when there is none, so a new build needs no change there; question files and pictures are answered from the saved copy and refreshed in the background; Google Fonts are kept too. Math question files and the symbol library are asked for with a stamp (`?v=…`, see Questions as text): a stamped file never changes, so it is not refreshed, and keeping one drops the copies of that file kept under older stamps. Rename a cache only if those rules change (v2 dropped the v1 rule that kept `m/t/_glyphs.js` from the first visit for good; `data.js` names the question cache too, as `PWA_Q`). `manifest.webmanifest` and `icons/` make the site installable; `python3 -I src/tools/icons.py icons` redraws the icons (needs Pillow). The `<head>` lines for both are in `site/make_index.py`.
- `module-core.js` is the timed-module engine both subjects share: the clock, movement between questions, marks for review, the list of every question and the check before finishing. `rw-module.js` is the Reading and Writing module (it draws the ordinary question cards and stops a click from revealing the answer); `rw-track.js` gives every Reading and Writing question a type (a reading set or a grammar rule) and draws that subject's map (`#rw-map`) and trap report from the practice records in `store.t`, `store.r` and `store.b`. Module scores are in `store.s.rwmodules`.
- `math-track.js` is the mastery map (`#m-map`), the "What went wrong?" prompt and the trap report; `math-module.js` is the timed module and the calculator panel; `msheet.js` is the reference sheet (`MSHEET`: each figure as inline SVG with its formulas as text), its Reference button and panel, which shares the calculator panel's place on the screen (one open at a time). Both read the last attempt per question from `store.m`; reasons for misses are in `store.x`, and module scores in `store.s.modules`.
- Colors: every color is a token (`--paper`, `--ink`, `--act`, `--rw`, `--math`, …) set once per theme at the top of `app.css`. `python3 -I src/tools/themes.py src/site/app.css` rewrites that block from the palettes in `themes.py`; it first checks every text/background pair the page uses (and white text on each gradient stop) and stops without writing if one is below 4.5:1 contrast. The chosen theme is saved under the `sat-sprint-theme` key; with none saved the page follows the device's light or dark setting.
- `vocab.js` is **Words to know** (`#vocab`): the word list for Words in Context, the positive-or-negative check, second meanings and the purpose words in Purpose and structure choices. `python3 -I src/reading/vocab.py` writes `build/vocab.json`; it counts everything from `build/bank.json`, and the definitions (`vocab_defs.py`), second meanings (`vocab_second.py`) and purpose words (`vocab_func.py`) are written for this site.
- `drills.js` runs every drill in both subjects. One drill host (`#dhost`) moves between the Reading and Writing page (`#drills`) and the Math page (`#m-drills`); `DR` lists the drills and `drillSubjOf` says which page each belongs to. The Math drills other than "Name the skill" use cards written for this site: `python3 -I src/math/mdrills.py` writes `build/mdrills.json` (counting solutions, which form shows it, exponents, percents, slope, clearing fractions, and the Algebra foundations cards from `math/foundations.py`). Each card is a prompt, choices with a note on each wrong one, and an explanation, all as printed HTML.
- `mfound.js` is **Algebra foundations** (`#m-found`): six sections (`#m-found-frac` … `#m-found-den`), each with its own drill of the cards tagged with that section. `#m-found-practice` sets up Easy Algebra practice. `mFoundNudgeHTML` puts a pointer to the page on the map and the lessons once three Easy Algebra questions are standing misses.
- `build/*.json`: the data embedded in the page (`data.json` grammar catalog, `rdata.json` reading routine, `bank.json` practice bank, `ann.json` annotations and drills, `notes-page.json`, `mdata.json` Math, `vocab.json` Words to know, `mdrills.json` Math drill cards).

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
- Some older questions set an exponent or a subscript as smaller text, raised or lowered a few points (x², 10⁸, x₁). `attach_scripts()` in `qbx.py` gives each such run the baseline of the word it touches and marks it, and `render.py` prints it as `<sup>` or `<sub>`; a run with nothing beside it is reported by `audit()`, which holds the question back. Before this, the raised digits were read as a line of their own and printed apart ("2 2 2" before the sentence).
- `build_math.py` runs every Math question in parallel, merges the symbol library (outlines that agree within two units in a box of 100 are one symbol), checks each answer against the key in `mdata.json`, and writes only the questions that pass. `build_rw.py` does the same for the Reading and Writing questions that were pictures, splitting the rationale by choice. Both can be rerun; a rerun starts from the same state as a first run.
- On the site, `math-text.js` loads a question's file when it comes near the screen and replaces the placeholder; `mImg()` in `math.js` returns the placeholder or, for a held-back question, the picture (`mPic()`).
- The symbols get short names (`G0`, `G1a`, …) in the order they are first met, so a rebuild that adds questions names them afresh, and a question must never be drawn with the library of another rebuild (π came out as d, % as g). `assemble.py` stamps the page with a hash of every file in `m/t` (`D.mathText.v`), and `mtxUrl()` asks for each file with that stamp, so a device fetches the matching set after every rebuild. Rebuild `index.html` after any change to `m/t`.

## Checks
`node src/check/habit.js index.html 390` serves the folder on localhost (a service worker needs http) and checks, for both subjects: the question of the day and that answering it is saved, the streak across several days on a controlled clock, older answers turned into days, the backup file (download, erase, restore exactly, add a second device's file, refuse files that are not backups, drop anything in a file that is not plain data), the manifest and icons, saving every question, and then the site with the server stopped and the network off.

`python3 -I src/check/mdrills_check.py` (needs sympy: `pip install sympy`) checks every Math drill card written for this site without using the generator: it reads the math as printed, turns it into sympy, and works out each answer again (the number of solutions, which form prints the value, which choice is equivalent, which equation has the same solutions, the slope, the percent; `found_check.py` does the Algebra foundations cards). It fails if a key is wrong or a second choice is also right.

`python3 -I src/math/notin.py` writes `build/mnotin.json`, the "What the bank never asks" list on Math → Start here, and doubles as its check: it reads the wording of every question, choice and explanation in `m/t/` and stops if a topic listed as absent turns up, if a topic listed as appearing once appears a different number of times, or if a question outside right triangles and circles mentions sine, cosine or tangent. The two questions kept as pictures were read by eye (named in the script).

`node src/check/symbols.js index.html [shots-folder]` checks the symbols in the Math questions. In the files: every symbol a question draws is in the library, no exponent is left apart from what it belongs to, and the exponents and subscripts of three older questions print as `<sup>` and `<sub>`. On a device: it serves the site as it was before the rebuild that renumbered the symbols (git `b4e166c`), then as it was after it (`b086afa`), where π is drawn as another symbol, then this folder, where every symbol of a question with π and of one with % must be the right one, the files are asked for with the stamp and the v1 caches are gone. That part needs git and the two commits; without them it is skipped.

`node src/check/additions.js index.html 390` checks the pages and drills added from the comparison with three prep books: Words to know and its two drills, the "Did not know a word" cause, every Math drill, the miss reasons that link to them, and Algebra foundations (its sections, a section's own drill, the Easy Algebra practice link, and the pointers that appear after three Easy Algebra misses).

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
