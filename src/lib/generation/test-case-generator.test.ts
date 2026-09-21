import { describe, expect, it, vi } from "vitest";
import {
  AiProviderError,
  type ProviderGenerationResponse,
  type TestCaseGenerationProvider,
} from "../analysis/ai-provider";
import { buildGenerationContext } from "./generation-context";
import { generationFixture } from "./generation-test-fixture";
import {
  finalizeGeneratedCases,
  generateTestCasesForLayer,
} from "./test-case-generator";
import type { GeneratedCaseDraft } from "./test-case-contract";

const usage = { inputTokens: 10, outputTokens: 20, totalTokens: 30 };
const options = { contextTokenLimit: 10_000, maxAutomaticRetries: 1 };

function draft(
  overrides: Partial<GeneratedCaseDraft> = {},
): GeneratedCaseDraft {
  return {
    moduleId: "module-1",
    featureId: "feature-1",
    title: "Upload a valid PRD",
    preconditions: null,
    steps: ["Choose a documented PRD file.", "Submit the file."],
    expectedResult: "The PRD is accepted.",
    type: "Positive",
    requirementIds: ["requirement-1"],
    businessRuleIds: [],
    validationIds: ["validation-1"],
    needConfirmationIds: [],
    ...overrides,
  };
}

function provider(
  responses: Array<ProviderGenerationResponse | Error>,
  tokens = 100,
): TestCaseGenerationProvider {
  return {
    model: "fake-model",
    countTokens: vi.fn().mockResolvedValue(tokens),
    generateAnalysis: vi.fn(),
    generateTestCases: vi.fn().mockImplementation(async () => {
      const response = responses.shift();
      if (response instanceof Error) throw response;
      if (!response) throw new Error("No response");
      return response;
    }),
  };
}

describe("M5 test-case generator", () => {
  it.each([
    ["frontend", "TP-FE-001"],
    ["backend", "TP-BE-001"],
  ] as const)("assigns deterministic IDs for %s", (layer, expectedId) => {
    const { analysis, selection } = generationFixture(layer);
    const cases = finalizeGeneratedCases(
      [draft()],
      buildGenerationContext(analysis, selection),
      layer,
    );
    expect(cases?.[0].testCase).toMatchObject({
      testCaseId: expectedId,
      module: "PRD Upload",
      feature: "Upload",
      priority: "Medium",
      automation: null,
    });
  });

  it.each(["Positive", "Negative", "Edge"] as const)(
    "preserves the approved %s enum",
    (type) => {
      const { analysis, selection } = generationFixture();
      expect(
        finalizeGeneratedCases(
          [draft({ type })],
          buildGenerationContext(analysis, selection),
          "frontend",
        )?.[0].testCase.type,
      ).toBe(type);
    },
  );

  it("removes obvious duplicates without merging distinct types", () => {
    const { analysis, selection } = generationFixture();
    const cases = finalizeGeneratedCases(
      [
        draft(),
        draft({ title: "  UPLOAD a valid PRD  " }),
        draft({ type: "Edge" }),
      ],
      buildGenerationContext(analysis, selection),
      "frontend",
    );
    expect(cases).toHaveLength(2);
    expect(cases?.map((item) => item.testCase.testCaseId)).toEqual([
      "TP-FE-001",
      "TP-FE-002",
    ]);
  });

  it.each([
    ["unknown module", { moduleId: "unknown" }],
    ["unknown feature", { featureId: "unknown" }],
    ["unsupported requirement", { requirementIds: ["unknown"] }],
    ["fabricated relationship", { validationIds: ["unknown"] }],
  ])("rejects %s", (_description, overrides) => {
    const { analysis, selection } = generationFixture();
    expect(
      finalizeGeneratedCases(
        [draft(overrides as Partial<GeneratedCaseDraft>)],
        buildGenerationContext(analysis, selection),
        "frontend",
      ),
    ).toBeNull();
  });

  it("retries one invalid structured result and then succeeds", async () => {
    const { analysis, selection } = generationFixture("frontend");
    const fake = provider([
      { jsonText: "not json", usage },
      { jsonText: JSON.stringify({ cases: [draft()] }), usage },
    ]);
    const outcome = await generateTestCasesForLayer(
      buildGenerationContext(analysis, selection),
      "frontend",
      fake,
      options,
    );
    expect(outcome.status).toBe("success");
    expect(fake.generateTestCases).toHaveBeenCalledTimes(2);
  });

  it("returns a safe failure after a second invalid result", async () => {
    const { analysis, selection } = generationFixture("frontend");
    const fake = provider([
      { jsonText: "{}", usage },
      {
        jsonText: JSON.stringify({ cases: [draft({ featureId: "bad" })] }),
        usage,
      },
    ]);
    const outcome = await generateTestCasesForLayer(
      buildGenerationContext(analysis, selection),
      "frontend",
      fake,
      options,
    );
    expect(outcome).toMatchObject({
      status: "failed",
      error: { code: "GENERATION_INVALID_RESPONSE" },
    });
    expect(JSON.stringify(outcome)).not.toContain("bad");
  });

  it("applies the retry limit and safe provider error mapping", async () => {
    const { analysis, selection } = generationFixture("backend");
    const fake = provider([
      new AiProviderError("timeout", true),
      new AiProviderError("timeout", true),
    ]);
    const outcome = await generateTestCasesForLayer(
      buildGenerationContext(analysis, selection),
      "backend",
      fake,
      options,
    );
    expect(outcome).toMatchObject({
      status: "failed",
      error: { code: "GENERATION_TIMEOUT" },
    });
    expect(fake.generateTestCases).toHaveBeenCalledTimes(2);
  });

  it("rejects over-context input before provider generation", async () => {
    const { analysis, selection } = generationFixture();
    const fake = provider([], 10_001);
    const outcome = await generateTestCasesForLayer(
      buildGenerationContext(analysis, selection),
      "frontend",
      fake,
      options,
    );
    expect(outcome).toMatchObject({
      status: "failed",
      error: { code: "GENERATION_CONTEXT_LIMIT" },
    });
    expect(fake.generateTestCases).not.toHaveBeenCalled();
  });
});
