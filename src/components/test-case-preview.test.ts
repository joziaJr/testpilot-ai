import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GeneratedTestCases } from "../lib/generation/generation-contract";
import {
  EditTestCasePanel,
  TestCasePreview,
  testCaseColumns,
} from "./test-case-preview";

type GeneratedCase = GeneratedTestCases["frontend"][number];

function generatedCase(
  testCaseId: string,
  overrides: Partial<GeneratedCase> = {},
): GeneratedCase {
  return {
    testCaseId,
    module: "Task Management",
    feature: "Create Task",
    title: "Create a task with documented values",
    preconditions: null,
    steps: ["Provide a task title.", "Create the task."],
    expectedResult: "The task is created in the workspace.",
    priority: "Medium",
    type: "Positive",
    automation: "Candidate",
    notes: null,
    source: {
      moduleId: "module-task-management",
      featureId: "feature-create-task",
      requirementIds: ["requirement-create-task"],
      businessRuleIds: [],
      validationIds: [],
    },
    ...overrides,
  };
}

function render(
  result: GeneratedTestCases,
  testingScope: "frontend" | "backend" | "both",
) {
  return renderToStaticMarkup(
    createElement(TestCasePreview, {
      result,
      testingScope,
      onResultChange: () => undefined,
    }),
  );
}

describe("TestCasePreview", () => {
  it("uses exactly the eleven approved columns", () => {
    expect(testCaseColumns).toEqual([
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
    ]);
  });

  it("renders FE and BE-only previews with exact IDs and stable order", () => {
    const frontend = [generatedCase("TP-FE-001"), generatedCase("TP-FE-002")];
    const backend = [generatedCase("TP-BE-001")];
    const feMarkup = render({ frontend, backend: [] }, "frontend");
    const beMarkup = render({ frontend: [], backend }, "backend");
    expect(feMarkup).toContain("Frontend (2)");
    expect(feMarkup.indexOf("TP-FE-001")).toBeLessThan(
      feMarkup.indexOf("TP-FE-002"),
    );
    expect(feMarkup).not.toContain("TP-BE-001");
    expect(beMarkup).toContain("Backend (1)");
    expect(beMarkup).toContain("TP-BE-001");
  });

  it("keeps Both layers separated behind accessible counted tabs", () => {
    const markup = render(
      {
        frontend: [generatedCase("TP-FE-001")],
        backend: [generatedCase("TP-BE-001")],
      },
      "both",
    );
    expect(markup).toContain('role="tablist"');
    expect(markup).toContain("Frontend (1)");
    expect(markup).toContain("Backend (1)");
    expect(markup).toContain("TP-FE-001");
    expect(markup).not.toContain("TP-BE-001");
  });

  it("renders ordered steps, long optional content and placeholders without mutation", () => {
    const longText = "Long review content ".repeat(80).trim();
    const item = generatedCase("TP-FE-001", {
      preconditions: longText,
      steps: ["First exact step", "Second exact step"],
      expectedResult: longText,
      automation: null,
      notes: "Exact optional note",
    });
    const before = structuredClone(item);
    const markup = render({ frontend: [item], backend: [] }, "frontend");
    expect(markup).toContain("<ol");
    expect(markup.indexOf("First exact step")).toBeLessThan(
      markup.indexOf("Second exact step"),
    );
    expect(markup).toContain(longText);
    expect(markup).toContain("Exact optional note");
    expect(markup).toContain(">-</td>");
    expect(item).toEqual(before);
  });

  it("shows valid empty states for either selected layer", () => {
    expect(render({ frontend: [], backend: [] }, "frontend")).toContain(
      "No Frontend test cases were generated",
    );
    expect(render({ frontend: [], backend: [] }, "backend")).toContain(
      "No Backend test cases were generated",
    );
  });

  it("escapes hostile generated strings as inert text", () => {
    const hostile = "<script>globalThis.previewPwned = true</script>";
    const markup = render(
      {
        frontend: [generatedCase("TP-FE-001", { title: hostile })],
        backend: [],
      },
      "frontend",
    );
    expect(markup).toContain(
      "&lt;script&gt;globalThis.previewPwned = true&lt;/script&gt;",
    );
    expect(markup).not.toContain("<script>");
  });

  it("exposes scoped manual edit and delete controls without changing columns", () => {
    const markup = render(
      { frontend: [generatedCase("TP-FE-001")], backend: [] },
      "frontend",
    );
    expect(markup).toContain("M7 manual review");
    expect(markup).toContain("Edit TP-FE-001");
    expect(markup).toContain("Delete TP-FE-001");
    expect(markup).toContain("do not call AI");
    expect(testCaseColumns).toHaveLength(11);
  });

  it("prefills source-linked Module and Feature as read-only", () => {
    const item = generatedCase("TP-FE-001");
    const markup = renderToStaticMarkup(
      createElement(EditTestCasePanel, {
        item,
        onCancel: () => undefined,
        onSave: () => null,
      }),
    );
    expect(markup).toContain("Module (source-linked, read-only)");
    expect(markup).toContain("Feature (source-linked, read-only)");
    expect(markup).toContain('value="Task Management"');
    expect(markup).toContain('value="Create Task"');
    expect(markup.match(/readonly/gi) ?? []).toHaveLength(2);
  });
});
