# Test Data Guide

## Purpose

Make actual input values reproducible without adding a default Test Data column to MVP-generated cases. Place concise values in Steps or Notes when necessary; use execution records or automation fixtures for larger data sets.

## Illustrative values

These examples reproduce the supplied brief's QA guidance. They do not establish TestPilot account fields or business rules.

```text
Invalid email:
user@

Empty:
""

Whitespace:
"   "

Password below boundary:
1234567

Password boundary:
12345678
```

Use the email example only where a source requires email validation. Use the password examples only where the source states the 8-character minimum. Do not infer a maximum, complexity rule, error message, or authentication feature from them.

## Fixture categories to prepare when supported

- Readable unencrypted text-based PDF, standard unencrypted OOXML DOCX, and UTF-8 TXT with/without BOM; annotate source facts. Include encrypted/password-protected and image-only rejection fixtures.
- Indonesian, English, and mixed-language PRDs with documented expected interpretation.
- Empty, corrupt, unsupported, or no-readable-content files; document how each was constructed.
- Size-boundary fixtures just below, at, and above TestPilot's approved 10 MB maximum; document the configured byte conversion and actual file sizes. Never transfer this limit into unrelated target-system PRDs.
- Ambiguous/conflicting requirements and deliberately absent fields/roles/contracts for guardrail evaluation.
- Controlled provider responses: valid, malformed JSON, empty, partial, timeout, rate limit, unavailable.
- TSV inputs with tabs, quotes, embedded newlines, Unicode, optional null values, and formula-leading =, +, -, @ strings; expect UTF-8 BOM/CRLF/TAB, single-cell normalized steps, literal formula-safe values, schema order, and nonempty-layer files.

These are future fixture categories, not created or executed data. Limits/encoding/nullable values and retry/partial policies are settled by [resolved decisions](../product/OPEN_QUESTIONS.md). Mock unavailable usage as null, not zero; include invalid/partial structured output and same-action duplicate/stale-response timing. Do not fabricate expected source facts.

## Fixture manifest recommendation

For each future fixture record its path/identifier, purpose, synthetic provenance, source/requirement revision, format/language/encoding, size or checksum where useful, deliberate mutations, expected parser/analysis facts, known ambiguity, and cleanup needs. For mock responses, record schema/provider-adapter compatibility. Keep expected source facts separate from expected model wording.

Store files and their documentation under [qa/test-data](../../qa/test-data/). Use synthetic, non-sensitive content. Do not commit credentials, confidential PRDs, or personal data. Preserve the exact executed fixture revision in execution evidence so later edits cannot invalidate the record. Link fixtures from cases, automation, and executions without adding a default Test Data export column.
