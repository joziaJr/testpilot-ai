# Test Case Guide

## Purpose

Define case specifications against the approved PRD and [resolved decisions](../product/OPEN_QUESTIONS.md). Specifications are not execution records. Missing source details remain `Need Confirmation` in analysis; omit dependent scenarios while allowing unrelated valid coverage. Never infer a rule merely from existing implementation if it conflicts with the source.

## Frontend Test Case

```text
Test Case ID
Module
Feature
Title
Preconditions
Steps
Expected Result
Priority
Type
Automation
Notes
```

## Backend Test Case

```text
Test Case ID
Module
Feature
Title
Preconditions
Steps
Expected Result
Priority
Type
Automation
Notes
```

The schemas are identical and contain eleven columns. FE/BE describes the tested layer, not a different column set. Test Data is not a default column. Actual Result and Status belong to execution records, not generated-case output. Requirement/layer references may be kept as internal metadata or repository context without adding default export columns.

## Field rules

| Field           | Authoring rule                                                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test Case ID    | Automatic unique immutable `TP-FE-001` / `TP-BE-001` format; application-owned deterministic allocation; never editable or renumbered on deletion                       |
| Module          | Required documented module; if needed source information is absent, preserve the gap in analysis rather than inventing a module for an accepted case                    |
| Feature         | Documented feature context                                                                                                                                              |
| Title           | Short, direct description of one scenario                                                                                                                               |
| Preconditions   | Only conditions needed to reproduce the scenario, supported by evidence                                                                                                 |
| Steps           | Ordered, reproducible actions; put needed concrete validation values here or in linked execution fixtures                                                               |
| Expected Result | Concise, source-backed observable outcome; no invented copy, fields, endpoints, or statuses                                                                             |
| Priority        | `High`, `Medium`, `Low` (PRD §6); project QA planning P0/P1/P2 belongs in separate execution/suite metadata                                                             |
| Type            | Distinguish Positive, Negative, and Edge; do not blur these into duplicate cases                                                                                        |
| Automation      | `Yes`, `No`, `Candidate`: suitability/status suggestion, not proof a script exists. Prefer Candidate for future automation; Yes needs explicit contextual justification |
| Notes           | Optional supporting context or limitations; `Need Confirmation` belongs primarily to analysis metadata, not a new case/export column                                    |

[Resolved OQ-09](../product/OPEN_QUESTIONS.md) fixes required fields: Test Case ID, Module, Feature, Title, Steps, Expected Result, Priority, Type. Preconditions, Automation, Notes are optional/nullable; render/export missing values as `-` where a value is needed. Do not fill absent required content with fabricated text or placeholders. IDs are scoped per layer to the active session, immutable after assignment; deletion never renumbers, additional cases continue counters, new sessions may restart at 001.

The `-` placeholder belongs to presentation/export. It does not become a fourth Automation enum value or a substitute for missing required data in accepted structured output.

## Output language and export

Use a single content language across Title, Preconditions, Steps, Expected Result. Mixed-language dominance follows requirement content, meaningful-content majority, then first primary section/heading. Headers/enums are standardized. Default-select first nine columns through Type; Automation/Notes unselected. Export only selected columns in schema order, no reordering. Skip empty layers, preserve preview data, normalize steps to one TSV cell, and apply UTF-8 BOM/CRLF/TAB and formula-literal safety.

## FE versus BE

| Layer    | Focus                                                                                                | Prohibited assumption                                                       |
| -------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Frontend | Documented user actions, input behavior, visible validation, preview/edit/delete/export interactions | Invented controls, roles, exact messages, or persistence rules              |
| Backend  | Documented validation, parsing, processing, output contracts, API behavior when specified            | Invented routes, methods, status codes, payload fields, or storage behavior |

The same source requirement may support separate FE and BE cases when observations differ. Both uses separate preview tabs and separate TSV files (PRD §§18, 23; BR-05), without duplicate scenarios created solely by changing a prefix. A missing API contract permits source-backed business-logic checks; contract-dependent expectations need confirmation. Documented authentication/authorization in an uploaded target PRD may be tested; TestPilot's own account features remain excluded.

## Review checklist

- Cite source requirement/revision or approved technical evidence.
- Keep titles short and expected results concise.
- Make preconditions and steps reproducible without hidden test data.
- Distinguish Positive, Negative, and Edge using documented rules/boundaries.
- Check for duplicate scenarios, including across FE/BE.
- Reject unsupported expected behavior; preserve missing-rule markers in analysis rather than creating speculative test cases.
- Keep approved ID formats stable, unique within the confirmed scope, and independent of row position. Edit only Module, Feature, Title, Preconditions, Steps, Expected Result, Priority, Type, Automation, and Notes (PRD §19).
- Automation Yes/No/Candidate conveys suitability/status suggestion. Prefer Candidate when only future suitability is known; never claim scripts already exist without evidence justifying that assertion.

## Repository authoring and storage

Store future specifications under [frontend](../../qa/test-cases/frontend/) or [backend](../../qa/test-cases/backend/). Suggested filename convention is `<case-id>.md` or a clearly named suite table with stable per-row IDs. This is a repository organization recommendation, not the product's ID format. Put source revision, layer, and approval context above a case table or in Notes without changing the approved default columns.

Do not populate cases just to fill directories. The coverage inventory in [Test Plan](TEST_PLAN.md) is planning, not a completed case suite. Record actual execution separately using the instructions in [FE execution](../../qa/test-execution/frontend/README.md) and [BE execution](../../qa/test-execution/backend/README.md).
