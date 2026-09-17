# AI Evaluation Strategy

## Purpose and status

Plan evaluation of the two AI responsibilities against [PRD §§6–14, 17, 24–26](../product/PRD.md), Business Flow BR-01–BR-07, and [resolved OQ-04/OQ-05/OQ-09–OQ-12](../product/OPEN_QUESTIONS.md). No corpus, model run, score, pass rate, or result exists. Output quality and hallucination evaluation remain distinct from functional and [AI security testing](SECURITY_TESTING.md).

## Evaluation dimensions

| Dimension             | Evidence to assess                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Analysis accuracy     | Documented modules/features/requirements/rules/validations identified; no unsupported facts                                                                                          |
| Coverage              | Selected requirements sufficiently represented without arbitrary count targets or redundant scenarios                                                                                |
| Layer relevance       | FE describes supported UI behavior; BE describes supported processing/contracts; Both keeps layers distinct                                                                          |
| Case quality          | Short titles, reproducible steps, concise expected results, coherent preconditions                                                                                                   |
| Reasonable inference  | Documented boundaries and permitted required-field/whitespace reasoning; no invented business rules                                                                                  |
| Hallucination control | No invented fields, roles, permissions, limits, API endpoints/methods/statuses/payloads/headers/auth mechanisms                                                                      |
| Uncertainty           | Need Confirmation with reason/missing details in analysis; dependent cases absent, unrelated valid coverage retained; no new export column                                           |
| Language              | Requirement-content dominance, then meaningful-content majority, then first primary heading; one language across Title/Preconditions/Steps/Expected Result; fixed headers/enums      |
| Structure             | Strict valid JSON, required fields and nullable presentation fields, steps array, approved enums including Yes/No/Candidate, application-owned session IDs; reject incomplete output |
| Operational evidence  | Three approved action labels, missing usage null, actual retry attempts tracked, at most one automatic transient retry, no duplicate active same-action requests                     |

## Corpus design

After case authoring is authorized, prepare synthetic annotated PDF/DOCX/TXT PRDs with known source facts. Include Indonesian, English, and mixed-language cases; simple and related requirements; documented limits; absent API contracts; contradictory/ambiguous requirements; and logically valid whitespace/boundary inference. Mark unsupported facts explicitly in fixture annotations.

Keep benign quality/hallucination fixtures separate from adversarial prompt-injection fixtures. Neither a hypothetical login fixture nor an authentication example authorizes TestPilot accounts. Capture source revision/checksum, expected facts, omissions, permissible inferences, and unresolved expectations under [Test Data Guide](TEST_DATA_GUIDE.md).

## Execution method

1. Identify the exact application build, provider/model, prompt/schema revisions, fixture, selected modules/features, scope, and configuration.
2. Validate deterministic schema handling with controlled responses separately from live-model evaluation.
3. Run analysis and generation through the real pipeline when it exists; retain sanitized outputs and usage metadata.
4. Review every assessed factual claim against source evidence. A second model may assist a reviewer only if later authorized; it is not the authoritative oracle or an MVP agent system.
5. Evaluate semantic properties instead of requiring identical prose or a fixed case count across runs.
6. Record Actual Result and Status only after real execution; link observed issues and reproducible counterexamples.

## Hallucination evaluation

Test omission as deliberately as presence: a source without a maximum must not acquire one; a BE selection without API details must not create an API contract. Confirm the system still produces supported business-logic scenarios where possible and preserves confirmation markers for missing details. Distinguish fabricated facts from permitted QA inference. Human judgment remains necessary after schema validation.

## Comparison and release use

For prompt/schema/model/provider changes, compare the same corpus/selections against a named baseline. Record unsupported-fact counts, missing source coverage, duplicates, FE/BE errors, uncertainty omissions, and language/structure failures. Select and document sample sizes appropriate to the change; no initial numeric SLO is required. Do not hide invented contracts behind an aggregate score. TestPilot's approved 10 MB policy is not evidence for a missing limit in an unrelated source PRD.

Use [Regression Checklist](REGRESSION_CHECKLIST.md) and [Release Checklist](RELEASE_CHECKLIST.md). Semantic quality checks, security checks, and deterministic tests each need their own evidence; a pass in one category does not prove another.
