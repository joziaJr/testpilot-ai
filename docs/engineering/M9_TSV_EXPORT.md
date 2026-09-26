# M9 TSV Export

## Status and boundary

M9 implements deterministic browser-side TSV serialization and download. It consumes the current saved M7 working cases and the validated M8 column selection. It adds no API route, provider request, AI behavior, backend persistence, export history, XLSX, CSV, ZIP, or column reordering.

```text
current M7 working cases + validated M8 selectedColumns
  -> normalize exported cell values
  -> flatten and number Steps
  -> neutralize spreadsheet formulas
  -> deterministic layer TSV
  -> browser download
```

## Input sources and mapping

The owning generation state passes the current `GeneratedTestCases` object into Export Configuration. Saved M7 edits therefore replace original values, deleted cases remain absent, collection order is preserved, and immutable IDs retain gaps. Export never reconstructs the original M5 response.

One explicit typed mapping reads only the approved public keys: Test Case ID, Module, Feature, Title, Preconditions, Steps, Expected Result, Priority, Type, Automation, and Notes. Internal source IDs, requirement references, provider metadata, prompts, PRD content, and arbitrary properties are unavailable to the serializer. Null optional values use the approved `-` presentation value.

M8's strict contract validates one to eleven unique keys in canonical order. A zero-column draft blocks both downloads and keeps the existing `Select at least one column for export.` alert. Malformed persisted state continues to use M8's first-nine safe fallback.

## FE/BE separation and filenames

Frontend exports only `result.frontend` as `testpilot_frontend.tsv`. Backend exports only `result.backend` as `testpilot_backend.tsv`. Both scope shows two explicit actions rather than starting simultaneous downloads. A zero-case layer has a disabled action and `No test cases available to export.`; another nonempty layer remains independently exportable. No combined or empty file is created.

## Header, rows, and column order

The first row contains only selected user-facing labels. Every data row uses the same selected-column count and canonical order. Rows preserve the current working collection order; export performs no sort, grouping, restoration, or ID renumbering. TAB separates columns and CRLF separates logical rows. The deterministic logical serializer omits a trailing CRLF.

## Steps representation

OQ-08 governs Steps. Each step is normalized, numbered from one, and joined into one readable cell with `|`:

```text
1. Open page | 2. Enter credentials | 3. Submit form
```

Original order is preserved and the stored array is never mutated. Multiline Steps are not emitted.

## Structure-breaking character normalization

Before TSV assembly, every consecutive run containing TAB, CRLF, CR, or LF—plus adjacent ASCII spaces—is replaced by one ASCII space. Ordinary text and ordinary repeated spaces outside such a run remain unchanged. This prevents untrusted generated or edited values from creating unintended rows or columns.

Literal double quotes require no CSV-style escaping because tabs/newlines have already been normalized and TSV does not assign structural meaning to a quote. Quotes remain ordinary user text.

## Formula-injection protection

After normalization, any value whose first meaningful character is `=`, `+`, `-`, or `@` receives a leading apostrophe in the exported representation. Leading whitespace is considered when detecting the prefix. This makes spreadsheet consumers treat hostile values as literal text. The preview, M7 state, PRD, and generated result are not changed.

## UTF-8, BOM, and download lifecycle

The logical serializer returns deterministic Unicode text. The download layer prepends UTF-8 BOM bytes, creates a `Blob` with `text/tab-separated-values;charset=utf-8`, creates a temporary object URL, clicks a hidden filename-bearing anchor, removes the anchor, and revokes the URL in a `finally` block. Export remains local to the browser and sends no TSV data to a server.

Predictable download failures show `Failed to export TSV.` without removing preview data or changing selection, cases, tabs, or generation state.

## Accessibility and UI

Layer-specific native buttons state exactly which TSV will download. Disabled state represents invalid selection or an empty layer. The selected count, existing validation alert, empty-layer explanation, and success/error status are exposed as text and semantic live regions. Controls wrap at narrow widths and remain keyboard operable.

## Tests

- Serializer/unit: approved mapping, headers, canonical selection, FE/BE IDs, current ordering and gaps, edit values, null placeholders, OQ-08 Steps, structural normalization, Unicode, quotes, formula prefixes, deterministic output, BOM/MIME, and object-URL cleanup.
- Component: approved defaults, scope-specific actions, Both separation, and empty-layer disabling.
- E2E: default FE artifact and filename, shared restored Both selection with separate artifacts, M7 edit/delete projection, formula and structural sanitization without state mutation or AI calls, zero-column prevention, empty-layer handling, and narrow viewport containment.
- QA: [M9 frontend specifications](../../qa/test-cases/frontend/M9_TSV_EXPORT.md). No backend test artifact is created because M9 adds no backend behavior or export API.

## Known limitations

- Browser download availability still depends on browser policy and user environment.
- Spreadsheet rendering behavior should also receive controlled manual Excel/Google Sheets compatibility review; deterministic automated tests verify bytes and content but are not a spreadsheet security certification.
- Export history, permanent preferences, server storage, combined archives, XLSX, and later integrations remain outside M9.
