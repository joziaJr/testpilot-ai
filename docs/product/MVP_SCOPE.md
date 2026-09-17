# MVP Scope

## Purpose and source

Prevent scope creep during agent-assisted development. Derived from the approved [PRD](PRD.md), [Business Flow](BUSINESS_FLOW.md), and [resolved decisions OQ-03–OQ-14](OPEN_QUESTIONS.md). Clarifications below do not alter the original source files or imply implementation exists.

## In Scope

- Validate uploads server-side, checking extension and actual type/MIME where feasible: maximum 10 MB per file; readable text-based unencrypted PDF, standard unencrypted OOXML DOCX, UTF-8 TXT with/without BOM. Reject >10 MB, unsupported, unreadable, encrypted/password-protected, or image-only/scanned input.
- Analyze documented modules, features, requirements, business rules, fields, validations, user behavior, navigation, permissions, constraints, and ambiguities with AI.
- Review detected language and requirements; select all modules, particular modules, or particular features. Generate only for that selection.
- Select Frontend, Backend, or Both.
- Generate distinct Positive, Negative, and Edge cases, grounded in selected requirements.
- Validate strict structured JSON with application schemas; reject invalid/incomplete results. Keep `Need Confirmation` in analysis metadata. Omit scenarios requiring missing details while allowing unrelated valid requirements; no analysis editing. Require at least one selected module/feature.
- Show cases before export, with separate FE/BE tabs. Manually edit the ten non-ID fields; validate Save/Cancel under the bootstrap QA plan. Delete without renumbering other IDs.
- Assign automatic, unique, immutable TP-FE/TP-BE IDs using per-layer active-session counters. Deletion never renumbers; additional cases continue counters; a new session may restart at 001.
- Retain metadata, requirements, language, selections, FE/BE cases and edits through internal navigation. Prefer refresh recovery via session-level browser storage if feasible; close may discard. Confirm new-PRD replacement when current generated/unsaved data exists. Request/session identity prevents stale responses overwriting newer state.
- Default-select Test Case ID through Type (first nine schema columns); Automation/Notes default unselected. Export selected columns in schema order without erasing preview data; no column reordering.
- Export separate `testpilot_frontend.tsv` / `testpilot_backend.tsv` only for nonempty layers. Both never combines layers or emits empty-layer files; clearly show absent-layer results.
- Understand Indonesian/English/mixed PRDs. Determine dominance from requirement content, then meaningful-content majority, then first primary section/heading. Keep Title/Preconditions/Steps/Expected Result in one output language; fixed headers/enums. Priority High/Medium/Low, Type Positive/Negative/Edge, Automation Yes/No/Candidate.
- Generate enough cases for coverage without intentional quantity inflation or redundancy. No user-selected case count (PRD §14).
- Use a configurable server-side provider, initially a suitable free-tier provider/model; no provider selector in the UI (PRD §25).
- Record per-request Action, Model, Input Tokens, Output Tokens, Total Tokens, Timestamp. Both follows prd_analysis, generate_frontend, generate_backend; no generate_both. Missing usage is null, not zero.
- Handle invalid documents, provider failures, and invalid/empty/partial AI responses without fabricated results.
- TSV uses UTF-8 with BOM, CRLF rows, TAB delimiters, deterministic readable steps within one cell, normalized structure-breaking characters, and formula-leading values rendered literally (OQ-08).
- Required case fields: ID, Module, Feature, Title, Steps, Expected Result, Priority, Type. Optional/nullable Preconditions, Automation, Notes display/export `-` when a value is needed; never fabricate missing required content (OQ-09).
- Provide recoverable failures and loading feedback, prevent duplicate active submissions for the same generation action, allow at most 1 automatic transient-provider/network retry, reject partial/invalid output, and centralize resource/time/context limits. No initial numeric SLO required.
- Use three main screens: Upload PRD, PRD Analysis, Test Case Preview. Do not permanently retain raw PRDs or extracted/generated session content; raw files last only as needed for processing and have no public URLs. Usage metadata may persist without PRD content. Keep secrets server-side.

## Out of Scope

- Login, Register, authentication, and user-account features in TestPilot itself.
- Team management and collaboration.
- Project management and full generation history.
- Jira integration.
- GitHub integration as a product feature.
- In-app test execution module.
- In-app bug reporting module.
- Playwright generation.
- XLSX export.
- OCR.
- Image-only PRDs, including scanned PDFs without readable text.
- PRD version comparison.
- Requirement change detection.
- Existing testcase import.
- Coverage dashboard.
- Autonomous multi-agent system.
- Multi-provider selection from the UI.
- Regenerate individual testcase.
- PRD analysis editing and custom export column ordering/reorder controls (OQ-05/OQ-07).

PRD §32 additionally reserves search/filter, user-facing PRD references per testcase, enhanced duplicate detection, saved export preferences, usage dashboards, saved projects/PRDs, history, multiple PRDs, and affected-case generation for later releases. Basic nonredundancy is already an MVP rule; an advanced duplicate-management feature is not. Minimal internal source grounding does not authorize a user-facing reference feature or an automated traceability system.

Repository test specifications, execution records, bug reports, and future regression automation support development quality; they do not authorize equivalent application modules. Development pull requests and CI do not constitute a product GitHub integration. AI-provider abstraction does not imply a provider-selection UI or autonomous agents.

## Scope gate

Before implementing a change, cite the approved source and applicable resolved OQ, inspect existing code, and stay within scope. No unresolved MVP-blocking Open Questions remain. Record genuinely new blockers only with evidence; delegated implementation choices do not reopen these decisions. This task ends after reconciliation and does not start M0.

No application features or full automation are authorized by the foundation task.
