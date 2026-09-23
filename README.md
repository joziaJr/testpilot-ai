# TestPilot AI

TestPilot AI is an MVP for turning a PRD into reviewable Frontend (FE) and Backend (BE) test cases using AI, then exporting selected columns as TSV.

## Current project status

M0 establishes the application and quality foundation. M1 implements PRD upload and server-authoritative validation, M2 implements deterministic TXT/PDF/DOCX extraction, M3 implements server-side Gemini PRD analysis with strict grounding and structured validation, M4 implements human requirement review and module/feature selection, and M5 implements selected-context FE/BE test-case generation with strict validation and deterministic IDs. See [M1 Upload](docs/engineering/M1_UPLOAD.md), [M2 Extraction](docs/engineering/M2_EXTRACTION.md), [M3 Analyzer](docs/engineering/M3_AI_PRD_ANALYZER.md), [M4 Review](docs/engineering/M4_REQUIREMENT_REVIEW.md), and [M5 Generator](docs/engineering/M5_TEST_CASE_GENERATOR.md). Full preview/edit/delete and export remain unimplemented. The current release-managed package version is `0.4.0`; this feature branch does not bump it.

The [PRD](docs/product/PRD.md) and [Business Flow](docs/product/BUSINESS_FLOW.md), both labeled **1.0 Draft / Approved Baseline for Development**, remain authoritative and unchanged. The [approved decisions OQ-03–OQ-14](docs/product/OPEN_QUESTIONS.md) clarify the implementation baseline. All twelve are resolved; their original subjects, final decisions, approval source, and affected docs remain traceable. The older task brief is historical context only.

## Read Documentation First

1. Read [agent rules](AGENTS.md).
2. Read [PRD](docs/product/PRD.md), [Business Flow](docs/product/BUSINESS_FLOW.md), and [MVP Scope](docs/product/MVP_SCOPE.md).
3. Read [Architecture](docs/engineering/ARCHITECTURE.md), [AI Architecture](docs/engineering/AI_ARCHITECTURE.md), and [AI Rules](docs/engineering/AI_RULES.md).
4. Follow [Development Guide](docs/engineering/DEVELOPMENT_GUIDE.md), [Error Handling](docs/engineering/ERROR_HANDLING.md), and [Security](docs/engineering/SECURITY.md).
5. Read the [Test Strategy](docs/qa/TEST_STRATEGY.md) and [Test Plan](docs/qa/TEST_PLAN.md) before changing behavior.
6. Use [AI Evaluation](docs/qa/AI_EVALUATION_STRATEGY.md), [Regression Checklist](docs/qa/REGRESSION_CHECKLIST.md), [Security Testing](docs/qa/SECURITY_TESTING.md), and [Penetration Testing Plan](docs/qa/PENETRATION_TEST_PLAN.md) for the corresponding quality work. These are plans, not executed assessments.

## MVP scope

The MVP covers PDF/DOCX/TXT upload, deterministic extraction, AI analysis, module/feature review and selection, FE/BE/Both generation of Positive/Negative/Edge cases, mandatory preview, manual edit/delete, column selection, and TSV export. Three screens support Upload PRD, PRD Analysis, and Test Case Preview.

Output follows source language consistently, prioritizing requirement content, meaningful-content majority, then first primary heading for mixed-language ties. FE/BE use separate tabs and nonempty-layer TSV files: `testpilot_frontend.tsv` and `testpilot_backend.tsv`. IDs use immutable session-scoped TP-FE/TP-BE counters. Export uses schema order, first nine columns selected by default, UTF-8 BOM, CRLF, sanitized single-cell steps, and formula-safe literal values. No count/reorder/provider-selection UI. See [MVP Scope](docs/product/MVP_SCOPE.md) and the resolved decisions for full policy.

