# M5 AI Test Case Generation

## Status and purpose

M5 converts one confirmed M4 reviewed selection into validated Frontend, Backend, or separate Frontend and Backend test-case collections. Generation requires an explicit QA action and stops at a minimal structured result view. Editing, deletion, full preview, and export remain later milestones.

## Architecture and flow

```text
validated M3 analysis + exact M4 reviewed-selection contract
  -> server revalidates IDs and derived relationships
  -> selected context only
  -> one layer request for Frontend or Backend, two parallel layer requests for Both
  -> existing Gemini/fake provider abstraction
  -> strict JSON and Zod validation
  -> grounding/reference checks
  -> deterministic duplicate filtering
  -> application-owned fields and IDs
  -> separate frontend/backend result collections
```

`POST /api/test-cases/generate` accepts JSON containing the existing M3 analysis and M4 reviewed-selection contracts. The handler rebuilds the expected M4 contract and requires an exact match before invoking the provider. The request body is bounded to 1,500,000 bytes and responses use `Cache-Control: no-store`.

## Selected generation context

The provider receives only selected modules, selected features, and the M4-derived requirements, business rules, validations, ambiguities, and Need Confirmation items. Unselected M3 analysis and the raw uploaded PRD are excluded. Each selected item retains its existing ID and evidence. No second interpretation or relationship layer is created.

## Provider prompt and output

The trusted system instruction defines layer boundaries, reasonable QA inference, atomicity, duplicate avoidance, uncertainty restraint, language behavior, and prohibited invention. The reviewed content is serialized in a JSON envelope marked as untrusted data. It cannot change the role, schema, scope, secret policy, or tool behavior.

The provider returns `{ cases: [...] }` as strict JSON. Drafts omit final IDs, Priority, Automation, Notes, Module names, and Feature names. They provide selected module/feature IDs, prose fields, Type, and grounding IDs. Gemini continues to use temperature `0`, structured response schema, server-only credentials, the configured model, bounded response reading, and no user-facing provider selector.

## Final output contract

The final result contains separate `frontend` and `backend` arrays. Each record contains:

- The approved eleven fields: Test Case ID, Module, Feature, Title, Preconditions, Steps, Expected Result, Priority, Type, Automation, Notes.
- Separate internal traceability: module ID, feature ID, requirement IDs, business-rule IDs, validation IDs, and Need Confirmation IDs.

`Test Data` is not added. Preconditions, Automation, and Notes may be null. Steps are stored as an ordered string array.

## Application-owned policy

- Frontend IDs: `TP-FE-001`, `TP-FE-002`, and onward.
- Backend IDs: `TP-BE-001`, `TP-BE-002`, and onward.
- FE and BE counters are independent.
- Module and Feature names are resolved from the selected M3 records.
- Priority defaults deterministically to `Medium`. The approved sources define the enum but no ranking algorithm.
- Automation remains null because generation does not prove automation exists or establish suitability for every case.
- Notes remain null unless referenced Need Confirmation limits coverage; then a short same-language limitation note is added.

## Generation rules

Positive covers documented valid behavior. Negative requires documented invalid behavior or a reasonable inverse of an explicit validation. Edge requires a documented boundary/state/optional rule or reasonable whitespace handling of an explicit required-field rule. Every case must be atomic, actionable, concise, and use exactly one of Positive, Negative, or Edge.

Backend generation stays at business/server validation level unless the selected evidence supplies an API contract. It cannot invent endpoints, methods, status codes, headers, payloads, or response schemas. Frontend generation cannot invent controls, messages, navigation, or visible states.

## Grounding and hallucination controls

Every draft must reference a selected feature and at least one selected requirement. Module-feature ownership must match M3. Module-level requirements may support a selected feature in the same module. Referenced rules and validations must overlap the case requirements. Referenced confirmations must resolve through a selected ambiguity to a case requirement. Any unknown or outside-selection reference rejects the provider result.

Cases are deduplicated by normalized Module ID, Feature ID, Title, and Type. Different types and real boundary distinctions remain separate. No model-generated ID or name is trusted.

## Retry and errors

Generation allows at most one automatic retry. Retryable provider/network failures follow existing Gemini error classification. Invalid JSON, schema, grounding, or empty output receives one corrective retry; a second invalid result returns `GENERATION_INVALID_RESPONSE`. Safe errors cover configuration, provider availability, timeout, rate limit, invalid request, invalid response, context limit, and generic failure. Raw prompts, source bodies, provider responses, keys, stack traces, and SDK details are never returned.

## Tokens, privacy, and logging

The server counts the selected user envelope before generation and returns a safe context-limit failure rather than truncating. Both scope executes FE and BE independently and records separate `generate_frontend` and `generate_backend` usage attempts. Token values unavailable from Gemini remain null.

The application does not log PRD text, prompts, responses, or credentials. Structured active-session results may be retained in `sessionStorage`; raw files and raw extracted PRD text are not persisted there. The result is identity-bound to the complete reviewed-selection fingerprint.

## State and stale-result safety

Starting generation clears the previous result. Selection, scope, confirmation, reanalysis, replacement, or removal clears it. Requests are aborted when the generation component unmounts, revision checks ignore late responses, and restored results must match both the analysis ID and selection fingerprint. Only one active generation request is allowed from the UI.

## Tests and evaluation

- Unit: strict request/output contracts, enums, IDs, context filtering, selection revalidation, grounding, deduplication, retries, errors, token bounds, prompt separation, and session parsing.
- Integration: FE/BE/Both handler orchestration, invalid M4 rejection, safe failure responses, and application-owned output fields.
- E2E: explicit generation, separate collections, all scopes, safe failure, session restoration, removal/replacement/selection/scope invalidation, and stale-response rejection.
- AI evaluation: grounding, layer relevance, types, duplicates, atomicity, result/step quality, uncertainty restraint, language consistency, prompt injection, and schema behavior remain separate from software pass/fail tests.

## Known limitations

- M5 does not edit, delete, regenerate an individual case, provide the full preview screen, or export.
- Priority uses `Medium` until an approved source-backed ranking policy exists.
- Automation remains empty until a later reviewed workflow can assess suitability without claiming implementation.
- Deterministic tests cannot guarantee the semantic quality of every live-model response; human QA review remains required.

## Open Question

- What approved source-backed rules, if any, should replace M5's deterministic `Medium` Priority default in a later milestone?
