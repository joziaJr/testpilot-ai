# M1 synthetic fixtures

All files contain invented, non-sensitive requirements; no external service is needed. Fixture revision: M1-1. Nothing here is a real customer PRD or malicious executable.

- requirements.txt: plain UTF-8 without BOM, short upload requirement.
- requirements.pdf: deterministic one-page PDF 1.4, Helvetica text, explicit object offsets/xref/trailer.
- requirements.docx: deterministic OOXML ZIP with fixed 2026-01-01 entry timestamps, deflated content types, root relationship and Word document XML containing one paragraph.
- invalid.exe: ASCII text starting with MZ, deliberately unsupported extension; it is not executable code.

Tests derive large TXT bodies (limit minus one/exact/plus one), BOM, invalid UTF-8, fake/truncated PDF, damaged ZIP offsets, MIME changes and filename variants in memory. Large files are not committed. Browser tests use these fixtures and documented inline synthetic data. No extraction or AI expectations are asserted.

| File              | Bytes | SHA-256                                                          |
| ----------------- | ----- | ---------------------------------------------------------------- |
| invalid.exe       | 32    | fccde24e5fb014fb74446a7a73b989459c5168810ec1706a52e113c17247c7cc |
| requirements.docx | 839   | bc2bb4ad5835ad8afe7dfc260761ee921129e69d129752d76eaa8b89472859cf |
| requirements.pdf  | 606   | 190fae189cda20e4655e6d9344aa56682ec43098a44db9029807f8d3b5e33eab |
| requirements.txt  | 63    | 98b04e97b78c45b847da5a90232c994a1dea0a0afe6e00286dab37ad50fce953 |
