import { z } from "zod";
import type { PrdAnalysis } from "../analysis/analysis-contract";

const identifier = z.string().trim().min(1).max(120);
const uniqueIdentifiers = z
  .array(identifier)
  .max(500)
  .refine((items) => new Set(items).size === items.length, {
    message: "IDs must be unique",
  });

export const testingScopeSchema = z.enum(["frontend", "backend", "both"]);
export type TestingScope = z.infer<typeof testingScopeSchema>;

export const reviewSelectionStateSchema = z
  .object({
    analysisId: identifier,
    selectedModuleIds: uniqueIdentifiers,
    selectedFeatureIds: uniqueIdentifiers,
    testingScope: testingScopeSchema.nullable(),
    confirmed: z.boolean(),
  })
  .strict();

export type ReviewSelectionState = z.infer<typeof reviewSelectionStateSchema>;

export const reviewedSelectionSchema = z
  .object({
    analysisId: identifier,
    selectedModuleIds: uniqueIdentifiers.min(1),
    selectedFeatureIds: uniqueIdentifiers,
    testingScope: testingScopeSchema,
    relatedRequirementIds: uniqueIdentifiers,
    relatedBusinessRuleIds: uniqueIdentifiers,
    relatedValidationIds: uniqueIdentifiers,
    relatedAmbiguityIds: uniqueIdentifiers,
    relatedNeedConfirmationIds: uniqueIdentifiers,
    unmappedAnalysisIds: uniqueIdentifiers,
  })
  .strict();

export type ReviewedSelection = z.infer<typeof reviewedSelectionSchema>;
export type ModuleSelectionStatus = "none" | "partial" | "all";

export function createReviewSelectionState(
  analysisId: string,
): ReviewSelectionState {
  return {
    analysisId,
    selectedModuleIds: [],
    selectedFeatureIds: [],
    testingScope: null,
    confirmed: false,
  };
}

function inAnalysisOrder<T extends { id: string }>(
  items: T[],
  selected: Set<string>,
) {
  return items.filter((item) => selected.has(item.id)).map((item) => item.id);
}

export function getModuleSelectionStatus(
  analysis: PrdAnalysis,
  state: ReviewSelectionState,
  moduleId: string,
): ModuleSelectionStatus {
  const features = analysis.features.filter(
    (feature) => feature.moduleId === moduleId,
  );
  if (!features.length)
    return state.selectedModuleIds.includes(moduleId) ? "all" : "none";
  const selected = features.filter((feature) =>
    state.selectedFeatureIds.includes(feature.id),
  ).length;
  if (!selected) return "none";
  return selected === features.length ? "all" : "partial";
}

export function toggleModuleSelection(
  analysis: PrdAnalysis,
  state: ReviewSelectionState,
  moduleId: string,
  selected: boolean,
): ReviewSelectionState {
  const moduleIds = new Set(state.selectedModuleIds);
  const featureIds = new Set(state.selectedFeatureIds);
  const children = analysis.features.filter(
    (feature) => feature.moduleId === moduleId,
  );
  if (selected) {
    moduleIds.add(moduleId);
    for (const feature of children) featureIds.add(feature.id);
  } else {
    moduleIds.delete(moduleId);
    for (const feature of children) featureIds.delete(feature.id);
  }
  return {
    ...state,
    selectedModuleIds: inAnalysisOrder(analysis.modules, moduleIds),
    selectedFeatureIds: inAnalysisOrder(analysis.features, featureIds),
    confirmed: false,
  };
}

export function toggleFeatureSelection(
  analysis: PrdAnalysis,
  state: ReviewSelectionState,
  featureId: string,
  selected: boolean,
): ReviewSelectionState {
  const feature = analysis.features.find((item) => item.id === featureId);
  if (!feature) return { ...state, confirmed: false };
  const featureIds = new Set(state.selectedFeatureIds);
  if (selected) featureIds.add(featureId);
  else featureIds.delete(featureId);

  const moduleIds = new Set(state.selectedModuleIds);
  const anySelected = analysis.features.some(
    (item) => item.moduleId === feature.moduleId && featureIds.has(item.id),
  );
  if (anySelected) moduleIds.add(feature.moduleId);
  else moduleIds.delete(feature.moduleId);

  return {
    ...state,
    selectedModuleIds: inAnalysisOrder(analysis.modules, moduleIds),
    selectedFeatureIds: inAnalysisOrder(analysis.features, featureIds),
    confirmed: false,
  };
}

export function setTestingScope(
  state: ReviewSelectionState,
  testingScope: TestingScope,
): ReviewSelectionState {
  return { ...state, testingScope, confirmed: false };
}

