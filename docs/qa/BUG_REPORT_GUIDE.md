# Bug Report Guide

## Purpose and evidence rule

Record observed defects consistently so another person can reproduce and retest them. These are repository QA artifacts, not an MVP application module. Store only actual observations supported by evidence; do not create fictional bugs to populate folders. An unanswered requirement belongs in [Open Questions](../product/OPEN_QUESTIONS.md), not automatically in a defect report.

## Required fields

| Field              | What to record                                                                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bug ID             | Stable identifier with distinguishable FE/BE layer, e.g. a `BUG-FE-` or `BUG-BE-` prefix; examples are naming conventions, not existing bugs                                                                          |
| Version            | Observed application version plus exact commit/build; identify unversioned builds honestly                                                                                                                            |
| Environment        | Deployment/local environment, relevant browser/OS/runtime, configuration; no secrets                                                                                                                                  |
| Module             | Affected documented module                                                                                                                                                                                            |
| Feature            | Affected feature/flow stage                                                                                                                                                                                           |
| Title              | Short description of observed failure and trigger                                                                                                                                                                     |
| Preconditions      | Actual setup, source/fixture revision, selected modules/features, layer choice                                                                                                                                        |
| Steps to Reproduce | Minimal ordered actions and concrete non-sensitive values                                                                                                                                                             |
| Expected Result    | Source-backed expectation with PRD/Business Flow or technical-spec reference                                                                                                                                          |
| Actual Result      | What was actually observed; distinguish repeatable failure from a single observation                                                                                                                                  |
| Severity           | Impact classification below                                                                                                                                                                                           |
| Priority           | Triage urgency P0/P1/P2, separate from generated-case High/Medium/Low                                                                                                                                                 |
| Evidence           | Sanitized screenshot/log/artifact or precise observation reference, timestamp, execution link                                                                                                                         |
| Related Test Case  | Existing case ID, generation-session identity when applicable, and execution reference; explicitly state if no case exists. Session identity distinguishes IDs that may restart in a new session under resolved OQ-09 |
| Status             | Actual lifecycle state, updated with evidence                                                                                                                                                                         |
| Notes              | Reproducibility, affected versions, workaround if verified, provider/model/prompt/schema revisions when relevant                                                                                                      |

Do not paste credentials, confidential PRDs, or personal data into evidence. Capture the original failure before fixing it. A failed AI output must be attached or summarized safely, with the source rule it violates; a fluent but invented answer is still a defect.

## Severity and priority

| Severity | Impact                                                                     |
| -------- | -------------------------------------------------------------------------- |
| Critical | Essential flow unusable, serious data loss, or exposed secrets             |
| High     | Major required behavior incorrect or substantial workflow blocked          |
| Medium   | Limited functional degradation with a verified practical workaround        |
| Low      | Minor presentation or usability defect without material incorrect behavior |

Priority describes order of work: P0 is a release-blocking critical path issue, P1 important, P2 secondary. Assess severity and priority independently using actual impact. A high-severity issue does not become acceptable merely by labeling it low priority. Release owners must assess all unresolved risks; no known P0 blocker may ship.

## Lifecycle and retest

Recommended workflow: Open → Triaged → In Progress → Ready for Retest → Closed. Reopen on a failed retest; use Duplicate or Deferred only with a linked reason and owner. These are QA record conventions, not product UI states.

Record the original observed build, fixing build, retested build, actual retest result, evidence, and regression scope. Never close solely because code changed. Preserve original observations and append retest history. An unexecuted retest has no result yet.

## FE/BE organization

Use [frontend](../../qa/bug-reports/frontend/) for observed UI behavior defects and [backend](../../qa/bug-reports/backend/) for observed server/parser/provider-processing defects. If ownership is unclear, record that uncertainty; do not invent a root cause. Cross-layer issues can live in the primary observed layer with links to related artifacts, avoiding duplicate reports of one defect.

Follow [Traceability](TRACEABILITY.md) and [Versioning and Release](../engineering/VERSIONING_RELEASE.md). No defect report has been created by this documentation task.
