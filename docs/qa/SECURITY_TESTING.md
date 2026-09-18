# Security Testing Strategy

## Purpose and scope

Prepare future validation against [PRD §33](../product/PRD.md) and [resolved OQ-03/OQ-06/OQ-08/OQ-11–OQ-13](../product/OPEN_QUESTIONS.md). Upload limits, session isolation, transient-only raw retention, server secrets, formula safety, strict JSON, and retry/duplicate prevention are settled. Additional tests assess real implementation safeguards, not accounts, roles, or new product features. No security execution or findings are claimed.

M1 upload safeguards and M2 extraction/parser boundaries have automated tests documented in [M1 Upload](../engineering/M1_UPLOAD.md) and [M2 Extraction](../engineering/M2_EXTRACTION.md). The full MVP coverage below remains the broader plan. Use only owned/authorized test environments and synthetic data during future execution; external provider infrastructure is outside the target unless separately authorized. Detailed execution prerequisites are in [Penetration Testing Plan](PENETRATION_TEST_PLAN.md).

## Separate evaluation categories

| Category                       | Purpose / owner of expectations                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Normal functional testing      | Approved upload-to-export behavior; [Test Plan](TEST_PLAN.md)                                          |
| Backend/API testing            | Actual documented TestPilot server contracts, including failure handling; no invented routes/statuses  |
| AI output quality              | Relevance, coverage, clarity, language, structure; [AI Evaluation Strategy](AI_EVALUATION_STRATEGY.md) |
| AI hallucination testing       | Unsupported facts and missing/conflicting-rule handling against source annotations                     |
| AI security / prompt injection | Adversarial source content attempting to cross instruction/data or privacy boundaries                  |
| Conventional security testing  | Input handling, rendering, secrets, resource controls, isolation, dependency risk                      |
| Regression testing             | Revalidate affected behavior and fixed defects; [Regression Checklist](REGRESSION_CHECKLIST.md)        |

## Planned conventional security coverage

| Area                                | Planned checks / expected safeguard                                                                                                                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File upload validation              | Bypass browser checks; verify server enforces 10 MB, extension plus actual type/MIME where feasible, readable unencrypted text PDF/OOXML DOCX, UTF-8 TXT with/without BOM                                                        |
| Malicious or malformed files        | Controlled malformed PDF/DOCX/TXT; safe parser failure, no embedded execution or unwanted external fetch                                                                                                                         |
| Oversized files / denial of service | Reject >10 MB; test below/at/above threshold and centralized extraction/time/context limits in bounded isolated environment; prevent unbounded retry                                                                             |
| Fake extension / MIME mismatch      | Renamed or mismatched synthetic file rejected or handled by the adopted validated-content policy                                                                                                                                 |
| XSS                                 | Uploaded, generated, edited, filename, and error text rendered safely in preview and other screens                                                                                                                               |
| Injection risks                     | Review actual interpreter/database/path/template boundaries; no shell execution, traversal, unsafe rendering, or external-resource resolution from untrusted content                                                             |
| API abuse                           | Validate request shape/context and repeated requests against documented server contracts; no assumed authentication feature                                                                                                      |
| Rate limiting                       | Verify duplicate same-action UI prevention and at most 1 automatic transient retry; assess actual server resource/rate controls without assuming UI prevention alone stops API abuse                                             |
| Secret/API key exposure             | Inspect browser bundles/network, errors, logs, exports, configuration, and repository evidence for leaked credentials                                                                                                            |
| Cross-user/data leakage             | Isolate anonymous sessions; request/session identity prevents stale data overwrites; test navigation, refresh recovery where feasible, replacement confirmation, and absence of permanent content history                        |
| Upload privacy                      | No public upload URLs or permanent raw retention; processing-only files, active-session-only extracted/results; no source content or secrets in usage logs                                                                       |
| TSV / spreadsheet formula injection | Formula-leading =, +, -, @ and leading-whitespace variants become literal text under the chosen deterministic strategy; normalize tabs/newlines, single-cell steps, UTF-8 BOM/CRLF/TAB; verify Excel/Sheets with synthetic input |
| Dependency vulnerabilities          | Inventory selected parsers/provider SDK/runtime dependencies; assess relevant advisories with actual versions and exposure once dependencies exist                                                                               |

No unresolved MVP-blocking Open Questions remain. OQ-03 fixes the 10 MB maximum; OQ-12 fixes duplicate/retry/partial policies with centralized configurable resource limits; OQ-13 fixes privacy/retention; OQ-08 fixes safe TSV behavior. Actual server rate-control mechanics, parser/model choice, and sanitization implementation are engineering choices to document and test. Dependencies are installed; run the audit for each candidate and report its actual result separately. M2 reviews PDF.js and Mammoth, rejects vulnerable Mammoth 1.10.0, pins patched 1.11.0, bounds DOCX worker resources, and covers malformed/textless files. This is defensive automation, not penetration testing or malware analysis.

## Planned AI security coverage

| Area                           | Planned checks / expected safeguard                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unsafe PRD content             | Content that resembles commands remains untrusted source data, not authority                                                                       |
| Prompt injection               | PRD text attempts to override grounding, invent rules, change selection, or alter output structure; application policy remains authoritative       |
| System prompt leakage attempts | Synthetic requests in source content seek hidden instructions or credentials; assess disclosure and ensure real secrets are never in model context |
| AI instruction hijacking       | Role-spoofing, nested instruction-like text, and bilingual conflicting instructions cannot authorize tools/actions or change application scope     |
| Data leakage attempts          | Synthetic canary data from an unrelated session is not revealed; use separate controlled sessions rather than real personal data                   |
| Output trust boundary          | Model output containing active markup or formula-like strings is handled safely by preview/export; schema-valid output is still untrusted          |

The proposed no-tool AI pipeline limits the attack surface; it does not prove prompt injection is impossible. Do not add browsing, remote actions, or autonomous agents to exercise it. Evaluate adversarial safety separately from ordinary hallucination and usability results.

## Evidence and completion

Record build/configuration, fixture and payload identifiers, execution scope, actual observations, sanitized evidence, and source/control expectations. Actual Result and Status remain empty before execution. Report only observed defects under [Bug Report Guide](BUG_REPORT_GUIDE.md). Retest fixes and relevant regressions; document untested areas and unresolved policies. No security clearance or penetration-test result is implied by this plan.
