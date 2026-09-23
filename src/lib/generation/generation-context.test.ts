import { describe, expect, it } from "vitest";
import { createReviewSelectionState } from "../review/review-contract";
import { buildGenerationContext } from "./generation-context";
import { confirmedFixture } from "./generation-test-fixture";

describe("M5 generation context", () => {
  it("contains only selected analysis relationships and uncertainty", () => {
    const { context } = confirmedFixture();
    expect(context).toMatchObject({
      analysisId: "analysis-1",
      documentLanguage: "english",
      modules: [{ id: "module-1" }],
      features: [{ id: "feature-1" }],
      requirements: [{ id: "requirement-1" }],
    });
    expect(context.needConfirmation).toEqual([]);
  });

  it("preserves linked unresolved confirmation as constraints", () => {
    const { analysis, selection } = confirmedFixture();
    analysis.ambiguities[0].requirementId = "requirement-1";
    const context = buildGenerationContext(analysis, selection, "analysis-1");
    expect(context?.ambiguities).toHaveLength(1);
    expect(context?.needConfirmation).toHaveLength(1);
  });

  it("rejects unconfirmed and stale selections", () => {
    const { analysis } = confirmedFixture();
    expect(
      buildGenerationContext(
        analysis,
        createReviewSelectionState("analysis-1"),
        "analysis-1",
      ),
    ).toBeNull();
    const { selection } = confirmedFixture();
    expect(
      buildGenerationContext(analysis, selection, "new-analysis"),
    ).toBeNull();
  });
});
