# SAT Sprint

A free single-page study site for the digital SAT, in two subjects:

- **Reading and Writing:** a 60-second grammar method with 19 lessons, a four-step reading routine, passage structure, drills, and timed practice on real College Board questions.
- **Math:** a start-here routine, lessons for all 19 skills, 102 broad question types (each with how to spot it, the steps, and the usual trap), shortcuts, formulas and Desmos tips, and practice on all 1,925 questions in College Board's SAT Math question bank, checked against College Board's answers with College Board's explanations. The **Expanded types** tab adds **249 finer teaching types**, detailed reasoning and steps, close-variant comparisons, and **998 Desmos arithmetic checks labeled by scope**.

Open `index.html`, or the GitHub Pages site (Settings → Pages → Deploy from a branch → `main`, `/ (root)`). Math questions are in `m/`: `t/` holds each question as text with its expressions drawn, and `q`, `r`, `qn`, `rn` hold the pictures (`q` = question, `r` = explanation, `qn`/`rn` = the same text re-wrapped for phones). The site needs those folders next to `index.html`, together with `sw.js`, `manifest.webmanifest` and `icons/` (offline use and the installed app).

Every page has the same layout: the subjects at the top (Home, Reading & Writing, Math); under them the same four tabs in both subjects, **Start here**, **Learn**, **Practice** and **My map**; a second row with the pages of the tab you are in, where it has more than one (Learn, and Practice with Drills, in both subjects); a short "On this page" line; and a footer listing every page. **Learn** opens an overview of that subject with one search across everything in it: lessons, question types, patterns, shortcuts and calculator moves in Math (`#m-hub`); reading steps, grammar lessons and rules, worked examples, terms and transition words in Reading and Writing (`#rw-hub`). Every earlier address still works.

**Home** opens with a real question to answer, Math or Reading and Writing: answering it shows how to spot that kind of question and the method for it. Nothing from there is saved as practice. The hero says what the site costs: free, no account, no paywall. **Appearance** (top right) switches between Match my device, Light, Dark, Purple, Blue, Pink and Green. **Suggest** opens a form for ideas, corrections and tips; sending it opens a ready-filled GitHub issue on this repository (posting needs a GitHub account), or the text can be copied instead. The same page has **My notes**, a private scratchpad.

The October source review adds detailed calculator-versus-hand methods, 11 probability families, source comparisons for every Math type, and new English reasoning and data patterns. Reading and Writing practice now includes all 1,845 unique source questions, including restored figure and grammar cards in `rw/`. Keep `rw/` alongside `index.html`, too.

Review scope, source corrections, and validation limits are documented in [src/REVIEW.md](src/REVIEW.md).

Progress, notes and the chosen appearance are saved in your browser only; **Backup and offline** (`#my-data`) makes a file of them and moves them to another device. An optional free account (`#account`, see **Accounts** below) keeps the same progress online and on every device; it is switched off until a project is set.

## Questions as text

Questions used to be pictures of the printed page. They are now rebuilt from College Board's own PDF export (`src/text/`):

- **Math** (1,923 of 1,925 questions): the words are real text that wraps to any screen and follows the theme. The export stores every expression as drawn shapes, not characters, so each expression is kept exactly as drawn, as a small vector drawing that sits in the sentence where it was printed; nothing is retyped or recognised. Graphs, diagrams and tables are cropped as pictures. In practice the four choices appear inside the answer buttons. Each question is a small file in `m/t/`, loaded when it is shown, and all of them share one library of symbol outlines (`m/t/_glyphs.js`). The page asks for these files with a stamp of the set they came from, so a device that kept files from an earlier version never draws a question with another version's symbols. The older questions that set an exponent or a subscript as small text (x², 10⁸, x₁) print it that way.
- **Reading and Writing** (465 of the 466 questions that were pictures: 131 with a table or graph, 334 of the 335 extra grammar questions): text cards like the rest, with real choices and College Board's explanation for each choice. A table or graph is a picture in `rw/f/`.
- **The printed page is always one tap away**: "See the question as printed" in Math, "As printed" links in Reading and Writing.
- **A question is rebuilt only when it passes every check**: every piece of text and every drawing on its pages was placed exactly once, the choices and headings were found, the printed answer agrees with the site's key, and nothing looks out of place (a symbol off its line, a stray label, a character the export does not name). The 20 Math questions and 1 grammar question that do not pass keep their pictures, as does any question whose file fails to load. `src/build/mtext.json` lists them with the reason.

