import { z } from "zod";
import { prdAnalysisSchema } from "../analysis/analysis-contract";
import { reviewedSelectionSchema } from "../review/review-contract";

const text = z.string().trim().min(1).max(4_000);
const identifier = z.string().trim().min(1).max(120);
const identifiers = z
  .array(identifier)
  .max(100)
  .refine((items) => new Set(items).size === items.length, {
    message: "IDs must be unique",
  });

export const generationLayerSchema = z.enum(["frontend", "backend"]);
export type GenerationLayer = z.infer<typeof generationLayerSchema>;

export const testCaseTypeSchema = z.enum(["Positive", "Negative", "Edge"]);
export const prioritySchema = z.enum(["High", "Medium", "Low"]);
export const automationSchema = z.enum(["Yes", "No", "Candidate"]);

export const generatedCaseDraftSchema = z
  .object({
    moduleId: identifier,
    featureId: identifier,
    title: text,
    preconditions: text.nullable(),
    steps: z.array(text).min(1).max(30),
    expectedResult: text,
    type: testCaseTypeSchema,
    requirementIds: identifiers.min(1),
    businessRuleIds: identifiers,
    validationIds: identifiers,
    needConfirmationIds: identifiers,
  })
  .strict();

export const providerGenerationSchema = z
  .object({ cases: z.array(generatedCaseDraftSchema).min(1).max(300) })
  .strict();

export const testCaseSchema = z
  .object({
    testCaseId: z.string().regex(/^TP-(FE|BE)-\d{3,}$/),
    module: text,
    feature: text,
    title: text,
    preconditions: text.nullable(),
    steps: z.array(text).min(1).max(30),
    expectedResult: text,
    priority: prioritySchema,
    type: testCaseTypeSchema,
    automation: automationSchema.nullable(),
    notes: text.nullable(),
  })
  .strict();

export const traceabilitySchema = z
  .object({
    moduleId: identifier,
    featureId: identifier,
    requirementIds: identifiers.min(1),
    businessRuleIds: identifiers,
    validationIds: identifiers,
    needConfirmationIds: identifiers,
  })
  .strict();

export const generatedTestCaseRecordSchema = z
  .object({
    testCase: testCaseSchema,
    traceability: traceabilitySchema,
  })
  .strict();

export const generationResultSchema = z
  .object({
    analysisId: identifier,
    selectionFingerprint: z.string().min(1).max(100_000),
    frontend: z.array(generatedTestCaseRecordSchema).max(300),
    backend: z.array(generatedTestCaseRecordSchema).max(300),
  })
  .strict();

export const generationRequestSchema = z
  .object({
    analysis: prdAnalysisSchema,
    selection: reviewedSelectionSchema,
  })
  .strict();

export type GeneratedCaseDraft = z.infer<typeof generatedCaseDraftSchema>;
export type GeneratedTestCaseRecord = z.infer<
  typeof generatedTestCaseRecordSchema
>;
export type GenerationResult = z.infer<typeof generationResultSchema>;

export function selectionFingerprint(
  selection: z.infer<typeof reviewedSelectionSchema>,
) {
  return JSON.stringify({
    analysisId: selection.analysisId,
    selectedModuleIds: selection.selectedModuleIds,
    selectedFeatureIds: selection.selectedFeatureIds,
    testingScope: selection.testingScope,
    relatedRequirementIds: selection.relatedRequirementIds,
    relatedBusinessRuleIds: selection.relatedBusinessRuleIds,
    relatedValidationIds: selection.relatedValidationIds,
    relatedAmbiguityIds: selection.relatedAmbiguityIds,
    relatedNeedConfirmationIds: selection.relatedNeedConfirmationIds,
  });
}
