# Security

## Purpose and status

Apply [PRD §33](../product/PRD.md) and [resolved OQ-03/OQ-06/OQ-08/OQ-11–OQ-13](../product/OPEN_QUESTIONS.md): server-only secrets, no public upload URLs, 10 MB validated upload maximum, bounded retry/resource controls, active-session-only content, and safe literal TSV output. Other defensive implementation mechanics below remain design guidance.

## Trust boundaries

| Boundary               | Safeguard                                                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser → server       | Treat filenames, types, sizes, content, selections, and edited values as untrusted; validate on the server                                                     |
| File → parser          | Do not execute embedded code/macros or use supplied filenames as arbitrary filesystem paths; constrain resource usage under confirmed policy                   |
| Extracted PRD → AI     | Treat document content as data; it cannot override application instructions, request secrets, or authorize tools/actions                                       |
| Provider → application | Validate structured output and source grounding; generated text is untrusted                                                                                   |
| Text → preview         | Render as text or use a reviewed safe rendering path; never execute uploaded/generated HTML or script                                                          |
| Application → TSV      | Normalize structure-breaking tabs/newlines and treat formula-leading =, +, -, @ values as literal text using deterministic sanitization; preserve preview data |
| Server → logs/client   | Return useful sanitized errors; exclude credentials and unnecessary sensitive source/provider content                                                          |

## Credentials

AI keys must remain server-side. Never place them in browser-exposed variables, frontend bundles, source control, fixtures, screenshots, exported cases, or logs. Document environment variable names only once the provider is selected. Use the chosen deployment's secret storage and least necessary access. If a key is exposed, revoke/rotate it and remove exposure paths; deleting a visible string alone does not invalidate the credential.

## Files and resource use

Validate extension plus actual file type/MIME server-side where reasonably possible, with a 10 MB maximum. Accept unencrypted readable text PDF/standard OOXML DOCX and UTF-8 TXT with/without BOM; reject encrypted, scanned/image-only, unreadable, unsupported, and oversized input. Dedicated parsers must not execute embedded content or write paths outside controlled storage. Centralize extraction/time/context/resource limits and test bounded handling, rather than scattering arbitrary constants. Prevent duplicate same-action UI requests; automatic transient retry maximum is 1. Review actual API resource/rate controls as implementation safeguards, not new product features.

## AI and data handling

Do not add tool execution, browsing, or autonomous actions to the analysis/generation pipeline. Embedded instructions such as requests to ignore guardrails remain source text, not application authority. Evaluate prompt-injection resistance with synthetic fixtures and inspect generated content for invented contracts.

Raw uploads must not have public URLs or permanent retention; keep them only for minimum processing time. Extracted content and generated cases live only for active-session needs; permanent history is post-MVP. Usage metadata may persist but never includes full PRD content. Avoid logging full PRD bodies, sensitive file content, keys, or secrets. Document selected-provider privacy/retention during implementation/deployment without unsupported claims about storage, training, or deletion. See [Environment](ENVIRONMENT.md) and its secret-free template.

## Export and session integrity

Keep unrelated anonymous sessions isolated. Preserve navigation data, prefer refresh recovery through session-level browser storage where feasible, allow discard on close, and confirm replacing current generated/unsaved data. Bind AI responses to request/session identifiers; stale results never overwrite newer state. Export UTF-8 BOM/CRLF/TAB, normalize embedded delimiters/newlines, keep steps in one cell, and sanitize formula-leading =, +, -, @ values as literal text. Verify the chosen deterministic strategy in Excel/Sheets with synthetic content; no security execution is performed now.

## Scope and validation

Authentication, roles, permission management, and collaboration are not MVP features. M0 adds ignored secret files, a blank-key example, server-only configuration validation, minimal dependencies, and disabled framework identification headers. A local dependency audit found no known vulnerabilities at M0 completion. This is not penetration testing or a security clearance; future validation must cover credential exposure, unsafe rendering, file handling, prompt injection, session isolation, and export hazards, with observed findings recorded through [Bug Report Guide](../qa/BUG_REPORT_GUIDE.md).

Use [Security Testing Strategy](../qa/SECURITY_TESTING.md) for conventional and AI-security coverage, including rate/resource abuse, dependency review, and disclosure attempts. The [Penetration Testing Plan](../qa/PENETRATION_TEST_PLAN.md) defines future execution scope, prerequisites, evidence, stop conditions, and retesting. Both are preparation only.

## M1 implementation

M1 implements bounded request-local upload validation, no storage/logging of document bodies, escaped filename rendering and request cancellation. See [M1 Upload](M1_UPLOAD.md) for exact signature checks and remaining resource/parser risks. No penetration testing has been executed.
