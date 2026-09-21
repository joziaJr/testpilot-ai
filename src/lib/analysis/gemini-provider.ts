import {
  AiProviderError,
  type AiProvider,
  type ProviderAnalysisRequest,
  type ProviderAnalysisResponse,
  type ProviderGenerationRequest,
  type TestCaseGenerationProvider,
} from "./ai-provider";

export const MAX_PROVIDER_RESPONSE_BYTES = 1_000_000;
const GEMINI_API_ROOT = "https://generativelanguage.googleapis.com/v1beta";

type Fetch = typeof fetch;

function providerError(status: number) {
  if (status === 401 || status === 403)
    return new AiProviderError("configuration", false);
  if (status === 429) return new AiProviderError("rate_limited", true);
  if (status === 408 || status === 504)
    return new AiProviderError("timeout", true);
  if (status >= 500) return new AiProviderError("unavailable", true);
  return new AiProviderError("failed", false);
}

async function readBoundedJson(response: Response) {
  const declared = response.headers.get("content-length");
  if (declared && Number(declared) > MAX_PROVIDER_RESPONSE_BYTES)
    throw new AiProviderError("failed", false);
  if (!response.body) throw new AiProviderError("failed", false);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_PROVIDER_RESPONSE_BYTES) {
        await reader.cancel();
        throw new AiProviderError("failed", false);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
  } catch {
    throw new AiProviderError("failed", false);
  }
}

export class GeminiProvider implements AiProvider, TestCaseGenerationProvider {
  constructor(
    readonly model: string,
    private readonly apiKey: string,
    private readonly requestTimeoutMs: number,
    private readonly fetcher: Fetch = fetch,
  ) {}

  private async request(
    action: "countTokens" | "generateContent",
    body: object,
    signal: AbortSignal,
  ) {
    const timeout = AbortSignal.timeout(this.requestTimeoutMs);
    try {
      const response = await this.fetcher(
        `${GEMINI_API_ROOT}/models/${encodeURIComponent(this.model)}:${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.apiKey,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.any([signal, timeout]),
        },
      );
      if (!response.ok) throw providerError(response.status);
      return await readBoundedJson(response);
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (timeout.aborted) throw new AiProviderError("timeout", true);
      if (signal.aborted) throw new AiProviderError("failed", false);
      throw new AiProviderError("unavailable", true);
    }
  }

  async countTokens(content: string, signal: AbortSignal) {
    const response = (await this.request(
      "countTokens",
      { contents: [{ role: "user", parts: [{ text: content }] }] },
      signal,
    )) as { totalTokens?: unknown };
    if (
      !Number.isSafeInteger(response.totalTokens) ||
      Number(response.totalTokens) < 0
    )
      throw new AiProviderError("failed", false);
    return Number(response.totalTokens);
  }

  async generateAnalysis(
    request: ProviderAnalysisRequest,
  ): Promise<ProviderAnalysisResponse> {
    const response = (await this.request(
      "generateContent",
      {
        systemInstruction: { parts: [{ text: request.systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: request.userContent }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseJsonSchema: request.jsonSchema,
        },
      },
      request.signal,
    )) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
      usageMetadata?: {
        promptTokenCount?: unknown;
        candidatesTokenCount?: unknown;
        totalTokenCount?: unknown;
      };
    };
    const jsonText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof jsonText !== "string" || !jsonText.trim())
      throw new AiProviderError("failed", false);
    const usage = response.usageMetadata;
    const token = (value: unknown) =>
      Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : null;
    return {
      jsonText,
      usage: {
        inputTokens: token(usage?.promptTokenCount),
        outputTokens: token(usage?.candidatesTokenCount),
        totalTokens: token(usage?.totalTokenCount),
      },
    };
  }

  async generateTestCases(request: ProviderGenerationRequest) {
    return this.generateAnalysis(request);
  }
}
