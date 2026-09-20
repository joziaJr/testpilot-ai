# M3: AI PRD Analyzer

## Implemented boundary

Sources: PRD sections 6–8, 24–27, 29, 31, 33–35; Business Flow PRD Analysis; resolved OQ-04–OQ-06 and OQ-10–OQ-13. M3 turns M2 normalized text into strict, source-grounded analysis. It does not implement requirement selection/editing, test-case generation, preview, export, history, OCR, tools or autonomous actions.

```text
browser retains selected File in memory
  -> user chooses Analyze PRD
  -> POST /api/documents/analyze (same file)
  -> repeat M1 validation
  -> repeat M2 extraction/normalization
  -> context token count
  -> analyzer prompt + strict schema
  -> Gemini adapter
  -> JSON parse -> Zod validation -> grounding/reference validation
  -> structured analysis and safe usage metadata
```

The analysis route repeats validation and extraction because raw normalized PRD text is not exposed to the browser and no server history is retained. M1 or M2 failure stops the pipeline before any AI request.

## Provider and model

M3 implements one server-only Gemini REST adapter and defaults to the live-validated `gemini-3.5-flash`. This follows OQ-11's approved Gemini direction; the exact model was delegated implementation work. The model remains server-configurable through `AI_MODEL`; there is no UI selector or silent provider fallback.

