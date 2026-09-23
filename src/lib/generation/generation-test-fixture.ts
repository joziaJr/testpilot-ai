import { validAnalysis } from "../analysis/analysis-test-fixture";
import {
  confirmReviewSelection,
  createReviewSelectionState,
  setTestingScope,
  toggleFeatureSelection,
  type TestingScope,
} from "../review/review-contract";
import type { GeneratedCaseDraft } from "./generation-contract";
import { buildGenerationContext } from "./generation-context";

export function confirmedFixture(scope: TestingScope = "frontend") {
  const analysis = validAnalysis();
  let selection = toggleFeatureSelection(
    analysis,
    createReviewSelectionState("analysis-1"),
    "feature-1",
    true,
  );
  selection = confirmReviewSelection(
    analysis,
    setTestingScope(selection, scope),
  );
  const context = buildGenerationContext(analysis, selection, "analysis-1");
  if (!context) throw new Error("Fixture selection must be valid");
  return { analysis, selection, context };
}

export function validDraft(
  overrides: Partial<GeneratedCaseDraft> = {},
): GeneratedCaseDraft {
  return {
    moduleId: "module-1",
    featureId: "feature-1",
    requirementIds: ["requirement-1"],
    businessRuleIds: [],
    validationIds: [],
    title: "Upload a valid PRD",
    preconditions: null,
    steps: ["Choose a supported PRD file.", "Submit the file."],
    expectedResult: "The PRD is accepted for processing.",
    priority: "Medium",
    type: "Positive",
    automation: "Candidate",
    notes: null,
    ...overrides,
  };
}
