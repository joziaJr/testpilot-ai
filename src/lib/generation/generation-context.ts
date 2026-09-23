import type { PrdAnalysis } from "../analysis/analysis-contract";
import {
  buildReviewedSelection,
  type ReviewSelectionState,
} from "../review/review-contract";

export function buildGenerationContext(
  analysis: PrdAnalysis,
  state: ReviewSelectionState,
  expectedAnalysisId: string,
) {
  if (!state.confirmed) return null;
  const selection = buildReviewedSelection(analysis, state, expectedAnalysisId);
  if (!selection) return null;
  const ids = {
    modules: new Set(selection.selectedModuleIds),
    features: new Set(selection.selectedFeatureIds),
    requirements: new Set(selection.relatedRequirementIds),
    rules: new Set(selection.relatedBusinessRuleIds),
    validations: new Set(selection.relatedValidationIds),
    ambiguities: new Set(selection.relatedAmbiguityIds),
    confirmations: new Set(selection.relatedNeedConfirmationIds),
  };
  return {
    analysisId: expectedAnalysisId,
    documentLanguage: analysis.documentLanguage,
    selection,
    modules: analysis.modules.filter((item) => ids.modules.has(item.id)),
    features: analysis.features.filter((item) => ids.features.has(item.id)),
    requirements: analysis.requirements.filter((item) =>
      ids.requirements.has(item.id),
    ),
    businessRules: analysis.businessRules.filter((item) =>
      ids.rules.has(item.id),
    ),
    validations: analysis.validations.filter((item) =>
      ids.validations.has(item.id),
    ),
    ambiguities: analysis.ambiguities.filter((item) =>
      ids.ambiguities.has(item.id),
    ),
    needConfirmation: analysis.needConfirmation.filter((item) =>
      ids.confirmations.has(item.id),
    ),
  };
}

export type GenerationContext = NonNullable<
  ReturnType<typeof buildGenerationContext>
>;
