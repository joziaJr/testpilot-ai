# M3 AI evaluation fixtures

Revision: `M3-2`. These fixtures are synthetic, non-sensitive PRDs for deterministic analyzer software tests and controlled future live-model evaluation. They contain no credentials, customer data, manual result, or claimed model outcome.

`evaluation-cases.json` defines twenty quality/security dimensions and their source-backed review oracles. `granularity-prd.txt` supplies three independently testable field rules, one allowed-value list that must remain a single requirement, and one ambiguity requiring a linked confirmation question. The deterministic `npm run test:ai-eval` command validates corpus completeness, fixture availability, language-policy behavior, prompt-data separation, schema rejection, atomicity instructions and the ambiguity-to-confirmation relationship. It does not claim that a live probabilistic Gemini response passed those dimensions.

Live evaluation, when separately run with an ignored local credential, must record provider/model, prompt/schema revision, fixture checksum, actual observation, and reviewer decision outside this manifest. The committed corpus never contains a real API key.
