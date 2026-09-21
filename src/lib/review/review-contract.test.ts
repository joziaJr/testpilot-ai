import { describe, expect, it } from "vitest";
import { validAnalysis } from "../analysis/analysis-test-fixture";
import {
  buildReviewedSelection,
  canConfirmReview,
  confirmReviewSelection,
  createReviewSelectionState,
  getModuleSelectionStatus,
  getUnmappedAnalysisIds,
  reviewedSelectionSchema,
  setTestingScope,
  toggleFeatureSelection,
  toggleModuleSelection,
  validateReviewSelection,
} from "./review-contract";

function analysisWithTwoFeatures() {
  const analysis = validAnalysis();
  analysis.features.push({
    id: "feature-2",
    moduleId: "module-1",
    name: "Review",
    description: null,
    evidence: analysis.features[0].evidence,
  });
  analysis.requirements.push({
    id: "requirement-2",
    moduleId: "module-1",
    featureId: "feature-2",
    statement: "Admin can manage users.",
    evidence: analysis.ambiguities[0].evidence,
  });
  analysis.ambiguities[0].requirementId = "requirement-2";
  return analysis;
}

describe("M4 review contract", () => {
  it("selects and clears every child feature with its module", () => {
    const analysis = analysisWithTwoFeatures();
    const initial = createReviewSelectionState("analysis-1");
    const selected = toggleModuleSelection(analysis, initial, "module-1", true);
    expect(selected.selectedModuleIds).toEqual(["module-1"]);
    expect(selected.selectedFeatureIds).toEqual(["feature-1", "feature-2"]);
    expect(getModuleSelectionStatus(analysis, selected, "module-1")).toBe(
      "all",
    );
    expect(
      toggleModuleSelection(analysis, selected, "module-1", false),
    ).toMatchObject({ selectedModuleIds: [], selectedFeatureIds: [] });
  });

  it("represents partial module selection deterministically", () => {
    const analysis = analysisWithTwoFeatures();
    const state = toggleFeatureSelection(
      analysis,
      createReviewSelectionState("analysis-1"),
      "feature-1",
      true,
    );
    expect(state.selectedModuleIds).toEqual(["module-1"]);
    expect(state.selectedFeatureIds).toEqual(["feature-1"]);
    expect(getModuleSelectionStatus(analysis, state, "module-1")).toBe(
      "partial",
    );
  });

  it("requires a valid selection and one testing scope", () => {
    const analysis = analysisWithTwoFeatures();
    let state = createReviewSelectionState("analysis-1");
    expect(canConfirmReview(analysis, state)).toBe(false);
    state = toggleFeatureSelection(analysis, state, "feature-1", true);
    expect(canConfirmReview(analysis, state)).toBe(false);
    state = setTestingScope(state, "frontend");
    expect(canConfirmReview(analysis, state)).toBe(true);
    expect(confirmReviewSelection(analysis, state).confirmed).toBe(true);
  });

  it("invalidates confirmation when feature or scope changes", () => {
    const analysis = analysisWithTwoFeatures();
    let state = toggleModuleSelection(
      analysis,
      createReviewSelectionState("analysis-1"),
      "module-1",
      true,
    );
    state = confirmReviewSelection(analysis, setTestingScope(state, "backend"));
    expect(state.confirmed).toBe(true);
    expect(setTestingScope(state, "both").confirmed).toBe(false);
    expect(
      toggleFeatureSelection(analysis, state, "feature-2", false).confirmed,
    ).toBe(false);
  });

  it("rejects stale analysis identity and unknown selections", () => {
    const analysis = analysisWithTwoFeatures();
    const state = {
      ...createReviewSelectionState("old-analysis"),
      selectedModuleIds: ["unknown-module"],
      selectedFeatureIds: ["unknown-feature"],
      testingScope: "both" as const,
    };
    expect(validateReviewSelection(analysis, state, "new-analysis")).toEqual(
      expect.arrayContaining([
        "stale analysis identity",
        "unknown module: unknown-module",
        "unknown feature: unknown-feature",
      ]),
    );
    expect(buildReviewedSelection(analysis, state, "new-analysis")).toBeNull();
  });

  it("derives only selected analysis relationships", () => {
    const analysis = analysisWithTwoFeatures();
    let state = toggleFeatureSelection(
      analysis,
      createReviewSelectionState("analysis-1"),
      "feature-2",
      true,
    );
    state = setTestingScope(state, "both");
    const contract = buildReviewedSelection(analysis, state);
    expect(contract).toMatchObject({
      selectedModuleIds: ["module-1"],
      selectedFeatureIds: ["feature-2"],
      testingScope: "both",
      relatedRequirementIds: ["requirement-2"],
      relatedAmbiguityIds: ["ambiguity-1"],
      relatedNeedConfirmationIds: ["confirmation-1"],
    });
    expect(() => reviewedSelectionSchema.parse(contract)).not.toThrow();
  });

  it("keeps safely unmapped analysis visible without fabricating a parent", () => {
    const analysis = analysisWithTwoFeatures();
    analysis.requirements.push({
      id: "requirement-general",
      moduleId: null,
      featureId: null,
      statement: "Admin can manage users.",
      evidence: analysis.ambiguities[0].evidence,
    });
    analysis.ambiguities.push({
      id: "ambiguity-general",
      requirementId: null,
      sourceText: "Admin can manage users.",
      reason: "The operations are unspecified.",
      evidence: analysis.ambiguities[0].evidence,
    });
    analysis.needConfirmation.push({
      id: "confirmation-general",
      ambiguityId: "ambiguity-general",
      status: "need_confirmation",
      requirement: "Which operations are allowed?",
      reason: "The operations are unspecified.",
      missingDetails: ["Allowed operations"],
      evidence: analysis.ambiguities[0].evidence,
    });
    expect(getUnmappedAnalysisIds(analysis)).toEqual([
      "requirement-general",
      "ambiguity-general",
      "confirmation-general",
    ]);
  });

  it("supports a selected standalone module with no feature", () => {
    const analysis = validAnalysis();
    analysis.features = [];
    analysis.requirements[0].featureId = null;
    let state = toggleModuleSelection(
      analysis,
      createReviewSelectionState("analysis-1"),
      "module-1",
      true,
    );
    state = setTestingScope(state, "backend");
    expect(getModuleSelectionStatus(analysis, state, "module-1")).toBe("all");
    expect(canConfirmReview(analysis, state)).toBe(true);
    expect(
      buildReviewedSelection(analysis, state)?.relatedRequirementIds,
    ).toEqual(["requirement-1"]);
  });

  it("creates a deterministic reset state", () => {
    expect(createReviewSelectionState("analysis-new")).toEqual({
      analysisId: "analysis-new",
      selectedModuleIds: [],
      selectedFeatureIds: [],
      testingScope: null,
      confirmed: false,
    });
  });
});
