# M5 FE / BE Test Case Generator

## Status and boundary

M5 consumes the validated M3 analysis and a confirmed M4 selection, produces strictly validated FE and/or BE cases, and ends at a generation-complete result and count summary. The separately implemented [M6 Preview](M6_TEST_CASE_PREVIEW.md) now renders that result; editing, deletion, regeneration and all export behavior remain later milestones.

```text
M3 structured analysis + confirmed M4 state
  -> POST /api/test-cases/generate
  -> reconstruct and validate reviewed selection
  -> selected-only generation context
  -> one generate_frontend and/or generate_backend provider action
  -> JSON parse -> Zod validation -> source/reference validation
  -> duplicate rejection -> deterministic application IDs
  -> FE/BE separated structured result -> count summary
```

The request contains the structured analysis already available in the browser, its browser-generated analysis identity, and the strict M4 selection state. It never contains the raw uploaded file or full extracted PRD. The server rejects unconfirmed, malformed, unknown or stale selection relationships before invoking the provider.

## Generation context and source grounding

`generation-context.ts` reconstructs the M4 reviewed contract and includes only selected modules/features and related requirements, business rules, validations, ambiguities, Need Confirmation records and source evidence. Unselected analysis is not sent to Gemini. Source strings remain untrusted document data in a JSON envelope separated from the system instruction.

Every generated draft references one selected feature and at least one selected requirement. Optional business-rule and validation references must be known, selected, related to one of the case requirements, and unique. Wrong parent relationships, unselected or unknown IDs, fabricated references and partial objects reject the complete generation result; they are never silently repaired.

## FE, BE and Both

- Frontend generation covers only documented user-observable behavior, input/validation, navigation or visible state. It must not invent controls, labels, layouts, routes or exact error copy.
- Backend generation covers documented business logic, validation and data behavior. API endpoints, methods, headers, status codes, payloads, responses and authentication details are allowed only when present in selected source context.
- Both runs separate `generate_frontend` and `generate_backend` actions and returns `{ frontend, backend }`. A layer may be empty when meaningful coverage would require invention. Cases are not duplicated merely by relabeling the layer.

## Structured case contract

The provider returns no human-readable Test Case ID. A draft contains module/feature IDs, unique source references, title, nullable preconditions, ordered steps, expected result, High/Medium/Low priority, Positive/Negative/Edge type, nullable Yes/No/Candidate automation and nullable notes. Test Data is not a field.

After validation, application code resolves documented module/feature names, retains references as internal `source` metadata, and independently assigns `TP-FE-001...` and `TP-BE-001...`. IDs are deterministic for accepted array order. M7 deletion/counter continuation behavior is intentionally absent.

Priority defaults to Medium. High or Low is permitted only when selected source context explicitly supports that impact. Automation defaults to Candidate unless context justifies another approved value; it never claims that TestPilot generated an automation script. Null optional values remain null internally; presentation placeholders belong to M6/M7.

## Coverage, ambiguity and duplication

The model is instructed to produce the minimum useful nonredundant set. Positive, Negative and Edge are included only where the documented rule supports them; all three are not forced. Ordered steps must be executable and expected results directly grounded.

Linked ambiguities and Need Confirmation are supplied as constraints. The generator omits dependent scenarios and never chooses an answer. Notes may describe a source limitation but cannot contain prompts, debugging data or hidden IDs.

Obvious duplicates are rejected using normalized layer, module, feature, title, steps and expected result. This preserves materially different type or boundary scenarios while rejecting equivalent repeated cases.

## Provider, retry and safe errors

M5 reuses the existing server-only Gemini REST adapter, `AI_MODEL`, temperature `0`, JSON response schema, response-size limit, timeout and context-token ceiling. There is no provider selector or new client secret. Each layer records its actual `generate_frontend` or `generate_backend` action with model, nullable token usage, attempt, timestamp, duration, outcome and safe error code.

Only transient provider/network failures receive at most `AI_MAX_AUTOMATIC_RETRIES` (maximum one). Invalid JSON, schema, references, duplicates and invalid selection are deterministic failures and are not automatically retried. Safe categories are `INVALID_SELECTION`, `AI_CONFIGURATION_ERROR`, `AI_PROVIDER_UNAVAILABLE`, `AI_TIMEOUT`, `AI_RATE_LIMITED`, `AI_INVALID_RESPONSE`, `AI_CONTEXT_LIMIT` and `GENERATION_FAILED`. Provider bodies, prompts, stack traces and secrets are not returned.

## Browser lifecycle and minimal UI

Generation requires the confirmed M4 state and an explicit Generate Test Cases action. The UI shows in-progress, safe failure/retry, complete status, and FE/BE counts only. Generated strings and IDs are not previewed in M5.

Validated results are stored in same-tab `sessionStorage` with the analysis identity and deterministic selection signature. A module, feature or scope change, reset, reanalysis, confirmed replacement, removal or component unmount aborts/invalidate generation and clears persisted output. Replacing a PRD while generated output exists requires explicit confirmation; cancelling preserves the current PRD and generated result. Revision checks prevent late responses from attaching to newer state. Full persistence and history remain out of scope.

## Testing and evaluation

- Unit: schemas/enums/steps, selected references, parent relationships, duplicates, deterministic independent IDs, selected-only context, confirmation constraints and session parsing.
- Integration: strict request validation, no provider call for unconfirmed/stale M4 state, provider result validation, transient retry and safe errors.
- E2E: FE, BE and Both generation; counts-only UI; failure/retry; refresh; selection/removal/replacement invalidation; late-response protection; narrow viewport.
- AI evaluation: eighteen M5 dimensions cover layer relevance, case types, traceability, rules/validations, invention defenses, ambiguity, duplicates, language, structure, injection, steps and grounding. The committed harness uses a deterministic fake and is not live-model quality evidence.

## Live-model validation

After provider availability blocked the initial attempt, the opt-in Playwright smoke passed on 2026-09-23 with the authorized ignored local credential and configured `gemini-3.5-flash` model. The same reviewed English fixture produced 2 FE cases for Frontend, 2 BE cases for Backend, and independently numbered 2 FE plus 2 BE cases for Both. Every path used supported Positive and Negative coverage, referenced all 3 analyzed requirements, and had zero duplicate cases and zero invalid references. No Edge case was produced because the source defines a required-field failure but no additional numeric or range boundary.

The review found no application bug, prompt/schema issue or model-quality variance. Cases stayed relevant to the selected task feature, omitted behavior tied to unresolved roles/permissions, used executable steps and grounded expected results, remained consistently English, kept FE/BE concerns separate, and did not invent fields, roles, permissions, UI controls or API contracts. Only aggregate metadata was emitted; no raw provider response, full prompt, full PRD or credential was logged. The smoke remains opt-in and skipped in ordinary CI.

## Security, privacy and limitations

Only selected structured context reaches the provider. Raw PRDs, full prompts and raw provider responses are not logged or persisted. M6 renders validated generated content safely through React text nodes. Request and provider response sizes are bounded, schemas are strict, and production rejects the fake provider.

Known limitations:

- Deterministic validation cannot prove every natural-language interpretation is semantically grounded; QA review in M6 remains required.
- Browser session storage is accessible to same-origin script and disappears with the tab session.
- A selected layer can validly produce zero cases rather than fabricate unsupported behavior.
- M5 assigns IDs for the initial accepted result only; later counter/deletion behavior belongs to M7.
- Deterministic fake evaluation is not a penetration test or general live-model quality claim.
- Live review covers one intentionally small synthetic English PRD; broader languages and requirement shapes can still exhibit provider/model variance.
