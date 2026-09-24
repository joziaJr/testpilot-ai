# Test Strategy

## M7 coverage addition

M7 combines pure mutation tests with static component rendering and Playwright workflows. Coverage verifies schema-valid Save, source-compatible canonical Module/Feature labels, incompatible-label rejection, invalid/duplicate rejection, Cancel, confirmed Delete, immutable IDs/source references, non-renumbering, final empty layers, active-session restoration/invalidation, FE/BE isolation, accessibility, responsive containment, inert hostile edited text, and absence of mutation-time AI/network behavior. Existing M1–M6 suites remain regression gates; no live-model test is required because M7 is deterministic and makes no AI call.

## Purpose and status

Define how functional and failure behavior will be assessed. M0 environment checks through M7 deterministic edit/delete tests are implemented. See the milestone engineering documents through [M7 Edit/Delete](../engineering/M7_EDIT_DELETE.md) for precise coverage and limitations. Deterministic provider tests remain separate from non-deterministic live-model quality review. The approved [PRD](../product/PRD.md), particularly §34 Definition of Done, and [Business Flow](../product/BUSINESS_FLOW.md) remain the product oracles.

## Testing levels

| Level                       | Focus and evidence                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Unit testing                | Deterministic file checks, parser helpers, schema validators, stable-ID logic, edit state, TSV serializer                            |
| Integration testing         | Validation → extraction, analyzer → structured requirements, selections → generator, accepted cases → export                         |
| API testing                 | TestPilot server contracts after specification; request validation, safe failures, secret isolation; never invent routes or statuses |
| Frontend functional testing | Upload feedback, review/selection, FE/BE presentation, edit Save/Cancel, deletion, export selection                                  |
| End-to-end testing          | Approved upload-to-export flow on a known build, with reproducible fixtures and controlled provider behavior                         |
| Regression testing          | Critical paths, prior observed defects, affected parser/schema/prompt/export behavior                                                |
| AI output validation        | Structural validity plus source grounding, scope, ambiguity, FE/BE distinction, duplicate and case-type review                       |
| Error handling testing      | Corrupt/unreadable files, provider timeout/rate limit/unavailability, malformed/empty/partial responses, state preservation          |

API testing of TestPilot itself is different from BE cases generated for an uploaded target-system PRD. Both need their own documented contracts.

## Test types

| Type        | Purpose                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Positive    | Documented valid input/flow satisfies its stated rule                                                   |
| Negative    | A documented constraint is violated, without inventing an error contract                                |
| Edge        | Behavior at a documented boundary or unusual supported condition                                        |
| Validation  | Inputs and structured outputs conform to agreed rules                                                   |
| Functional  | User-visible result agrees with the approved requirement                                                |
| Integration | Components exchange correct data and preserve context                                                   |
| Regression  | Existing verified behavior remains correct after change                                                 |
| AI-specific | Grounding, ambiguity, language, injection resistance, schema, selection scope, and stochastic variation |

These QA categories may overlap. The generated-case Type values requested in the brief are Positive, Negative, and Edge; do not add every strategy category to the product enum.

## Priority

| Priority           | Meaning                                                                      | Typical planning focus                                                                                             |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| P0 / Critical path | Failure blocks trustworthy completion or compromises essential data/security | Upload-to-export flow, source grounding/no invented rules, no exposed credentials, valid selected-output structure |
| P1 / Important     | Material workflow/coverage degradation requiring correction                  | Format/language variants, editing/cancel/session behavior, provider failures, stable IDs                           |
| P2 / Secondary     | Lower-impact behavior with limited effect on task completion                 | Presentation refinements and secondary compatibility checks supported by the specification                         |

These priorities govern project QA planning and bug triage; generated-case Priority is explicitly High/Medium/Low in PRD §6. Do not export P0/P1/P2 as product Priority values or substitute priority for severity. Store repository execution priority separately. Reassess planning priority by impact and source evidence.

## AI evaluation method

Use synthetic PRDs with explicit facts, omitted contracts, documented boundaries, ambiguous/conflicting requirements, and Indonesian/English/mixed text. Verify same-language output, dominant-language mixed output, fixed headers/enums, and permitted reasonable QA inference (including whitespace for a required field). Future annotations identify source facts and forbidden inferences. Compare semantic assertions, not exact prose. Valid JSON alone is not a pass for AI correctness. Verify available usage metadata independently from output quality.

Use provider mocks for deterministic response/failure/retry/duplicate-request checks and controlled live runs for semantics after setup. Record model, prompt/schema, source, and actual results; a mock pass does not prove live grounding. Apply [resolved OQ-03–OQ-14](../product/OPEN_QUESTIONS.md), including 10 MB, strict rejection of partial JSON, single-language cases, and null missing usage. Evaluation sample selection is implementation/testing methodology, not an unresolved product blocker; no invented numerical SLO/pass-rate target.

## Environments, entry, and exit

Before execution: obtain source-backed acceptance criteria, an identifiable build, supported tooling, synthetic fixtures, and approved data/provider handling. Before claiming a pass: execute the checks, capture actual results, and link evidence. Leave Actual Result and Status empty in planned records.

Release assessment uses [Release Checklist](RELEASE_CHECKLIST.md). Open Questions that affect acceptance block a pass claim for that behavior. Missing implementation or unavailable tools are limitations, not successful tests. The documentation foundation itself can be reviewed without an application release.

## Records and maintenance

Keep normal functional tests, actual Backend/API contract tests, AI output-quality evaluation, hallucination checks, AI security/prompt-injection checks, conventional security tests, and regression evidence distinguishable. Dedicated plans are [AI Evaluation](AI_EVALUATION_STRATEGY.md), [Security Testing](SECURITY_TESTING.md), [Penetration Testing](PENETRATION_TEST_PLAN.md), and [Regression Checklist](REGRESSION_CHECKLIST.md). No penetration testing is executed during foundation work.

Use [Test Case Guide](TEST_CASE_GUIDE.md), [Test Data Guide](TEST_DATA_GUIDE.md), [Bug Report Guide](BUG_REPORT_GUIDE.md), and [Traceability](TRACEABILITY.md). Separate FE/BE specifications, executions, and defects. Add regression coverage for observed defects once reproducible evidence and expected behavior exist. Keep source/implementation/docs synchronized.
