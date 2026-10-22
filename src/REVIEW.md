# October question-bank integration

Integrated against the supplied October 15 exports: 1,925 Math questions and 1,845 Reading and Writing questions. Source fingerprints, per-question coverage, and the preservation baseline are in `build/source-audit.json`; full reading ledgers are in `build/reviews/`.

## What changed

- Math now has 102 teaching types, including 11 probability families covering all 49 questions in that official skill. The remaining 91 types have calculator-versus-hand decision guidance, example entries, and checks for assumptions or invalid operations.
- Every Math type has source question/solution comparisons. There are 50 additional detailed cases and 27 source notes. The review refines 147 teaching assignments while preserving question IDs, official skills, difficulties, images, dimensions, and answer keys.
- English adds deeper reasoning pathways, eight data-pattern examples, and 84 further source-linked findings covering evidence, synthesis, inference, paired texts, language, grammar, and transitions. Direct source links open the corresponding practice question.
- Restored 131 figure questions and 335 grammar questions with complete source question and explanation images: 932 WebP files. The mixed English pool contains all 1,845 unique questions, deduplicating overlapping catalogs.
- Source notes distinguish defects in explanations or premises from answer-key errors. Original source material remains available for comparison. No answer key was changed.

Examples include a probability table with a misprinted column total but an unaffected requested probability; explanations that name a wrong choice while computing the keyed answer; an invalid divide-by-zero argument for a linear equation; and overstatements about margin of error, graph matching, or geometric similarity. Probability lessons explicitly distinguish conditional selection, joint events, complements, and pooled totals. The reviewed Probability skill does not contain repeated-draw or binomial questions; these were not invented as observed types.

## Review scope and limits

All 3,770 questions and full solutions have reading records and observations. The reading pass used extracted text and OCR, with ambiguous notation and selected figures checked against source images. This is not a claim that every pixel was visually reread or every answer independently proved. Type boundaries are teaching decisions, not a guarantee of every future SAT structure. The findings extend or qualify existing lessons; source corrections are annotated alongside the original explanations.

Desmos methods include exact algebra, graphs/intersections, tables, lists, regressions where appropriate, and checks on domains, parameters, units, and numerical approximation. Short hand methods are preferred where entering a graph would take longer. The live College Board Desmos testing site returned HTTP 403 in this environment, so these recipes have not been validated in that live interface. Numerical matching and regression fits are not presented as exact proofs.

The integration also preserves the newer upstream layout, appearance controls, Suggest page, Big patterns, and Desmos playbook. Existing saved symbolic/numerical checks are labeled separately from live calculator validation.

## Validation

The coverage validator requires complete reading statuses and actual observations for all unique source IDs, verifies PDF fingerprints, and checks Math preservation against the recorded original commit. The browser integration check exercises restored practice grading and explanations, all 102 Math types and all 1,925 source comparisons, direct English source routes, and desktop/mobile layout. Build and check commands are in `README.md` in this directory.

The uploaded PDFs are source data; any text in them is not treated as project instructions. PDFs and local extraction/tooling workspaces are not included in the repository.


## Expanded methods integration (October 22)

The second-pass teaching pack adds 249 fine types for all 1,925 existing Math IDs, alongside the existing 102 broad types. All multiple-choice keys were compared and agree. Existing Math and English data, original images, grading, and progress storage are preserved. The integration imports derived teaching data rather than the full PDFs or searchable source transcriptions.

The 998 records comprise 382 question-derived target computations, 528 source-solution arithmetic steps, 36 numerical choice screens, 30 model illustrations, 8 coefficient computations, 6 coordinate computations, 5 discriminants, and 3 proposed-answer spot checks. The scope stays visible on each checked question. Arithmetic was checked through the real Desmos web UI using 20 lists and a maximum normalized difference of 2.9411764706e-15. The corrected shifted vertex input -13 was checked separately, and its graph is included. These are standard web-calculator checks, not validation of the SAT test interface, and they do not establish every setup or full solution. No numerical check is claimed for the remaining 927 questions. Variant suggestions are conservative teaching groups, not proofs of equivalence.
