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

## M2 implementation

M2 keeps parsing server-side and in memory after repeated M1 validation. Client responses omit extracted text; logs omit raw content, paths and parser exceptions. PDF.js performs text extraction without OCR/rendering/external resource configuration. Mammoth 1.11.0 runs in a bounded worker after archive expansion checks; version 1.10.0 was rejected due to its directory-traversal advisory. Exact resource limits and residual parser/DoS risks are documented in [M2 Extraction](M2_EXTRACTION.md). No penetration testing or malware scanning was performed.

## M3 implementation

M3 separates system instructions from a JSON-encoded untrusted PRD data envelope, requests strict JSON, and rejects ungrounded excerpts, broken references, duplicate facts, malformed/partial/oversized output and stale browser responses. Gemini credentials stay in a server header and never enter URLs, bundles, fixtures, responses or logs. Token counting, a 900,000-token ceiling, 60-second deadline, one transient retry maximum, 1,000,000-byte provider-response limit and production-disabled fake provider bound the implemented path. Prompt separation and schemas reduce risk but do not prove semantic safety; human review and controlled live adversarial evaluation remain required. See [M3 Analyzer](M3_AI_PRD_ANALYZER.md).

## M4 implementation

M4 renders all AI/source strings through React text nodes and introduces no HTML interpretation. It persists only the active structured analysis and identity-bound selection in same-tab `sessionStorage`; it does not persist the uploaded file, raw extracted PRD, provider payload, provider response dump, prompt, or credential. Malformed/stale stored data is rejected, while successful replacement, reanalysis, and removal invalidate it. Same-origin XSS could access session data, so dependency review, escaping, CSP planning, and adversarial UI tests remain required. See [M4 Review](M4_REQUIREMENT_REVIEW.md).

## M5 implementation

M5 sends only selected structured analysis context and relevant evidence, not the entire extracted PRD. Its route validates a bounded strict request and confirmed M4 relationships before invoking the provider. Generated strings remain untrusted, are stored only for the active browser session, and are not rendered as HTML. See [M5 Generator](M5_TEST_CASE_GENERATOR.md).

## M6 implementation

M6 renders validated generated strings only through React text nodes and uses no raw HTML or Markdown execution. Internal source references, prompts, provider responses and secrets are not displayed. Hostile script-like content is covered by deterministic render and browser tests and remains inert visible text. See [M6 Preview](M6_TEST_CASE_PREVIEW.md).

## M7 implementation

M7 treats edited values as untrusted text, revalidates them against the bounded generated-case field schema, and continues to render only React text nodes. Test Case ID and source references are excluded from editing; Module and Feature are read-only and checked again at the mutation boundary against their canonical current values. Save/Delete use no route, provider, environment variable, prompt, or raw response; they replace only the validated active-session result. Automated browser coverage verifies script-like edits remain inert and mutation actions do not produce generation requests. See [M7 Edit/Delete](M7_EDIT_DELETE.md).
