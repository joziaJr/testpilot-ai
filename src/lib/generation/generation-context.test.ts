import { describe, expect, it } from "vitest";
import {
  buildGenerationContext,
  validateReviewedSelectionAgainstAnalysis,
} from "./generation-context";
import { generationFixture } from "./generation-test-fixture";

describe("M5 generation context", () => {
  it("builds context only from the reviewed M4 selection", () => {
    const { analysis, selection } = generationFixture("frontend");
    analysis.features.push({
      id: "feature-unselected",
      moduleId: "module-1",
      name: "Unselected",
      description: null,
      evidence: analysis.features[0].evidence,
    });
    const context = buildGenerationContext(analysis, selection);
    expect(context.features.map((item) => item.id)).toEqual(["feature-1"]);
    expect(context.requirements.map((item) => item.id)).toEqual([
      "requirement-1",
    ]);
    expect(JSON.stringify(context)).not.toContain("feature-unselected");
  });

  it("rejects a selection whose derived relationships were changed", () => {
    const { analysis, selection } = generationFixture();
    expect(validateReviewedSelectionAgainstAnalysis(analysis, selection)).toBe(
      true,
    );
    expect(
      validateReviewedSelectionAgainstAnalysis(analysis, {
        ...selection,
        relatedRequirementIds: [],
      }),
    ).toBe(false);
  });
});
