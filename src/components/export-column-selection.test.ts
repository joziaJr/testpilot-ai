import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GeneratedTestCases } from "../lib/generation/generation-contract";
import { ExportColumnSelection } from "./export-column-selection";

const result: GeneratedTestCases = {
  frontend: [
    {
      testCaseId: "TP-FE-001",
      module: "Tasks",
      feature: "Create Task",
      title: "Create a task",
      preconditions: null,
      steps: ["Open the page."],
      expectedResult: "The task is created.",
      priority: "Medium",
      type: "Positive",
      automation: "Candidate",
      notes: null,
      source: {
        moduleId: "module-1",
        featureId: "feature-1",
        requirementIds: ["requirement-1"],
        businessRuleIds: [],
        validationIds: [],
      },
    },
  ],
  backend: [],
};

function render(scope: "frontend" | "backend" | "both" = "frontend") {
  return renderToStaticMarkup(
    createElement(ExportColumnSelection, { result, testingScope: scope }),
  );
}

describe("ExportColumnSelection", () => {
  it("renders all approved columns with the OQ-07 default selection", () => {
    const markup = render();
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

  it("keeps fixed order and exposes only the scoped layer download", () => {
    const markup = render();
    expect(markup).toContain("approved schema order");
    expect(markup).not.toContain("Move Up");
    expect(markup).not.toContain("Move Down");
    expect(markup).toContain("Download Frontend TSV");
    expect(markup).not.toContain("Download Backend TSV");
  });

  it("shows separate Both actions and disables an empty layer", () => {
    const markup = render("both");
    expect(markup).toContain("Download Frontend TSV");
    expect(markup).toContain("Download Backend TSV");
    expect(markup).toContain("No test cases available to export.");
    expect(markup).toContain("disabled");
  });

  it("shows only the Backend action in Backend scope", () => {
    const markup = render("backend");
    expect(markup).not.toContain("Download Frontend TSV");
    expect(markup).toContain("Download Backend TSV");
  });
});
