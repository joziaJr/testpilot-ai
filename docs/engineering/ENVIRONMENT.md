# Environment Guide

## Purpose and current state

M0 installs the Next.js/TypeScript/Tailwind CSS/shadcn/ui conventions/Zod foundation with npm scripts, local hooks, tests, and CI. The secret-free [.env.example](../../.env.example) documents the server configuration contract. No AI provider is called and no AI key is required in M0.

[PRD §§25–26, 29–30, 33](../product/PRD.md) and [resolved OQ-03–OQ-14](../product/OPEN_QUESTIONS.md) define the baseline. No unresolved MVP-blocking questions remain. Actual parser/model selection, dependency versions, provider-specific context/timeout values, and deployment wiring are delegated implementation choices.

## Proposed environment roles

| Environment          | Purpose                                                      | Configuration/evidence                                                                                                         |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Local development    | Implement and validate scoped changes                        | Document runtime/package-manager versions, install/start/build/check commands, synthetic fixtures, server-side provider config |
| Automated validation | Repeat deterministic gates and controlled integration checks | Locked dependencies, configured scripts, mock provider behavior; no developer secrets committed                                |
| QA candidate         | Validate the exact candidate before release                  | Version, commit/build, environment identity, provider/model, prompt/schema revisions, sanitized evidence                       |
| Released deployment  | Serve a validated artifact                                   | Same artifact identity, approved configuration/secrets, upload/session/usage policy                                            |

These roles do not mandate separate infrastructure or additional product environments. Choose the minimum deployment setup during architecture review.

## Configuration inventory to finalize

| Setting category     | Approved baseline                                                                                                               | Implementation work                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Runtime and scripts  | Next.js 16, React 19, TypeScript 6, Tailwind CSS 4, shadcn/ui conventions, Zod 4                                                | Node >=22.22.1; npm 11.6.2; commands are documented in the root README                                   |
| Provider/model       | One server-configurable adapter; suitable Gemini API free-tier model may be initial; no UI selector                             | Select current suitable model and document privacy/retention                                             |
| Provider credential  | Environment or approved secret storage; server-only; never client bundle/Git                                                    | Wire secret-free template names and deployment storage                                                   |
| Upload/parser policy | 10 MB maximum; unencrypted readable PDF/OOXML DOCX; UTF-8 TXT with/without BOM; server extension/type checks                    | Select dedicated compatible parsers and consistent byte representation for the configured 10 MB limit    |
| Processing policy    | At most 1 automatic transient retry; one active same-action request; reject invalid/partial JSON; responsive loading            | Centralize timeout/context/resource configuration; no arbitrary scattered limits or required initial SLO |
| Session/storage      | Internal-navigation continuity; prefer session-level refresh recovery; close may discard; replacement confirmation; request IDs | Wire session storage/cleanup, no permanent raw/extracted/generated history or public upload URLs         |
| AI usage             | Approved three actions; missing values null; metadata may persist without PRD body                                              | Wire metadata-only sink, timestamps, and actual-attempt tracking                                         |
| Version/build        | Current 0.1.0; stable 1.0.0 after DoD; v-prefixed tags; maintainer owns release                                                 | Husky/Commitlint/GitHub Actions/Release Please are configured; remote runs/releases remain unexecuted    |

The server environment schema validates `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`, `MAX_UPLOAD_SIZE_MB`, `AI_MAX_AUTOMATIC_RETRIES`, `AI_TIMEOUT_MS`, and `AI_CONTEXT_TOKEN_LIMIT`. Blank optional values become undefined, so M0 does not require a key/model. Upload maximum is fixed at 10 MB and automatic retries cannot exceed 1. Real `.env*` files are ignored except `.env.example`; never prefix credentials with `NEXT_PUBLIC_`.

## Setup documentation to add with implementation

1. Pin supported runtime/tool versions and dependency installation instructions from the real project manifest.
2. Explain how to configure the chosen provider/model and obtain credentials through its official setup, with values kept out of the repository.
3. List required environment variable names, validation rules, and startup failure behavior for missing/invalid configuration.
4. Document actual local start/build and validation commands, then run and verify them.
5. Configure Husky and CI using those commands under [Versioning and Release](VERSIONING_RELEASE.md).
6. Record source/fixture, prompt/schema/model revisions for QA; avoid changing live configuration unnoticed during a test run.
7. Update [README](../../README.md) so a new developer can follow the verified setup.

Do not claim a free tier is unlimited. Select and document provider/model privacy and retention only when provider integration is authorized. M0 validates configuration shape without making network calls or storing source content.

## M1 implementation

M1 defaults MAX_UPLOAD_SIZE_MB to 10 and AI_MAX_AUTOMATIC_RETRIES to 1 when absent. Invalid configured values still fail validation. No new variables or AI credentials are required. Decimal size conversion, request overhead and deadlines are documented in [M1 Upload](M1_UPLOAD.md).
