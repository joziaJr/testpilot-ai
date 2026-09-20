import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  prdAnalysisSchema,
  validateAnalysisGrounding,
} from "./analysis-contract";
import {
  analyzerSystemInstruction,
  buildAnalyzerUserContent,
} from "./analyzer-prompt";
import { analysisSource, validAnalysis } from "./analysis-test-fixture";
import { FakeAiProvider } from "./fake-ai-provider";

const root = resolve("qa/test-data/m3");
const cases = JSON.parse(
  readFileSync(resolve(root, "evaluation-cases.json"), "utf8"),
) as Array<{ id: string; category: string; fixture: string; oracle: string }>;

const requiredCategories = [
  "module_detection",
  "feature_detection",
  "requirement_extraction",
  "business_rule_extraction",
  "validation_extraction",
  "no_invention",
  "ambiguity_detection",
  "need_confirmation",
  "indonesian_consistency",
  "english_consistency",
  "mixed_language",
  "duplicate_prevention",
  "prompt_injection",
  "system_prompt_leakage",
  "secret_request_resistance",
  "invalid_structured_output",
  "requirement_granularity_consistency",
  "ambiguity_coverage",
  "need_confirmation_coverage",
  "cross_collection_relationship",
] as const;

describe("M3 deterministic AI evaluation harness", () => {
  it("defines every required evaluation dimension with a reproducible fixture and oracle", () => {
    expect(cases.map((item) => item.category).sort()).toEqual(
      [...requiredCategories].sort(),
    );
    expect(new Set(cases.map((item) => item.id)).size).toBe(cases.length);
    for (const item of cases) {
      expect(item.oracle.length).toBeGreaterThan(10);
      expect(
        readFileSync(resolve(root, item.fixture), "utf8").length,
      ).toBeGreaterThan(0);
    }
  });

  it.each([
    ["english-prd.txt", "english"],
    ["indonesian-prd.txt", "indonesian"],
    ["mixed-prd.txt", "indonesian"],
  ] as const)(
    "applies the documented language policy to %s in the CI fake",
    async (fixture, language) => {
      const source = readFileSync(resolve(root, fixture), "utf8").trim();
      const provider = new FakeAiProvider();
      const response = await provider.generateAnalysis({
        systemInstruction: "trusted",
        userContent: buildAnalyzerUserContent(source),
        jsonSchema: {},
        signal: new AbortController().signal,
      });
      expect(
        prdAnalysisSchema.parse(JSON.parse(response.jsonText)).documentLanguage,
      ).toBe(language);
    },
  );

  it("keeps injection and secret requests inside the untrusted data envelope", () => {
    const source = readFileSync(
      resolve(root, "prompt-injection-prd.txt"),
      "utf8",
    );
    const envelope = JSON.parse(
      buildAnalyzerUserContent(source).slice(
        buildAnalyzerUserContent(source).indexOf("{"),
      ),
    );
    expect(envelope).toMatchObject({
      kind: "untrusted_prd_data",
      prdText: source,
    });
  });

  it("rejects invalid structured output deterministically", () => {
    expect(
      prdAnalysisSchema.safeParse({ documentLanguage: "english" }).success,
    ).toBe(false);
  });

  it("defines atomic requirement and enum-list evaluation rules", () => {
    const fixture = readFileSync(resolve(root, "granularity-prd.txt"), "utf8");
    expect(fixture).toContain("Email is required.");
    expect(fixture).toContain("Low, Medium, and High");
    expect(analyzerSystemInstruction).toContain("Requirements must be atomic");
    expect(analyzerSystemInstruction).toContain(
      "Do not split one logical enumerated constraint",
    );
  });

  it("accepts a grounded ambiguity-to-confirmation relationship", () => {
    const analysis = validAnalysis();
    expect(analysis.needConfirmation[0].ambiguityId).toBe(
      analysis.ambiguities[0].id,
    );
    expect(validateAnalysisGrounding(analysis, analysisSource)).toEqual([]);
  });
});
