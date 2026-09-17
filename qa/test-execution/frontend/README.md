# Frontend test execution records

Store actual frontend execution attempts here, separately from [case specifications](../../test-cases/frontend/README.md). No execution has been performed; this file contains instructions only.

A future record must identify the run, case ID/revision, application version and exact commit/build, environment, source/fixture revision, executor/date, and evidence links. For AI-sensitive checks also identify provider/model and prompt/schema revisions. Record P0/P1/P2 execution priority separately from generated-case High/Medium/Low Priority.

For generated cases, include the generation-session identifier with layer and Test Case ID: counters may restart at 001 in a new session under resolved OQ-09. A matching ID alone does not identify the same case across sessions.

Use one uniquely named run file or a run folder such as `<date>-<build>-<run-id>`; do not overwrite earlier runs. Include these result fields:

| Field         | Rule                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- |
| Actual Result | Leave empty until execution; then record the observed behavior                              |
| Status        | Leave empty until execution; then record Pass, Fail, or Blocked based on the actual attempt |
| Evidence      | Reference sanitized observations, logs, screenshots, or exported artifacts from that run    |
| Related Bug   | Link an observed defect when one exists; never invent one                                   |

Do not prefill Actual Result or Status with `Pending`, `Not Run`, dashes, or expected outcomes. A run attempted but blocked may record Blocked with the actual cause; an unattempted case stays empty. Pass requires evidence that its source-backed expected result was met. Do not claim a live-provider pass based only on mocks.

On failure, use [Bug Report Guide](../../../docs/qa/BUG_REPORT_GUIDE.md). For retests, preserve the original result and append a new build-specific record. Follow [Traceability](../../../docs/qa/TRACEABILITY.md) and [Versioning and Release](../../../docs/engineering/VERSIONING_RELEASE.md). Repository execution records do not authorize an in-app execution module.
