# Error Handling

## M9 TSV export handling

M9 blocks download when the M8 draft has zero columns or the requested layer has no current cases. It reuses `Select at least one column for export.` and shows `No test cases available to export.` without creating an artifact. A detectable Blob/object-URL/anchor failure shows `Failed to export TSV.` while retaining preview, edits, deletes, IDs, selection, and tab state. Export has no provider/network retry because it is deterministic local behavior.

## M8 export-column handling

M8 treats zero selected columns as an invalid draft and shows `Select at least one column for export.` No file operation is attempted. Unknown, duplicate, reordered, extra-field, or malformed persisted keys are rejected and safely replaced by the OQ-07 first-nine default. Selection errors do not mutate cases, call a server, or affect M7 state.

## M7 edit/delete handling

M7 validates the complete editable field set before Save. Required blank/invalid fields and duplicate same-layer scenarios keep the editor open, show a safe user-facing alert, and leave the saved case untouched. Cancel discards the draft. Delete requires explicit confirmation; dismissal is a no-op. A stale or missing case cannot be edited or deleted through the mutation contract. Deleting the final case is a valid empty layer, not an error. No provider retry or server error path is introduced because M7 performs no request.

## Purpose and status

Required errors come from [PRD §§27, 33](../product/PRD.md), [Business Flow §3](../product/BUSINESS_FLOW.md), and [resolved OQ-03/OQ-05/OQ-06/OQ-12](../product/OPEN_QUESTIONS.md). Recovery policies below now reflect approved decisions. No TestPilot endpoint/status contract is invented.

## Approved user-facing error categories

| Area   | PRD §27 wording                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| File   | `Unsupported file format`; `File cannot be read`; `No readable text found`; `File exceeds maximum size`      |
| AI     | `Failed to analyze PRD`; `Failed to generate test cases`; `AI service unavailable`; `AI usage limit reached` |
| Export | `No test cases available`; `No export columns selected`; `Failed to export TSV`                              |

Do not crash on failure. Invalid upload permits Upload Again. Failed generation has a retry path. Require at least one module/feature; suggested message: `Select at least one module or feature.` Prevent duplicate active submission of the same generation action. At most one automatic retry is allowed for transient provider/network failures.

## General rules

- Validate at each boundary. Stop the failing operation before downstream work consumes invalid data.
- Explain the failing stage and a supported next action in user-facing language. Do not expose stack traces, provider payloads, credentials, or sensitive document content.
- Keep valid working data intact when possible; do not report failure as an empty successful result.
- Separate user-correctable input errors from extraction, provider, schema, state, and export failures.
- Never fabricate requirements or cases to recover from a failure.
- Use sanitized diagnostics sufficient to reproduce an issue. Proposed diagnostic metadata: stage, internal error category, correlation reference, timestamp, build, and provider/model revision where relevant.

## Failure matrix

| Boundary / failure                             | Recommended handling                                                                               | Validation evidence                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Empty file                                     | Reject before extraction or AI work                                                                | No downstream invocation                                        |
| Unsupported extension or mismatched content    | Reject according to confirmed file policy                                                          | Server enforcement even if browser checks are bypassed          |
| Oversized file                                 | Reject >10 MB; otherwise valid readable files at/below the maximum are eligible                    | Boundary checks below/at/above configured 10 MB                 |
| Corrupt/encrypted/unsupported document variant | Reject encrypted/password-protected PDF/DOCX, unsupported variants, and corrupt/unreadable content | No automatic validation-error retries or invented text          |
| No readable content                            | Report no usable text; OCR is excluded                                                             | No analyzer call with unusable content                          |
| Provider timeout/unavailable                   | Report processing failure; retain valid existing state                                             | No unbounded retry or fake completion                           |
| Rate limit                                     | Surface temporary provider constraint safely                                                       | Follow confirmed retry policy; do not expose provider internals |
| Invalid JSON / wrong schema                    | Reject invalid structure before normal preview                                                     | No unvalidated case rows accepted                               |
| Empty AI response                              | Identify no usable result                                                                          | No fabricated success data                                      |
| Partial AI response                            | Reject incomplete structured output; never display partial payload as successful generation        | Recoverable error/retry path without filling missing content    |
| Unsupported AI facts                           | Flag/reject unsupported content according to validated workflow                                    | Source grounding review and guardrail evidence                  |
| Stale response / changed selection             | Match request/session identity; older responses never overwrite newer active state                 | Navigation/new-PRD/retry race tests                             |
| Edit/Save failure                              | Preserve recoverable draft/saved data per session contract                                         | No unrelated changes or false saved state                       |
| TSV generation/download failure                | Report export failure while retaining preview data                                                 | No incomplete artifact represented as a successful export       |
| No cases / no selected columns                 | Show `No test cases available` / `No export columns selected`                                      | Do not create a falsely successful empty export                 |

