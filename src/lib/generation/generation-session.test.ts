import { expect, it } from "vitest";
import { assignTestCaseIds } from "./generation-contract";
import { parsePersistedGeneration } from "./generation-session";
import { confirmedFixture, validDraft } from "./generation-test-fixture";

it("restores only strict M5 session data", () => {
  const { analysis } = confirmedFixture();
  const raw = JSON.stringify({
    analysisId: "analysis-1",
    selectionKey: "selection-1",
    result: {
      frontend: assignTestCaseIds(analysis, "frontend", [validDraft()]),
      backend: [],
    },
  });
  expect(parsePersistedGeneration(raw)?.analysisId).toBe("analysis-1");
  expect(parsePersistedGeneration("not json")).toBeNull();
  expect(parsePersistedGeneration(JSON.stringify({}))).toBeNull();
});
