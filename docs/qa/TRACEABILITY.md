# Traceability

## Purpose and scope

Maintain a lightweight evidence chain:

```text
PRD → Requirement → Module / Feature → Test Case → Test Result → Bug
```

This is a repository documentation convention. The MVP does not include a full automated traceability system, coverage dashboard, or user-facing PRD-reference-per-case feature; the latter is a post-MVP candidate in PRD §32. Minimal internal references may support grounding without adding default case columns or UI features.

## Source identity

The approved [PRD](../product/PRD.md) and [Business Flow](../product/BUSINESS_FLOW.md) remain unchanged, version 1.0 Draft / Approved Baseline for Development. Cite section/BR identifiers plus applicable [resolved OQ-03–OQ-14](../product/OPEN_QUESTIONS.md). The register retains original question subjects, decisions, status, rationale, owner/date, affected docs, and verbatim approval. Document version is not application version.

For future uploaded-source fixtures, record a stable fixture revision/checksum and source location. A requirement reference must resolve to actual source content; inferred QA scenarios must remain distinguishable from explicit product rules.

## Baseline coverage mapping

This maps approved requirements to planned coverage, not to executed cases. Case/result/bug references are intentionally absent until real artifacts exist. The [Test Plan](TEST_PLAN.md) and [Release Checklist](RELEASE_CHECKLIST.md) contain the corresponding checks.

| Source                              | Behavior                                                                             | Planned coverage                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| PRD §§5, 27; Business Flow §3       | PDF/DOCX/TXT validation, extraction, invalid-file recovery                           | Upload formats/failures, no OCR, Upload Again                                                       |
| PRD §6; BR-07                       | Same/dominant language output, fixed headers/enums                                   | Indonesian/English/mixed language and structured-value checks                                       |
| PRD §§7–8, 24, 28                   | Analysis, language display, module/feature review and selection                      | Detection, selected-scope generation, three-screen responsibilities                                 |
| PRD §§9–13; BR-01/BR-03/BR-04/BR-06 | FE/BE semantics, inference, no invented rules/contracts, ambiguity                   | Layer-specific generation, guardrails, `Need Confirmation`, permitted whitespace/boundary inference |
| PRD §14                             | Coverage-based quantity, no manual count or redundancy                               | Quantity and duplicate-scenario review                                                              |
| PRD §§15–17                         | Eleven columns, automatic unique immutable IDs, structured output                    | Schema/enums/steps validation and deterministic ID checks                                           |
| PRD §§18–20; BR-02/BR-05            | Review before export, split tabs, non-ID editing, deletion                           | Preview, Save/Cancel from bootstrap plan, stable IDs, QA control                                    |
| PRD §§21–23; BR-05                  | Selected columns, preserved preview data, separate named TSVs                        | Export selection/order, TSV content, Excel/Sheets use, FE/BE/Both                                   |
| PRD §25                             | Configurable initial free-tier provider, no provider UI                              | Adapter/configuration checks                                                                        |
| PRD §26                             | Available usage metadata for every AI request                                        | Actions/model/tokens/timestamp checks                                                               |
| PRD §§27, 33                        | Handled errors, no crash, retry path, loading, usable large preview                  | Failure/recovery/responsiveness checks                                                              |
| PRD §29                             | Active-session generation data                                                       | Metadata/requirements/language/selection/FE/BE/edit state checks                                    |
| PRD §30                             | Versioning, commits, hooks/CI, post-main release automation                          | Release gates and version identity                                                                  |
| PRD §§31–32; Business Flow §15      | MVP boundaries and post-MVP candidates                                               | Scope review against [MVP Scope](../product/MVP_SCOPE.md)                                           |
| PRD §33                             | Server-only secrets, non-public uploads, modular responsibilities                    | Security/configuration and architecture review                                                      |
| PRD §34                             | Full Definition of Done                                                              | Release checklist plus all mapped coverage above                                                    |
| PRD §35; BR-02                      | QA retains judgment and final approval                                               | Review flow and human acceptance of generated cases                                                 |
| OQ-03–OQ-06                         | File policy, language fallback, ambiguity/empty selection, session lifecycle         | Test Plan upload/language/selection/session checks                                                  |
| OQ-07–OQ-10                         | Export defaults/order/empty layers, TSV safety, field/ID rules, analysis uncertainty | Test Plan export/schema/IDs and AI Evaluation uncertainty                                           |
| OQ-11–OQ-14                         | Stack/provider/usage, retries/partial output, privacy, release tooling               | Test Plan operational/security/release; Security Testing; Release Checklist                         |

## Artifact linking convention

| Artifact           | References to retain                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Case specification | Source revision/section, module/feature, stable case ID, layer                              |
| Execution record   | Case ID/revision, build/version/environment, fixture, actual result/status after execution  |
| Bug report         | Observed build, source-backed expectation, related case/execution, evidence, retest history |
| Release evidence   | Candidate version/commit, execution set, unresolved defects, decision and owner             |

