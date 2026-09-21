import type { ServerEnvironment } from "@/config/env-schema";
import { FakeAiProvider } from "../analysis/fake-ai-provider";
import { GeminiProvider } from "../analysis/gemini-provider";
import type { GenerationContext } from "./generation-context";
import {
  generateTestCasesForLayer,
  generationConfigurationFailure,
  type LayerGenerationOutcome,
} from "./test-case-generator";
import type { GenerationLayer } from "./test-case-contract";

export type TestCaseGenerator = (
  context: GenerationContext,
  layer: GenerationLayer,
  signal: AbortSignal,
) => Promise<LayerGenerationOutcome>;

export function createConfiguredGenerator(
  environment: ServerEnvironment,
): TestCaseGenerator {
  const options = {
    contextTokenLimit: environment.AI_CONTEXT_TOKEN_LIMIT,
    maxAutomaticRetries: environment.AI_MAX_AUTOMATIC_RETRIES,
  };
  if (environment.AI_TEST_MODE) {
    const provider = new FakeAiProvider();
    return (context, layer, signal) =>
      generateTestCasesForLayer(context, layer, provider, options, signal);
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
  return (context, layer, signal) =>
    generateTestCasesForLayer(context, layer, provider, options, signal);
}
