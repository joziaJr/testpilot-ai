import { describe, expect, it } from "vitest";

import { serverEnvironmentSchema } from "./env-schema";

const validEnvironment = {
  NODE_ENV: "test",
  AI_PROVIDER: "gemini",
  AI_MODEL: "",
  AI_API_KEY: "",
  MAX_UPLOAD_SIZE_MB: "10",
  AI_MAX_AUTOMATIC_RETRIES: "1",
  AI_TIMEOUT_MS: "",
  AI_CONTEXT_TOKEN_LIMIT: "",
};

describe("serverEnvironmentSchema", () => {
  it("accepts the approved M0 defaults without requiring an AI key", () => {
    expect(serverEnvironmentSchema.parse(validEnvironment)).toEqual({
      NODE_ENV: "test",
      AI_PROVIDER: "gemini",
      AI_MODEL: undefined,
      AI_API_KEY: undefined,
      MAX_UPLOAD_SIZE_MB: 10,
      AI_MAX_AUTOMATIC_RETRIES: 1,
      AI_TIMEOUT_MS: undefined,
      AI_CONTEXT_TOKEN_LIMIT: undefined,
    });
  });

  it.each([
    ["an upload policy other than 10 MB", { MAX_UPLOAD_SIZE_MB: "11" }],
    ["more than one automatic retry", { AI_MAX_AUTOMATIC_RETRIES: "2" }],
  ])("rejects %s", (_description, overrides) => {
    expect(() =>
      serverEnvironmentSchema.parse({ ...validEnvironment, ...overrides }),
    ).toThrow();
  });
});
