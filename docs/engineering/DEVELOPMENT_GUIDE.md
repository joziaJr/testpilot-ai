# Development Guide

## Current foundation

M0 implements the toolchain; M1 implements PRD upload validation; M2 implements deterministic document extraction; M3 implements strict server-side AI PRD analysis; M4 implements requirement review and module/feature selection. See [M1 Upload](M1_UPLOAD.md), [M2 Extraction](M2_EXTRACTION.md), [M3 Analyzer](M3_AI_PRD_ANALYZER.md), and [M4 Review](M4_REQUIREMENT_REVIEW.md). Generation and later workflows remain unimplemented. Inspect manifests, lockfile, status and documentation before later milestone work.

## Mandatory rules

1. Read project documentation before making changes.
2. Treat the approved PRD as the product source of truth.
3. Do not implement out-of-scope features.
4. Inspect existing implementation before editing.
5. Prefer minimal scoped changes.
6. Never rewrite unrelated working code.
7. Preserve existing developer changes.
8. Do not remove project configuration unless clearly obsolete and verified.
9. Run relevant validation after changes.
10. Report modified files, including created files.
11. Report tests performed with actual results.
12. Report known limitations and unresolved decisions.
13. Do not silently introduce dependencies.
14. Avoid unnecessary abstraction.
15. Never expose AI API keys to the frontend.

## Working sequence

READ DOCS → UNDERSTAND CURRENT STATE → CHECK MVP SCOPE → INSPECT EXISTING CODE → PLAN MINIMAL CHANGE → IMPLEMENT → RUN VALIDATION → UPDATE RELEVANT DOCUMENTATION → REPORT RESULTS.

Read [PRD](../product/PRD.md), [Business Flow](../product/BUSINESS_FLOW.md), [MVP Scope](../product/MVP_SCOPE.md), [Architecture](ARCHITECTURE.md), [AI Rules](AI_RULES.md), [Environment](ENVIRONMENT.md), and relevant QA docs. Both approved source files are present; cite their sections/business-rule IDs rather than the archived abbreviated flow. Identify source support and [Open Questions](../product/OPEN_QUESTIONS.md) for the change. If Git exists, inspect status and diff before and after editing. Do not reset, overwrite, or clean up someone else's changes.

Use the [resolved decision register](../product/OPEN_QUESTIONS.md) as the approved clarification baseline alongside the source documents. OQ-03–OQ-14 are resolved; do not reopen them merely because dependencies/configuration still need wiring. Record compatible parser/model/library choices and centralized limits during implementation. Equivalent release tooling requires a clear technical reason and updated docs. Code and affected documentation must evolve together.

## Dependency and configuration changes

Before adding a dependency, explain its purpose and preserve existing configuration/lockfiles. Use the installed stack and add a table dependency only when real requirements justify it. Keep credentials server-side, never in `NEXT_PUBLIC_` variables, and update the secret-free environment template alongside validated server configuration.

## Validation by change type

| Change                     | Required relevant validation once tooling exists                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| Documentation              | Source/scope review, links, required structure, schema consistency                                   |
| Parser/file checks         | Unit and integration checks for supported, empty, corrupt, unreadable, and boundary files            |
| AI prompts/schema/provider | Structured validation, deterministic provider-failure checks, semantic guardrail regression          |
| Preview/edit/delete        | Frontend behavior, Save/Cancel/state checks, stable-ID regression                                    |
| TSV                        | Selected fields/order, escaping, Unicode, formula-handling contract, round-trip with agreed consumer |
| Cross-stage changes        | Affected integration and critical end-to-end flows                                                   |

Run commands from `package.json`. `npm run check` covers lint, typecheck, unit tests, and build; `npm run test:e2e` covers the browser upload flow. Add meaningful tests for actual behavior, record exact results, and do not report missing or remote-only checks as passed.

## Documentation validation

1. Confirm every required document and QA directory exists and contains useful guidance.
2. Check all relative Markdown links and anchors resolve; review external references when used.
3. Compare derived flow/behavior, full exclusions, mandatory agent rules, FE/BE columns, language/enums, IDs, split export, usage tracking, and retry behavior against the approved PRD and Business Flow. Preserve source files; the archived brief is only bootstrap context.
4. Confirm architecture recommendations are not presented as implemented or approved product behavior.
5. Confirm missing decisions say `Open Question`; uploaded-PRD ambiguity uses `Need Confirmation`.
6. Confirm there are no fictional case records, execution outcomes, or bug reports. Storage instructions are not executed records.
7. Inspect the final file list and diff if Git exists. Report checks performed separately from application tests.

No automated documentation checker is installed yet. These checks may be performed manually or using a temporary inspection script without introducing application dependencies.

## Reporting and contribution

Every completion report must include changed files, what changed and why, validation performed, checks not run and why, known limitations, and remaining Open Questions. Do not claim implementation or execution from documentation alone. Follow [Versioning and Release](VERSIONING_RELEASE.md) for commits and releases. Update [README](../../README.md) whenever setup or validation commands become available.
