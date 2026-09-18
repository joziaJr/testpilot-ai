# M2: Document extraction

## Implemented boundary

Sources: PRD sections 5, 24.1, 27, 31, 33 and 34; Business Flow section 3; resolved OQ-03, OQ-11 and OQ-13. M2 deterministically extracts readable text from an M1-validated PDF, DOCX or TXT. It does not perform OCR, image extraction, translation, summarization, semantic analysis, AI calls, requirement review or persistence.

An accepted upload is not automatically a readable document. The UI and API keep validation and extraction status separate.

```text
browser selects one file
  -> POST /api/uploads/validate
  -> validation passes
  -> POST /api/documents/extract (same bytes; server revalidates)
  -> parser -> normalization -> typed extraction result
  -> browser receives status/type/character count only
```

Two requests let the UI communicate `Validating`, `Validation: PASS`, `Extraction: IN PROGRESS`, and a distinct extraction success or failure. The second endpoint does not trust the first response or the browser. It repeats M1 size, extension, MIME, signature/container and request-shape validation before invoking a parser. The raw upload exists only in request-local memory.

## Parser choices

| Format | Parser               | Purpose and boundary                                                                       |
| ------ | -------------------- | ------------------------------------------------------------------------------------------ |
| TXT    | Node `TextDecoder`   | Fatal UTF-8 decoding, including optional BOM; no replacement of malformed bytes            |
| PDF    | `pdfjs-dist` 6.3.289 | Maintained Mozilla PDF.js distribution; page-by-page `getTextContent`; no rendering or OCR |
| DOCX   | `mammoth` 1.11.0     | Patched OOXML raw-text extraction; images are ignored and no generated HTML is exposed     |

PDF.js and Mammoth are server-external packages in Next.js so PDF.js can resolve its worker artifact correctly in development and production server routes. Mammoth 1.10.0 was rejected during dependency review because of GHSA-rmjr-87wv-gf87; the lockfile contains patched 1.11.0. No AI SDK was added.

## Internal contract

`documentExtractionResultSchema` is a strict discriminated Zod union.

Success contains `fileName`, `fileType`, normalized `text`, `characterCount`, and `status: success`. Failure contains the same identity, empty `text`, `characterCount: 0`, `status: failed`, and a safe error code/message. The internal full text is available to future server-side M3 orchestration, but `/api/documents/extract` deliberately omits it from the browser response.

The endpoint returns `200` for extraction success, `422` when validation passed but extraction failed, the existing M1 `400`/`413` responses for upload validation failures, and `Cache-Control: no-store` in every handled response.

| Error code            | Meaning                                                                               | User-safe message                                |
| --------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `EMPTY_DOCUMENT`      | Valid container/encoding produced whitespace-only content                             | `No readable text found.`                        |
| `UNREADABLE_DOCUMENT` | PDF contains no extractable text or requires unsupported reading such as OCR/password | `No readable text found.`                        |
| `MALFORMED_DOCUMENT`  | Fatal decoder or parser rejection                                                     | `Document is malformed and cannot be extracted.` |
| `EXTRACTION_FAILED`   | Processing deadline/resource boundary or non-document operational failure             | `Document extraction failed. Try another file.`  |

Raw exceptions, parser messages, stack traces and paths are not returned or logged.

## Format behavior

### TXT

TXT is decoded with UTF-8 fatal mode. UTF-8 BOM is removed during normalization. English, Bahasa Indonesia and mixed content pass through unchanged apart from the documented normalization. Whitespace-only content is `EMPTY_DOCUMENT`; invalid byte sequences are `MALFORMED_DOCUMENT`.

### PDF

PDF.js parses in-memory bytes page by page with strict parser errors, disabled auto-fetch/streaming/font rendering, no worker fetch, and error-only verbosity. Text items remain in parser order, item line endings are honored, and pages are separated by a blank line. A textless or image-only PDF is `UNREADABLE_DOCUMENT`; OCR is never attempted. Encrypted/password-protected PDFs fail safely. Extraction reflects PDF.js's text layer and cannot guarantee perfect visual reading order for every authored PDF.

