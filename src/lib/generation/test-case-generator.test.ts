import { describe, expect, it, vi } from "vitest";
import {
  AiProviderError,
  type AiProvider,
  type ProviderAnalysisResponse,
} from "../analysis/ai-provider";
import { confirmedFixture, validDraft } from "./generation-test-fixture";
import { generateTestCases } from "./test-case-generator";

const usage = { inputTokens: 10, outputTokens: 20, totalTokens: 30 };
const options = { contextTokenLimit: 1_000, maxAutomaticRetries: 1 };

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

function response(drafts = [validDraft()]): ProviderAnalysisResponse {
  return { jsonText: JSON.stringify({ testCases: drafts }), usage };
}

describe("M5 test-case generator", () => {
  it.each([
    ["frontend", 1, 0],
    ["backend", 0, 1],
  ] as const)("generates a validated %s-only result", async (scope, fe, be) => {
    const { analysis, context } = confirmedFixture(scope);
    const result = await generateTestCases(
      analysis,
      context,
      provider([response()]),
      options,
    );
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.result.frontend).toHaveLength(fe);
      expect(result.result.backend).toHaveLength(be);
    }
  });

  it("runs separate FE and BE actions with independent identifiers", async () => {
    const { analysis, context } = confirmedFixture("both");
    const result = await generateTestCases(
      analysis,
      context,
      provider([response(), response()]),
      options,
    );
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.result.frontend[0].testCaseId).toBe("TP-FE-001");
      expect(result.result.backend[0].testCaseId).toBe("TP-BE-001");
      expect(result.usage.map((item) => item.action)).toEqual([
        "generate_frontend",
        "generate_backend",
      ]);
    }
  });

  it("retries one transient failure and records both attempts", async () => {
    const { analysis, context } = confirmedFixture();
    const fake = provider([
      new AiProviderError("unavailable", true),
      response(),
    ]);
    const result = await generateTestCases(analysis, context, fake, options);
    expect(result.status).toBe("success");
    expect(result.usage).toHaveLength(2);
    expect(fake.generateAnalysis).toHaveBeenCalledTimes(2);
  });

  it("does not retry invalid JSON, unknown references, or duplicates", async () => {
    const { analysis, context } = confirmedFixture();
    for (const invalid of [
      { jsonText: "not json", usage },
      response([validDraft({ requirementIds: ["unknown"] })]),
      response([validDraft(), validDraft()]),
    ]) {
      const fake = provider([invalid]);
      const result = await generateTestCases(analysis, context, fake, options);
      expect(result).toMatchObject({
        status: "failed",
        error: { code: "AI_INVALID_RESPONSE" },
      });
      expect(fake.generateAnalysis).toHaveBeenCalledOnce();
    }
  });

  it("rejects over-context input before generation", async () => {
    const { analysis, context } = confirmedFixture();
    const fake = provider([], 1_001);
    const result = await generateTestCases(analysis, context, fake, options);
    expect(result).toMatchObject({
      status: "failed",
      error: { code: "AI_CONTEXT_LIMIT" },
    });
    expect(fake.generateAnalysis).not.toHaveBeenCalled();
  });

  it("returns safe provider errors after the bounded retry", async () => {
    const { analysis, context } = confirmedFixture();
    const fake = provider([
      new AiProviderError("rate_limited", true),
      new AiProviderError("rate_limited", true),
    ]);
    const result = await generateTestCases(analysis, context, fake, options);
    expect(result).toMatchObject({
      status: "failed",
      error: { code: "AI_RATE_LIMITED" },
    });
    expect(JSON.stringify(result)).not.toContain("AI provider request failed");
    expect(fake.generateAnalysis).toHaveBeenCalledTimes(2);
  });
});
