import { z } from "zod";

const boundedText = z.string().trim().min(1).max(4_000);
const identifier = z.string().trim().min(1).max(120);

export const sourceEvidenceSchema = z
  .object({
    excerpt: z.string().trim().min(1).max(1_000),
    section: z.string().trim().min(1).max(300).nullable(),
  })
  .strict();

const moduleSchema = z
  .object({
    id: identifier,
    name: boundedText,
    description: boundedText.nullable(),
    evidence: sourceEvidenceSchema,
  })
  .strict();

const featureSchema = z
  .object({
    id: identifier,
    moduleId: identifier,
    name: boundedText,
    description: boundedText.nullable(),
    evidence: sourceEvidenceSchema,
  })
  .strict();

const requirementSchema = z
  .object({
    id: identifier,
    moduleId: identifier.nullable(),
    featureId: identifier.nullable(),
    statement: boundedText,
    evidence: sourceEvidenceSchema,
  })
  .strict();

const linkedFactShape = {
  id: identifier,
  requirementIds: z.array(identifier).min(1).max(100),
  evidence: sourceEvidenceSchema,
};

export const prdAnalysisSchema = z
  .object({
    documentLanguage: z.enum(["indonesian", "english"]),
    modules: z.array(moduleSchema).max(100),
    features: z.array(featureSchema).max(200),
    requirements: z.array(requirementSchema).max(500),
    businessRules: z
      .array(z.object({ ...linkedFactShape, rule: boundedText }).strict())
      .max(500),
    validations: z
      .array(z.object({ ...linkedFactShape, validation: boundedText }).strict())
      .max(500),
    ambiguities: z
      .array(
        z
          .object({
            id: identifier,
            requirementId: identifier.nullable(),
            sourceText: boundedText,
            reason: boundedText,
            evidence: sourceEvidenceSchema,
          })
          .strict(),
      )
      .max(300),
    needConfirmation: z
      .array(
        z
          .object({
            id: identifier,
            status: z.literal("need_confirmation"),
            ambiguityId: identifier,
            requirement: boundedText,
            reason: boundedText,
            missingDetails: z.array(boundedText).min(1).max(20),
            evidence: sourceEvidenceSchema,
          })
          .strict(),
      )
      .max(300),
  })
  .strict();

export type PrdAnalysis = z.infer<typeof prdAnalysisSchema>;

function normalizeFact(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ");
}

const collectionKeys = [
  "modules",
  "features",
  "requirements",
  "businessRules",
  "validations",
  "ambiguities",
  "needConfirmation",
] as const;

export function validateAnalysisGrounding(
  analysis: PrdAnalysis,
  source: string,
): string[] {
  const errors: string[] = [];
  const allIds = new Set<string>();
  const normalizedFacts = new Set<string>();
  const moduleIds = new Set(analysis.modules.map((item) => item.id));
  const featureIds = new Set(analysis.features.map((item) => item.id));
  const requirementIds = new Set(analysis.requirements.map((item) => item.id));

  for (const key of collectionKeys) {
    for (const item of analysis[key]) {
      if (allIds.has(item.id)) errors.push(`duplicate id: ${item.id}`);
      allIds.add(item.id);
      if (!source.includes(item.evidence.excerpt))
        errors.push(`missing evidence: ${item.id}`);
      const fact =
        "name" in item
          ? item.name
          : "statement" in item
            ? item.statement
            : "rule" in item
              ? item.rule
              : "validation" in item
                ? item.validation
                : "sourceText" in item
                  ? item.sourceText
                  : item.requirement;
      const normalized = `${key}:${normalizeFact(fact)}`;
      if (normalizedFacts.has(normalized)) {
        if (key === "ambiguities")
          errors.push(`duplicate ambiguity: ${item.id}`);
        else if (key === "needConfirmation")
          errors.push(`duplicate need confirmation question: ${item.id}`);
        else errors.push(`duplicate fact: ${item.id}`);
      }
      normalizedFacts.add(normalized);
    }
  }

  for (const feature of analysis.features)
    if (!moduleIds.has(feature.moduleId))
      errors.push(`unknown module reference: ${feature.id}`);
  for (const requirement of analysis.requirements) {
    if (requirement.moduleId && !moduleIds.has(requirement.moduleId))
      errors.push(`unknown module reference: ${requirement.id}`);
    if (requirement.featureId && !featureIds.has(requirement.featureId))
      errors.push(`unknown feature reference: ${requirement.id}`);
  }
  for (const item of [...analysis.businessRules, ...analysis.validations])
    for (const requirementId of item.requirementIds)
      if (!requirementIds.has(requirementId))
        errors.push(`unknown requirement reference: ${item.id}`);
  for (const ambiguity of analysis.ambiguities)
    if (ambiguity.requirementId && !requirementIds.has(ambiguity.requirementId))
      errors.push(`unknown requirement reference: ${ambiguity.id}`);
  const ambiguityIds = new Set(analysis.ambiguities.map((item) => item.id));
  for (const confirmation of analysis.needConfirmation)
    if (!ambiguityIds.has(confirmation.ambiguityId))
      errors.push(`unknown ambiguity reference: ${confirmation.id}`);

  return errors;
}
