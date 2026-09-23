import { describe, expect, it } from "vitest";
import {
  assignTestCaseIds,
  generatedCaseDraftSchema,
  generatedTestCasesSchema,
  validateGeneratedLayer,
} from "./generation-contract";
import { confirmedFixture, validDraft } from "./generation-test-fixture";

describe("M5 generation contract", () => {
  it.each(["Positive", "Negative", "Edge"] as const)(
    "accepts the approved %s type",
    (type) => {
      expect(generatedCaseDraftSchema.parse(validDraft({ type })).type).toBe(
        type,
      );
    },
  );

  it("rejects unknown enums, empty steps, and duplicate references", () => {
    expect(() =>
      generatedCaseDraftSchema.parse({
        ...validDraft(),
        priority: "Critical",
      }),
    ).toThrow();
    expect(() =>
      generatedCaseDraftSchema.parse({ ...validDraft(), steps: [] }),
    ).toThrow();
    expect(() =>
      generatedCaseDraftSchema.parse({
        ...validDraft(),
        requirementIds: ["requirement-1", "requirement-1"],
      }),
    ).toThrow();
  });

  it("rejects unknown requirements and unselected features", () => {
    const { analysis, context } = confirmedFixture();
    expect(
      validateGeneratedLayer(analysis, context.selection, "frontend", [
        validDraft({ requirementIds: ["unknown"] }),
      ]),
    ).toContain("frontend[0]: unknown or unselected requirement");
    expect(
      validateGeneratedLayer(analysis, context.selection, "frontend", [
        validDraft({ featureId: "unknown" }),
      ]),
    ).toContain("frontend[0]: unselected feature");
  });

  it("rejects a wrong module/feature relationship", () => {
    const { analysis, context } = confirmedFixture();
    analysis.modules.push({
      id: "module-2",
      name: "Other",
      description: null,
      evidence: analysis.modules[0].evidence,
    });
    context.selection.selectedModuleIds.push("module-2");
    expect(
      validateGeneratedLayer(analysis, context.selection, "frontend", [
        validDraft({ moduleId: "module-2" }),
      ]),
    ).toContain("frontend[0]: wrong module/feature relationship");
  });

  it("rejects normalized duplicate scenarios but keeps distinct variants", () => {
    const { analysis, context } = confirmedFixture();
    const duplicate = validDraft({ title: "  UPLOAD   a valid prd " });
    expect(
      validateGeneratedLayer(analysis, context.selection, "frontend", [
        validDraft(),
        duplicate,
      ]),
    ).toContain("frontend[1]: duplicate test case");
    expect(
      validateGeneratedLayer(analysis, context.selection, "frontend", [
        validDraft(),
        validDraft({
          title: "Reject an empty PRD",
          steps: ["Submit an empty PRD."],
          expectedResult: "The empty PRD is rejected.",
          type: "Negative",
        }),
      ]),
    ).toEqual([]);
  });

  it("assigns deterministic independent FE and BE identifiers", () => {
    const { analysis } = confirmedFixture("both");
    const drafts = [validDraft(), validDraft({ title: "Second case" })];
    expect(
      assignTestCaseIds(analysis, "frontend", drafts).map(
        (item) => item.testCaseId,
      ),
    ).toEqual(["TP-FE-001", "TP-FE-002"]);
    expect(
      assignTestCaseIds(analysis, "backend", drafts).map(
        (item) => item.testCaseId,
      ),
    ).toEqual(["TP-BE-001", "TP-BE-002"]);
  });

  it("keeps FE-only, BE-only, and combined results separated", () => {
    const { analysis } = confirmedFixture("both");
    const frontend = assignTestCaseIds(analysis, "frontend", [validDraft()]);
    const backend = assignTestCaseIds(analysis, "backend", [validDraft()]);
    expect(generatedTestCasesSchema.parse({ frontend, backend })).toMatchObject(
      {
        frontend: [{ testCaseId: "TP-FE-001" }],
        backend: [{ testCaseId: "TP-BE-001" }],
      },
    );
  });
});
