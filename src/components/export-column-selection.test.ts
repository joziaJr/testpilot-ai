import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExportColumnSelection } from "./export-column-selection";

describe("ExportColumnSelection", () => {
  it("renders all approved columns with the OQ-07 default selection", () => {
    const markup = renderToStaticMarkup(createElement(ExportColumnSelection));
    expect(markup).toContain("9 of 11 columns selected");
    expect(markup.match(/type="checkbox"/g)).toHaveLength(11);
    expect(markup.match(/checked=""/g)).toHaveLength(9);
    for (const label of [
      "Test Case ID",
      "Module",
      "Feature",
      "Title",
      "Preconditions",
      "Steps",
      "Expected Result",
      "Priority",
      "Type",
      "Automation",
      "Notes",
    ])
      expect(markup).toContain(label);
  });

  it("states the fixed-order and no-file M8 boundary", () => {
    const markup = renderToStaticMarkup(createElement(ExportColumnSelection));
    expect(markup).toContain("approved schema order");
    expect(markup).toContain("does not create or download a file");
    expect(markup).not.toContain("Move Up");
    expect(markup).not.toContain("Move Down");
    expect(markup).not.toContain("Export TSV");
  });
});
