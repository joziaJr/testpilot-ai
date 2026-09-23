# M5 synthetic test data

`generator.txt` is synthetic, non-sensitive input for generator grounding review. It provides a selected capability, business rule, required-field validation, backend business behavior and an explicit permission gap. It intentionally provides no endpoint, HTTP method, status code, payload or response schema, so backend evaluation can detect API-contract invention.

Automated browser coverage currently reuses `qa/test-data/m4/review.txt` because it already supplies deterministic M3 relationships required by the M4-to-M5 flow. No fixture is an execution record or evidence of live-model quality.
