# M8 Export Column Selection

## Status and boundary

Implemented on `feat/export-column-selection`. M8 creates a deterministic active-session configuration for future TSV export. It does not serialize data, create a Blob, name or download a file, add an export route, sanitize spreadsheet values, or invoke AI. Those responsibilities remain M9.

```text
M7 edited/deleted working result
  + M8 shared selectedColumns preference
  -> validated future-export configuration
  -> M9 not implemented
```

## Available columns and stable keys

The fixed allowlist is identical for FE and BE:

| Canonical position | Key              | Label           | Default      |
| -----------------: | ---------------- | --------------- | ------------ |
|                  1 | `testCaseId`     | Test Case ID    | Selected     |
|                  2 | `module`         | Module          | Selected     |
|                  3 | `feature`        | Feature         | Selected     |
|                  4 | `title`          | Title           | Selected     |
|                  5 | `preconditions`  | Preconditions   | Selected     |
|                  6 | `steps`          | Steps           | Selected     |
|                  7 | `expectedResult` | Expected Result | Selected     |
|                  8 | `priority`       | Priority        | Selected     |
|                  9 | `type`           | Type            | Selected     |
|                 10 | `automation`     | Automation      | Not selected |
|                 11 | `notes`          | Notes           | Not selected |

Test Data, source/reference IDs, provider metadata, PRD content, and arbitrary names are not allowed.

## Selection and fixed ordering

Each checkbox immediately updates the draft selection and selected count. Select All restores all eleven; Clear All temporarily creates an invalid zero-column draft and displays `Select at least one column for export.` No export action exists.

OQ-07 fixes ordering. Every transition filters the fixed allowlist, so selected keys always remain in canonical schema order. Deselecting removes a key. Reselecting inserts it back at its canonical position. There are no Move Up, Move Down, drag-and-drop, or reorder controls, and persisted reordered arrays are rejected.

## Validation and persistence

The strict Zod contract accepts one to eleven unique allowlisted keys in canonical order. Unknown, duplicate, empty, reordered, extra-field, and malformed persisted values are invalid. Invalid persisted state falls back to the first-nine default without crashing.

Valid preferences use same-tab `sessionStorage` key `testpilot.export-columns.v1`. A zero-column draft is not persisted; refreshing it safely returns to the canonical default. Valid selections survive refresh, M7 Edit/Delete, regeneration, FE/BE tab changes, reanalysis, and PRD replacement during the active tab session. This preference is intentionally independent of generation identity and stores no case or PRD content.

## Interaction with M7 and FE/BE

One shared configuration applies to Frontend, Backend, and Both because both layers use the same schema. M8 reads and writes only approved column keys. It cannot mutate, restore, reconstruct, or renumber test cases. M7 edits and deletions remain in the owning generated result and M8 selection produces no generation, analysis, or provider request.

## Accessibility and security

All eleven native checkboxes have meaningful accessible names, selected/not-selected text, and visible focus. Select All and Clear All are keyboard-operable text buttons. Canonical positions are stated in text, the count uses a status role, and zero-column validation uses an alert.

The fixed allowlist prevents arbitrary keys and internal metadata. M8 imports no server provider/configuration code and performs no network call. It persists only the approved key array and exposes no key, prompt, provider response, raw PRD, source references, or test-case content.

## Tests

- Unit: exact allowlist, first-nine default, deselection, canonical reinsertion, empty/unknown/duplicate/reordered rejection, valid restoration, and malformed fallback.
- Component: eleven visible options, nine checked defaults, fixed-order/no-file wording, and absence of reorder/export controls.
- E2E: default state, selection/counts, fixed DOM order, refresh, Clear/Select All, invalid persisted fallback, shared Both behavior, M7 edit/delete isolation, regeneration retention, narrow viewport, no download, and no mutation-time generation request.
- QA: [frontend cases](../../qa/test-cases/frontend/M8_EXPORT_COLUMN_SELECTION.md) and [backend-boundary cases](../../qa/test-cases/backend/M8_EXPORT_COLUMN_SELECTION.md).

## Known limitations

- Closing the tab/session may discard the preference.
- A cleared invalid draft returns to the first-nine default after refresh.
- Custom ordering and saved account preferences are excluded by OQ-07 and post-MVP scope.
- TSV generation, escaping, filenames, empty-layer export handling, and downloads remain M9.