Keep repository traceability in context/Notes without adding default case columns. Need Confirmation remains analysis metadata, not an added traceability/export column. Since IDs may restart in a new session, identify generated-case references by session plus layer/ID as well as source revision. Planned execution Actual Result and Status stay empty; do not manufacture result/bug links.

## Change maintenance

On a source change, identify affected modules/features and case specifications, preserve old evidence, and plan relevant regression. On implementation changes, update related docs and tests without retroactively changing source intent. On a failed execution, link the actual defect. On retest, append the new build/result and link the original observation. Handle these steps manually until a separate scope decision authorizes automation.

## M1 implementation

PRD sections 5/27/33, Business Flow section 3 and OQ-03/OQ-06/OQ-13 map to [M1 FE specifications](../../qa/test-cases/frontend/M1_UPLOAD.md) and [M1 BE specifications](../../qa/test-cases/backend/M1_UPLOAD.md). Notes link each case to actual automated tests. See [M1 Upload](../engineering/M1_UPLOAD.md) for implemented versus deferred scope. No manual result or bug links are manufactured.

## M2 implementation

PRD sections 5/24.1/27/31/33/34, Business Flow section 3 and OQ-03/OQ-11/OQ-13 map to Document Extraction, [M2 FE specifications](../../qa/test-cases/frontend/M2_EXTRACTION.md), [M2 BE specifications](../../qa/test-cases/backend/M2_EXTRACTION.md), and named unit/integration/E2E tests in their Notes. [M2 Extraction](../engineering/M2_EXTRACTION.md) defines the implemented contract and exclusions. No manual result or bug link is claimed.

## M3 implementation

PRD sections 6–8/24–27/29/31/33–35, Business Flow PRD Analysis, and OQ-04–OQ-06/OQ-10–OQ-13 map to [M3 FE specifications](../../qa/test-cases/frontend/M3_AI_ANALYZER.md), [M3 BE specifications](../../qa/test-cases/backend/M3_AI_ANALYZER.md), named analyzer unit/integration/E2E tests, and the [M3 evaluation corpus](../../qa/test-data/m3/README.md). [M3 Analyzer](../engineering/M3_AI_PRD_ANALYZER.md) defines the schema, evidence and exclusions. Deterministic software/security coverage is not reported as live-model semantic quality, manual execution, penetration-test clearance or M4 review coverage.

## M4 implementation

PRD sections 7–8/24.2/28–29/33–35, Business Flow Requirement Review, and OQ-05/OQ-06/OQ-13 map to [M4 FE specifications](../../qa/test-cases/frontend/M4_REQUIREMENT_REVIEW.md), review contract/session unit tests, and browser tests in `tests/e2e/shell.spec.ts`. [M4 Review](../engineering/M4_REQUIREMENT_REVIEW.md) defines selection semantics, identity validation, persistence, privacy, and exclusions. M4 adds no backend endpoint and produces no test cases, execution result, or bug record.

## M5 implementation

PRD sections 6/9–14/17–18/24.3/25–29/33–35, Business Flow generation, and OQ-04/OQ-05/OQ-09–OQ-13 map M3 requirement IDs through the confirmed M4 selection to internal references on every M5 generated case. [M5 FE specifications](../../qa/test-cases/frontend/M5_TEST_CASE_GENERATOR.md), [M5 backend/API specifications](../../qa/test-cases/backend/M5_TEST_CASE_GENERATOR.md), generator unit/integration tests, deterministic generation evaluation, and browser tests provide automated coverage. [M5 Generator](../engineering/M5_TEST_CASE_GENERATOR.md) defines the exact contract. M6 preview/edit/delete and export coverage are not claimed.

## M7 implementation

PRD sections 18–20/24.4/29/33–35, BR-02/BR-05, Business Flow QA Review, and OQ-06/OQ-09/OQ-13 map to the [M7 FE specifications](../../qa/test-cases/frontend/M7_EDIT_DELETE.md), [M7 backend-boundary specifications](../../qa/test-cases/backend/M7_EDIT_DELETE.md), deterministic mutation/component tests, and browser lifecycle/accessibility/security tests. [M7 Edit/Delete](../engineering/M7_EDIT_DELETE.md) defines mutable fields, source-linked read-only Module/Feature labels, immutable source/ID metadata, confirmation, stable ID gaps, layer isolation, session persistence, and invalidation. M7 adds no backend route, AI request, regeneration, column selection, export, execution result, or bug record.

## M6 implementation (historical preview boundary)

PRD sections 15–18/24.4/27–29/33–35 and Business Flow Test Case Preview map the validated M5 result to the [M6 FE preview specifications](../../qa/test-cases/frontend/M6_TEST_CASE_PREVIEW.md), [M6 backend-boundary specifications](../../qa/test-cases/backend/M6_TEST_CASE_PREVIEW.md), deterministic render tests and browser lifecycle/accessibility/security tests. The backend-boundary cases verify reuse of the validated M5 result and absence of a new preview route/provider call; they do not claim that M6 adds backend behavior. [M6 Preview](../engineering/M6_TEST_CASE_PREVIEW.md) defines the exact display contract. M7 edit/delete, M8 column selection and M9 export coverage are not claimed.
