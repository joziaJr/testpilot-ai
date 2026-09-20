import {
  analysisErrorMessages,
  type AnalysisErrorCode,
} from "./analysis-errors";
import {
  prdAnalysisSchema,
  validateAnalysisGrounding,
  type PrdAnalysis,
} from "./analysis-contract";
import {
  analysisJsonSchema,
  analyzerSystemInstruction,
  buildAnalyzerUserContent,
} from "./analyzer-prompt";
import {
  AiProviderError,
  type AiProvider,
  type ProviderUsage,
} from "./ai-provider";

export type AnalysisAttempt = ProviderUsage & {
  action: "prd_analysis";
  attempt: number;
  model: string;
  timestamp: string;
  durationMs: number;
  outcome: "success" | "failed";
  errorCode: AnalysisErrorCode | null;
};

export type AnalysisOutcome =
  | {
      status: "success";
      analysis: PrdAnalysis;
      usage: AnalysisAttempt[];
    }
  | {
      status: "failed";
      error: { code: AnalysisErrorCode; message: string };
      usage: AnalysisAttempt[];
    };

export type AnalyzerOptions = {
  contextTokenLimit: number;
  maxAutomaticRetries: number;
};

const emptyUsage: ProviderUsage = {
  inputTokens: null,
  outputTokens: null,
  totalTokens: null,
};

function failure(
  code: AnalysisErrorCode,
  usage: AnalysisAttempt[],
): AnalysisOutcome {
  return {
    status: "failed",
    error: { code, message: analysisErrorMessages[code] },
    usage,
  };
}

function mapProviderError(error: AiProviderError): AnalysisErrorCode {
  if (error.kind === "configuration") return "AI_CONFIGURATION_ERROR";
  if (error.kind === "timeout") return "AI_TIMEOUT";
  if (error.kind === "rate_limited") return "AI_RATE_LIMITED";
  if (error.kind === "unavailable") return "AI_PROVIDER_UNAVAILABLE";
  return "ANALYSIS_FAILED";
}

export async function analyzePrd(
  source: string,
  provider: AiProvider,
  options: AnalyzerOptions,
  signal: AbortSignal = new AbortController().signal,
): Promise<AnalysisOutcome> {
  const userContent = buildAnalyzerUserContent(source);
  try {
    const tokens = await provider.countTokens(userContent, signal);
    if (tokens > options.contextTokenLimit)
      return failure("AI_CONTEXT_LIMIT", []);
  } catch (error) {
    if (error instanceof AiProviderError)
      return failure(mapProviderError(error), []);
    return failure("ANALYSIS_FAILED", []);
  }

  const usage: AnalysisAttempt[] = [];
  const attempts = options.maxAutomaticRetries + 1;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const started = Date.now();
    const timestamp = new Date().toISOString();
    try {
      const response = await provider.generateAnalysis({
        systemInstruction: analyzerSystemInstruction,
        userContent,
        jsonSchema: analysisJsonSchema,
        signal,
      });
      let parsed: unknown;
      try {
        parsed = JSON.parse(response.jsonText);
      } catch {
        usage.push({
          ...response.usage,
          action: "prd_analysis",
          attempt,
          model: provider.model,
          timestamp,
          durationMs: Date.now() - started,
          outcome: "failed",
          errorCode: "AI_INVALID_RESPONSE",
        });
        return failure("AI_INVALID_RESPONSE", usage);
      }
      const validated = prdAnalysisSchema.safeParse(parsed);
      if (
        !validated.success ||
        validateAnalysisGrounding(validated.data, source).length
      ) {
        usage.push({
          ...response.usage,
          action: "prd_analysis",
          attempt,
          model: provider.model,
          timestamp,
          durationMs: Date.now() - started,
          outcome: "failed",
          errorCode: "AI_INVALID_RESPONSE",
        });
        return failure("AI_INVALID_RESPONSE", usage);
      }
      usage.push({
        ...response.usage,
        action: "prd_analysis",
        attempt,
        model: provider.model,
        timestamp,
        durationMs: Date.now() - started,
        outcome: "success",
        errorCode: null,
      });
      return { status: "success", analysis: validated.data, usage };
    } catch (error) {
      const providerError =
        error instanceof AiProviderError
          ? error
          : new AiProviderError("failed", false);
      const code = mapProviderError(providerError);
      usage.push({
        ...emptyUsage,
        action: "prd_analysis",
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
  return failure("ANALYSIS_FAILED", usage);
}

export function configurationFailure(): AnalysisOutcome {
  return failure("AI_CONFIGURATION_ERROR", []);
}
