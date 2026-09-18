# M1: PRD upload and file validation

## Implemented boundary

Sources: PRD sections 5, 27 and 33; Business Flow section 3; resolved OQ-03, OQ-06 and OQ-13. M1 implements upload validation only. Acceptance does not certify document readability, safe content, or extraction success. The later M2 extraction boundary will perform parser/readability checks after M1 acceptance. No extraction, OCR, AI, generation, preview, export, or persistence runs inside the M1 endpoint.

## User flow

Select or drop one PDF/DOCX/TXT. Metadata checks provide immediate feedback; the server validates every submitted file. While validation runs, show progress. On acceptance show filename and exact byte size, with Remove and Replace. File-picker cancellation leaves the selection intact. Invalid replacements preserve the previous accepted selection. Remove aborts pending validation and clears metadata; request revision checks prevent stale responses restoring old selections. A newer selection aborts the older request. There are no generated/unsaved cases to require replacement confirmation in M1.

Only metadata is kept in component memory after validation. Refresh discards it. The file input is cleared after selection; no browser storage, server session, permanent file, or public URL is created.

## Configuration and size

`getUploadPolicy()` selects the existing validated `MAX_UPLOAD_SIZE_MB` server setting. The approved default is 10, and any different configured maximum is rejected. Decimal conversion is centralized: 10 MB = 10,000,000 bytes, inclusive. Only the public size policy is passed to the client. `AI_MAX_AUTOMATIC_RETRIES` defaults to its existing approved value 1; no AI configuration or key is needed for M1. No new environment variables or dependencies were introduced.

The multipart envelope is limited to file maximum plus 65,536 bytes of framing overhead. This is an implementation resource allowance, not an additional file-size allowance. A supplied Content-Length is checked, and actual streamed bytes are counted independently. The body read is cancelled after 30 seconds; the browser request deadline is 45 seconds. There is no automatic retry.

## Server contract

`POST /api/uploads/validate`, Node runtime, multipart/form-data containing exactly one `file` part and no extra fields. The route delegates to the independently tested `handleUpload` function. Unsupported HTTP methods use Next.js route handling.

Success: HTTP 200 with `{ "file": { "name": "requirements.txt", "size": 61, "extension": "txt" } }` (example metadata, not a stored record). Errors: `{ "error": { "code": "...", "message": "..." } }`. All handler responses use `Cache-Control: no-store`; they never return file contents, stack traces, filesystem paths, or secrets.

| Error code       | HTTP | Recovery                                                                                            |
| ---------------- | ---- | --------------------------------------------------------------------------------------------------- |
| FILE_REQUIRED    | 400  | Select one file                                                                                     |
| INVALID_REQUEST  | 400  | Retry using the picker/drop area; includes malformed, duplicate, unexpected parts and stalled reads |
| UNSUPPORTED_TYPE | 400  | Choose PDF, DOCX or TXT                                                                             |
| TYPE_MISMATCH    | 400  | Choose the original file with matching extension/MIME                                               |
| EMPTY_FILE       | 400  | Choose a nonempty file                                                                              |
| INVALID_FILE     | 400  | Choose an original eligible file                                                                    |
| TOO_LARGE        | 413  | Choose a file at or below 10 MB                                                                     |

Network/unusable-response failures use the client-only UPLOAD_FAILED message. Client error text is selected from the local error catalog, not rendered from an arbitrary server response. Invalid deployment configuration fails closed and must be corrected by the operator.

## Deterministic validation

- Nonempty name/file, inclusive configured size boundary, case-insensitive final extension; no invented filename-length rule. Spaces and multiple dots are supported.
- Recognized MIME must match the extension: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain. Empty MIME and application/octet-stream are treated as unspecified and still require byte checks. Other MIME values are rejected.
- PDF: starts with a PDF version signature and ends with an EOF marker (within the last 1,024 bytes). This is signature validation, not a PDF parser.
- DOCX: ZIP local and central-directory structure, matching entry names and bounded offsets, no duplicate names, no multi-disk/encrypted central entries; required [Content_Types].xml, _rels/.rels, word/document.xml entries. No decompression, XML processing, CRC verification, relationship resolution or content extraction. A crafted container can pass M1; M2 will apply its dedicated parser and resource boundary.
- TXT: strict UTF-8 including optional BOM, rejecting binary control bytes except tab/CR/LF and recognizable PDF/ZIP signatures renamed to TXT. No requirements extraction, semantic validation or whitespace-only readability judgment.

## Security and remaining limits

Files remain untrusted even after acceptance. React renders names as text. Upload names are never used as filesystem paths. Bytes exist only in request-local memory; no raw content logging, subprocess, embedded execution, external fetch or AI call occurs. Bounded input limits memory per request, but buffering creates multiple bounded copies. The read deadline is not a global concurrency/rate limit. Production deployment must provide ingress request limits, connection/timeouts and abuse controls appropriate to its infrastructure; M1 does not claim denial-of-service immunity, malware scanning, distributed rate limiting or penetration-test clearance.

## Validation and traceability

- Unit: `src/lib/upload-validation.test.ts`, metadata/type checks, size boundaries, filename variants, valid formats, UTF-8 BOM, binary input, truncated PDF and damaged ZIP offsets.
- Server integration: `src/lib/upload-handler.test.ts`, real Request/FormData, success metadata, server-side bypass attempts, malformed/missing/duplicate/extra parts, file and request size bounds, spoofed/missing Content-Length and stalled streams.
- Browser: `tests/e2e/shell.spec.ts`, real endpoint and local fixtures, picker for all formats, drop, mobile viewport, remove/replace/recovery, safe filename rendering and late-response cancellation. The timing test delays the real endpoint response; it does not fake validation results.
- QA specifications: [FE](../../qa/test-cases/frontend/M1_UPLOAD.md), [BE](../../qa/test-cases/backend/M1_UPLOAD.md); [fixture manifest](../../qa/test-data/m1/README.md). Specifications contain no manual execution results.

Run `npm ci`, `npm run check`, `npm run test:e2e`, `npx prettier --check .`, and `npm audit --audit-level=high`. No AI quality, hallucination, prompt-injection, export or penetration tests are claimed for M1.

## Local validation evidence (2026-09-18)

Candidate: uncommitted M1 working tree on feat/prd-upload-validation, based on 440e307; application version remains 0.1.0. Windows, Node/npm versions recorded by the final validation command. npm ci passed with Husky prepare enabled. npm run check passed lint, typecheck, 45 Vitest tests across three files, and the production build. npm run test:e2e passed eight Chromium tests; after fixing a reproduced development Strict Mode cleanup race, npx playwright test --repeat-each=3 passed all 24 executions. The final full check passed after the fix. Prettier check and git diff --check passed. npm audit --audit-level=high reported zero vulnerabilities. Desktop screenshot was inspected and the automated 375px viewport check passed.

Earlier browser runs exposed an ambiguous alert selector (Next.js route announcer) and a real early-upload cancellation race; both were corrected and covered by successful reruns. The final implementation preserves unmount cancellation without treating Strict Mode effect replay as an unmount. No manual test-case execution records, bugs, penetration-test results or remote CI pass are fabricated.

PRD and Business Flow SHA-256 hashes remained respectively 043d2c39c5da4ec3e5f0498f51b74a9bb2f01d6677d392faf0aa6d9b5ed84157 and faf67af40bfca93525bc3e6e1354d5e96fc2311cbfa6ec8604bec04c0266d2c0. No dependency/version changes were made. Prettier normalized three checked-out JSON files' line endings; their JSON content and Git diffs remained unchanged.
