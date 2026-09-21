# Regression Checklist

## Purpose and current status

Plan repeat validation after changes. This checklist is unexecuted and contains no test results. Record the candidate and previous baseline builds, source/fixture revisions, provider/model, prompt/schema versions, and the changed areas before selecting cases.

## Select coverage by change

| Changed area                 | Minimum affected regression focus                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload/parser                | Approved types/UTF-8 variants; encrypted/scanned/corrupt/unreadable/mismatched rejection; below/at/above 10 MB; downstream meaning                                                                                        |
| Prompt/model/provider/schema | Grounding/hallucination/duplicates/layer relevance; missing-detail scenarios excluded while valid ones survive; language fallback; strict required/nullable schema; usage null; one transient retry and partial rejection |
| Selection/session            | Empty selection blocked; navigation continuity; refresh preservation if feasible; replacement confirmation; session/request identity; stale-response rejection and duplicate prevention                                   |
| Preview/edit/delete          | Split tabs, eleven columns, Automation semantics, '-' only for absent optional presentation, immutable per-session IDs, continued counters, Save/Cancel, no delete renumbering                                            |
| Export                       | First nine default-selected columns, schema order/no reorder, preserved data, skip empty layers, separate filenames, UTF-8 BOM/CRLF/TAB, normalized single-cell steps and literal formula values                          |
| Configuration/dependencies   | Relevant component checks, server-secret isolation, upload privacy, parser/provider behavior, security review                                                                                                             |
| Release tooling              | 0.1.0 start, DoD-gated 1.0.0, v tags, Husky/Commitlint/GitHub Actions/Release Please, maintainer ownership, post-main versioning, no local-push bumps                                                                     |
| Observed bug fix             | Original reproduction on the fixing build plus adjacent cases; retain original and retest evidence                                                                                                                        |

## Candidate review

- [ ] Change impact and source-backed case selection documented.
- [ ] P0 upload-to-export flow and affected P1/P2 coverage selected and executed.
- [ ] Relevant deterministic, integration/API, frontend, and E2E evidence captured.
- [ ] AI output quality and hallucination checks run where AI behavior changed.
- [ ] AI security and conventional security checks selected by actual exposure changes.
- [ ] FE/BE separation, immutable IDs, language/enums, and usage tracking preserved.
- [ ] Known affected defects retested with build-specific observations.
- [ ] Newly observed defects recorded and linked; no invented bugs or results.
- [ ] Resolved OQ-03–OQ-14 behavior preserved; any genuinely new blocker is explicitly recorded before declaring affected behavior passed.
- [ ] Release evidence updated for the exact tested candidate.

Leave all boxes unchecked until the corresponding work is performed. For unexecuted case records, Actual Result and Status remain empty. Review the [Test Strategy](TEST_STRATEGY.md), [AI Evaluation Strategy](AI_EVALUATION_STRATEGY.md), [Security Testing](SECURITY_TESTING.md), and [Release Checklist](RELEASE_CHECKLIST.md). M1–M5 deterministic regression runs via `npm run check`, `npm run test:e2e`, `npm run test:ai-eval`, and `npm run test:ai-generation-eval`; live-model evaluation and later-stage rows remain separate planned work.
