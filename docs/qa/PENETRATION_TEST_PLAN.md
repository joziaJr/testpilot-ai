# Penetration Testing Plan

## Status and objective

Planning only. No application exists, no target has been designated, and no penetration testing has been executed. Prepare a bounded assessment of the implemented TestPilot MVP's actual upload, parsing, server, preview, session, AI, and TSV boundaries once functional. This plan does not authorize testing external services or production infrastructure.

## Entry conditions

Before execution, record the environment owner, explicit authorized targets, candidate version/commit, dates, allowed techniques, resource/request ceilings, stop conditions, contact, evidence storage, and cleanup obligations. Use an isolated owned test environment, synthetic fixtures, and test credentials if needed for infrastructure. The MVP itself has no account feature.

Document implemented server/API contracts, session storage, parser/dependency versions, provider configuration, and centralized runtime limits before execution. Apply [resolved decisions](../product/OPEN_QUESTIONS.md): 10 MB upload policy, no encrypted/image-only input, one automatic transient retry, no duplicate same-action request, no partial success, formula-literal TSV, processing/session-only content and no public uploads. Provider infrastructure is excluded; simulate provider failures where appropriate. Missing implementation/target authorization blocks execution, not this completed plan.

## Assessment sequence

1. Inventory actual entry points and trust boundaries from the implementation; do not invent endpoints or attack surfaces.
2. Review configuration, dependencies, secret handling, upload storage, and server validation.
3. Exercise file type/MIME mismatch, malformed content, controlled expansion, path handling, and approved size/resource boundaries.
4. Assess safe rendering/XSS and actual injection surfaces with inert or bounded synthetic probes.
5. Assess anonymous-session isolation, stale request context, upload privacy, request abuse, and configured rate/resource controls.
6. Assess prompt injection, instruction hijacking, disclosure attempts, and model-output handling using the synthetic AI-security corpus.
7. Assess TSV delimiter/newline/formula behavior in the agreed Excel/Sheets workflow, with harmless test content.
8. Capture observed findings; retest fixes and affected regressions on a named build; clean up test files/sessions/credentials.

Use [Security Testing Strategy](SECURITY_TESTING.md) as the coverage matrix. No exploit automation or payload library is created here. Do not perform destructive denial-of-service testing; test resource controls within the agreed isolated limits. Stop on unintended data exposure, unexpected external effects, or resource conditions outside the approved scope.

## Result and finding records

For each actual attempt record target/build, fixture/probe identifier, preconditions, steps, source/control expectation, actual observation, status, evidence, and cleanup. Leave Actual Result and Status empty for unexecuted checks. Classify observed findings by severity and priority using [Bug Report Guide](BUG_REPORT_GUIDE.md); do not infer a successful exploit from a scanner warning alone.

Keep screenshots/logs free of real secrets or confidential PRDs. Record limits of the assessment, tests skipped and why, relevant configuration changes, unresolved risks, and retest status. A pass in this assessment does not prove absence of all vulnerabilities or validate AI business-rule quality.

## Exit and release use

Assessment completion requires covered agreed scope, reproducible evidence, reviewed findings, cleanup, and retest evidence for fixes. Release acceptance follows [Release Checklist](RELEASE_CHECKLIST.md), including no known P0 blockers and explicit handling of other unresolved defects. Record the decision owner. No completion or release approval is claimed by this documentation foundation.
