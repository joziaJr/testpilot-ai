# M2 synthetic extraction fixtures

Revision: `M2-1`. All content is invented, non-sensitive and generated locally by `generate-fixtures.mjs`; no customer document, credential or external service is used. Re-run the generator from the repository root to reproduce the binary fixtures. The generator uses Node built-ins only and fixed content/order.

| Fixture             | Purpose                                                                           | Bytes | SHA-256                                                            |
| ------------------- | --------------------------------------------------------------------------------- | ----: | ------------------------------------------------------------------ |
| `requirements.txt`  | Mixed Indonesian/English UTF-8 with CRLF and paragraphs                           |    93 | `f41fe513c7de73e58cc25e643cbcb8b6e1a46d5ad2678b6dd50aac4f708d792a` |
| `whitespace.txt`    | Valid UTF-8 with whitespace only                                                  |     8 | `1c5e67f8756ad3d2608df4617d8014becefeaa00f5d346ab355c02e0dc14f8fa` |
| `requirements.pdf`  | Two-page text PDF with ordered headings/body text                                 |   951 | `1e226b08bfc061f828e7ff6202ab85893d1a7b9d992508f6ae13e989af0ee68f` |
| `image-only.pdf`    | Valid one-page PDF with a drawn rectangle and no text; represents no-OCR handling |   582 | `8751abfd133031d8fd00d25d1c979c1cbf9854110686036c7f2966377a3442a8` |
| `malformed.pdf`     | Passes M1's outer signature/EOF check but has no valid PDF object structure       |    22 | `1a30db538894c5a0a97d8072b4480a2827b7d62d0f66b9a8c1eb526febcfe68f` |
| `requirements.docx` | OOXML heading, Indonesian paragraph, textual list item and two-row table          | 1,603 | `2e79322a8b1d29f2035d6418c12ea93be4885858e41138a1202736a2140ae33d` |
| `whitespace.docx`   | Structurally valid OOXML containing a whitespace-only paragraph                   | 1,459 | `25c52fc6ab97f2d71a0340c324040aac0bf0ad887232b9765054e55f85679f21` |
| `malformed.docx`    | Passes M1 container checks but has malformed document XML                         | 1,600 | `db1cf9dc94c55ff8add2a88acb4251f294690ae6da4dcafe07e3ada78ba914e7` |

Malformed UTF-8, UTF-8 BOM, English/Bahasa/mixed strings, line endings, normalization input and archive resource mutations are generated in memory by tests where committing another binary would add no evidence. `image-only.pdf` contains no raster image payload; its absence of text deterministically exercises the same no-readable-text/OCR-excluded decision without embedding external media.

These fixtures test extraction mechanics only. They contain no expected modules, semantic analysis output, generated cases or AI oracle.