PRD error categories and resolved decisions provide acceptance expectations. New-PRD replacement must ask for confirmation when unsaved/current generated data exists. Empty export layers produce no empty TSV and require UI indication. Keep responsive/loading UI; exact performance SLOs are not required for the initial MVP.

## Retry and partial-result policy

Allow at most **1 automatic retry** for transient network/provider failures, including temporary timeout/unavailability, relevant provider 5xx, and retryable rate-limit responses. This classifies provider errors; it does not invent TestPilot API HTTP statuses. Never automatically retry unsupported documents, validation errors, deterministic application errors, or invalid selection. Invalid/incomplete structured output is rejected and may use the defined recoverable retry path; do not treat it as transient merely to loop. Centralize timeout/context/resource limits. Record each actual AI attempt's available usage and null for unavailable values. No individual-case regeneration or background job system is added.

## QA and defect reporting

Use controlled fixtures or provider mocks to reproduce failures, with actual evidence recorded under [test execution](../../qa/test-execution/) and observed defects under [bug reports](../../qa/bug-reports/). Record the version and failing stage. Never include a real API key or confidential PRD in diagnostics or repository evidence. See [Security](SECURITY.md) and [Test Plan](../qa/TEST_PLAN.md).

## M1 implementation

M1 now has a concrete upload endpoint and safe error catalog: see [M1 Upload](M1_UPLOAD.md). Readability/no-text/encryption detection requiring full parsing remains M2; upload acceptance is not extraction success.

## M2 implementation

M2 now separates validation errors from typed extraction errors. `EMPTY_DOCUMENT`, `UNREADABLE_DOCUMENT`, `MALFORMED_DOCUMENT`, and `EXTRACTION_FAILED` map parser/decoder/resource failures to fixed user-safe messages. Validation-pass/extraction-fail returns 422 metadata without extracted text or raw exceptions. See [M2 Extraction](M2_EXTRACTION.md).

## M3 implementation

M3 adds `AI_CONFIGURATION_ERROR`, `AI_PROVIDER_UNAVAILABLE`, `AI_TIMEOUT`, `AI_RATE_LIMITED`, `AI_INVALID_RESPONSE`, `AI_CONTEXT_LIMIT`, and `ANALYSIS_FAILED`. Only transient provider/network classes receive the configured maximum one automatic retry. Invalid JSON/schema/evidence is rejected immediately under OQ-12. Responses include fixed safe text and attempt metadata without raw provider errors, prompts, PRD bodies, keys, stack traces or paths. See [M3 Analyzer](M3_AI_PRD_ANALYZER.md).

## M4 implementation

M4 adds no server endpoint. Invalid, partial, unknown-ID, or stale session selections are rejected by the client-side Zod/domain contract and cannot be confirmed. Malformed persisted state is ignored and the user can reset, replace, remove, or reanalyze to recover. Need Confirmation is product context rather than a runtime failure and does not block unrelated source-backed selection.

## M5 implementation

M5 reuses the AI error categories and adds `INVALID_SELECTION` for malformed, stale or unconfirmed M4 input plus `GENERATION_FAILED` for a safe non-specific generator failure. Invalid JSON, schema, references and duplicates map to `AI_INVALID_RESPONSE` with no partial result or automatic validation retry. The UI offers an explicit retry and never shows provider details. See [M5 Generator](M5_TEST_CASE_GENERATOR.md).

## M6 implementation

M6 introduces no request or error category. Preview appears only for a successful validated M5 state. A selected layer with zero generated cases is rendered as a valid explanatory empty state, not an application failure. Existing M5 invalidation and safe failure behavior remain authoritative. See [M6 Preview](M6_TEST_CASE_PREVIEW.md).
