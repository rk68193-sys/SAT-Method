# SAT Sprint

A free single-page study site for the digital SAT, in two subjects:

- **Reading and Writing:** a 60-second grammar method with 19 lessons, a four-step reading routine, passage structure, drills, timed practice on real College Board questions, and a Methods page: seven techniques from James Lu’s SAT videos (vocabulary in context, clause patterns, transitions, active reading, hard reading questions, verbs, punctuation), each tested against the question bank.
- **Math:** a start-here routine, lessons for all 19 skills, 102 question types (each with how to spot it, the steps, and the usual trap), shortcuts, formulas, a Desmos playbook of 20 moves in the four families James Lu’s Desmos guide teaches (solve, fit, read, compute), each checked on real bank questions, and practice on all 1,925 questions in College Board's SAT Math question bank, checked against College Board's answers with College Board's explanations.

Open `index.html`, or the GitHub Pages site (Settings → Pages → Deploy from a branch → `main`, `/ (root)`). Math questions are images in `m/` (`q` = question, `r` = explanation, `qn`/`rn` = the same text re-wrapped for phones), so the site needs those folders next to `index.html`.

Every page has the same layout: the subjects at the top (Home, Reading & Writing, Math), the pages of the current subject as tabs underneath, a short "On this page" line, and a footer listing every page. **Appearance** (top right) switches between Match my device, Light, Dark, Purple, Blue, Pink and Green. **Suggest** opens a form for ideas, corrections and tips; sending it opens a ready-filled GitHub issue on this repository (posting needs a GitHub account), or the text can be copied instead. The same page has **My notes**, a private scratchpad.

The October source review adds detailed calculator-versus-hand methods, 11 probability families, source comparisons for every Math type, and new English reasoning and data patterns. Reading and Writing practice now includes all 1,845 unique source questions, including restored figure and grammar cards in `rw/`. Keep `rw/` alongside `index.html`, too.

Review scope, source corrections, and validation limits are documented in [src/REVIEW.md](src/REVIEW.md).

Progress, notes and the chosen appearance are saved in your browser only.

## Rebuilding

See `src/README.md`.

SAT® is a trademark registered by College Board, which is not affiliated with, and does not endorse, this site. Passages, questions, answers and explanations come from College Board's free SAT Suite Question Bank.
