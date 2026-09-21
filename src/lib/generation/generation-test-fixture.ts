import { validAnalysis } from "../analysis/analysis-test-fixture";
import {
  buildReviewedSelection,
  createReviewSelectionState,
  setTestingScope,
  toggleFeatureSelection,
  type TestingScope,
} from "../review/review-contract";

export function generationFixture(scope: TestingScope = "both") {
  const analysis = validAnalysis();
  analysis.validations.push({
    id: "validation-1",
    requirementIds: ["requirement-1"],
    validation: "A PRD file is required.",
    evidence: analysis.requirements[0].evidence,
  });
  let state = toggleFeatureSelection(
    analysis,
    createReviewSelectionState("analysis-1"),
    "feature-1",
    true,
  );
  state = setTestingScope(state, scope);
  const selection = buildReviewedSelection(analysis, state, "analysis-1");
  if (!selection) throw new Error("Invalid generation fixture");
  return { analysis, selection };
}
