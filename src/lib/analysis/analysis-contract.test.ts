import { describe, expect, it } from "vitest";
import {
  prdAnalysisSchema,
  validateAnalysisGrounding,
} from "./analysis-contract";
import { analysisSource, validAnalysis } from "./analysis-test-fixture";

describe("PRD analysis contract", () => {
  it("accepts grounded structured analysis and Need Confirmation metadata", () => {
    const result = prdAnalysisSchema.parse(validAnalysis());
    expect(result.needConfirmation[0]).toMatchObject({
      status: "need_confirmation",
      ambiguityId: "ambiguity-1",
      missingDetails: ["Which operations does manage include?"],
    });
    expect(validateAnalysisGrounding(result, analysisSource)).toEqual([]);
  });

  it("rejects an unknown Need Confirmation ambiguity reference", () => {
    const analysis = validAnalysis();
    analysis.needConfirmation[0].ambiguityId = "unknown-ambiguity";
    expect(validateAnalysisGrounding(analysis, analysisSource)).toContain(
      "unknown ambiguity reference: confirmation-1",
    );
  });

  it("rejects duplicate normalized Need Confirmation questions", () => {
    const analysis = validAnalysis();
    analysis.needConfirmation.push({
      ...analysis.needConfirmation[0],
      id: "confirmation-2",
      requirement: "  CLARIFY   user management operations.  ",
    });
    expect(validateAnalysisGrounding(analysis, analysisSource)).toContain(
      "duplicate need confirmation question: confirmation-2",
    );
  });

  it("rejects duplicate normalized ambiguities", () => {
    const analysis = validAnalysis();
    analysis.ambiguities.push({
      ...analysis.ambiguities[0],
      id: "ambiguity-2",
      sourceText: "  ADMIN can   manage users.  ",
    });
    expect(validateAnalysisGrounding(analysis, analysisSource)).toContain(
      "duplicate ambiguity: ambiguity-2",
    );
  });

  it("requires grounded evidence for ambiguity and Need Confirmation", () => {
    const analysis = validAnalysis();
    analysis.ambiguities[0].evidence.excerpt = "Fabricated ambiguity";
    analysis.needConfirmation[0].evidence.excerpt = "Fabricated question";
    expect(validateAnalysisGrounding(analysis, analysisSource)).toEqual(
      expect.arrayContaining([
        "missing evidence: ambiguity-1",
        "missing evidence: confirmation-1",
      ]),
    );
  });

  it("rejects partial, extra, and non-standard language output", () => {
    expect(() =>
      prdAnalysisSchema.parse({ documentLanguage: "mixed" }),
    ).toThrow();
    expect(() =>
      prdAnalysisSchema.parse({ ...validAnalysis(), inventedConfidence: 0.9 }),
    ).toThrow();
  });

  it("rejects fabricated evidence, duplicate facts, and broken references", () => {
    const analysis = validAnalysis();
    analysis.modules.push({
      ...analysis.modules[0],
      id: "module-2",
      evidence: { excerpt: "Not in the PRD", section: "Fake section" },
    });
    analysis.features[0].moduleId = "unknown";
    expect(validateAnalysisGrounding(analysis, analysisSource)).toEqual(
      expect.arrayContaining([
        "missing evidence: module-2",
        "duplicate fact: module-2",
        "unknown module reference: feature-1",
      ]),
    );
  });
});
