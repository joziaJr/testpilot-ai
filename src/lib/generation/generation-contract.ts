import { z } from "zod";
import type { PrdAnalysis } from "../analysis/analysis-contract";
import type { ReviewedSelection } from "../review/review-contract";

const identifier = z.string().trim().min(1).max(120);
const boundedText = z.string().trim().min(1).max(4_000);
const optionalText = boundedText.nullable();
const uniqueIdentifiers = z
  .array(identifier)
  .max(100)
  .refine((items) => new Set(items).size === items.length, {
    message: "IDs must be unique",
  });

export const generationLayerSchema = z.enum(["frontend", "backend"]);
export type GenerationLayer = z.infer<typeof generationLayerSchema>;

export const generatedCaseDraftSchema = z
  .object({
    moduleId: identifier,
    featureId: identifier,
    requirementIds: uniqueIdentifiers.min(1),
    businessRuleIds: uniqueIdentifiers,
    validationIds: uniqueIdentifiers,
    title: boundedText,
    preconditions: optionalText,
    steps: z.array(boundedText).min(1).max(50),
    expectedResult: boundedText,
    priority: z.enum(["High", "Medium", "Low"]),
    type: z.enum(["Positive", "Negative", "Edge"]),
    automation: z.enum(["Yes", "No", "Candidate"]).nullable(),
    notes: optionalText,
  })
  .strict();

export const providerGenerationSchema = z
  .object({
    testCases: z.array(generatedCaseDraftSchema).max(500),
  })
  .strict();

const sourceReferencesSchema = z
  .object({
    moduleId: identifier,
    featureId: identifier,
    requirementIds: uniqueIdentifiers.min(1),
    businessRuleIds: uniqueIdentifiers,
    validationIds: uniqueIdentifiers,
  })
  .strict();

export const generatedTestCaseSchema = z
  .object({
    testCaseId: z.string().regex(/^TP-(FE|BE)-\d{3,}$/),
    module: boundedText,
    feature: boundedText,
    title: boundedText,
    preconditions: optionalText,
    steps: z.array(boundedText).min(1).max(50),
    expectedResult: boundedText,
    priority: z.enum(["High", "Medium", "Low"]),
    type: z.enum(["Positive", "Negative", "Edge"]),
    automation: z.enum(["Yes", "No", "Candidate"]).nullable(),
    notes: optionalText,
    source: sourceReferencesSchema,
  })
  .strict();

export const generatedTestCasesSchema = z
  .object({
    frontend: z.array(generatedTestCaseSchema).max(500),
    backend: z.array(generatedTestCaseSchema).max(500),
  })
  .strict();

export type GeneratedCaseDraft = z.infer<typeof generatedCaseDraftSchema>;
export type GeneratedTestCases = z.infer<typeof generatedTestCasesSchema>;

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ");
}

export function validateGeneratedLayer(
  analysis: PrdAnalysis,
  selection: ReviewedSelection,
  layer: GenerationLayer,
  drafts: GeneratedCaseDraft[],
) {
  const errors: string[] = [];
  const modules = new Map(analysis.modules.map((item) => [item.id, item]));
  const features = new Map(analysis.features.map((item) => [item.id, item]));
  const requirements = new Map(
    analysis.requirements.map((item) => [item.id, item]),
  );
  const rules = new Map(analysis.businessRules.map((item) => [item.id, item]));
  const validations = new Map(
    analysis.validations.map((item) => [item.id, item]),
  );
  const selectedModules = new Set(selection.selectedModuleIds);
  const selectedFeatures = new Set(selection.selectedFeatureIds);
  const selectedRequirements = new Set(selection.relatedRequirementIds);
  const selectedRules = new Set(selection.relatedBusinessRuleIds);
  const selectedValidations = new Set(selection.relatedValidationIds);
  const duplicateKeys = new Set<string>();

  for (const [index, draft] of drafts.entries()) {
    const label = `${layer}[${index}]`;
    const feature = features.get(draft.featureId);
    if (!modules.has(draft.moduleId) || !selectedModules.has(draft.moduleId))
      errors.push(`${label}: unselected module`);
    if (!feature || !selectedFeatures.has(draft.featureId))
      errors.push(`${label}: unselected feature`);
    else if (feature.moduleId !== draft.moduleId)
      errors.push(`${label}: wrong module/feature relationship`);

    for (const id of draft.requirementIds) {
      const requirement = requirements.get(id);
      if (!requirement || !selectedRequirements.has(id)) {
        errors.push(`${label}: unknown or unselected requirement`);
        continue;
      }
      if (
        (requirement.featureId !== null &&
          requirement.featureId !== draft.featureId) ||
        (requirement.featureId === null &&
          requirement.moduleId !== draft.moduleId)
      )
        errors.push(`${label}: requirement outside case context`);
    }
    for (const id of draft.businessRuleIds) {
      const rule = rules.get(id);
      if (!rule || !selectedRules.has(id))
        errors.push(`${label}: unknown or unselected business rule`);
      else if (
        !rule.requirementIds.some((id) => draft.requirementIds.includes(id))
      )
        errors.push(`${label}: unrelated business rule`);
    }
    for (const id of draft.validationIds) {
      const validation = validations.get(id);
      if (!validation || !selectedValidations.has(id))
        errors.push(`${label}: unknown or unselected validation`);
      else if (
        !validation.requirementIds.some((id) =>
          draft.requirementIds.includes(id),
        )
      )
        errors.push(`${label}: unrelated validation`);
    }
    const duplicateKey = [
      layer,
      draft.moduleId,
      draft.featureId,
      normalize(draft.title),
      normalize(draft.steps.join(" ")),
      normalize(draft.expectedResult),
    ].join(":");
    if (duplicateKeys.has(duplicateKey))
      errors.push(`${label}: duplicate test case`);
    duplicateKeys.add(duplicateKey);
  }
  return errors;
}

function formatId(layer: GenerationLayer, index: number) {
  return `TP-${layer === "frontend" ? "FE" : "BE"}-${String(index + 1).padStart(3, "0")}`;
}

export function assignTestCaseIds(
  analysis: PrdAnalysis,
  layer: GenerationLayer,
  drafts: GeneratedCaseDraft[],
) {
  const modules = new Map(analysis.modules.map((item) => [item.id, item.name]));
  const features = new Map(
    analysis.features.map((item) => [item.id, item.name]),
  );
  return drafts.map((draft, index) =>
    generatedTestCaseSchema.parse({
      testCaseId: formatId(layer, index),
      module: modules.get(draft.moduleId),
      feature: features.get(draft.featureId),
      title: draft.title,
      preconditions: draft.preconditions,
      steps: draft.steps,
      expectedResult: draft.expectedResult,
      priority: draft.priority,
      type: draft.type,
      automation: draft.automation,
      notes: draft.notes,
      source: {
        moduleId: draft.moduleId,
        featureId: draft.featureId,
        requirementIds: draft.requirementIds,
        businessRuleIds: draft.businessRuleIds,
        validationIds: draft.validationIds,
      },
    }),
  );
}
