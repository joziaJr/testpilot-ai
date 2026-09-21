# M4 Requirement Review and Selection

## Status

Implemented on `feat/requirement-review`. M4 reviews the validated M3 result; it does not generate test cases or exports.

## User flow

1. Complete upload validation, extraction, and AI analysis.
2. Inspect modules, features, requirements, business rules, validations, ambiguities, Need Confirmation items, and their source evidence.
3. Select modules or individual features. Selecting a module selects its features; a partially selected module uses the native indeterminate state.
4. Choose exactly one future testing scope: Frontend, Backend, or Frontend + Backend.
5. Confirm a valid selection. Need Confirmation remains visible and does not block unrelated source-backed work.

Requirements are review context and are not independently selectable. Items without a safe module or feature relationship appear under General / Unmapped Analysis.

## Review contract

`src/lib/review/review-contract.ts` owns the deterministic Zod contracts and pure transitions. The confirmed contract contains the analysis identity, selected module and feature IDs, scope, related M3 item IDs, and unmapped item IDs. It copies no requirement prose and invents no relationships. Confirmation requires at least one valid module or feature plus one scope. Any later selection or scope change clears confirmation.

Each analysis gets a new browser-generated identity. A saved selection is accepted only when that identity and every referenced module/feature still match the current M3 result. This prevents stale review state from crossing replacement or reanalysis.

## Session lifecycle and privacy

The active structured M3 result and M4 selection are stored in `sessionStorage` to preserve a same-tab refresh. The uploaded file, extracted raw PRD, credentials, provider request, raw provider response, and system prompt are not stored there. Remove, successful replacement, and reanalysis clear both session keys. A restored result can be reviewed, but the user must re-upload the source file to analyze again.

Browser session storage remains accessible to script running in the same origin. Existing XSS prevention, dependency review, restrictive rendering of source strings as text, and removal controls therefore remain part of the security boundary.

## Accessibility and responsive behavior

The review uses native checkboxes, radio buttons, fieldsets, labels, buttons, headings, lists, and disclosure elements. Module selection exposes its indeterminate state through the native checkbox. Keyboard focus indicators are visible. The layout wraps controls and uses a single-column hierarchy so it remains usable at narrow widths.

## Errors and recovery

Malformed persisted data is ignored. Unknown IDs, stale analysis identities, broken feature-parent relationships, and invalid selections cannot produce a confirmed contract. Reset clears the review selection. Removing or replacing the document returns the flow to the applicable M1/M2 state.

## Test coverage

- Unit: selection cascade, partial state, exact scope requirement, confirmation invalidation, stale/unknown identities, deterministic subset mapping, unmapped items, and standalone modules.
- Session parsing: valid restoration and rejection of malformed or partial persisted data.
- E2E: hierarchy/evidence display, module and feature interaction, all scopes, confirmation readiness, refresh restoration, reanalysis invalidation, and removal cleanup.
- M1-M3 regression remains in the existing Vitest, AI evaluation, build, and Playwright suites.

## Known limitations

- State is limited to the active browser tab and disappears when that tab session ends.
- A refresh restores structured analysis, not the browser `File`; another analysis requires re-upload.
- M5 will consume the reviewed contract, but no test generation begins in M4.

## Open Questions

None introduced by M4.
