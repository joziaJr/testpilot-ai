import { describe, expect, it } from "vitest";
import { validAnalysis } from "../analysis/analysis-test-fixture";
import {
  assignTestCaseIds,
  type GeneratedTestCases,
} from "./generation-contract";
import { validDraft } from "./generation-test-fixture";
import {
  deleteGeneratedTestCase,
  editGeneratedTestCase,
} from "./generation-mutations";

function resultFixture(): GeneratedTestCases {
  const analysis = validAnalysis();
  return {
    frontend: assignTestCaseIds(analysis, "frontend", [
      validDraft({ title: "First frontend case" }),
      validDraft({ title: "Second frontend case" }),
      validDraft({ title: "Third frontend case" }),
    ]),
    backend: assignTestCaseIds(analysis, "backend", [
      validDraft({ title: "First backend case" }),
    ]),
  };
}

function editable(item: GeneratedTestCases["frontend"][number]) {
  return {
    module: item.module,
    feature: item.feature,
    title: item.title,
    preconditions: item.preconditions,
    steps: item.steps,
    expectedResult: item.expectedResult,
    priority: item.priority,
    type: item.type,
    automation: item.automation,
    notes: item.notes,
  };
}

describe("generation mutations", () => {
  it("edits approved fields while preserving immutable identity and source metadata", () => {
    const current = resultFixture();
    const original = structuredClone(current.frontend[0]);
    const outcome = editGeneratedTestCase(current, "frontend", "TP-FE-001", {
      module: original.module,
      feature: original.feature,
      title: "Edited title",
      preconditions: "A workspace exists.",
      steps: ["First edited step.", "Second edited step."],
      expectedResult: "The edited behavior is observed.",
      priority: "High",
      type: "Edge",
      automation: "No",
      notes: "Reviewed manually.",
    });

    expect(outcome.success).toBe(true);
    if (!outcome.success) return;
    expect(outcome.result.frontend[0]).toMatchObject({
      testCaseId: original.testCaseId,
      source: original.source,
      title: "Edited title",
      steps: ["First edited step.", "Second edited step."],
    });
    expect(outcome.result.backend).toEqual(current.backend);
    expect(current.frontend[0]).toEqual(original);
  });

  it("accepts source-compatible labels and rejects Module or Feature mismatches atomically", () => {
    const current = resultFixture();
    const original = structuredClone(current.frontend[0]);
    const compatible = editGeneratedTestCase(current, "frontend", "TP-FE-001", {
      ...editable(original),
      title: "Compatible label edit",
    });
    const wrongModule = editGeneratedTestCase(
      current,
      "frontend",
      "TP-FE-001",
      {
        ...editable(original),
        module: "Unrelated Module",
      },
    );
    const wrongFeature = editGeneratedTestCase(
      current,
      "frontend",
      "TP-FE-001",
      {
        ...editable(original),
        feature: "Unrelated Feature",
      },
    );

    expect(compatible.success).toBe(true);
    if (compatible.success) {
      expect(compatible.result.frontend[0].module).toBe(original.module);
      expect(compatible.result.frontend[0].feature).toBe(original.feature);
      expect(compatible.result.frontend[0].source).toEqual(original.source);
    }
    for (const outcome of [wrongModule, wrongFeature])
      expect(outcome).toEqual({
        success: false,
        message:
          "Module and Feature are source-linked and cannot be changed for this test case.",
      });
    expect(current.frontend[0]).toEqual(original);
  });

  it("rejects invalid and duplicate edits without partially mutating the result", () => {
    const current = resultFixture();
    const invalid = editGeneratedTestCase(current, "frontend", "TP-FE-001", {
      ...editable(current.frontend[0]),
      title: "",
    });
    const duplicate = editGeneratedTestCase(current, "frontend", "TP-FE-001", {
      ...editable(current.frontend[0]),
      title: current.frontend[1].title,
    });
    expect(invalid.success).toBe(false);
    expect(duplicate).toEqual({
      success: false,
      message: "Another test case already has the same scenario.",
    });
    expect(current).toEqual(resultFixture());
  });

  it("deletes only the requested layer and never renumbers remaining IDs", () => {
    const current = resultFixture();
    const outcome = deleteGeneratedTestCase(current, "frontend", "TP-FE-002");
    expect(outcome.success).toBe(true);
    if (!outcome.success) return;
    expect(outcome.result.frontend.map((item) => item.testCaseId)).toEqual([
      "TP-FE-001",
      "TP-FE-003",
    ]);
    expect(outcome.result.backend).toEqual(current.backend);
  });

  it("allows deletion of the last case as a valid empty layer", () => {
    const current = resultFixture();
    const outcome = deleteGeneratedTestCase(
      { ...current, frontend: current.frontend.slice(0, 1) },
      "frontend",
      "TP-FE-001",
    );
    expect(outcome.success).toBe(true);
    if (outcome.success) expect(outcome.result.frontend).toEqual([]);
  });
});
