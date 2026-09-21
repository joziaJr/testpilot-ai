import {
  AiProviderError,
  type ProviderUsage,
  type TestCaseGenerationProvider,
} from "../analysis/ai-provider";
import type { GenerationContext } from "./generation-context";
import {
  generationErrorMessages,
  type GenerationErrorCode,
} from "./generation-errors";
import {
  buildGeneratorUserContent,
  generationJsonSchema,
  generatorSystemInstruction,
} from "./generator-prompt";
import {
  generatedTestCaseRecordSchema,
  providerGenerationSchema,
  type GeneratedCaseDraft,
  type GeneratedTestCaseRecord,
  type GenerationLayer,
} from "./test-case-contract";

export type GenerationAttempt = ProviderUsage & {
  action: "generate_frontend" | "generate_backend";
  attempt: number;
  model: string;
  timestamp: string;
  durationMs: number;
  outcome: "success" | "failed";
  errorCode: GenerationErrorCode | null;
};

export type LayerGenerationOutcome =
  | {
      status: "success";
      cases: GeneratedTestCaseRecord[];
      usage: GenerationAttempt[];
    }
  | {
      status: "failed";
      error: { code: GenerationErrorCode; message: string };
      usage: GenerationAttempt[];
    };

export type GeneratorOptions = {
  contextTokenLimit: number;
  maxAutomaticRetries: number;
};

const emptyUsage: ProviderUsage = {
  inputTokens: null,
  outputTokens: null,
  totalTokens: null,
};

function failure(
  code: GenerationErrorCode,
  usage: GenerationAttempt[],
): LayerGenerationOutcome {
  return {
    status: "failed",
    error: { code, message: generationErrorMessages[code] },
    usage,
  };
}

function mapProviderError(error: AiProviderError): GenerationErrorCode {
  if (error.kind === "configuration") return "GENERATION_CONFIGURATION_ERROR";
  if (error.kind === "timeout") return "GENERATION_TIMEOUT";
  if (error.kind === "rate_limited") return "GENERATION_RATE_LIMITED";
  if (error.kind === "unavailable") return "GENERATION_PROVIDER_UNAVAILABLE";
  return "GENERATION_FAILED";
}

function isGroundedDraft(
  draft: GeneratedCaseDraft,
  context: GenerationContext,
) {
  const feature = context.features.find((item) => item.id === draft.featureId);
  if (!feature || feature.moduleId !== draft.moduleId) return false;
  if (!context.modules.some((item) => item.id === draft.moduleId)) return false;

  const requirements = new Map(
    context.requirements.map((item) => [item.id, item]),
  );
  for (const id of draft.requirementIds) {
    const requirement = requirements.get(id);
    if (
      !requirement ||
      (requirement.featureId !== draft.featureId &&
        !(
          requirement.featureId === null &&
          requirement.moduleId === draft.moduleId
        ))
    )
      return false;
  }
  const referencedRequirements = new Set(draft.requirementIds);
  const linked = (
    ids: string[],
    items: Array<{ id: string; requirementIds: string[] }>,
  ) =>
    ids.every((id) => {
      const item = items.find((candidate) => candidate.id === id);
      return item?.requirementIds.some((requirementId) =>
        referencedRequirements.has(requirementId),
      );
    });
  if (!linked(draft.businessRuleIds, context.businessRules)) return false;
  if (!linked(draft.validationIds, context.validations)) return false;

  for (const id of draft.needConfirmationIds) {
    const confirmation = context.needConfirmation.find(
      (item) => item.id === id,
    );
    const ambiguity = context.ambiguities.find(
      (item) => item.id === confirmation?.ambiguityId,
    );
    if (
      !confirmation ||
      !ambiguity ||
      ambiguity.requirementId === null ||
      !referencedRequirements.has(ambiguity.requirementId)
    )
      return false;
  }
  return true;
}

function normalized(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ");
}

