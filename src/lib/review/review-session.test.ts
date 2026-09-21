import { describe, expect, it } from "vitest";
import { validAnalysis } from "../analysis/analysis-test-fixture";
import { createReviewSelectionState } from "./review-contract";
import {
  parsePersistedAnalysisSession,
  parsePersistedReviewSelection,
} from "./review-session";

describe("M4 session parsing", () => {
  it("restores valid analysis and selection data", () => {
    expect(
      parsePersistedAnalysisSession(
        JSON.stringify({
          analysisId: "analysis-1",
          file: {
            name: "requirements.txt",
            size: 100,
            type: "text/plain",
            fileType: "txt",
            characterCount: 42,
          },
          analysis: validAnalysis(),
        }),
      )?.analysisId,
    ).toBe("analysis-1");
    expect(
      parsePersistedReviewSelection(
        JSON.stringify(createReviewSelectionState("analysis-1")),
      )?.analysisId,
    ).toBe("analysis-1");
  });

  it("rejects malformed, partial, and non-JSON session data", () => {
    expect(parsePersistedAnalysisSession("not json")).toBeNull();
    expect(parsePersistedAnalysisSession(JSON.stringify({}))).toBeNull();
    expect(parsePersistedReviewSelection(JSON.stringify({}))).toBeNull();
  });
});
