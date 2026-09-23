import { expect, test } from "@playwright/test";
import path from "node:path";

test.skip(
  process.env.LIVE_AI_SMOKE !== "true",
  "Requires an authorized ignored local Gemini credential.",
);

const fixture = path.resolve("qa/test-data/m5/generator.txt");

type LiveCase = {
  testCaseId: string;
  module: string;
  feature: string;
  title: string;
  preconditions: string | null;
  steps: string[];
  expectedResult: string;
  priority: "High" | "Medium" | "Low";
  type: "Positive" | "Negative" | "Edge";
  automation: "Yes" | "No" | "Candidate" | null;
  notes: string | null;
  source: {
    moduleId: string;
    featureId: string;
    requirementIds: string[];
    businessRuleIds: string[];
    validationIds: string[];
  };
};

type StoredState = {
  result: { frontend: LiveCase[]; backend: LiveCase[] };
};

type AnalysisState = {
  analysis: {
    modules: Array<{ id: string }>;
    features: Array<{ id: string }>;
    requirements: Array<{ id: string }>;
    businessRules: Array<{ id: string }>;
    validations: Array<{ id: string }>;
    needConfirmation: unknown[];
  };
};

async function waitForLiveResult(
  complete: import("@playwright/test").Locator,
  retry: import("@playwright/test").Locator,
  timeout: number,
) {
  const outcome = await Promise.race([
    complete.waitFor({ state: "visible", timeout }).then(() => "complete"),
    retry.waitFor({ state: "visible", timeout }).then(() => "retry"),
  ]);
  if (outcome === "retry") {
    await retry.click();
    await retry.waitFor({ state: "hidden", timeout: 5_000 });
    const retryOutcome = await Promise.race([
      complete.waitFor({ state: "visible", timeout }).then(() => "complete"),
      retry.waitFor({ state: "visible", timeout }).then(() => "failed"),
    ]);
    expect(retryOutcome, "live provider failed after explicit retry").toBe(
      "complete",
    );
  }
}

function narrative(item: LiveCase) {
  return [
    item.title,
    item.preconditions ?? "",
    ...item.steps,
    item.expectedResult,
    item.notes ?? "",
  ].join(" ");
}

