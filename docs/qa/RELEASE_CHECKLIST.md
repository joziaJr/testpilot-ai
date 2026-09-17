# Release Checklist

## Purpose and current status

Assess whether a specific implemented candidate is QA-ready and releasable. This checklist reflects [PRD §§30, 33–34](../product/PRD.md), the approved [Business Flow](../product/BUSINESS_FLOW.md), and bootstrap QA requirements. All boxes below are intentionally unchecked. No application, release candidate, or execution evidence exists yet. Architecture-review readiness of documentation is not application QA readiness.

## Candidate identification

For an actual candidate, record version, commit/build, environment, review date, responsible reviewer, source revision, provider/model, prompt/schema revisions, and links to execution/defect evidence. PRD version 1.0 Draft is not an application version. Use the exact tested artifact; changes to code, prompts, schema, or configuration can invalidate prior evidence.

## Build and development gates

- [ ] Lint passes using the configured command.
- [ ] Typecheck passes using the configured command.
- [ ] Relevant automated tests pass; results and omissions are recorded.
- [ ] Husky and Commitlint checks run; GitHub Actions repeats required checks; Release Please follows the approved post-main process.
- [ ] Development starts at 0.1.0; stable 1.0.0 only after MVP DoD; v-prefixed SemVer tag and build identity are correct.
- [ ] No version bump occurs on an ordinary local push; release notes match the actual changes.

## Critical functional flow

- [ ] Upload → validation → extraction → analysis → QA review → module/feature selection → FE/BE/Both → generation → preview → edit/delete → column selection → TSV passes.
- [ ] Readable text PDF, standard OOXML DOCX, and UTF-8 TXT with/without BOM work; server checks extension/type and 10 MB maximum; encrypted/scanned/unsupported/empty/corrupt/unreadable/oversized files rejected.
- [ ] Invalid upload shows an error and permits Upload Again; no OCR/image-only support is implied.
- [ ] Language follows requirements-content dominance, meaningful-content majority, first primary heading fallback; Title/Preconditions/Steps/Expected Result consistent, headers/enums fixed.
- [ ] Analysis detects documented facts; missing details show Need Confirmation and reason in analysis metadata, omit dependent scenarios, retain unrelated valid coverage.
- [ ] All/specific module/feature selection honored; empty selection cannot generate; PRD analysis editing absent.
- [ ] Frontend generation works with documented UI behavior.
- [ ] Backend generation works without invented API contracts, headers, or authentication mechanisms.
- [ ] Both generation works with separate FE/BE preview tabs.
- [ ] Positive, Negative, and Edge coverage is relevant, nonredundant, and source-grounded; no manual case-count feature.
- [ ] AI guardrails and permitted QA inference are checked; invalid/empty/partial AI output does not cause a crash or false success.
- [ ] Strict required/nullable fields, High/Medium/Low, Positive/Negative/Edge, Yes/No/Candidate, '-' optional presentation, and immutable TP-FE/TP-BE session counters verified.
- [ ] Mandatory preview and QA review occur before export; long text, empty fields, and large counts follow the agreed contract.
- [ ] Edit, Save, Cancel, and active-session data work; only non-ID fields are editable.
- [ ] Delete removes the chosen case while all other IDs remain unchanged.
- [ ] First nine export columns default selected; Automation/Notes off; selected fields in schema order, no reorder controls or preview data erasure.
- [ ] FE/BE export approved separate filenames only for nonempty layers; empty layer skipped with UI indication, no combined TSV.
- [ ] TSV UTF-8 BOM/CRLF/TAB, deterministic single-cell steps, normalized tabs/newlines, and literal formula-leading values verified in Excel/Sheets.
- [ ] No cases, no selected columns, and export failures produce the required handled errors.

## Reliability, security, and release decision

- [ ] Usage uses prd_analysis/generate_frontend/generate_backend, never generate_both; unavailable values null, actual attempts tracked.
- [ ] Configurable provider works without a UI selector or business-flow changes.
- [ ] AI timeout, rate limit, unavailable, invalid JSON, empty, and partial responses are checked.
- [ ] One active same-action request, maximum 1 automatic transient retry, no auto-retry for validation/deterministic/selection failures, rejection of partial/invalid payloads, responsive loading and centralized limits verified.
- [ ] No exposed secrets or content-bearing usage logs; no public uploads/permanent raw retention; raw processing cleanup and active-session-only content verified.
- [ ] Affected regression and actual defect retests pass on the candidate; original results remain traceable.
- [ ] Navigation preserves session; refresh preservation evaluated where feasible; replacement asks confirmation for current/unsaved generated data; request/session IDs prevent stale overwrite.
- [ ] No known P0 blockers remain; other known defects have an explicit risk decision and owner.
- [ ] Scope remains within the MVP; no excluded/post-MVP features slipped in.
- [ ] Documentation, environment instructions, source mappings, and release notes match the candidate.
- [ ] Repository maintainer/project owner records the release decision with evidence; no dedicated early RC strategy required. No unresolved new release blocker.

Do not check a box because a document describes the behavior. A blocked or unavailable check needs an explicit record, not a pass. Required checks cannot be waived silently as not applicable. The current documentation-only work has not satisfied this application release checklist.
