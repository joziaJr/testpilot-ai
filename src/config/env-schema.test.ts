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
  AI_TEST_MODE: "false",
};

describe("serverEnvironmentSchema", () => {
  it("defaults the approved policies without requiring local environment files", () => {
    const config = serverEnvironmentSchema.parse({});
    expect(config.MAX_UPLOAD_SIZE_MB).toBe(10);
    expect(config.AI_MAX_AUTOMATIC_RETRIES).toBe(1);
    expect(config.AI_API_KEY).toBeUndefined();
    expect(config.AI_MODEL).toBe("gemini-3.5-flash");
  });
  it("accepts the approved M0 defaults without requiring an AI key", () => {
    expect(serverEnvironmentSchema.parse(validEnvironment)).toEqual({
      NODE_ENV: "test",
      AI_PROVIDER: "gemini",
      AI_MODEL: "gemini-3.5-flash",
      AI_API_KEY: undefined,
      MAX_UPLOAD_SIZE_MB: 10,
      AI_MAX_AUTOMATIC_RETRIES: 1,
      AI_TIMEOUT_MS: 60_000,
      AI_CONTEXT_TOKEN_LIMIT: 900_000,
      AI_TEST_MODE: false,
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

  it("allows the fake provider only outside production", () => {
    expect(
      serverEnvironmentSchema.parse({
        ...validEnvironment,
        AI_TEST_MODE: "true",
      }).AI_TEST_MODE,
    ).toBe(true);
    expect(() =>
      serverEnvironmentSchema.parse({
        ...validEnvironment,
        NODE_ENV: "production",
        AI_TEST_MODE: "true",
      }),
    ).toThrow("AI_TEST_MODE must be false in production");
  });
});
