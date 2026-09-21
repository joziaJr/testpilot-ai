import type { PrdAnalysis } from "../analysis/analysis-contract";
import {
  buildReviewedSelection,
  type ReviewedSelection,
} from "../review/review-contract";

export function validateReviewedSelectionAgainstAnalysis(
  analysis: PrdAnalysis,
  selection: ReviewedSelection,
) {
  const rebuilt = buildReviewedSelection(
    analysis,
    {
      analysisId: selection.analysisId,
      selectedModuleIds: selection.selectedModuleIds,
      selectedFeatureIds: selection.selectedFeatureIds,
      testingScope: selection.testingScope,
      confirmed: true,
    },
    selection.analysisId,
  );
  return (
    rebuilt !== null && JSON.stringify(rebuilt) === JSON.stringify(selection)
  );
}

export function buildGenerationContext(
  analysis: PrdAnalysis,
  selection: ReviewedSelection,
) {
  const moduleIds = new Set(selection.selectedModuleIds);
  const featureIds = new Set(selection.selectedFeatureIds);
  const requirementIds = new Set(selection.relatedRequirementIds);
  const businessRuleIds = new Set(selection.relatedBusinessRuleIds);
  const validationIds = new Set(selection.relatedValidationIds);
  const ambiguityIds = new Set(selection.relatedAmbiguityIds);
  const confirmationIds = new Set(selection.relatedNeedConfirmationIds);
  return {
    documentLanguage: analysis.documentLanguage,
    modules: analysis.modules.filter((item) => moduleIds.has(item.id)),
    features: analysis.features.filter((item) => featureIds.has(item.id)),
    requirements: analysis.requirements.filter((item) =>
      requirementIds.has(item.id),
    ),
    businessRules: analysis.businessRules.filter((item) =>
      businessRuleIds.has(item.id),
    ),
    validations: analysis.validations.filter((item) =>
      validationIds.has(item.id),
    ),
    ambiguities: analysis.ambiguities.filter((item) =>
      ambiguityIds.has(item.id),
    ),
    needConfirmation: analysis.needConfirmation.filter((item) =>
      confirmationIds.has(item.id),
    ),
  };
}

export type GenerationContext = ReturnType<typeof buildGenerationContext>;
