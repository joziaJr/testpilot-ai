import type { ServerEnvironment } from "@/config/env-schema";
import { FakeAiProvider } from "../analysis/fake-ai-provider";
import { GeminiProvider } from "../analysis/gemini-provider";
import type { PrdAnalysis } from "../analysis/analysis-contract";
import type { GenerationContext } from "./generation-context";
import {
  generateTestCases,
  generationConfigurationFailure,
  type GenerationOutcome,
} from "./test-case-generator";

export type TestCaseGenerator = (
  analysis: PrdAnalysis,
  context: GenerationContext,
  signal: AbortSignal,
) => Promise<GenerationOutcome>;

export function createConfiguredGenerator(
  environment: ServerEnvironment,
): TestCaseGenerator {
  if (environment.AI_TEST_MODE) {
    const provider = new FakeAiProvider();
    return (analysis, context, signal) =>
      generateTestCases(
        analysis,
        context,
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
    return async () => generationConfigurationFailure();
  const provider = new GeminiProvider(
    environment.AI_MODEL,
    environment.AI_API_KEY,
    environment.AI_TIMEOUT_MS,
  );
  return (analysis, context, signal) =>
    generateTestCases(
      analysis,
      context,
      provider,
      {
        contextTokenLimit: environment.AI_CONTEXT_TOKEN_LIMIT,
        maxAutomaticRetries: environment.AI_MAX_AUTOMATIC_RETRIES,
      },
      signal,
    );
}
