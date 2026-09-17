# Future automation

This directory reserves the location for future QA automation conventions. No framework, dependencies, scripts, or full automation suite are installed by this task. An Automation value in generated content is not evidence that a runnable test exists.

Prioritize future automation in this order:

1. P0 flows.
2. File validation.
3. PRD processing.
4. AI response schema validation.
5. TSV export.
6. Regression-critical behavior.

Use the adopted application toolchain and place tests near the implementation where that is clearer; this folder need not duplicate all test code. Link runnable suites, source-backed cases, fixtures, and results when they exist. Mock provider transport/failure behavior for deterministic checks and label live-model evaluations separately. Semantic guardrail checks still require source-grounded assertions and review.

Use the [resolved decisions](../../docs/product/OPEN_QUESTIONS.md) as policy oracles: 10 MB uploads, strict JSON, ambiguity eligibility, session IDs, one automatic transient retry, schema-order safe TSV, and missing usage null. Do not invent API contracts or execution results. Add verified commands only with actual implementation; follow [Environment](../../docs/engineering/ENVIRONMENT.md), [Test Strategy](../../docs/qa/TEST_STRATEGY.md), and [Development Guide](../../docs/engineering/DEVELOPMENT_GUIDE.md).

Automation used to validate TestPilot is distinct from out-of-scope product Playwright generation or an automation-execution module.
