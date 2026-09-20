# Agent instructions

The repository contains M0, M1 upload validation, M2 document extraction and M3 AI PRD analysis. See docs/engineering/M1_UPLOAD.md, docs/engineering/M2_EXTRACTION.md and docs/engineering/M3_AI_PRD_ANALYZER.md for implemented behavior and limitations. Requirement review and later product features must be introduced only by their approved milestone, within MVP scope.

## Required workflow

READ DOCS → UNDERSTAND CURRENT STATE → CHECK MVP SCOPE → INSPECT EXISTING CODE → PLAN MINIMAL CHANGE → IMPLEMENT → RUN VALIDATION → UPDATE RELEVANT DOCUMENTATION → REPORT RESULTS.

Start with [README](README.md), [PRD](docs/product/PRD.md), [Business Flow](docs/product/BUSINESS_FLOW.md), [MVP Scope](docs/product/MVP_SCOPE.md), and [Development Guide](docs/engineering/DEVELOPMENT_GUIDE.md). Read relevant engineering and QA documents before changing their area.

## Rules for every change

1. Read project documentation before making changes.
2. The approved PRD is the product source of truth; the approved Business Flow governs sequence. Both source files are present and labeled 1.0 Draft / Approved Baseline for Development. Never silently resolve conflicts or rewrite approved requirements. The archived bootstrap brief and its abbreviated flow are not the primary product source.
3. Do not implement out-of-scope features. Recommendations are not approved product requirements.
4. Inspect existing implementation, configuration, and working changes before editing. Use Git status/diff when Git exists.
5. Prefer minimal, scoped changes.
6. Never rewrite unrelated working code.
7. Preserve existing developer changes.
8. Do not remove project configuration unless clearly obsolete and verified.
9. Run relevant validation after changes. Missing tools and unrun checks must be reported honestly.
10. Report created and modified files.
11. Report tests/checks performed and their actual results.
12. Report known limitations and unresolved questions.
13. Do not silently introduce dependencies; explain purpose, tradeoffs, and configuration changes.
14. Avoid unnecessary abstractions.
15. Never expose AI API keys to the frontend, source control, fixtures, exports, or logs.

Read [approved decisions and history](docs/product/OPEN_QUESTIONS.md) alongside the PRD/Business Flow. OQ-03–OQ-14 are RESOLVED. Record only genuinely new unknown product decisions as Open Question; delegated parser/model/configuration choices are implementation work, not replacement blockers. Mark missing uploaded-PRD details as `Need Confirmation` in analysis metadata and omit dependent scenarios while allowing unrelated source-backed ones. Follow [AI Rules](docs/engineering/AI_RULES.md).

Use identical approved FE/BE columns, High/Medium/Low Priority, Positive/Negative/Edge Type, and Yes/No/Candidate Automation. Apply approved required/nullable fields without fabricated content. Preserve session-scoped immutable IDs. Both exports nonempty layers separately; columns remain in schema order with no reorder controls. Enforce 10 MB server upload policy, session replacement confirmation and stale-response protection, one active request per generation action, at most one automatic transient retry, and rejection of invalid/partial JSON. Usage values missing from the provider are null, not zero. Do not create unsupported cases or fabricate execution results/bugs; unexecuted Actual Result and Status remain empty.

Update docs with implementation. The installed M0 baseline is Next.js/TypeScript/Tailwind CSS/shadcn/ui conventions/Zod with Vitest, Playwright, Husky, Commitlint, GitHub Actions, and Release Please. Version remains `0.1.0`; never bump on local push. Run `npm run check` and relevant E2E coverage before reporting completion. Follow [Versioning and Release](docs/engineering/VERSIONING_RELEASE.md).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