The pictures in `m/` and `rw/` are still needed: for the questions that kept them, for "as printed", and as the fallback.

## The starting check and the study plan

Both subjects have a **starting check** (`#m-check`, `#rw-check`): ten questions on one clock (about 16 minutes for Math, 12 for Reading and Writing), one at each difficulty from every content area, with answers at the end. It gives a **rough starting range** for that section, the question types to begin with, and it fills in the map. The range is deliberately wide: the share right at each difficulty, counted equally, is placed on the 200 to 800 scale, plus or minus one standard error and never less than 60 points. The page says how it is worked out, that it is not a prediction, and that the real test adapts and is much longer. Home offers the checks to someone with no results yet.

**My study plan** (`#plan`, linked from Home and the footer) asks for a test date, 15, 30 or 45 minutes a day, and which sections. Each day it builds a few short sets from your results:

- **Repeats.** A question you miss comes back after 1 day; each time you then get it right it moves to 3 days, then 7, then it is done. Questions missed before the plan existed count as due straight away.
- **Practice by type.** The weakest types on your map first, then the ones getting there, then new ones (the most common first).
- **The check** first, for a section with no check and almost no history, and **a timed module** on Saturdays and every other day in the last week.

With both sections chosen they take turns day by day; from 30 minutes a day each section gets a set every day. A task is ticked when its questions have been answered since the day was built, and "Add one more set" adds another. The page also shows the week ahead and where you stand in each section. Everything is saved in this browser only; deleting the plan keeps your results.

## Daily practice, backup and offline use

All of this works the same for Math and for Reading and Writing, and none of it needs an account.

- **Today** on Home has a **question of the day** for each section: the same question for everyone that day, Easy, Medium and Hard taking turns. Each opens as ordinary practice, so the answer is saved, shows on the map and counts toward the plan.
- **The streak** is the number of days in a row with at least one answer in either section. It stays alive through today if yesterday had practice. Beside it, a calendar of the last weeks shows how much was answered each day (hover or press a square for the Math and Reading and Writing counts). The plan page and the backup page show it too. Answers saved before this existed are turned into days once, from the date of the last attempt at each question.
- **Backup** (`#my-data`, "Backup and offline" in the footer, and a line on both maps and the plan): **Download a backup file** writes one small dated file with every answer, miss reason, plan, note and setting. On a phone, "Send it to myself" hands the same file to the share sheet. Nothing is uploaded.
- **Restore** reads such a file and offers two choices. **Add it to what is here** keeps both: for a question answered in both places the more recent attempt stays, days and module scores are joined, notes from both are kept, and the plan and settings on this device stay. **Replace what is here** makes the device match the file. A file is checked before anything is used: only plain values are kept, and adding the same file twice changes nothing. **Erase my progress** starts over.
- **Offline.** Over https the site registers a service worker (`sw.js`). After one visit the page opens with no connection; every question file or picture you have opened is kept as you go, and **Save every question for offline use** fetches the rest once (about 32 MB). When an update rebuilds the Math questions, their files have a new stamp, so the saved ones are fetched again as they are opened, or all at once with the same button. The site can be installed to the home screen or as a desktop app (`manifest.webmanifest`). With no connection, everything works except the Desmos calculator panel and Suggest. Opened as a file from a folder, the site already works offline and none of this is used.

## Timed modules, the mastery map and the trap report

Both subjects have these. Reading and Writing:

- **Reading & Writing → Practice** has two ways to practice. **Learn or pace** is the set with an answer after each question. **Timed module** (`#rw-module`) is one part of the real section: 27 questions on a single 32-minute clock, in the order the test asks them (8 Craft and Structure, 7 Information and Ideas, 7 Standard English Conventions, 5 Expression of Ideas; each kind of question kept together, easier first). You can move back and forth, mark questions for review, cross out choices and see every question in one list. Answers and explanations come at the end, where each question opens with the answer you gave. A blank counts against the module score but is not saved as a miss; a question you marked for review is saved as "unsure", so it shows up under **Unsure or guessed**.
- After each answer, **What caused the difficulty?** is now one tap instead of a menu.
- **Reading & Writing → My map** (`#rw-map`) shows 126 types as squares: the 20 kinds of reading question, by name, and the 106 grammar and transition rules by lesson. A square opens what to look at first or the rule, your record, and a practice set for just that type. **Why you miss** (`#rw-traps`) adds up the causes you tapped, with a fix for each, the types where it happened and a retry set.

Math:

