# M7 Edit and Delete Test Cases

## Status and boundary

Implemented on `feat/test-case-edit-delete`. M7 adds deliberate manual editing and confirmed deletion to the validated M5 result displayed by M6. It adds no AI request, prompt, provider action, backend route, regeneration, column selection, export, execution result, bug workflow, or permanent history.

```text
validated session result
  -> local edit draft -> schema validation -> Save -> replace matching case
  -> confirmed Delete -> remove matching case
  -> persist complete FE/BE result in the existing active-session record
```

## Editable and immutable data

The submitted edit contract is derived from the generated-case schema. Title, Preconditions, Steps, Expected Result, Priority, Type, Automation, and Notes can be changed. Module and Feature remain visible and prefilled, but are source-linked read-only fields: the UI prevents editing and the mutation boundary independently rejects values that differ from the current canonical labels. This prevents displayed labels from contradicting the immutable `source.moduleId` and `source.featureId` references without introducing source remapping.

Test Case ID, Module/Feature identity, and internal source references are immutable. The editor shows the ID and canonical labels as read-only context and never displays source metadata. Save creates a new validated result; it cannot partially mutate the prior value. A normalized same-layer duplicate scenario is rejected. Cancel discards the draft.

Steps can be edited, added, and removed while retaining at least one valid step. Step reordering is not included in M7.

## Delete behavior and stable IDs

Every deletion uses an explicit browser confirmation naming the case. Dismissal makes no change. Acceptance removes only that exact case from its FE or BE collection. Remaining IDs keep their original values and gaps; they are never renumbered or reused. Deleting the final case produces a valid empty-layer state and updated count.

## Layer and session behavior

Frontend and Backend mutations are isolated. M7 writes the complete updated result to the existing `testpilot.generated-test-cases.v1` session record using the current analysis identity and selection signature. Refresh therefore restores saved edits and deletes in the active tab.

Existing lifecycle rules remain authoritative: a new generation, changed module/feature/scope, reset, reanalysis, file removal, or confirmed PRD replacement clears the mutated result. Draft edits that have not been saved are component-local and are not restored.

## Security and accessibility

Edited values render as React text nodes; markup is not interpreted. M7 has no provider import, API call, secret access, raw provider response, prompt, or source-document logging. The editor uses labelled native controls, focuses Title when opened, reports validation through an alert, and supports keyboard operation. Delete uses the native confirmation dialog. Wide tables remain horizontally scrollable without widening the page viewport.

## Tests

- Unit: valid source-compatible saves, incompatible Module/Feature rejection, immutable source/ID data, invalid/duplicate rejection, layer isolation, deletion without renumbering, and final-case deletion.
- Component: exact eleven columns, scoped action controls, FE/BE presentation, empty layers, and hostile-string escaping.
- E2E: prefilled editor, Cancel, validation, Save, add-step, inert hostile text, no mutation-time generation request, refresh restoration, regeneration invalidation, delete accept/cancel, ID gaps, final empty layer, Both isolation, and narrow viewport.
- QA artifacts: [frontend cases](../../qa/test-cases/frontend/M7_EDIT_DELETE.md) and [backend-boundary cases](../../qa/test-cases/backend/M7_EDIT_DELETE.md).

## Known limitations

- State is active-session only; browser/tab lifecycle follows OQ-06.
- Drafts are not retained when closing the editor or switching FE/BE tabs.
- Step reordering, undo/history, bulk changes, and regeneration remain excluded. M8 provides independent fixed-order column selection; M9 now exports only the saved M7 working result.
