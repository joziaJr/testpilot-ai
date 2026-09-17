# Versioning and Release

## Status

M0 starts at `0.1.0` and configures Husky, Commitlint, Conventional Commits, GitHub Actions, and Release Please under [resolved OQ-14](../product/OPEN_QUESTIONS.md). No commit, push, release pull request, tag, or release is created by M0. An equivalent tooling replacement still requires a clear technical reason and documentation update.

## Semantic Versioning

Use `MAJOR.MINOR.PATCH`: development starts at `0.1.0`, remains pre-stable `0.x.x`, and stable MVP `1.0.0` requires the approved Definition of Done. Tags are `v0.1.0`, `v0.2.0`, `v1.0.0`, etc. These are approved targets/conventions, not existing releases. See [Semantic Versioning](https://semver.org/).

PRD §§30.1, 30.5 establishes the project's release classification:

| Change                                     | Increment |
| ------------------------------------------ | --------- |
| `fix`                                      | PATCH     |
| `feat`                                     | MINOR     |
| Breaking change, regardless of commit type | MAJOR     |

Apply the highest required increment and reset lower components. There is no formal public backwards-compatibility guarantee during 0.x.x, but breaking product/architecture changes must be documented and traceable. Keep fix → PATCH, feat → MINOR, breaking → MAJOR, including early development. Configure release tooling to match this mapping; do not silently accept different pre-1.0 defaults. A version calculation alone does not qualify a build as stable 1.0.0 before MVP DoD. Documentation/test/chore/refactor-only work need not publish an application release.

## Conventional Commits

Use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format, including optional scopes. Supported types and examples from PRD §30.2:

```text
feat: add PRD upload
fix: handle invalid PDF
docs: update PRD
test: add parser tests
refactor: simplify AI service
chore: update dependencies
```

Mark a breaking change with `!` or a `BREAKING CHANGE:` footer. Explain what changed and the migration impact. Preserve the classification in the final merge/squash commit so release automation can interpret it. Commit type describes work actually done; do not label a documentation-only foundation as an implemented feature.

## Husky quality gates

Use [Husky](https://typicode.github.io/husky/) for local Git hooks when Git and the application toolchain exist. Proposed mapping:

| Hook       | Validation                                                                  |
| ---------- | --------------------------------------------------------------------------- |
| pre-commit | Relevant lint, typecheck, and focused tests using real configured commands  |
| commit-msg | Commitlint validates Conventional Commit format                             |
| pre-push   | Additional relevant tests if justified by runtime/cost; never version bumps |

Husky runs `lint-staged` at pre-commit, Commitlint at commit-msg, and typecheck plus unit tests at pre-push. GitHub Actions runs the full foundation check and Playwright smoke test. Release Please manages the automated release/version pull request process after main merges. Local hooks can be bypassed, so CI remains required.

## Release flow

```text
Feature Branch
→ Development
→ Commit with Husky Validation
→ Push
→ Pull Request
→ CI
→ Review
→ Merge Main
→ Automated Versioning
→ Release validation
→ Release
```

Pre-commit and commit-msg hooks run during the commit process; optional pre-push validation runs during push. This explains the brief's conceptual Commit → Husky Validation → Push sequence.

The repository maintainer/project owner is the release owner. A dedicated RC strategy is not required for earliest MVP development; one may be introduced before stable 1.0.0 if needed. Candidate below means an identifiable build, not a mandatory prerelease tag.

Release implementation after merge to main:

1. Run configured quality gates on the merged revision.
2. Classify releasable commits since the last release and determine the version automatically using the adopted policy.
3. Produce a candidate with recorded version, commit SHA, build identifier, and changelog/release notes.
4. Complete the [Release Checklist](../qa/RELEASE_CHECKLIST.md) against that candidate; do not publish merely because a version was computed.
5. Publish/tag the validated immutable artifact and retain its evidence. Ensure retries cannot produce duplicate releases or unrelated version increments.

Versions must NOT increase on every local push. The configured Release Please workflow runs after merges/pushes to `main`, uses the manifest at `0.1.0`, and creates v-prefixed releases only through the reviewed process. This development automation is not a TestPilot product integration. No release is created in M0.

## QA version references

| QA activity      | Required identity                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| Test execution   | Tested version (or explicitly unversioned build), exact commit/build, environment, execution time    |
| Bug report       | Observed version and exact build; link execution and evidence                                        |
| Regression       | Candidate identity, prior baseline, selected regression scope                                        |
| Retest           | Original failing build and new build; append evidence rather than replacing the original observation |
| Release tracking | Released version/tag, commit/build, release notes, checklist, known issues                           |

For AI-sensitive results also record provider/model, prompt/schema revisions, and fixture/source revision. A version alone cannot reproduce a changed prompt or model. Never use an example version as if it were released. When no version exists, explicitly record that fact and identify the exact available build; do not guess a number.
