<!-- Claude Code project instructions for the SAT method repo. Keep this file short (under ~200 lines); details belong in src/README.md. -->

# SAT method

This repo is SAT Sprint (https://satsprint.org): a free, single-page study site for the digital SAT, Reading and Writing plus Math, built on College Board's SAT question bank. `README.md` describes every feature. `src/README.md` names the file behind each feature and documents every build step and check: read the matching part before changing something.

## Ground rules

- `main` is the live site. GitHub Pages publishes it to satsprint.org as it is, with no build step. Work on a branch and open a pull request unless the owner says to push to `main`.
- `index.html` (about 8 MB) is generated. Never edit it by hand or open it whole; search it with `grep -o` and a short pattern. After any change under `src/` or `m/t/`, rebuild it and commit it with the change. The Checks workflow fails when it is not a fresh build.
- `src/build/*.json` is the page's data. Most of it is written by a script (`src/README.md` names it): change the script and rerun it rather than editing the JSON. `data.json`, `rdata.json`, `ann.json`, `notes-page.json` and `account.json` have no script and are edited directly. `bank.json` (Reading and Writing) and `mdata.json` (Math) hold College Board's questions and answer keys.
- Never change a College Board question, answer key or explanation. Note a source error beside the original (see `src/REVIEW.md`).
- Teaching claims are counted, not assumed. A number or a "most questions..." claim in a lesson is computed from the bank by its generator, and the generator's `--check` fails if the claim stops holding. Leave out advice the bank does not back.
- Colors are tokens. The theme block at the top of `src/site/app.css`, all of `src/site/prize-themes.css` and `FX_PAL` in `src/site/fx.js` are written by `src/tools/themes.py`: change the palettes there and rerun it. It stops if any text and background pair falls under 4.5:1 contrast.
- Leave `m/` (about 9,500 question files and pictures) and `rw/` (about 1,100 pictures) out of searches and listings. Look into big JSON such as `src/build/bank.json` (2.3 MB) with a short `python3` or `jq` query, not a full read.
- College Board's PDF exports are not in the repo, so `src/text/` and the Math image pipeline cannot be rerun here. Do not try to rebuild them.
- Only public keys go in the repo. `src/build/account.json` holds the Supabase project URL and its publishable (anon) key, which are meant to be public; never add a service-role key. The owner's gift link is kept only as a SHA-256 (`PZ_GIFT` in `src/site/prizes.js`); never commit the code itself.

## Build

```sh
python3 -I src/site/assemble.py /tmp/sat/page.html
python3 -I src/site/make_index.py /tmp/sat/page.html index.html
```

It takes under a second. Keep `page.html` outside the repo. `assemble.py` also writes `src/site/bundle.js`, an ignored intermediate. Run Python scripts with `python3 -I`, as the docs do.

## Checks

`.github/workflows/checks.yml` runs every check on each push and pull request. Before committing, rebuild and run the fast set (needs `pip install sympy==1.14.0`):

```sh
node --check src/site/bundle.js
python3 -I src/math/notin.py && python3 -I src/math/shortcut_first.py && git diff --exit-code -- src/build
python3 src/check/study_coverage.py
python3 -I src/math/study_text.py --check
python3 -I src/check/mdrills_check.py
node src/check/rw-practice.js
python3 -I src/check/head.py index.html
```

After touching colors, run `themes.py` (plain, `--prizes` and `--fxpal`) on copies and compare them, as checks.yml does.

Browser checks use Playwright with Chromium: `node src/check/<name>.js index.html 390`. Run the ones that cover your change (`src/README.md`, "Checks", says what each covers). `symbols`, `suggest`, `skip` and `visits` take only `index.html`; `msmoke` takes `index.html 390 light`; `source-review` needs a local server (see checks.yml). `symbols.js` needs two old commits, so part of it is skipped in a shallow clone.

## How the page is put together

- `src/site/shell.html` is the page. `assemble.py` puts in the CSS, the data and the script.
- The script is the `src/site/*.js` slices joined, in the order of `parts` in `assemble.py`, inside one `'use strict'` function, so they share one scope. A new slice goes into `parts`. There are no modules, imports, packages or bundler.
- Match the code's style: ES5 (`var` and `function`; no arrow functions, classes, `let` or `const`) and 2-space indents.
- The data is the `src/build/*.json` files as one JSON block (`#sprint-data`), read into `D` at the top of `core.js`.
- Progress is `store`, saved in localStorage by `save()` in `core.js`. Backups and account sync pass it through `bkClean` and `bkMerge` in `data.js`: names must match `BK_KEY` and strings `BK_STR` (free text only where `bkFree` allows), or they are dropped. Put new saved data under `store.s`. On a conflict `bkMerge` keeps this device's value there, so give new data its own rule when two devices should be joined instead (see `days` and `pz`).
- `sw.js` serves the page network first and question files from its cache. Rename a cache (also named in `data.js` as `PWA_Q`) only if those rules change.
- A change in `m/t/` changes the stamp built into `index.html`; rebuild.

## What the site promises

- Free, no account needed, no paywall. Prizes never lock anything and coins are never sold.
- No cookies or trackers. Visit counts stay cookieless, run only on satsprint.org, and stop under Do Not Track or Global Privacy Control. The page reaches only Google Fonts, Desmos and the Supabase project; ask the owner before adding any other outside service.
- Prize effects and every canvas never run inside a timed module (`.mmwrap`) and hold still under reduced motion.
- No sideways scrolling on a phone (the checks run at 390 px wide).

## Writing

- Site text, docs and commit messages share one plain voice: short sentences, everyday words, real numbers. American spelling. College Board passages are quoted exactly as printed.
- A commit subject says what changed in a sentence, after the area when there is one: `Prizes: a Seasons crate that follows the school year`.
- When you add a file, script or check, add it to `src/README.md`. When you add something visitors will see, add it to `README.md`.
