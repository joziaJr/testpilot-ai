# AI Evaluation Strategy

## Purpose and status

Plan evaluation of the two AI responsibilities against [PRD §§6–14, 17, 24–26](../product/PRD.md), Business Flow BR-01–BR-07, and [resolved OQ-04/OQ-05/OQ-09–OQ-12](../product/OPEN_QUESTIONS.md). M3 adds the synthetic `M3-2` analyzer corpus and deterministic harness under `qa/test-data/m3`. M5 extends `npm run test:ai-eval` with a separate deterministic generation harness covering FE/BE relevance, supported case types, requirement/rule/validation traceability, invention defenses, Need Confirmation safety, duplicates, language, strict structure, prompt-injection separation, executable steps and grounded expected results. Output quality and hallucination evaluation remain distinct from functional and [AI security testing](SECURITY_TESTING.md); fake-provider evidence does not replace controlled live-model semantic review.

## Evaluation dimensions

| Dimension               | Evidence to assess                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Analysis accuracy       | Documented modules/features/requirements/rules/validations identified; no unsupported facts                                                                                          |
| Feature coverage        | Explicit feature/subsections and direct module capabilities represented; goals, summaries and repeated acceptance bullets do not create duplicates                                   |
| Coverage                | Selected requirements sufficiently represented without arbitrary count targets or redundant scenarios                                                                                |
| Requirement granularity | One independently testable behavior/constraint/validation/transition/persistence/navigation/field rule per requirement; one logical enum list remains one requirement                |
| Uncertainty coverage    | Every expected ambiguity is represented; every confirmation question references its ambiguity; neither collection contains normalized semantic duplicates                            |
| Layer relevance         | FE describes supported UI behavior; BE describes supported processing/contracts; Both keeps layers distinct                                                                          |
| Case quality            | Short titles, reproducible steps, concise expected results, coherent preconditions                                                                                                   |
| Reasonable inference    | Documented boundaries and permitted required-field/whitespace reasoning; no invented business rules                                                                                  |
| Hallucination control   | No invented fields, roles, permissions, limits, API endpoints/methods/statuses/payloads/headers/auth mechanisms                                                                      |
| Uncertainty             | Need Confirmation with reason/missing details in analysis; dependent cases absent, unrelated valid coverage retained; no new export column                                           |
| Language                | Requirement-content dominance, then meaningful-content majority, then first primary heading; one language across Title/Preconditions/Steps/Expected Result; fixed headers/enums      |
| Structure               | Strict valid JSON, required fields and nullable presentation fields, steps array, approved enums including Yes/No/Candidate, application-owned session IDs; reject incomplete output |
| Operational evidence    | Three approved action labels, missing usage null, actual retry attempts tracked, at most one automatic transient retry, no duplicate active same-action requests                     |

## Corpus design

The M3-2 text corpus covers English, Indonesian, mixed-language, atomic requirement boundaries, an enum list that must remain intact, ambiguity-to-confirmation relationships, documented limits, absent details and adversarial embedded instructions. Its manifest records twenty analyzer oracles without manual outcomes. Future generation evaluation should add annotated PDF/DOCX/TXT PRDs with selected-scope and layer expectations. Mark unsupported facts explicitly in fixture annotations.

Keep benign quality/hallucination fixtures separate from adversarial prompt-injection fixtures. Neither a hypothetical login fixture nor an authentication example authorizes TestPilot accounts. Capture source revision/checksum, expected facts, omissions, permissible inferences, and unresolved expectations under [Test Data Guide](TEST_DATA_GUIDE.md).

## Execution method

1. Identify the exact application build, provider/model, prompt/schema revisions, fixture, selected modules/features, scope, and configuration.
2. Validate deterministic schema handling with controlled responses separately from live-model evaluation.
3. Run analysis and generation through the real pipeline when it exists; retain sanitized outputs and usage metadata.
4. Review every assessed factual claim against source evidence. A second model may assist a reviewer only if later authorized; it is not the authoritative oracle or an MVP agent system.
5. Compare normalized semantic requirement sets across repeated runs. Counts are diagnostic; equivalent coverage with different wording/order is not a failure.
6. Record Actual Result and Status only after real execution; link observed issues and reproducible counterexamples.

## Hallucination evaluation

Test omission as deliberately as presence: a source without a maximum must not acquire one; a BE selection without API details must not create an API contract. Confirm the system still produces supported business-logic scenarios where possible and preserves confirmation markers for missing details. Distinguish fabricated facts from permitted QA inference. Human judgment remains necessary after schema validation.

## Comparison and release use

For prompt/schema/model/provider changes, compare the same corpus/selections against a named baseline. Record unsupported-fact counts, missing source coverage, duplicates, FE/BE errors, uncertainty omissions, and language/structure failures. Select and document sample sizes appropriate to the change; no initial numeric SLO is required. Do not hide invented contracts behind an aggregate score. TestPilot's approved 10 MB policy is not evidence for a missing limit in an unrelated source PRD.

Use [Regression Checklist](REGRESSION_CHECKLIST.md) and [Release Checklist](RELEASE_CHECKLIST.md). Semantic quality checks, security checks, and deterministic tests each need their own evidence; a pass in one category does not prove another.

## M3 execution boundary

Run `npm run test:ai-eval` for deterministic corpus completeness, fake-provider language behavior, prompt-data separation and invalid-schema rejection. This command is CI-safe and makes no network request. A live Gemini evaluation is optional, requires an ignored credential and human review, and must record actual evidence separately before any quality claim. M3 completion does not claim live-model semantic accuracy.

## M3 refinement observation

An authorized 2026-09-20 live stability check used the same synthetic TaskFlow TXT sample for three sequential `gemini-3.5-flash` runs with prompt revision `m3-analyzer-v2` and temperature `0`. Each run returned 5 modules, 9 features, 28 requirements, 5 business rules, 5 validations, 5 ambiguities and 5 linked Need Confirmation questions. Normalized requirement-set overlap was 28/28 for every pair, and all five known uncertainty topics were present. Grounding, reference and normalized-duplicate checks reported no errors. Full PRD/provider responses were not retained or logged. This is a sample observation, not a general pass rate or deterministic-model guarantee.
