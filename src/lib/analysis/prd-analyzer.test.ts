import { describe, expect, it, vi } from "vitest";
import {
  AiProviderError,
  type AiProvider,
  type ProviderAnalysisResponse,
} from "./ai-provider";
import { analysisSource, validAnalysis } from "./analysis-test-fixture";
import { analyzePrd } from "./prd-analyzer";

const usage = { inputTokens: 10, outputTokens: 20, totalTokens: 30 };

function provider(
  responses: Array<ProviderAnalysisResponse | Error>,
  tokens = 100,
): AiProvider {
  return {
    model: "fake-model",
    countTokens: vi.fn().mockResolvedValue(tokens),
    generateAnalysis: vi.fn().mockImplementation(async () => {
      const response = responses.shift();
      if (response instanceof Error) throw response;
      if (!response) throw new Error("No response");
      return response;
    }),
  };
}

const options = { contextTokenLimit: 1_000, maxAutomaticRetries: 1 };

describe("PRD analyzer", () => {
  it("accepts grounded structured output and preserves Need Confirmation", async () => {
    const result = await analyzePrd(
      analysisSource,
      provider([{ jsonText: JSON.stringify(validAnalysis()), usage }]),
      options,
    );
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.analysis.needConfirmation).toHaveLength(1);
      expect(result.usage[0]).toMatchObject({
        model: "fake-model",
        outcome: "success",
      });
    }
  });

  it("retries one transient provider failure and records both attempts", async () => {
    const fake = provider([
      new AiProviderError("unavailable", true),
      { jsonText: JSON.stringify(validAnalysis()), usage },
    ]);
    const result = await analyzePrd(analysisSource, fake, options);
    expect(result.status).toBe("success");
    expect(result.usage).toHaveLength(2);
    expect(result.usage.map((item) => item.outcome)).toEqual([
      "failed",
      "success",
    ]);
    expect(fake.generateAnalysis).toHaveBeenCalledTimes(2);
  });

  it("does not retry invalid JSON or schema/grounding failures", async () => {
    for (const jsonText of [
      "not json",
      JSON.stringify({ ...validAnalysis(), modules: [] }),
      JSON.stringify({
        ...validAnalysis(),
        requirements: [
          {
            ...validAnalysis().requirements[0],
            evidence: { excerpt: "fabricated", section: null },
          },
        ],
      }),
    ]) {
      const fake = provider([{ jsonText, usage }]);
      const result = await analyzePrd(analysisSource, fake, options);
      expect(result).toMatchObject({
        status: "failed",
        error: { code: "AI_INVALID_RESPONSE" },
      });
      expect(fake.generateAnalysis).toHaveBeenCalledOnce();
    }
  });

  it("returns a safe final error after the approved transient retry", async () => {
    const fake = provider([
      new AiProviderError("rate_limited", true),
      new AiProviderError("rate_limited", true),
    ]);
    const result = await analyzePrd(analysisSource, fake, options);
    expect(result).toMatchObject({
      status: "failed",
      error: {
        code: "AI_RATE_LIMITED",
        message: "AI analysis is temporarily busy. Try again later.",
      },
    });
    expect(JSON.stringify(result)).not.toContain("AI provider request failed");
    expect(fake.generateAnalysis).toHaveBeenCalledTimes(2);
  });

  it("rejects over-context input before generation", async () => {
    const fake = provider([], 1_001);
    const result = await analyzePrd(analysisSource, fake, options);
    expect(result).toMatchObject({
      status: "failed",
      error: { code: "AI_CONTEXT_LIMIT" },
    });
    expect(fake.generateAnalysis).not.toHaveBeenCalled();
  });

  it.each([
    ["configuration", "AI_CONFIGURATION_ERROR"],
    ["timeout", "AI_TIMEOUT"],
    ["unavailable", "AI_PROVIDER_UNAVAILABLE"],
    ["failed", "ANALYSIS_FAILED"],
  ] as const)("sanitizes %s provider errors", async (kind, code) => {
    const fake = provider([new AiProviderError(kind, false)]);
    const result = await analyzePrd(analysisSource, fake, options);
    expect(result).toMatchObject({ status: "failed", error: { code } });
  });
});