export function validateReviewSelection(
  analysis: PrdAnalysis,
  state: ReviewSelectionState,
  expectedAnalysisId: string = state.analysisId,
) {
  const parsed = reviewSelectionStateSchema.safeParse(state);
  if (!parsed.success) return ["invalid selection state"];
  const errors: string[] = [];
  if (state.analysisId !== expectedAnalysisId)
    errors.push("stale analysis identity");

  const modules = new Map(analysis.modules.map((item) => [item.id, item]));
  const features = new Map(analysis.features.map((item) => [item.id, item]));
  for (const moduleId of state.selectedModuleIds)
    if (!modules.has(moduleId)) errors.push(`unknown module: ${moduleId}`);
  for (const featureId of state.selectedFeatureIds) {
    const feature = features.get(featureId);
    if (!feature) errors.push(`unknown feature: ${featureId}`);
    else if (!state.selectedModuleIds.includes(feature.moduleId))
      errors.push(`feature without selected module: ${featureId}`);
  }
  for (const moduleId of state.selectedModuleIds) {
    const children = analysis.features.filter(
      (feature) => feature.moduleId === moduleId,
    );
    if (
      children.length &&
      !children.some((feature) => state.selectedFeatureIds.includes(feature.id))
    )
      errors.push(`module without selected feature: ${moduleId}`);
  }
  return errors;
}

export function canConfirmReview(
  analysis: PrdAnalysis,
  state: ReviewSelectionState,
  expectedAnalysisId: string = state.analysisId,
) {
  return (
    state.selectedModuleIds.length > 0 &&
    state.testingScope !== null &&
    validateReviewSelection(analysis, state, expectedAnalysisId).length === 0
  );
}

export function confirmReviewSelection(
  analysis: PrdAnalysis,
  state: ReviewSelectionState,
  expectedAnalysisId: string = state.analysisId,
): ReviewSelectionState {
  return canConfirmReview(analysis, state, expectedAnalysisId)
    ? { ...state, confirmed: true }
    : { ...state, confirmed: false };
}

export function getUnmappedAnalysisIds(analysis: PrdAnalysis) {
  const requirements = new Map(
    analysis.requirements.map((item) => [item.id, item]),
  );
  const unmappedRequirements = analysis.requirements.filter(
    (item) => item.moduleId === null && item.featureId === null,
  );
  const unmappedRequirementIds = new Set(
    unmappedRequirements.map((item) => item.id),
  );
  const unmappedRules = analysis.businessRules.filter((item) =>
    item.requirementIds.every((id) => unmappedRequirementIds.has(id)),
  );
  const unmappedValidations = analysis.validations.filter((item) =>
    item.requirementIds.every((id) => unmappedRequirementIds.has(id)),
  );
  const unmappedAmbiguities = analysis.ambiguities.filter(
    (item) =>
      item.requirementId === null ||
      !requirements.has(item.requirementId) ||
      unmappedRequirementIds.has(item.requirementId),
  );
  const ambiguityIds = new Set(unmappedAmbiguities.map((item) => item.id));
  const unmappedConfirmations = analysis.needConfirmation.filter((item) =>
    ambiguityIds.has(item.ambiguityId),
  );
  return [
    ...unmappedRequirements,
    ...unmappedRules,
    ...unmappedValidations,
    ...unmappedAmbiguities,
    ...unmappedConfirmations,
  ].map((item) => item.id);
}

export function buildReviewedSelection(
  analysis: PrdAnalysis,
  state: ReviewSelectionState,
  expectedAnalysisId: string = state.analysisId,
): ReviewedSelection | null {
  if (!canConfirmReview(analysis, state, expectedAnalysisId)) return null;
  const selectedModules = new Set(state.selectedModuleIds);
  const selectedFeatures = new Set(state.selectedFeatureIds);
  const relatedRequirements = analysis.requirements.filter(
    (item) =>
      (item.featureId !== null && selectedFeatures.has(item.featureId)) ||
      (item.featureId === null &&
        item.moduleId !== null &&
        selectedModules.has(item.moduleId)),
  );
  const requirementIds = new Set(relatedRequirements.map((item) => item.id));
  const relatedBusinessRules = analysis.businessRules.filter((item) =>
    item.requirementIds.some((id) => requirementIds.has(id)),
  );
  const relatedValidations = analysis.validations.filter((item) =>
    item.requirementIds.some((id) => requirementIds.has(id)),
  );
  const relatedAmbiguities = analysis.ambiguities.filter(
    (item) =>
      item.requirementId !== null && requirementIds.has(item.requirementId),
  );
  const ambiguityIds = new Set(relatedAmbiguities.map((item) => item.id));
  const relatedConfirmations = analysis.needConfirmation.filter((item) =>
    ambiguityIds.has(item.ambiguityId),
  );

  return reviewedSelectionSchema.parse({
    analysisId: state.analysisId,
    selectedModuleIds: state.selectedModuleIds,
    selectedFeatureIds: state.selectedFeatureIds,
    testingScope: state.testingScope,
    relatedRequirementIds: relatedRequirements.map((item) => item.id),
    relatedBusinessRuleIds: relatedBusinessRules.map((item) => item.id),
    relatedValidationIds: relatedValidations.map((item) => item.id),
    relatedAmbiguityIds: relatedAmbiguities.map((item) => item.id),
    relatedNeedConfirmationIds: relatedConfirmations.map((item) => item.id),
    unmappedAnalysisIds: getUnmappedAnalysisIds(analysis),
  });
}
