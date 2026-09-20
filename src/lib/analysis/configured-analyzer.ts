import type { ServerEnvironment } from "@/config/env-schema";
import { FakeAiProvider } from "./fake-ai-provider";
import { GeminiProvider } from "./gemini-provider";
import {
  analyzePrd,
  configurationFailure,
  type AnalysisOutcome,
} from "./prd-analyzer";

export type PrdAnalyzer = (
  source: string,
  signal: AbortSignal,
) => Promise<AnalysisOutcome>;

export function createConfiguredAnalyzer(
  environment: ServerEnvironment,
): PrdAnalyzer {
  if (environment.AI_TEST_MODE) {
    const provider = new FakeAiProvider();
    return (source, signal) =>
      analyzePrd(
        source,
        provider,
        {
          contextTokenLimit: environment.AI_CONTEXT_TOKEN_LIMIT,
          maxAutomaticRetries: environment.AI_MAX_AUTOMATIC_RETRIES,
        },
        signal,
      );
  }
  if (
    environment.AI_PROVIDER !== "gemini" ||
    !environment.AI_API_KEY ||
    !environment.AI_MODEL
  )
    return async () => configurationFailure();
  const provider = new GeminiProvider(
    environment.AI_MODEL,
    environment.AI_API_KEY,
    environment.AI_TIMEOUT_MS,
  );
  return (source, signal) =>
    analyzePrd(
      source,
      provider,
      {
        contextTokenLimit: environment.AI_CONTEXT_TOKEN_LIMIT,
        maxAutomaticRetries: environment.AI_MAX_AUTOMATIC_RETRIES,
      },
      signal,
    );
}
