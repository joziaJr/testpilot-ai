import { describe, expect, it, vi } from "vitest";
import type { TestCaseGenerator } from "./configured-generator";
import { handleGeneration } from "./generation-handler";
import { generationFixture } from "./generation-test-fixture";

function request(body: unknown) {
  return new Request("http://localhost/api/test-cases/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function successfulGenerator() {
  return vi
    .fn<TestCaseGenerator>()
    .mockImplementation(async (_context, layer) => ({
      status: "success",
      cases: [
        {
          testCase: {
            testCaseId: layer === "frontend" ? "TP-FE-001" : "TP-BE-001",
            module: "PRD Upload",
            feature: "Upload",
            title: "Upload a valid PRD",
            preconditions: null,
            steps: ["Choose a PRD."],
            expectedResult: "The PRD is accepted.",
            priority: "Medium",
            type: "Positive",
            automation: null,
            notes: null,
          },
          traceability: {
            moduleId: "module-1",
            featureId: "feature-1",
            requirementIds: ["requirement-1"],
            businessRuleIds: [],
            validationIds: ["validation-1"],
            needConfirmationIds: [],
          },
        },
      ],
      usage: [],
    }));
}

describe("M5 generation handler", () => {
  it.each([
    ["frontend", ["frontend"]],
    ["backend", ["backend"]],
    ["both", ["frontend", "backend"]],
  ] as const)("generates the approved %s scope", async (scope, layers) => {
    const fixture = generationFixture(scope);
    const generator = successfulGenerator();
    const response = await handleGeneration(request(fixture), generator);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(generator.mock.calls.map((call) => call[1])).toEqual(layers);
    expect(body.generation.result.frontend).toHaveLength(
      scope === "backend" ? 0 : 1,
    );
    expect(body.generation.result.backend).toHaveLength(
      scope === "frontend" ? 0 : 1,
    );
  });

  it("rejects an unreviewed or modified M4 selection", async () => {
    const fixture = generationFixture();
    const generator = successfulGenerator();
    const response = await handleGeneration(
      request({
        ...fixture,
        selection: { ...fixture.selection, relatedRequirementIds: [] },
      }),
      generator,
    );
    expect(response.status).toBe(422);
    expect(generator).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({
      generation: {
        status: "failed",
        error: { code: "GENERATION_INVALID_REQUEST" },
      },
    });
  });

  it("returns only a safe failure when a layer fails", async () => {
    const fixture = generationFixture("frontend");
    const generator = vi.fn<TestCaseGenerator>().mockResolvedValue({
      status: "failed",
      error: {
        code: "GENERATION_PROVIDER_UNAVAILABLE",
        message: "AI generation is temporarily unavailable. Try again later.",
      },
      usage: [],
    });
    const response = await handleGeneration(request(fixture), generator);
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain(
      fixture.analysis.requirements[0].statement,
    );
  });

  it("rejects an oversized request before provider work", async () => {
    const generator = successfulGenerator();
    const response = await handleGeneration(
      new Request("http://localhost/api/test-cases/generate", {
        method: "POST",
        headers: { "Content-Length": "1500001" },
        body: "{}",
      }),
      generator,
    );
    expect(response.status).toBe(413);
    expect(generator).not.toHaveBeenCalled();
  });
});
