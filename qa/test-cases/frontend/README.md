# Frontend test case specifications

Store evidence-backed frontend case specifications here. M1–M5 milestone suites now document implemented coverage; they remain specifications rather than manual execution records.

Follow [Test Case Guide](../../../docs/qa/TEST_CASE_GUIDE.md) for the identical eleven-column FE/BE schema. Use stable case identifiers, short titles, reproducible steps, and source-backed expected results. Cite the approved requirement/technical evidence and its revision in repository context or Notes. Scope each case to documented UI interactions and visible behavior.

Suggested organization: one `<case-id>.md` file or a named suite table with stable per-row IDs. Product-generated TP-FE/TP-BE IDs use per-layer active-session counters: continue for additional cases, never renumber after deletion, and optionally restart at 001 only for a new session. Include session context in references across runs. These conventions are not actual case records.

Keep Actual Result and Status in [execution records](../../test-execution/frontend/README.md), not in case columns. Store needed concrete values in steps or linked [test-data](../../test-data/README.md); Test Data is not a default column. Distinguish product Priority High/Medium/Low from project QA planning P0/P1/P2.

Only create cases when supported by PRD, implemented evidence, or an approved technical specification. The approved PRD permits later grounded authoring, but this foundation does not fabricate a completed case suite. Follow [Traceability](../../../docs/qa/TRACEABILITY.md).
