import { describe, expect, it } from "vitest";
import { parsePersistedGenerationResult } from "./generation-session";

describe("M5 generation session", () => {
  it("rejects malformed and partial persisted results", () => {
    expect(parsePersistedGenerationResult("not json")).toBeNull();
    expect(parsePersistedGenerationResult(JSON.stringify({}))).toBeNull();
  });
});
