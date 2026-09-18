import { describe, expect, it } from "vitest";
import { normalizeExtractedText } from "./normalize-text";

describe("normalizeExtractedText", () => {
  it("normalizes line endings, BOM, non-breaking spaces and outer whitespace", () => {
    expect(
      normalizeExtractedText(
        "\ufeff  Product\u00a0Requirements  \r\nRule one\rRule two  ",
      ),
    ).toBe("Product Requirements\nRule one\nRule two");
  });

  it("collapses excessive blank lines without flattening structure", () => {
    expect(
      normalizeExtractedText(
        "Password Requirements:\n\n\n\n- Minimum 8 characters\n- Must contain a number\n\nNext section",
      ),
    ).toBe(
      "Password Requirements:\n\n- Minimum 8 characters\n- Must contain a number\n\nNext section",
    );
  });

  it("preserves tabs used for table-derived text", () => {
    expect(
      normalizeExtractedText("Field\tRule\nPassword\tMinimum 8 characters"),
    ).toBe("Field\tRule\nPassword\tMinimum 8 characters");
  });
});
