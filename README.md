# SAT Sprint

A free single-page study site for the digital SAT, in two subjects:

- **Reading and Writing:** a 60-second grammar method with 19 lessons, a four-step reading routine, passage structure, drills, and timed practice on real College Board questions.
- **Math:** a start-here routine, lessons for all 19 skills, 102 broad question types (each with how to spot it, the steps, and the usual trap), shortcuts, formulas and Desmos tips, and practice on all 1,925 questions in College Board's SAT Math question bank, checked against College Board's answers with College Board's explanations. The **Expanded types** tab adds **249 finer teaching types**, detailed reasoning and steps, close-variant comparisons, and **998 Desmos arithmetic checks labeled by scope**.

Open `index.html`, or the GitHub Pages site (Settings → Pages → Deploy from a branch → `main`, `/ (root)`). Math questions are images in `m/` (`q` = question, `r` = explanation, `qn`/`rn` = the same text re-wrapped for phones), so the site needs those folders next to `index.html`.

Every page has the same layout: the subjects at the top (Home, Reading & Writing, Math), the pages of the current subject as tabs underneath, a short "On this page" line, and a footer listing every page. **Appearance** (top right) switches between Match my device, Light, Dark, Purple, Blue, Pink and Green. **Suggest** opens a form for ideas, corrections and tips; sending it opens a ready-filled GitHub issue on this repository (posting needs a GitHub account), or the text can be copied instead. The same page has **My notes**, a private scratchpad.

The October source review adds detailed calculator-versus-hand methods, 11 probability families, source comparisons for every Math type, and new English reasoning and data patterns. Reading and Writing practice now includes all 1,845 unique source questions, including restored figure and grammar cards in `rw/`. Keep `rw/` alongside `index.html`, too.

Review scope, source corrections, and validation limits are documented in [src/REVIEW.md](src/REVIEW.md).

Progress, notes and the chosen appearance are saved in your browser only.

## The starting check and the study plan

Both subjects have a **starting check** (`#m-check`, `#rw-check`): ten questions on one clock (about 16 minutes for Math, 12 for Reading and Writing), one at each difficulty from every content area, with answers at the end. It gives a **rough starting range** for that section, the question types to begin with, and it fills in the map. The range is deliberately wide: the share right at each difficulty, counted equally, is placed on the 200 to 800 scale, plus or minus one standard error and never less than 60 points. The page says how it is worked out, that it is not a prediction, and that the real test adapts and is much longer. Home offers the checks to someone with no results yet.

**My study plan** (`#plan`, linked from Home and the footer) asks for a test date, 15, 30 or 45 minutes a day, and which sections. Each day it builds a few short sets from your results:

- **Repeats.** A question you miss comes back after 1 day; each time you then get it right it moves to 3 days, then 7, then it is done. Questions missed before the plan existed count as due straight away.
- **Practice by type.** The weakest types on your map first, then the ones getting there, then new ones (the most common first).
- **The check** first, for a section with no check and almost no history, and **a timed module** on Saturdays and every other day in the last week.

With both sections chosen they take turns day by day; from 30 minutes a day each section gets a set every day. A task is ticked when its questions have been answered since the day was built, and "Add one more set" adds another. The page also shows the week ahead and where you stand in each section. Everything is saved in this browser only; deleting the plan keeps your results.

## Timed modules, the mastery map and the trap report

Both subjects have these. Reading and Writing:

- **Reading & Writing → Practice** has two ways to practice. **Learn or pace** is the set with an answer after each question. **Timed module** (`#rw-module`) is one part of the real section: 27 questions on a single 32-minute clock, in the order the test asks them (8 Craft and Structure, 7 Information and Ideas, 7 Standard English Conventions, 5 Expression of Ideas; each kind of question kept together, easier first). You can move back and forth, mark questions for review, cross out choices and see every question in one list. Answers and explanations come at the end, where each question opens with the answer you gave. A blank counts against the module score but is not saved as a miss; a question you marked for review is saved as "unsure", so it shows up under **Unsure or guessed**.
- After each answer, **What caused the difficulty?** is now one tap instead of a menu.
- **Reading & Writing → My map** (`#rw-map`) shows 126 types as squares: the 20 kinds of reading question, by name, and the 106 grammar and transition rules by lesson. A square opens what to look at first or the rule, your record, and a practice set for just that type. **Why you miss** (`#rw-traps`) adds up the causes you tapped, with a fix for each, the types where it happened and a retry set.

Math:

- **Math → Practice** has two ways to practice. **Learn** shows College Board's answer and the method after each question. **Timed module** (`#m-module`) is one part of the real Math section: 22 questions on a single 35-minute clock, mixed like the test plan (8 Algebra, 8 Advanced Math, 3 Problem-Solving and Data Analysis, 3 Geometry and Trigonometry, easier questions first). You can move back and forth, mark questions for review, cross out choices and see every question in one list; answers, methods and explanations come at the end. A question left blank counts against the module score but is not saved as a miss.
- **Calculator** opens College Board's version of the Desmos graphing calculator in a panel beside the question (a sheet at the bottom of a phone screen). It loads from desmos.com, so it needs a connection.
- After any miss, **What went wrong?** takes one tap: answered a different question, fell for the type's trap, did not know the method, arithmetic slip, misread, or rushed.
- **Math → My map** (`#m-map`) shows all 249 fine question types as squares colored by your last results: needs work (under 60% right), getting there, strong (85% or more on at least three questions), or not tried. A square opens the type's trap, your record, and practice for just that type. The same page has **Why you miss** (`#m-traps`), which adds up the reasons you tapped, names the types where each happened and offers a retry set, plus your recent module scores.

## Rebuilding

See `src/README.md`.

SAT® is a trademark registered by College Board, which is not affiliated with, and does not endorse, this site. Passages, questions, answers and explanations come from College Board's free SAT Suite Question Bank.


## Expanded Math methods

Open **Math → Expanded types** (`#m-study`). Search a topic or a question ID, filter by skill or calculator evidence, and open a type for the recognition cues, reasoning, hand steps, and graphing route. Each type links to its own practice set. In ordinary Math practice, the same material appears under **Expanded method and calculator check** after you submit an answer. Existing lessons link to their related finer types.

Calculator checks include 382 question-derived target calculations, 528 intermediate source-solution steps, and 88 other labeled checks. They do not independently re-verify every full solution; 927 questions have no recorded numerical check.