export function finalizeGeneratedCases(
  drafts: GeneratedCaseDraft[],
  context: GenerationContext,
  layer: GenerationLayer,
) {
  if (drafts.some((draft) => !isGroundedDraft(draft, context))) return null;
  const seen = new Set<string>();
  const unique = drafts.filter((draft) => {
    const key = [
      draft.moduleId,
      draft.featureId,
      normalized(draft.title),
      draft.type,
    ].join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const prefix = layer === "frontend" ? "TP-FE" : "TP-BE";
  return unique.map((draft, index) => {
    const moduleRecord = context.modules.find(
      (item) => item.id === draft.moduleId,
    )!;
    const feature = context.features.find(
      (item) => item.id === draft.featureId,
    )!;
    const requirementIds = new Set(draft.requirementIds);
    const relatedAmbiguityIds = new Set(
      context.ambiguities
        .filter(
          (item) =>
            item.requirementId !== null &&
            requirementIds.has(item.requirementId),
        )
        .map((item) => item.id),
    );
    const needConfirmationIds = context.needConfirmation
      .filter((item) => relatedAmbiguityIds.has(item.ambiguityId))
      .map((item) => item.id);
    const notes = needConfirmationIds.length
      ? context.documentLanguage === "indonesian"
        ? "Cakupan dibatasi oleh detail yang masih berstatus Need Confirmation."
        : "Coverage is limited by unresolved Need Confirmation details."
      : null;
    return generatedTestCaseRecordSchema.parse({
      testCase: {
        testCaseId: `${prefix}-${String(index + 1).padStart(3, "0")}`,
        module: moduleRecord.name,
        feature: feature.name,
        title: draft.title,
        preconditions: draft.preconditions,
        steps: draft.steps,
        expectedResult: draft.expectedResult,
        priority: "Medium",
        type: draft.type,
        automation: null,
        notes,
      },
      traceability: {
        moduleId: draft.moduleId,
        featureId: draft.featureId,
        requirementIds: draft.requirementIds,
        businessRuleIds: draft.businessRuleIds,
        validationIds: draft.validationIds,
        needConfirmationIds,
      },
    });
  });
}

export async function generateTestCasesForLayer(
  context: GenerationContext,
  layer: GenerationLayer,
  provider: TestCaseGenerationProvider,
  options: GeneratorOptions,
  signal: AbortSignal = new AbortController().signal,
): Promise<LayerGenerationOutcome> {
  const userContent = buildGeneratorUserContent(context, layer);
  try {
    const tokens = await provider.countTokens(userContent, signal);
    if (tokens > options.contextTokenLimit)
      return failure("GENERATION_CONTEXT_LIMIT", []);
  } catch (error) {
    if (error instanceof AiProviderError)
      return failure(mapProviderError(error), []);
    return failure("GENERATION_FAILED", []);
  }

  const usage: GenerationAttempt[] = [];
  const attempts = options.maxAutomaticRetries + 1;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const started = Date.now();
    const timestamp = new Date().toISOString();
    try {
      const response = await provider.generateTestCases({
        systemInstruction: generatorSystemInstruction,
        userContent,
        jsonSchema: generationJsonSchema,
        signal,
      });
      let parsed: unknown;
      try {
        parsed = JSON.parse(response.jsonText);
      } catch {
        parsed = null;
      }
      const validated = providerGenerationSchema.safeParse(parsed);
      const cases = validated.success
        ? finalizeGeneratedCases(validated.data.cases, context, layer)
        : null;
      if (!cases?.length) {
        usage.push({
          ...response.usage,
          action:
            layer === "frontend" ? "generate_frontend" : "generate_backend",
          attempt,
          model: provider.model,
          timestamp,
          durationMs: Date.now() - started,
          outcome: "failed",
          errorCode: "GENERATION_INVALID_RESPONSE",
        });
        if (attempt === attempts)
          return failure("GENERATION_INVALID_RESPONSE", usage);
        continue;
      }
      usage.push({
        ...response.usage,
        action: layer === "frontend" ? "generate_frontend" : "generate_backend",
        attempt,
        model: provider.model,
        timestamp,
        durationMs: Date.now() - started,
        outcome: "success",
        errorCode: null,
      });
      return { status: "success", cases, usage };
    } catch (error) {
      const providerError =
        error instanceof AiProviderError
          ? error
          : new AiProviderError("failed", false);
      const code = mapProviderError(providerError);
      usage.push({
        ...emptyUsage,
        action: layer === "frontend" ? "generate_frontend" : "generate_backend",
        attempt,
        model: provider.model,
        timestamp,
        durationMs: Date.now() - started,
        outcome: "failed",
        errorCode: code,
      });
      if (!providerError.retryable || attempt === attempts)
        return failure(code, usage);
    }
  }
  return failure("GENERATION_FAILED", usage);
}

export function generationConfigurationFailure(): LayerGenerationOutcome {
  return failure("GENERATION_CONFIGURATION_ERROR", []);
}
