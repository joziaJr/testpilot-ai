export type ProviderUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
};

export type ProviderAnalysisResponse = {
  jsonText: string;
  usage: ProviderUsage;
};

export type ProviderAnalysisRequest = {
  systemInstruction: string;
  userContent: string;
  jsonSchema: object;
  signal: AbortSignal;
};

export type ProviderGenerationRequest = ProviderAnalysisRequest;
export type ProviderGenerationResponse = ProviderAnalysisResponse;

export type ProviderErrorKind =
  "configuration" | "timeout" | "rate_limited" | "unavailable" | "failed";

export class AiProviderError extends Error {
  constructor(
    readonly kind: ProviderErrorKind,
    readonly retryable: boolean,
  ) {
    super("AI provider request failed");
    this.name = "AiProviderError";
  }
}

export interface AiProvider {
  readonly model: string;
  countTokens(content: string, signal: AbortSignal): Promise<number>;
  generateAnalysis(
    request: ProviderAnalysisRequest,
  ): Promise<ProviderAnalysisResponse>;
}

export interface TestCaseGenerationProvider extends AiProvider {
  generateTestCases(
    request: ProviderGenerationRequest,
  ): Promise<ProviderGenerationResponse>;
}