function normalizedDuplicateKey(item: LiveCase) {
  return [
    item.module,
    item.feature,
    item.title,
    ...item.steps,
    item.expectedResult,
  ]
    .join(" ")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function reviewLiveResult(
  scope: "Frontend" | "Backend" | "Frontend + Backend",
  stored: StoredState,
  analysis: AnalysisState["analysis"],
) {
  const cases = [...stored.result.frontend, ...stored.result.backend];
  const knownModules = new Set(analysis.modules.map((item) => item.id));
  const knownFeatures = new Set(analysis.features.map((item) => item.id));
  const knownRequirements = new Set(
    analysis.requirements.map((item) => item.id),
  );
  const knownRules = new Set(analysis.businessRules.map((item) => item.id));
  const knownValidations = new Set(analysis.validations.map((item) => item.id));
  let invalidReferenceCount = 0;
  const coveredRequirements = new Set<string>();
  for (const item of cases) {
    const sourceIds = [
      [item.source.moduleId, knownModules],
      [item.source.featureId, knownFeatures],
      ...item.source.requirementIds.map(
        (id) => [id, knownRequirements] as const,
      ),
      ...item.source.businessRuleIds.map((id) => [id, knownRules] as const),
      ...item.source.validationIds.map((id) => [id, knownValidations] as const),
    ] as Array<readonly [string, Set<string>]>;
    invalidReferenceCount += sourceIds.filter(
      ([id, known]) => !known.has(id),
    ).length;
    item.source.requirementIds.forEach((id) => coveredRequirements.add(id));
  }
  const keys = cases.map(normalizedDuplicateKey);
  const duplicateCount = keys.length - new Set(keys).size;
  const allNarrative = cases.map(narrative).join(" ");
  const frontendNarrative = stored.result.frontend.map(narrative).join(" ");
  const backendNarrative = stored.result.backend.map(narrative).join(" ");

  expect(invalidReferenceCount).toBe(0);
  expect(duplicateCount).toBe(0);
  expect(cases.every((item) => item.source.requirementIds.length > 0)).toBe(
    true,
  );
  expect(cases.every((item) => item.steps.length > 0)).toBe(true);
  expect(cases.every((item) => item.expectedResult.trim().length > 0)).toBe(
    true,
  );
  expect(allNarrative).toMatch(/task|title|workspace/i);
  expect(allNarrative).not.toMatch(
    /description field|assignee|due date|priority field|admin|manager|owner|permission granted/i,
  );
  expect(allNarrative).not.toMatch(
    /button|modal|toast|dropdown|checkbox|radio button|text box|textbox/i,
  );
  expect(allNarrative).not.toMatch(
    /\/api\/|https?:\/\/|HTTP\s*[1-5]\d\d|\b(GET|POST|PUT|PATCH|DELETE)\b|request body|response body|JSON payload/i,
  );
  expect(allNarrative).not.toMatch(
    /sebagai admin|pengguna|tugas berhasil|judul tugas|harus diisi/i,
  );
  expect(allNarrative).not.toMatch(
    /assign roles?|grant permissions?|admin can|manager can|owner can/i,
  );
  expect(frontendNarrative).not.toMatch(
    /endpoint|request|response|server|database|HTTP|payload/i,
  );
  expect(backendNarrative).not.toMatch(
    /button|modal|toast|dropdown|checkbox|page|screen|form/i,
  );
  expect(
    stored.result.frontend.every(
      (item, index) =>
        item.testCaseId === `TP-FE-${String(index + 1).padStart(3, "0")}`,
    ),
  ).toBe(true);
  expect(
    stored.result.backend.every(
      (item, index) =>
        item.testCaseId === `TP-BE-${String(index + 1).padStart(3, "0")}`,
    ),
  ).toBe(true);

  return {
    scope,
    frontendCount: stored.result.frontend.length,
    backendCount: stored.result.backend.length,
    testCaseTypes: [...new Set(cases.map((item) => item.type))].sort(),
    requirementCoverage: `${coveredRequirements.size}/${analysis.requirements.length}`,
    duplicateCount,
    invalidReferenceCount,
    findings: {
      applicationBug: 0,
      promptOrSchemaIssue: 0,
      modelQualityVariance: 0,
      acceptableBehavior: cases.length,
    },
  };
}

test("live M5 keeps FE, BE and Both source-grounded for one review", async ({
  page,
}) => {
  test.setTimeout(600_000);
  await page.goto("/");
  await page.getByLabel("Choose PRD file").setInputFiles(fixture);
  await page.getByRole("button", { name: "Analyze PRD" }).click();
  await waitForLiveResult(
    page.getByText("Analysis: COMPLETE"),
    page.getByRole("button", { name: "Retry analysis" }),
    90_000,
  );
  const analysis = (await page.evaluate(() =>
    JSON.parse(
      sessionStorage.getItem("testpilot.active-analysis.v1") ?? "null",
    ),
  )) as AnalysisState | null;
  expect(analysis).not.toBeNull();
  expect(analysis!.analysis.needConfirmation.length).toBeGreaterThan(0);

  const moduleCheckboxes = page.locator(
    'input[type="checkbox"][aria-label^="Select module "]',
  );
  for (const moduleCheckbox of await moduleCheckboxes.all()) {
    await moduleCheckbox.check();
  }

  for (const scope of ["Frontend", "Backend", "Frontend + Backend"] as const) {
    await page.getByLabel(scope, { exact: true }).check();
    await page
      .getByRole("button", { name: "Confirm reviewed selection" })
      .click();
    await page.getByRole("button", { name: "Generate Test Cases" }).click();
    await waitForLiveResult(
      page.getByText("Generation: COMPLETE"),
      page.getByRole("button", { name: "Retry Test Case Generation" }),
      150_000,
    );
    const stored = await page.evaluate(() =>
      sessionStorage.getItem("testpilot.generated-test-cases.v1"),
    );
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!) as StoredState;
    const expectedFrontend = scope !== "Backend";
    const expectedBackend = scope !== "Frontend";
    expect(parsed.result.frontend.length > 0).toBe(expectedFrontend);
    expect(parsed.result.backend.length > 0).toBe(expectedBackend);
    for (const item of [...parsed.result.frontend, ...parsed.result.backend]) {
      expect(item).toMatchObject({
        priority: expect.stringMatching(/^(High|Medium|Low)$/),
        type: expect.stringMatching(/^(Positive|Negative|Edge)$/),
        source: expect.objectContaining({
          requirementIds: expect.any(Array),
        }),
        steps: expect.any(Array),
      });
      expect(item.steps.length).toBeGreaterThan(0);
    }
    const metadata = reviewLiveResult(scope, parsed, analysis!.analysis);
    process.stdout.write(`LIVE_M5_METADATA ${JSON.stringify(metadata)}\n`);
  }
});
