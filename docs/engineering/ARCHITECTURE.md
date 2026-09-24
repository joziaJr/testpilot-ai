# Architecture

## Status and objective

Approved direction: one full-stack web application using preferred Next.js, TypeScript, Tailwind CSS, shadcn/ui, and Zod. Use a simple table or justify TanStack Table; no microservices or unnecessary infrastructure. [PRD](../product/PRD.md), [Business Flow](../product/BUSINESS_FLOW.md), and [resolved OQ-03–OQ-14](../product/OPEN_QUESTIONS.md) govern the design. M0 is installed; M1 implements [upload validation](M1_UPLOAD.md), M2 implements server-side [document extraction](M2_EXTRACTION.md), M3 implements the server-side [AI PRD Analyzer](M3_AI_PRD_ANALYZER.md), and M4 implements [requirement review and selection](M4_REQUIREMENT_REVIEW.md). Generation and export responsibilities remain planned.

```text
Browser: upload / review / selection / M6 preview / M7 edit + delete / future export
    ↕ application requests and validated data
Server: file validation → document parser → PRD Analyzer → output validation
        selected requirements → M5 Test Case Generator → output validation → IDs
                                  ↕
                         AI provider adapter
```

Only the Analyzer and Generator use AI. Arrows describe responsibilities, not endpoint contracts or deployment units.

## Responsibilities and boundaries

| Component                    | Responsibility                                                                                                                                                                              | Boundary                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend                     | Three screens: Upload PRD, PRD Analysis, Test Case Preview; detected language, review/selection, loading/error feedback, separate FE/BE tabs, drafts, Save/Cancel, delete, export selection | Mandatory review before export; no AI credentials/direct privileged provider calls; safe text rendering                                                    |
| Server                       | Authoritative input validation, orchestration, provider access, output validation, request lifecycle                                                                                        | Do not trust client checks; never return raw provider errors or secrets                                                                                    |
| Document parsing             | Server PDF.js/Mammoth/TextDecoder parsing after extension/type/MIME and 10 MB checks; deterministic normalization and typed result                                                          | Readable text PDF and standard OOXML DOCX only, neither encrypted; TXT UTF-8 with/without BOM; no OCR. Exact behavior in [M2 Extraction](M2_EXTRACTION.md) |
| AI provider abstraction      | M3 Gemini REST adapter for analysis; server-configurable model, credentials, safe errors, strict structured responses and available usage metadata                                          | `gemini-3.5-flash` default; no UI provider selector, client key, silent fallback or agent framework (PRD §25)                                              |
| PRD Analyzer                 | Identify source-backed modules/features/requirements, rules, fields, validations, behavior, navigation, permissions, constraints, language, and uncertainty                                 | No case generation or invented rules; attempt detection only where the uploaded PRD supports it                                                            |
| Requirement review           | Show the complete grounded hierarchy/evidence, select modules/features, choose one FE/BE/Both scope, and produce a deterministic reviewed-selection contract                                | No requirement editing or selection; uncertainty is visible and nonblocking; no test generation                                                            |
| Test Case Generator          | Generate requested FE/BE Positive/Negative/Edge coverage for selected requirements                                                                                                          | No unselected requirement expansion or invented API contracts                                                                                              |
| Structured output validation | Check shape, types, references, target, source grounding, duplicates, and completeness                                                                                                      | Schema validity alone cannot prove semantic correctness; uncertainty stays explicit                                                                        |
| Preview/edit state           | Render accepted cases, validate and save M7 field edits, confirm deletion, retain stable IDs and session state                                                                              | Save/Cancel must not mutate unrelated cases; deletion must not renumber others or cross FE/BE layers                                                       |
| TSV generation               | Serialize current saved edits with selected columns in fixed schema order                                                                                                                   | Deterministic code; no AI or reorder control; no internal metadata in default columns                                                                      |
| Usage recording              | Record Action, Model, Input Tokens, Output Tokens, Total Tokens, Timestamp for every AI request where available                                                                             | Actions: `prd_analysis`, `generate_frontend`, `generate_backend`; no dedicated dashboard required (PRD §26)                                                |

