# M8 backend-boundary test cases — Export Column Selection

Specifications only. M8 adds no backend route or file generation. These cases verify the local configuration boundary. Actual Result, Status, and Bug ID remain absent until real manual execution.

| Test Case ID | Module | Feature | Title | Preconditions | Steps | Expected Result | Priority | Type | Automation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M8-BE-001 | Test Case Preview | Network isolation | Change columns without a request | Generated result exists | Record requests; change multiple selections | No analysis, generation, provider, or export request occurs | High | Negative | Yes | E2E request counter and code review |
| M8-BE-002 | Test Case Preview | Allowlist | Persist approved keys only | Valid custom configuration exists | Inspect session value | Only unique approved keys in canonical order are stored | High | Positive | Yes | Unit and E2E |
| M8-BE-003 | Test Case Preview | Shared schema | Reuse one configuration for FE and BE | Both result exists | Switch layers after configuring | No separate backend preference or backend mutation is created | Medium | Positive | Yes | E2E |
| M8-BE-004 | Test Case Preview | Privacy | Exclude internal data | Configuration is persisted | Inspect UI and stored value | No source IDs, requirements, provider metadata, PRD content, or test-case content is present | High | Negative | Yes | Contract and security review |
