import { describe, expect, it } from "vitest";
import { FakeAiProvider } from "../analysis/fake-ai-provider";
import { buildGenerationContext } from "./generation-context";
import { generationFixture } from "./generation-test-fixture";
import { generateTestCasesForLayer } from "./test-case-generator";

const options = { contextTokenLimit: 10_000, maxAutomaticRetries: 1 };

async function evaluate(
  layer: "frontend" | "backend",
  language: "indonesian" | "english" = "english",
) {
  const { analysis, selection } = generationFixture(
    layer === "frontend" ? "frontend" : "backend",
  );
  analysis.documentLanguage = language;
  if (language === "indonesian") {
    analysis.modules[0].name = "Unggah PRD";
    analysis.features[0].name = "Unggah Dokumen";
  }
  return generateTestCasesForLayer(
    buildGenerationContext(analysis, selection),
    layer,
    new FakeAiProvider(),
    options,
  );
}

describe("M5 deterministic generation evaluation", () => {
  it.each(["frontend", "backend"] as const)(
    "keeps %s cases grounded, atomic, clear, and layer-safe",
    async (layer) => {
      const outcome = await evaluate(layer);
      expect(outcome.status).toBe("success");
      if (outcome.status !== "success") return;
      expect(outcome.cases.map((item) => item.testCase.type)).toEqual([
        "Positive",
        "Negative",
        "Edge",
      ]);
      expect(
        outcome.cases.every(
          (item) =>
            item.testCase.module === "PRD Upload" &&
            item.testCase.feature === "Upload" &&
            item.traceability.requirementIds.includes("requirement-1") &&
            item.testCase.steps.length <= 3 &&
            !/works correctly/i.test(item.testCase.expectedResult),
        ),
      ).toBe(true);
      expect(JSON.stringify(outcome)).not.toMatch(
        /POST \/|GET \/|HTTP 4\d\d|admin permission/i,
      );
      const intents = outcome.cases.map(
        (item) =>
          `${item.testCase.feature}:${item.testCase.title.toLowerCase()}:${item.testCase.type}`,
      );
      expect(new Set(intents).size).toBe(intents.length);
    },
  );

  it("keeps Indonesian output consistent", async () => {
    const outcome = await evaluate("frontend", "indonesian");
    expect(outcome.status).toBe("success");
    if (outcome.status === "success") {
      expect(outcome.cases[0].testCase.title).toMatch(/^Verifikasi/);
      expect(outcome.cases[0].testCase.steps.join(" ")).toContain("Buka");
    }
  });

  it("follows the already-resolved dominant language for mixed documents", async () => {
    const outcome = await evaluate("frontend", "english");
    expect(outcome.status).toBe("success");
    if (outcome.status === "success")
      expect(outcome.cases[0].testCase.title).toMatch(/^Verify/);
  });

  it("preserves Need Confirmation without inventing an answer", async () => {
    const { analysis, selection } = generationFixture("frontend");
    analysis.ambiguities[0].requirementId = "requirement-1";
    const context = buildGenerationContext(analysis, {
      ...selection,
      relatedAmbiguityIds: ["ambiguity-1"],
      relatedNeedConfirmationIds: ["confirmation-1"],
    });
    const outcome = await generateTestCasesForLayer(
      context,
      "frontend",
      new FakeAiProvider(),
      options,
    );
    expect(outcome.status).toBe("success");
    if (outcome.status === "success") {
      expect(outcome.cases.every((item) => item.testCase.notes !== null)).toBe(
        true,
      );
      expect(JSON.stringify(outcome.cases)).not.toMatch(
        /delete user|invite user|admin may/i,
      );
    }
  });
});
