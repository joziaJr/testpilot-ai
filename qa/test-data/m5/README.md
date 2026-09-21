# M5 test data

M5 deterministic generation reuses the synthetic M4 review fixture at `qa/test-data/m4/review.txt`. It contains two selected-feature candidates, an explicit required-field validation, and unresolved admin wording so automated checks can exercise Positive/Negative/Edge generation, Need Confirmation restraint, FE/BE separation, and grounding without a live provider.

The generation evaluation also derives controlled English, Indonesian, and mixed-language contexts in code from `generation-test-fixture.ts`. These are synthetic evaluation inputs, not execution results or evidence that a probabilistic live model always behaves identically.