### DOCX

Mammoth's raw-text path reads OOXML paragraphs and table-contained paragraphs without converting or displaying HTML, images or embedded code. Paragraph separation, explicit line breaks, tabs and textual bullet markers present in the source remain available for normalization. Semantic list markers that exist only as Word numbering metadata may not appear in raw text.

Before parsing, central-directory metadata limits the archive to 5,000 entries and 50,000,000 declared expanded bytes. Mammoth runs in an isolated Node worker with a 96 MB old-generation limit, 4 MB stack limit and 20-second deadline. The worker is terminated on completion or timeout. This bounds parser lifetime and limits the effect of deceptive compressed documents in addition to the M1 10 MB upload limit.

## Normalization

Normalization is deterministic and does not summarize, reorder, translate or interpret requirements:

- remove one leading UTF-8 BOM;
- convert CRLF/CR, Unicode line separators and form feed to LF;
- convert non-breaking spaces to ordinary spaces;
- trim each line and collapse repeated ordinary spaces within a line;
- retain tabs, headings, bullets, paragraph breaks and page separation;
- reduce three or more consecutive line breaks to one blank line;
- trim only the document's outer whitespace.

The normalized JavaScript string length is the reported character count.

## UI and lifecycle

The accepted card shows filename, file type, byte size, validation status and extraction state. Success shows the character count; extracted PRD text is not displayed. Failure shows a safe extraction message while retaining the validated selection so it can be removed or replaced. A failed M1 replacement leaves the prior selection intact. A newly validated but unreadable replacement becomes the current validated selection with extraction failed.

One `AbortController` covers validation and extraction. Selecting another file or removing the current file aborts pending requests. A revision token prevents late validation or extraction responses from restoring stale state. Refresh or close discards state; there is no server session, database, browser storage or permanent raw/extracted history.

## Security and resource controls

- extraction is server-only and runs only behind the same authoritative M1 validation boundary;
- request/file limits remain 10 MB plus bounded multipart framing overhead;
- raw content and extracted text are never logged or returned to the client;
- no filename is used as a filesystem path and no public upload URL is created;
- PDF external resource URLs are not configured, PDF images are not rendered, and DOCX images/macros are not executed;
- response caching is disabled;
- parser packages are pinned through the npm lockfile and audited;
- DOCX expansion, memory, stack and time are bounded; PDF parsing has the same 20-second response deadline and destroys its loading task on completion/timeout.

M2 does not claim malware scanning, perfect parser isolation, penetration-test clearance, distributed rate limiting or denial-of-service immunity. Production ingress must also enforce request/concurrency/time limits. The PDF.js text layer may be imperfect for unusual glyph positioning, custom encodings, complex layouts or damaged-but-recoverable PDFs. Mammoth raw text may omit visual-only formatting and numbering metadata. These are parser limitations, not permission to rewrite source content.

## Automated coverage

- Unit: normalization, UTF-8/BOM/languages/line endings, whitespace and malformed TXT; multi-page/textless/malformed PDF; heading/paragraph/list/table/whitespace/malformed DOCX.
- Integration: M1-accepted formats reach extraction, raw text stays off the API, validation-pass/extraction-fail is distinct, and M1 rejection never invokes the extractor.
- Browser: M1 upload regression; success for all three formats; textless PDF safe failure; replacement recovery; remove; late validation and extraction response protection; safe filename rendering; narrow viewport.
- Fixtures: deterministic generator, manifest and checksums under `qa/test-data/m2`.
- Specifications: [M2 frontend](../../qa/test-cases/frontend/M2_EXTRACTION.md) and [M2 backend](../../qa/test-cases/backend/M2_EXTRACTION.md). They are specifications, not manual execution records.
