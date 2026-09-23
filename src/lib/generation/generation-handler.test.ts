import { expect, it, vi } from "vitest";
import type { TestCaseGenerator } from "./configured-generator";
import { handleGeneration } from "./generation-handler";
import { confirmedFixture } from "./generation-test-fixture";

function request(body: unknown) {
  return new Request("http://localhost/api/test-cases/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

it("passes only a valid confirmed M4 selection to the generator", async () => {
  const { analysis, selection } = confirmedFixture();
  const generator = vi.fn<TestCaseGenerator>().mockResolvedValue({
    status: "success",
    result: { frontend: [], backend: [] },
    usage: [],
  });
  const response = await handleGeneration(
    request({ analysisId: "analysis-1", analysis, selection }),
    generator,
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(generator).toHaveBeenCalledOnce();
  expect(generator.mock.calls[0][1]).toMatchObject({
    analysisId: "analysis-1",
    requirements: [{ id: "requirement-1" }],
  });
});

it("rejects unconfirmed and stale selections before provider invocation", async () => {
  const { analysis, selection } = confirmedFixture();
  const generator = vi.fn<TestCaseGenerator>();
  for (const invalid of [
    { ...selection, confirmed: false },
    { ...selection, analysisId: "old-analysis" },
  ]) {
    const response = await handleGeneration(
      request({ analysisId: "analysis-1", analysis, selection: invalid }),
      generator,
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      generation: {
        status: "failed",
        error: { code: "INVALID_SELECTION" },
      },
    });
  }
  expect(generator).not.toHaveBeenCalled();
});

it("rejects malformed and oversized requests safely", async () => {
  const generator = vi.fn<TestCaseGenerator>();
  const malformed = await handleGeneration(
    new Request("http://localhost/api/test-cases/generate", {
      method: "POST",
      body: "not json",
    }),
    generator,
  );
  expect(malformed.status).toBe(422);
  const oversized = await handleGeneration(
    new Request("http://localhost/api/test-cases/generate", {
      method: "POST",
      headers: { "Content-Length": "1000001" },
      body: "{}",
    }),
    generator,
  );
  expect(oversized.status).toBe(422);
  expect(generator).not.toHaveBeenCalled();
});