- **Math → Practice** has two ways to practice. **Learn** shows College Board's answer and the method after each question. **Timed module** (`#m-module`) is one part of the real Math section: 22 questions on a single 35-minute clock, mixed like the test plan (8 Algebra, 8 Advanced Math, 3 Problem-Solving and Data Analysis, 3 Geometry and Trigonometry, easier questions first). You can move back and forth, mark questions for review, cross out choices and see every question in one list; answers, methods and explanations come at the end. A question left blank counts against the module score but is not saved as a miss.
- **Calculator** opens College Board's version of the Desmos graphing calculator in a panel beside the question (a sheet at the bottom of a phone screen). It loads from desmos.com, so it needs a connection.
- **Reference** opens the reference sheet in the same panel: the formulas and facts the test gives you (circle, rectangle, triangle, the Pythagorean theorem, the two special right triangles, box, cylinder, sphere, cone, pyramid; degrees and radians in a circle; the angles of a triangle), drawn for this site. It works offline. Escape or Close puts it away, and opening one panel closes the other. The Formulas page (`#m-sheet`) shows the same sheet.
- After any miss, **What went wrong?** takes one tap: answered a different question, fell for the type's trap, did not know the method, arithmetic slip, misread, or rushed.
- **Math → My map** (`#m-map`) shows all 249 fine question types as squares colored by your last results: needs work (under 60% right), getting there, strong (85% or more on at least three questions), or not tried. A square opens the type's trap, your record, and practice for just that type. The same page has **Why you miss** (`#m-traps`), which adds up the reasons you tapped, names the types where each happened and offers a retry set, plus your recent module scores.

## Words to know, drills and the basics

These were added after comparing the site with three SAT prep books; everything is written for this site and checked against the bank.

