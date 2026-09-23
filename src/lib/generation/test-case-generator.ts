import type { AiProvider, ProviderUsage } from "../analysis/ai-provider";
import { AiProviderError } from "../analysis/ai-provider";
import type { PrdAnalysis } from "../analysis/analysis-contract";
import {
  assignTestCaseIds,
  generatedTestCasesSchema,
  providerGenerationSchema,
  validateGeneratedLayer,
  type GeneratedTestCases,
  type GenerationLayer,
} from "./generation-contract";
import type { GenerationContext } from "./generation-context";
import {
  generationJsonSchema,
  generatorSystemInstruction,
  buildGeneratorUserContent,
} from "./generation-prompt";
import {
  generationErrorMessages,
  type GenerationErrorCode,
} from "./generation-errors";

export type GenerationAttempt = ProviderUsage & {
  action: "generate_frontend" | "generate_backend";
  attempt: number;
  model: string;
  timestamp: string;
  durationMs: number;
  outcome: "success" | "failed";
  errorCode: GenerationErrorCode | null;
};

export type GenerationOutcome =
  | {
      status: "success";
      result: GeneratedTestCases;
      usage: GenerationAttempt[];
    }
  | {
      status: "failed";
      error: { code: GenerationErrorCode; message: string };
      usage: GenerationAttempt[];
    };

type GenerationFailure = Extract<GenerationOutcome, { status: "failed" }>;
type LayerGeneration =
  | {
      drafts: ReturnType<typeof providerGenerationSchema.parse>["testCases"];
      usage: GenerationAttempt[];
    }
  | { outcome: GenerationFailure; usage: GenerationAttempt[] };

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
): GenerationFailure {
  return {
    status: "failed",
    error: { code, message: generationErrorMessages[code] },
    usage,
  };
}

function mapProviderError(error: AiProviderError): GenerationErrorCode {
  if (error.kind === "configuration") return "AI_CONFIGURATION_ERROR";
  if (error.kind === "timeout") return "AI_TIMEOUT";
  if (error.kind === "rate_limited") return "AI_RATE_LIMITED";
  if (error.kind === "unavailable") return "AI_PROVIDER_UNAVAILABLE";
  return "GENERATION_FAILED";
}

async function generateLayer(
  analysis: PrdAnalysis,
  context: GenerationContext,
  layer: GenerationLayer,
  provider: AiProvider,
  options: GeneratorOptions,
  signal: AbortSignal,
): Promise<LayerGeneration> {
  const usage: GenerationAttempt[] = [];
  const userContent = buildGeneratorUserContent(context, layer);
  try {
    const tokens = await provider.countTokens(userContent, signal);
    if (tokens > options.contextTokenLimit)
      return { outcome: failure("AI_CONTEXT_LIMIT", usage), usage } as const;
  } catch (error) {
    const providerError =
      error instanceof AiProviderError
        ? error
        : new AiProviderError("failed", false);
    return {
      outcome: failure(mapProviderError(providerError), usage),
      usage,
    } as const;
  }

  const attempts = options.maxAutomaticRetries + 1;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const timestamp = new Date().toISOString();
    const started = Date.now();
    try {
      const response = await provider.generateAnalysis({
        systemInstruction: generatorSystemInstruction,
        userContent,
        jsonSchema: generationJsonSchema,
        signal,
      });
      let json: unknown;
      try {
        json = JSON.parse(response.jsonText);
      } catch {
        json = null;
      }
      const parsed = providerGenerationSchema.safeParse(json);
      if (
        !parsed.success ||
        validateGeneratedLayer(
          analysis,
          context.selection,
          layer,
          parsed.data.testCases,
        ).length
      ) {
        usage.push({
          ...response.usage,
          action:
            layer === "frontend" ? "generate_frontend" : "generate_backend",
          attempt,
          model: provider.model,
          timestamp,
          durationMs: Date.now() - started,
          outcome: "failed",
          errorCode: "AI_INVALID_RESPONSE",
        });
        return {
          outcome: failure("AI_INVALID_RESPONSE", usage),
          usage,
        } as const;
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
      return { drafts: parsed.data.testCases, usage } as const;
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
        return { outcome: failure(code, usage), usage } as const;
    }
  }
  return {
    outcome: failure("GENERATION_FAILED", usage),
    usage,
  } as const;
}

export async function generateTestCases(
  analysis: PrdAnalysis,
  context: GenerationContext,
  provider: AiProvider,
  options: GeneratorOptions,
  signal: AbortSignal = new AbortController().signal,
): Promise<GenerationOutcome> {
  const layers: GenerationLayer[] =
    context.selection.testingScope === "both"
      ? ["frontend", "backend"]
      : [context.selection.testingScope];
  const drafts = { frontend: [], backend: [] } as Record<
    GenerationLayer,
    ReturnType<typeof providerGenerationSchema.parse>["testCases"]
  >;
  const usage: GenerationAttempt[] = [];
  for (const layer of layers) {
    const generated = await generateLayer(
      analysis,
      context,
      layer,
      provider,
      options,
      signal,
    );
    usage.push(...generated.usage);
    if ("outcome" in generated)
      return failure(generated.outcome.error.code, usage);
    drafts[layer] = generated.drafts;
  }
  return {
    status: "success",
    result: generatedTestCasesSchema.parse({
      frontend: assignTestCaseIds(analysis, "frontend", drafts.frontend),
      backend: assignTestCaseIds(analysis, "backend", drafts.backend),
    }),
    usage,
  };
}

export function generationConfigurationFailure(): GenerationOutcome {
  return failure("AI_CONFIGURATION_ERROR", []);
}