Accounts, collaboration, project/history management, Jira/GitHub product integrations, in-app execution/bug modules, Playwright generation, XLSX, OCR/image-only PRDs, PRD comparison, existing-case import, coverage dashboards, individual-case regeneration, and provider selection in the UI are excluded. Other PRD §32 candidates remain post-MVP. Repository QA records and development tools are not application features.

## Documentation and QA map

| Location                                                                                          | Purpose                                                               |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [docs/product](docs/product/)                                                                     | Product authority, flow, scope, source gaps                           |
| [docs/engineering](docs/engineering/)                                                             | Implementation recommendations and agent rules                        |
| [docs/qa](docs/qa/)                                                                               | Strategy, plan, case/data/bug standards, traceability, release checks |
| [qa/test-cases/frontend](qa/test-cases/frontend/) / [backend](qa/test-cases/backend/)             | M1–M5 FE/BE specifications and future cases                           |
| [qa/test-execution/frontend](qa/test-execution/frontend/) / [backend](qa/test-execution/backend/) | Actual execution records, kept separate from specifications           |
| [qa/bug-reports/frontend](qa/bug-reports/frontend/) / [backend](qa/bug-reports/backend/)          | Observed defects only                                                 |
| [qa/test-data](qa/test-data/)                                                                     | Synthetic documented M1–M5 fixtures                                   |
| [qa/automation](qa/automation/)                                                                   | Automation conventions; executable tests live in src and tests        |

## Prerequisites

- Node.js `>=22.22.1` (CI uses Node 24)
- npm `11.6.2`
- Git for Husky hooks

## Install and run

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Upload and extraction require no AI key. To run real M3 analysis and M5 generation, copy `.env.example` to an ignored local environment file and set `AI_API_KEY`; never commit or expose it. Ordinary tests use an injected deterministic fake and never call a live provider.

For a production build:

```bash
npm run build
npm run start
```

## Validation commands

| Command                 | Purpose                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `npm run lint`          | ESLint with Next.js Core Web Vitals and TypeScript rules                  |
| `npm run typecheck`     | Strict TypeScript validation without emitting files                       |
| `npm run test`          | Run deterministic Vitest unit tests                                       |
| `npm run test:watch`    | Run unit tests in watch mode                                              |
| `npm run test:coverage` | Produce unit coverage with V8                                             |
| `npm run test:ai-eval`  | Validate deterministic M3 analysis and M5 generation evaluation harnesses |
| `npm run test:e2e`      | Run the Playwright Chromium upload suite                                  |
| `npm run check`         | Run lint, typecheck, unit tests, and production build                     |

Install the Playwright browser once with `npx playwright install chromium`. CI installs Chromium with its Linux system dependencies and runs both `check` and E2E.

## Project structure

| Location             | Responsibility                                               |
| -------------------- | ------------------------------------------------------------ |
| `src/app/`           | Next.js upload page, API route and global styling            |
| `src/config/`        | Server environment schema and validation boundary            |
| `src/lib/`           | Upload, extraction, analysis, review and generation services |
| `tests/e2e/`         | Playwright upload/extraction/analysis coverage               |
| `.github/workflows/` | CI and Release Please automation                             |
| `.husky/`            | Local commit and push quality gates                          |

Business-service directories are added only by their implementing milestone; the M5 generator exists, while preview/edit/delete and export layers do not.

## Contribution and release flow

Read docs → understand current state → check scope → inspect code → plan a minimal change → implement the authorized change → validate → update docs → report results.

Use a feature branch and Conventional Commits. Pre-commit runs staged lint/format checks, commit-msg runs Commitlint, and pre-push runs typecheck plus unit tests. GitHub Actions repeats validation and E2E. After merge to `main`, Release Please manages release pull requests and v-prefixed tags; it does not bump versions on local pushes. See [Versioning and Release](docs/engineering/VERSIONING_RELEASE.md).

**No unresolved MVP-blocking Open Questions.** M5 implements structured generation and a count summary only. The next milestone is **M6: Test Case Preview**, under separate authorization.