- **Words to know** (`#vocab`, under Reading and Writing → Learn → Reading): the 814 words offered as choices in the fill-in Words in Context questions, with a plain definition each and how often each was right, filtered by search, by right answers, or by the words in questions you missed (a miss marked **Did not know a word** sends its words there). The page also shows what to do when you cannot predict the word (decide whether it is positive or negative), 40 familiar words used in a second meaning, and the 87 words that Purpose and structure choices use to describe what a text does. Two drills go with it: **Word meanings** and **Second meanings**.
- **Parts of speech in five minutes** (`#parts-of-speech`, at the top of Look up → Glossary): the eight parts of speech the grammar rules lean on (a prepositional phrase, a coordinating conjunction, a tensed verb), each with a quick test and examples, what makes a sentence, and a short exercise where you name each word's part and tap it to check. The glossary list gains the terms the rule names used without defining. Its drill, **Sentence or fragment?** (`#drill-frag`, just before **Which boundary?**), shows one string of words and asks whether it can stand alone: 16 sentences, many built to look like fragments, and 28 fragments of three kinds (no tensed verb; a clause opened by a word like *because*; only a *which*, *who* or *that* clause). Each answer names the subject and tensed verb, or gives one way to fix it. Grammar Parts A and B point beginners to both.
- **Same idea, different words** (`#drill-same`, a Reading drill right after **Follow the pointer**): one sentence from a real Detail or Main idea passage and four rewordings written for this site. One keeps the meaning in other words; the others reuse the sentence's words and change what it says (they swap who did what, invent or reverse a cause, say more than the sentence does, or say the opposite). It exists because matching words fails on the real test: the right choice shares the most words with the passage in only 18% of Information and Ideas questions (see **Shortcuts that do not work**). On every one of the 26 cards, picking by shared words lands on a wrong choice, and each answer shows the counts. Step 3 · Say and the shortcuts list both link to it.
- **Poems and stories** (`#poems`, on Step 2 · Chunk): 36 reading questions are built on a poem and 111 on a novel, short story or play, and they are rated Hard less often than the rest. Four moves for a poem, each backed by a count from the bank: read by sentence, not by line (141 of 154 marked line breaks fall mid-sentence); find the turn (3 of the 5 overall-structure answers on poems read "this, then that", and so do all their choices); name the speaker's attitude (all 8 main idea and main purpose answers on poems are about a feeling or a view); and say what an image stands for without adding to it. For stories: read for what a character feels, wants or is like (19 of the 27 main idea and main purpose answers), and translate old wording. A list links all 36 poem questions. Two fiction habits from a prep book, slowing down and looking at the first and last lines, are left out because the bank does not back them.
- **Math → Practice → Drills** (`#m-drills`): **Name the skill** (a real bank question; name College Board's skill before solving), **How many solutions?**, **Which form shows it?**, and quick reps for the usual slips: **Exponent rules**, **Percent multipliers**, **Slope from two points**, **Clearing fractions**. Every wrong choice says what went wrong. A miss tagged "Arithmetic or sign slip" or "Did not know the method" links to the drills that train that habit.
- **Algebra foundations** (`#m-found`, Math → Learn → Foundations): the six moves every question assumes (fractions, getting x alone, solving for a whole expression, distributing and factoring, like terms, an unknown in a denominator), each with a worked example, the usual slip, why it works and a drill of its own. 269 of the bank's 685 Easy questions are Algebra; once three of them are standing misses, the map and the lessons point here.
- **Look for the shortcut first** (`#m-first`, Math → Learn → Shortcut first): six kinds of question where what is asked for drops out in a step or two (a multiple of what you know, the same bracket twice, adding or subtracting the equations, the sum or product of the solutions, matching the two sides, halfway between equal heights), each with its tell, the move, a worked example, what to watch and bank questions to try. Then the look-alikes, where the short way is not there, and where picking numbers fits: a check or a fallback, not the first move. 78 bank questions are filed under a kind or a look-alike, and after a practice answer on one of them a note shows the short way for that question, or why it was not there. A mixed set of ten asks you to decide each time.
- **What the bank never asks** (`#m-notin`, on Math → Start here): seven topics some prep books teach that no question in the bank uses (complex numbers, logarithms, matrices and vectors, permutations and combinations, ellipses and hyperbolas, sine waves and the laws of sines and cosines, the remainder theorem), two that come up once (polynomial division, sequences), and the factor theorem, which seven questions use. The Learn search finds them too, so searching "complex numbers" says it is not in the bank.

## Rebuilding

See `src/README.md`.

SAT® is a trademark registered by College Board, which is not affiliated with, and does not endorse, this site. Passages, questions, answers and explanations come from College Board's free SAT Suite Question Bank.


## Expanded Math methods

Open **Math → Expanded types** (`#m-study`). Search a topic or a question ID, filter by skill or calculator evidence, and open a type for the recognition cues, reasoning, hand steps, and graphing route. Every type’s **Recognize it** line says what that type’s own bank questions give and ask, so you can spot one before solving it, and its **Why it works** line is its own: the reason behind the rule, often with a small worked example (why exponents add, why a cone is a third of a cylinder), so you can rebuild a rule you forget. Each type links to its own practice set. In ordinary Math practice, the same material appears under **Expanded method and calculator check** after you submit an answer. Existing lessons link to their related finer types.

Calculator checks include 382 question-derived target calculations, 528 intermediate source-solution steps, and 88 other labeled checks. They do not independently re-verify every full solution; 927 questions have no recorded numerical check.


## Accounts

An account is optional. Without one the site works as before and progress stays in the browser. With one, the streak and days practiced, both maps, the study plan, notes and every answer are also kept online and appear on any device that signs in (`#account`, **Sign in** in the top bar).

Accounts are on when `src/build/account.json` names a [Supabase](https://supabase.com) project (it does now); with that file empty, no sign-in link is shown and nothing is sent anywhere. Setting up a project:

1. Create a free Supabase project.
2. In its SQL editor, run `src/account/setup.sql` once. It makes one table (`progress`, one row per person) whose row rules let a signed-in person read and write only their own row, and the function behind "Delete my account".
3. Authentication → URL Configuration: set **Site URL** to the site's address (the GitHub Pages URL). Emailed links (confirming an address, choosing a new password) return there.
4. Authentication → Sign In / Providers → Email: decide whether new accounts must confirm their address. The built-in mail sender allows only a few emails an hour; for real use, turn confirmation off or connect your own mail service (SMTP).
5. Put the project URL and its **publishable (anon) key** in `src/build/account.json` (`{"url": "https://xxxx.supabase.co", "key": "..."}`) and rebuild (`src/README.md`). This key is meant to be public; never use the secret (service role) key.

How it behaves: answers are sent a few seconds after they are given, and wait on the device when there is no connection. Progress already on a device is added to the account at sign-in. If two devices change things at once, they are joined the way a backup is added (the newer attempt at each question stays). Signing out removes the progress from that device (it stays in the account), which suits shared computers. "Erase my progress" while signed in erases the account's copy too; "Delete my account" removes the account and keeps the device's copy. The service stores an email address and the progress, nothing else.

`node src/check/account.js index.html 390` checks all of this against a stand-in service on localhost. It cannot check the real table's row rules, so after setup, sign in with two different accounts once and confirm each sees only its own progress.

