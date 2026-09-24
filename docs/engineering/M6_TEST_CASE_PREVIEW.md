# M6 Test Case Preview

## Status and boundary

Implemented on `feat/test-case-preview`. M6 deterministically renders the already validated M5 result for QA review. It adds no provider call, API route, schema field, persistence layer, editing, deletion, regeneration, search, filtering, sorting, column selection or export behavior. Those remain later milestones.

```text
validated M5 result + confirmed testing scope
  -> generation success state
  -> M6 preview component
  -> Frontend and/or Backend table
```

## Preview architecture and layer separation

`TestCasePreview` receives the immutable M5 `{ frontend, backend }` result and the confirmed M4/M5 testing scope. Frontend-only and Backend-only scopes render their corresponding section directly. Both renders accessible counted tabs and only the selected layer table, so FE and BE rows are never mixed. Changing tabs updates local presentation state only and causes no network or AI request.

The table preserves M5 array order and displays the application-owned `TP-FE-*` / `TP-BE-*` IDs unchanged. Internal source references and provider usage metadata are intentionally not displayed.

## Approved columns and content

The table uses exactly the approved schema order: Test Case ID, Module, Feature, Title, Preconditions, Steps, Expected Result, Priority, Type, Automation and Notes. There is no Test Data column. Nullable Preconditions, Automation and Notes use the presentation-only `-` placeholder without mutating stored data.

Steps render as an ordered list using the original strings and order. Long text wraps inside cells, while a focusable labelled horizontal-scroll container keeps every column and complete value accessible at narrow widths. Content is not truncated or rewritten.

## Empty states

A selected layer with zero cases is a valid M5 outcome, not an error. Its panel explains that no cases were generated from the selected documented requirements and creates no placeholder row. Both still exposes the zero-count layer tab so the user can inspect that result explicitly.

## State lifecycle and session behavior

Preview has no separate result store. It exists only while the owning M5 generation state is successful. Existing M5 invalidation therefore clears it on module, feature or scope changes, reset, reanalysis, confirmed replacement, removal, new generation or stale-request rejection.

The validated M5 result continues to use its analysis identity and deterministic selection signature in same-tab `sessionStorage`. A matching active-session refresh restores the result and preview. Both defaults to the Frontend tab after restoration; selected-tab presentation state is not persisted. No permanent or cross-session history is introduced.

## Safe rendering and accessibility

All generated strings are rendered as React text nodes. M6 uses no raw HTML or Markdown interpretation and does not display the raw provider response, prompt, source PRD or secrets. Automated render and browser tests confirm a script-like title remains visible inert text and creates no script element.

The table uses a caption, semantic column headers and ordered lists. Both uses `tablist`, `tab`, `tabpanel`, `aria-selected`, labelled relationships, roving tab stops and Left/Right/Home/End keyboard switching. The horizontal-scroll region is keyboard-focusable and labelled.

## Tests

- Deterministic render tests: exact columns, FE-only, BE-only, Both separation/counts, stable IDs/order, ordered steps, long content, nullable placeholders, empty layers, hostile strings and input immutability.
- E2E: generated FE/BE previews, all headers, ordered steps, accessible tab switching without another generation request, independent IDs, empty Backend layer, selection/scope/removal/replacement invalidation, refresh restoration, narrow viewport and inert hostile content.
- Regression: existing M1-M5 unit, E2E and AI-evaluation suites remain authoritative for upstream behavior.

## Known limitations

- Wide tables intentionally require horizontal scrolling on small screens.
- Both restores to the Frontend tab rather than persisting the last viewed tab.
- M6 is read-only. Edit/Delete belongs to M7, column selection to M8 and TSV export to M9.
