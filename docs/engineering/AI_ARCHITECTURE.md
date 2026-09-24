# AI Architecture

## Purpose and status

The two-stage pipeline is fixed by [PRD §§17, 24–26](../product/PRD.md), [Business Flow](../product/BUSINESS_FLOW.md), and [resolved decisions](../product/OPEN_QUESTIONS.md). M3 implements the first AI stage through one server-configurable Gemini adapter, strict structured JSON with Zod and deterministic grounding checks. The test-case generator remains planned. Apply [AI Rules](AI_RULES.md) and the exact [M3 contract](M3_AI_PRD_ANALYZER.md).

```text
PRD
↓
Document Extraction                 [deterministic; after file validation]
↓
PRD Analyzer                        [AI]
↓
Structured Requirements             [deterministic validation]
↓
User Selection                      [user + application]
↓
Test Case Generator                 [AI]
↓
Structured Test Case JSON           [deterministic validation + ID assignment]
↓
Application Preview                 [application]
↓
Edit / Delete → Select Columns → TSV [application; no AI]
```

## 1. Validation and extraction — no AI

Server validation enforces 10 MB per file and checks extension plus actual type/MIME where feasible. Support readable text PDF, standard OOXML DOCX, and UTF-8 TXT with/without BOM; reject encrypted/password-protected PDF/DOCX, image-only/scanned, unsupported, oversized, or unreadable input. Use dedicated server parsers, retain source context only for the session, and remove raw files after processing needs end.

## 2. PRD Analyzer — AI

Supply extracted content as untrusted source data beneath application instructions. Identify documented modules, features, requirements, rules, fields, validations, behavior, navigation, permissions, and constraints. Represent missing information primarily in analysis metadata with recommended fields `status: need_confirmation`, `requirement`, `reason`, `missing_details`; display `Need Confirmation` and its reason during analysis. This is not a default testcase/export column or an instruction to fill Notes.

Recommended validation: parse structured output, check the agreed schema, check source support, reject unsupported facts, and retain unresolved conflicts. Minimal internal evidence supports validation but is not the post-MVP user-facing PRD-reference feature or a full traceability engine. A matching excerpt alone cannot prove the model's interpretation. Human review and semantic QA are still required; validate internal references rather than trusting model identifiers.

## 3. Review and selection — no AI

Present detected language and analysis for review. Users select all/specific modules or specific features and FE/BE/Both. Require at least one module/feature; otherwise prevent generation with clear validation (suggested: `Select at least one module or feature.`). Analysis editing is excluded. Omit scenarios requiring missing details, but generate unrelated valid scenarios in the same feature. Never invent missing rules to complete coverage.

## 4. Test Case Generator — AI (implemented in M5)

Inputs: structured requirements, selected modules/features, testing scope, documented related context, and the agreed schema. Generate concise, reproducible Positive, Negative, and Edge cases. AI determines sufficient quantity for coverage without inflation/redundancy; no user count or case-type selector is specified (PRD §§10, 14, 24). FE describes observable UI behavior; BE describes documented business logic, server validation, authentication/authorization, data handling, and request/response behavior of the uploaded target system. This does not add authentication to TestPilot.

M5 reconstructs the confirmed M4 contract server-side, sends only selected related context, runs separate `generate_frontend` / `generate_backend` provider actions, validates every source reference and obvious duplicate, then assigns independent TP-FE/TP-BE IDs in application code. See [M5 Generator](M5_TEST_CASE_GENERATOR.md). [M6 Preview](M6_TEST_CASE_PREVIEW.md) remains a separate deterministic UI layer and makes no AI call.

Use the eleven FE/BE columns from [Test Case Guide](../qa/TEST_CASE_GUIDE.md) and PRD §17's preferred test_cases representation. Validate strict JSON through application schemas. Required: ID, Module, Feature, Title, Steps, Expected Result, Priority, Type. Optional/nullable: Preconditions, Automation, Notes; use `-` for absent display/export values where needed, never to disguise missing required content. Application-owned final TP-FE/TP-BE IDs use per-layer session counters, remain immutable, continue for additional cases, and may restart at 001 only in a new session.

Output uses one consistent language across Title, Preconditions, Steps, Expected Result. For mixed PRDs prioritize requirement content, then meaningful-content majority, then language of the first primary heading. Keep headers and High/Medium/Low, Positive/Negative/Edge, Yes/No/Candidate enums unchanged. Automation suggests suitability/status, not an existing script; prefer Candidate for future suitability, require justification for Yes. Missing target API contracts must not acquire invented endpoints, methods, statuses, payloads, schemas, headers, or authentication mechanisms.

## 5. Structured validation and acceptance — no AI required

Recommended checks before preview:

- Valid JSON conforming to the agreed schema, including types and confirmed required/optional fields.
- Valid references to selected requirements and source evidence; no unsupported fields, roles, permissions, contracts, rules, or limits.
- Requested FE/BE separation and Positive/Negative/Edge labels; no undesired expansion of selection scope.
- Coherent preconditions, reproducible steps, concise expected results, and non-duplicated scenarios.
- Empty/truncated/partial responses identified explicitly; no empty values invented to make incomplete output appear complete.
- Deterministic IDs assigned to accepted cases; existing IDs remain unaffected by deletion.

Schema validation cannot detect every hallucination; reviewers must assess grounding. Reject incomplete or invalid structured output rather than displaying partial success. Allow a recoverable retry path; at most 1 automatic retry only for transient provider/network failures. Do not automatically retry validation, unsupported documents, deterministic errors, or invalid selections. Prevent duplicate active submissions for the same generation action; bind responses to request/session identity and reject stale responses. Centralize timeout/context/resource settings (OQ-12).

## 6. Preview and export — no AI

Show accepted cases for QA review before export, with separate FE/BE tabs. Edit non-ID fields and delete deterministically. Export first nine default-selected columns plus optional selections, always schema order, only for nonempty layers; no reorder control. Produce approved filenames separately. Use UTF-8 BOM/CRLF/TAB, normalized single-cell steps, and literal formula-safe text. No AI for validation, extraction, IDs, editing, deletion, or TSV serialization.

## Provider adapter and evaluation

Keep provider/model settings and credentials server-side. One configurable adapter may initially use a suitable Gemini API free-tier model; select the actual compatible model at implementation time and document its privacy/retention behavior. No UI provider selector, silent fallback, or indefinite retries. Map provider failures safely without inventing TestPilot HTTP contracts. No permanent raw PRD retention or content in usage logs.

Record per-request Action, Model, Input Tokens, Output Tokens, Total Tokens, Timestamp. Both follows `prd_analysis`, `generate_frontend`, `generate_backend`; never `generate_both`. Separate layer generation requests preserve the action mapping; reuse the completed analysis rather than implying it must be repeated for each generation. Store missing provider usage values as `null`, not `0`; record actual retry attempts distinctly. Metadata may persist without source content or a dashboard (OQ-11/OQ-13).

For future evaluation, record model/provider identifier, prompt revision, schema revision, source-fixture revision, and actual results. Use mocked responses for deterministic failure checks and synthetic source fixtures for controlled live evaluation. Assess grounding, ambiguity handling, selected-scope coverage, duplicates, and layer correctness; do not demand identical prose across runs. A model/prompt/schema change requires relevant regression and guardrail checks before release.