## Data model recommendation

Keep source context, requirements, selected modules/features, request/session identity, case data, and column selection distinct. Use PRD §17's preferred test_cases object with steps arrays and strict Zod validation. Required fields are ID, Module, Feature, Title, Steps, Expected Result, Priority, Type; nullable presentation fields are Preconditions, Automation, Notes. Render absent optional values as `-` where needed. Minimal internal grounding does not authorize user-facing source references or full traceability features.

Use the identical FE/BE schema in [Test Case Guide](../qa/TEST_CASE_GUIDE.md). Application code allocates immutable TP-FE/TP-BE IDs with independent active-session counters; additional cases continue, deletion never renumbers, new sessions may restart at 001. Priority High/Medium/Low, Type Positive/Negative/Edge, Automation Yes/No/Candidate. Candidate is preferred for future suitability; Yes needs contextual justification, not fabricated automation claims. Coverage drives quantity.

## State and session recommendation

Retain PRD metadata, extracted requirements, detected language, selection, FE/BE cases and edits during internal navigation. Prefer session-level browser storage for refresh preservation if feasible; tab/browser close may discard. Do not persist permanent projects/history. Keep raw files only for processing, no public upload URLs; extracted content/results only for the active session. Usage metadata may persist without PRD bodies (OQ-06/OQ-13).

Confirm before replacing a session with a new PRD when current generated data or M7 edits exist. Associate all analysis/generation requests with request/session identifiers and prevent older responses overwriting newer state. M7 keeps draft fields local until Save; Cancel discards them, and accepted edits/deletes replace only the matching layer in the persisted generated result. Only one active request per same generation action; prevent repeated submits. Reject invalid/incomplete output, allow at most one automatic retry for transient provider/network failure, and expose recoverable failure. Individual-case regeneration remains excluded.

Use one deterministic TSV serializer for nonempty FE/BE layers, named testpilot_frontend.tsv and testpilot_backend.tsv. Skip empty layers with UI indication. First nine schema columns default selected, Automation/Notes unselected; fixed schema order, no reorder controls, no preview data deletion. Format: UTF-8 BOM, CRLF, TAB. Keep numbered steps in one cell using a deterministic readable separator; normalize raw tabs/newlines and render values beginning with `=`, `+`, `-`, or `@` as literal text. Choose and test the concrete sanitization strategy during implementation (OQ-07/OQ-08).

## Failure and security boundaries

File validation, extraction, AI transport/schema, session, and export are separate failure boundaries. Centralize timeout/context/resource configuration; configured model context limits may apply, no initial numerical SLO required. Keep responsive/loading UI and usable large previews. Apply [Error Handling](ERROR_HANDLING.md), [Security](SECURITY.md), and [Environment](ENVIRONMENT.md).

## Implemented M7 mutation boundary

M7 derives its submitted-field schema from the accepted M5 test-case schema. Module and Feature remain canonical source-linked labels: the UI renders them read-only and the mutation boundary rejects mismatches with the current case, preserving their immutable source IDs without remapping. M7 also preserves the application-owned ID and hidden source references, rejects invalid or duplicate saved scenarios, confirms deletion, and allows a layer to become empty. Mutations use no API route or AI call. Regeneration, selection changes, removal, reanalysis, or confirmed PRD replacement continue to invalidate the entire generated result through the existing lifecycle.

## Implementation entry conditions

Before implementing later milestones, inspect state and select compatible tools within the approved direction. M3 establishes one server-configurable Gemini adapter and defaults it to the live-validated `gemini-3.5-flash`; no provider selector. M4 creates an identity-bound reviewed-selection contract. M5 consumes it through selected-only FE/BE generation, strict reference validation and application-owned IDs. M6 renders that validated session result in separate, accessible FE/BE preview tables without a provider call. M7 mutates that same result locally under schema validation and session persistence. AI calls use analysis, frontend-generation and backend-generation usage actions with missing counters null. No unresolved MVP-blocking Open Questions remain. M8 column selection requires separate authorization.
