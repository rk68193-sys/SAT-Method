# Authored explanations

The collection covers all 3,770 College Board question IDs: 1,925 Math and 1,845 Reading and Writing. It is enabled on the SAT Sprint production host, its GitHub Pages host, and local preview hosts. Unknown hosts, file URLs, missing entries and changed answer keys retain the previous feedback. `?explanations=off` before a route hash restores the original feedback and original source display for comparison or diagnosis.

Question IDs, answer keys, memberships, attempts, rewards and account data retain their existing contracts. Explanations are primary feedback, and original source solutions or previous guided notes remain available in reference panels. Module explanations are revealed in review after finishing. Optional variations do not record attempts or award rewards.

Seven passages have complete context or underlines restored from College Board's official question-bank records. Four questions use explicitly labeled editorial practice wording: `3a2d77d7`, `d222f7d9`, `4e18fc5d`, and `da978ee6`. These corrections appear before answering; originals remain accessible. They are not presented as official College Board errata.

`src/build/explanations.json` is the release payload. Assembly embeds it into `index.html` through `src/site/assemble.py`. The exporter defaults to a local-only collection; `--release` explicitly exports the approved production mode. Re-exporting requires the separate editorial ledger, pinned selection and evidence-linked source-resolution ledger. The committed payload is sufficient for ordinary site rebuilds.

`src/check/explanations.js` validates every ID and source occurrence, exact host and key guards, structured source rendering and escaping. `src/check/explanations-browser.js` covers a sample across every Math type, all eleven source resolutions, modules, offline use and responsive layouts. `src/check/explanation-duplicates.js` checks both presentations of all 25 duplicated Reading and Writing IDs and their shared history. Its diagnostic hook exists only in an intercepted test page.

Content was editorially reviewed; improved student learning has not been measured. The user authorized publication in chat on November 17, 2026.
