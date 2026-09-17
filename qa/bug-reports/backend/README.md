# Backend observed defects

Store only observed backend defects here. There are no bug reports at the foundation stage; this README is not a defect record. Follow [Bug Report Guide](../../../docs/qa/BUG_REPORT_GUIDE.md) for every required field, severity/priority definitions, lifecycle, and retest evidence.

Use stable layer-identifying bug IDs, such as a `BUG-BE-` prefix, and a matching filename. This convention does not allocate an actual Bug ID. Link the observed version/build, environment, source-backed expectation, related [case](../../test-cases/backend/README.md), and [execution](../../test-execution/backend/README.md).

Record reproducible steps, the actual result, and sanitized evidence. Mark suspected causes as hypotheses. For cross-layer failures, keep one primary report and link related evidence instead of creating fictional duplicate defects. Preserve original observations and append fixing-build/retest evidence.

Unspecified product behavior belongs in [Open Questions](../../../docs/product/OPEN_QUESTIONS.md) until there is an approved expected result. Do not create bugs from imagined failures or close them without an actual retest. These repository records do not add the out-of-scope bug reporting application module.
