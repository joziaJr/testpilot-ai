import { describe, expect, it } from "vitest";
import { generationFixture } from "./generation-test-fixture";
import { generationRequestSchema, testCaseSchema } from "./test-case-contract";

const validCase = {
  testCaseId: "TP-FE-001",
  module: "PRD Upload",
  feature: "Upload",
  title: "Upload a valid PRD",
  preconditions: null,
  steps: ["Choose a valid PRD."],
  expectedResult: "The PRD is accepted.",
  priority: "Medium",
  type: "Positive",
  automation: null,
  notes: null,
};

describe("M5 generation contracts", () => {
  it("accepts the actual M3 analysis and M4 reviewed selection", () => {
    expect(generationRequestSchema.safeParse(generationFixture()).success).toBe(
      true,
    );
  });

  it.each([
    ["priority", { priority: "Critical" }],
    ["type", { type: "Security" }],
    ["ID", { testCaseId: "AI-1" }],
    ["extra field", { testData: "secret" }],
  ])("rejects an invalid %s", (_name, override) => {
    expect(
      testCaseSchema.safeParse({ ...validCase, ...override }).success,
    ).toBe(false);
  });
});