The adapter uses native `fetch` rather than adding an SDK. It sends the API key in the `x-goog-api-key` header, uses `countTokens`, requests `application/json` with a response JSON schema, bounds response bodies to 1,000,000 bytes, and maps provider failures without returning bodies or SDK details. Generation temperature is `0`, the lowest practical setting for this extraction/classification task. This reduces avoidable variation but does not make probabilistic output deterministic. Official references: [models](https://ai.google.dev/gemini-api/docs/models), [structured output](https://ai.google.dev/gemini-api/docs/structured-output), [API-key security](https://ai.google.dev/gemini-api/docs/api-key), and [pricing/data-use table](https://ai.google.dev/gemini-api/docs/pricing).

Free-tier service terms and data-use treatment must be reviewed before confidential production PRDs are allowed. The application makes no unsupported provider retention, deletion or training guarantee. A deployment requiring different data terms must configure an approved Gemini plan/model without adding a user-facing choice.

## Structured analysis contract

The strict Zod contract contains:

- `documentLanguage`: `indonesian` or `english`;
- modules and features with stable response-local IDs and evidence;
- atomic requirements linked to optional module/feature IDs and evidence;
- business rules and validations linked to known requirement IDs;
- ambiguities with source text, reason and optional requirement link;
- `needConfirmation` items with `status: need_confirmation`, an `ambiguityId`, a concrete question in the existing `requirement` field, reason, missing details and evidence.

One requirement represents exactly one independently testable behavior, constraint, validation, state transition, persistence expectation, navigation outcome, or required/optional field rule. Independent statements remain separate. One logical enumerated constraint remains one requirement rather than one item per enum value. Atomicity never justifies adding unsupported requirements or targeting a count.

Each explicitly named feature/subsection becomes one feature. A directly stated module capability also becomes a feature when the module has no feature subsection. Recording a feature does not replace its independently testable capability requirement. Repeated summary or acceptance bullets do not create duplicate requirements when detailed evidence already represents the same behavior.

An ambiguity describes unclear, incomplete, contradictory or underspecified information. Need Confirmation asks how to resolve it. Every confirmation must reference an existing ambiguity; duplicate normalized ambiguity issues and confirmation questions are rejected. The same grounded excerpt may support both linked records.

Every item has `{ excerpt, section }`. `excerpt` must be a verbatim substring of normalized PRD text. `section` is nullable and cannot replace evidence. The server rejects unknown module/feature/requirement/ambiguity references, duplicate IDs, duplicate normalized facts, fabricated excerpts, extra fields, partial objects and over-limit collections. These deterministic checks reduce unsupported output but cannot prove every interpretation is semantically correct; M4 human review remains required.

## Source grounding and uncertainty

The uploaded PRD is the only target-product authority. The system instruction prohibits invented modules, features, roles, permissions, fields, limits, workflows, rules, validations, API contracts, storage and behavior. Claims without exact evidence are rejected. Ambiguous, incomplete or contradictory statements use ambiguity and Need Confirmation records. M3 never fills missing facts or generates cases that depend on them.

## Language policy

The prompt applies OQ-04: use requirement content first, meaningful-content majority second, and the first primary heading last. Indonesian input yields Indonesian analysis, English yields English, and mixed input uses one dominant language. Schema keys and enums remain standardized English.

## Prompt-injection boundary

System instructions are a separate provider field. Raw PRD content is never interpolated into the system instruction; it is JSON-encoded inside a user-content envelope marked `untrusted_prd_data`. The system instruction explicitly rejects embedded commands to change role, reveal prompts/secrets, execute tools, bypass schema or stop analysis. Strict output/grounding checks remain necessary because prompt separation cannot guarantee model behavior.

## Retry, errors and lifecycle

Only transient timeout, rate-limit, network/unavailable and relevant provider failures are automatically retried, at most `AI_MAX_AUTOMATIC_RETRIES` (approved maximum 1). Invalid JSON, schema, references or evidence are deterministic validation failures and are not automatically retried. Each generation attempt records action `prd_analysis`, model, token values or `null`, timestamp, duration, outcome and safe error category in active-session response metadata.

Safe errors are `AI_CONFIGURATION_ERROR`, `AI_PROVIDER_UNAVAILABLE`, `AI_TIMEOUT`, `AI_RATE_LIMITED`, `AI_INVALID_RESPONSE`, `AI_CONTEXT_LIMIT` and `ANALYSIS_FAILED`. Responses never contain provider bodies, stack traces, API keys, system prompts, filesystem paths or full raw PRD text.

The browser allows one active analysis request. Remove or replace aborts it and increments the existing revision token, so a late result cannot restore stale state. Analysis success shows language-independent counts only; M4 review UI is not implemented.

## Context and resource handling

Gemini `countTokens` runs before generation. `AI_CONTEXT_TOKEN_LIMIT` defaults to 900,000, reserving space below the model's documented 1M context window for system/schema/output content. Input above the configured ceiling fails without truncation or chunking. Provider requests default to a 60-second deadline. Chunking is intentionally absent because silent partial analysis would violate source completeness; future chunking requires a separately tested deterministic merge/deduplication design.

## Privacy and logging

Files, normalized text and structured results remain request/active-session data with no database, public URL or permanent history. Application code does not log raw PRDs, prompts, provider responses, keys or environment values. The browser receives structured analysis/evidence and safe usage metadata, but never the full normalized-text field. The committed `.env.example` contains placeholders only, and production rejects `AI_TEST_MODE=true`.

## Test architecture

Normal tests never call Gemini. Unit and integration tests use injected provider/extractor fakes. Playwright starts Next.js with the production-forbidden deterministic fake provider and exercises analysis success/failure/recovery and stale-response handling. `npm run test:ai-eval` validates the M3-2 corpus, twenty evaluation dimensions, atomicity rules, ambiguity/confirmation coverage and relationships, language behavior, injection-data separation and invalid-schema rejection. It is deterministic harness evidence, not a live-model quality result.

## Live stability observation

On 2026-09-20, an authorized ignored local credential and locally configured `gemini-3.5-flash` model were used for three sequential analyses of the same synthetic TaskFlow TXT sample with prompt revision `m3-analyzer-v2` and temperature `0`. Only aggregate metadata and semantic-set comparisons were retained:

| Run | Modules | Features | Requirements | Business rules | Validations | Ambiguities | Need Confirmation |
| --- | ------- | -------- | ------------ | -------------- | ----------- | ----------- | ----------------- |
| 1   | 5       | 9        | 28           | 5              | 5           | 5           | 5                 |
| 2   | 5       | 9        | 28           | 5              | 5           | 5           | 5                 |
| 3   | 5       | 9        | 28           | 5              | 5           | 5           | 5                 |

The normalized requirement sets were identical across all pairs (28/28). All five expected confirmation topics were present in every run. Each confirmation referenced a known ambiguity, and automated review found no missing evidence excerpt, invalid reference, duplicate requirement, duplicate ambiguity or duplicate confirmation question. A separate semantic spot-check found no unsupported requirement. These observations are evidence for this sample/configuration only and do not establish general model determinism or quality.

The model consistently left some high-level capability sentences represented by their feature records while extracting the detailed independently testable rules as requirements. The source concepts remained present, but complete duplication of every feature capability into the requirements collection is not guaranteed by deterministic validation and remains a semantic-review concern.

No penetration testing was performed.
