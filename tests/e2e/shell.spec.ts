import { expect, test } from "@playwright/test";
import path from "node:path";
const fixture = (name: string) => path.resolve("qa/test-data/m1", name);
const extractionFixture = (name: string) =>
  path.resolve("qa/test-data/m2", name);
const reviewFixture = path.resolve("qa/test-data/m4/review.txt");

test("upload interface is accessible on a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page).toHaveTitle("TestPilot AI");
  await expect(
    page.getByRole("heading", { name: "Upload your PRD" }),
  ).toBeVisible();
  await expect(page.getByText("PDF, DOCX, or TXT · Up to 10 MB")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
for (const ext of ["pdf", "docx", "txt"]) {
  test(`accepts ${ext} via file picker and removes it`, async ({ page }) => {
    await page.goto("/");
    const chooser = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: "Choose file", exact: true })
      .click();
    await (await chooser).setFiles(fixture(`requirements.${ext}`));
    await expect(
      page.getByText("File accepted", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(`requirements.${ext}`, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Extraction: COMPLETE/)).toBeVisible();
    await page.getByRole("button", { name: "Remove file" }).click();
    await expect(page.getByText("File accepted", { exact: true })).toHaveCount(
      0,
    );
  });
}
test("rejects invalid input, recovers, and preserves the previous file on failed replacement", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByLabel("Choose PRD file");
  await input.setInputFiles(fixture("invalid.exe"));
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Unsupported file format",
  );
  await input.setInputFiles(fixture("requirements.txt"));
  await expect(page.getByText("File accepted", { exact: true })).toBeVisible();
  await input.setInputFiles({
    name: "fake.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("not a PDF"),
  });
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "File cannot be read",
  );
  await expect(
    page.getByText("requirements.txt", { exact: true }),
  ).toBeVisible();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Replace file" }).click();
  await (await chooser).setFiles(fixture("requirements.docx"));
  await expect(
    page.getByText("requirements.docx", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});
test("supports drop and rejects multiple dropped files", async ({ page }) => {
  await page.goto("/");
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(
      new File(["Synthetic PRD"], "My.prd.TXT", { type: "text/plain" }),
    );
    return data;
  });
  await page
    .getByTestId("drop-zone")
    .dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.getByText("File accepted", { exact: true })).toBeVisible();
  await transfer.evaluate((data) =>
    data.items.add(new File(["another"], "other.txt", { type: "text/plain" })),
  );
  await page
    .getByTestId("drop-zone")
    .dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Choose one PRD file",
  );
});
test("renders hostile filenames as text", async ({ page }) => {
  await page.goto("/");
  const name = "<img src=x onerror=alert(1)>.txt";
  await page.getByLabel("Choose PRD file").setInputFiles({
    name,
    mimeType: "text/plain",
    buffer: Buffer.from("PRD"),
  });
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  await expect(page.locator("img")).toHaveCount(0);
});
test("shows validation success separately from unreadable extraction and recovers", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByLabel("Choose PRD file");
  await input.setInputFiles(extractionFixture("image-only.pdf"));
  await expect(
    page.getByText("Validation: PASS", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Extraction: FAILED — No readable text found.",
  );
  await input.setInputFiles(extractionFixture("requirements.txt"));
  await expect(page.getByText(/Extraction: COMPLETE/)).toBeVisible();
  await expect(
    page.getByText("requirements.txt", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove file" }).click();
  await expect(page.getByText("Validation: PASS", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText(/Extraction:/)).toHaveCount(0);
});
test("a removed selection cannot be restored by a late replacement response", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Choose PRD file")
    .setInputFiles(fixture("requirements.txt"));
  await expect(page.getByText("File accepted", { exact: true })).toBeVisible();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started!: () => void;
  const intercepted = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route("**/api/uploads/validate", async (route) => {
    const response = await route.fetch();
    started();
    await gate;
    await route.fulfill({ response });
  });
  await page
    .getByLabel("Choose PRD file")
    .setInputFiles(fixture("requirements.pdf"));
  await intercepted;
  await page.getByRole("button", { name: "Remove file" }).click();
  release();
  await page.unrouteAll({ behavior: "wait" });
  await expect(page.getByText("File accepted", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});
test("a removed selection cannot be restored by a late extraction response", async ({
  page,
}) => {
  await page.goto("/");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started!: () => void;
  const intercepted = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route("**/api/documents/extract", async (route) => {
    const response = await route.fetch();
    started();
    await gate;
    await route.fulfill({ response });
  });
  await page
    .getByLabel("Choose PRD file")
    .setInputFiles(extractionFixture("requirements.pdf"));
  await intercepted;
  await expect(
    page.getByText("Extraction: IN PROGRESS", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove file" }).click();
  release();
  await page.unrouteAll({ behavior: "wait" });
  await expect(page.getByText("File accepted", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Extraction:/)).toHaveCount(0);
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});

test("analyzes an extracted PRD and shows a structured summary", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Choose PRD file")
    .setInputFiles(extractionFixture("requirements.txt"));
  await expect(
    page.getByText("Analysis: READY", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Analyze PRD" }).click();
  await expect(
    page.getByText("Analysis: IN PROGRESS", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Analysis: COMPLETE", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/1 modules · 1 features · 1 requirements/),
  ).toBeVisible();
});

test("recovers from a safe AI failure and clears analysis on replacement", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Choose PRD file")
    .setInputFiles(extractionFixture("requirements.txt"));
  await page.route("**/api/documents/analyze", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        validation: { status: "passed" },
        extraction: {
          status: "success",
          fileName: "requirements.txt",
          fileType: "txt",
          characterCount: 89,
        },
        analysis: {
          status: "failed",
          error: {
            code: "AI_PROVIDER_UNAVAILABLE",
            message: "private provider detail must be ignored",
          },
          usage: [],
        },
      }),
    });
  });
  await page.getByRole("button", { name: "Analyze PRD" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "AI analysis is temporarily unavailable",
  );
  await expect(page.getByRole("main")).not.toContainText(
    "private provider detail",
  );
  await page.unroute("**/api/documents/analyze");
  await page.getByRole("button", { name: "Retry analysis" }).click();
  await expect(
    page.getByText("Analysis: COMPLETE", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Choose PRD file")
    .setInputFiles(fixture("requirements.txt"));
  await expect(
    page.getByText("Analysis: READY", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Analysis: COMPLETE", { exact: true }),
  ).toHaveCount(0);
});

test("a removed selection cannot be restored by a late analysis response", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Choose PRD file")
    .setInputFiles(extractionFixture("requirements.txt"));
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started!: () => void;
  const intercepted = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route("**/api/documents/analyze", async (route) => {
    const response = await route.fetch();
    started();
    await gate;
    await route.fulfill({ response });
  });
  await page.getByRole("button", { name: "Analyze PRD" }).click();
  await intercepted;
  await page.getByRole("button", { name: "Remove file" }).click();
  release();
  await page.unrouteAll({ behavior: "wait" });
  await expect(page.getByText(/Analysis:/)).toHaveCount(0);
  await expect(page.getByText("File accepted", { exact: true })).toHaveCount(0);
});

test("reviews linked M3 analysis with module, feature, and scope selection", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Choose PRD file").setInputFiles(reviewFixture);
  await page.getByRole("button", { name: "Analyze PRD" }).click();

  await expect(
    page.getByRole("heading", { name: "Review AI analysis" }),
  ).toBeVisible();
  await expect(
    page.getByText("Task Management", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Create Task", { exact: true })).toBeVisible();
  await expect(page.getByText("Delete Task", { exact: true })).toBeVisible();
  await expect(
    page.getByText("1 need confirmation", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("1 business rules detected", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("1 validations detected", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("2 features", { exact: true })).toBeVisible();
  await expect(
    page.getByText("2 requirements detected", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("1 requirement", { exact: true })).toHaveCount(2);
  await expect(
    page.getByText("Which task management operations may an admin perform?", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Linked ambiguity: ambiguity-admin-management", {
      exact: true,
    }),
  ).toBeVisible();

  const moduleSelection = page.getByLabel("Select module Task Management");
  await moduleSelection.check();
  await expect(page.getByLabel("Create Task")).toBeChecked();
  await expect(page.getByLabel("Delete Task")).toBeChecked();
  await page.getByLabel("Delete Task").uncheck();
  await expect(moduleSelection).not.toBeChecked();
  await expect(moduleSelection).toHaveJSProperty("indeterminate", true);

  for (const scope of ["Frontend", "Backend", "Frontend + Backend"]) {
    await page.getByLabel(scope, { exact: true }).check();
    await expect(page.getByLabel(scope, { exact: true })).toBeChecked();
  }
  await page
    .getByRole("button", { name: "Confirm reviewed selection" })
    .click();
  await expect(page.getByText("Ready for Test Case Generation")).toBeVisible();

  await page.getByLabel("Create Task").uncheck();
  await expect(page.getByText("Ready for Test Case Generation")).toHaveCount(0);
});

test("restores a confirmed review on refresh and invalidates it on reanalysis", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Choose PRD file").setInputFiles(reviewFixture);
  await page.getByRole("button", { name: "Analyze PRD" }).click();
  await page.getByLabel("Create Task").check();
  await page.getByLabel("Frontend + Backend", { exact: true }).check();
  await page
    .getByRole("button", { name: "Confirm reviewed selection" })
    .click();
  await expect(page.getByText("Ready for Test Case Generation")).toBeVisible();

  await page.reload();
  await expect(
    page.getByText("Analysis: COMPLETE", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Create Task")).toBeChecked();
  await expect(page.getByText("Ready for Test Case Generation")).toBeVisible();
  await expect(
    page.getByText(/Review restored for this browser session/),
  ).toBeVisible();

  await page.getByLabel("Choose PRD file").setInputFiles(reviewFixture);
  await expect(
    page.getByText("Analysis: READY", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("testpilot.review-selection.v1"),
    ),
  ).toBeNull();
  await page.getByRole("button", { name: "Analyze PRD" }).click();
  await expect(page.getByLabel("Create Task")).not.toBeChecked();
  await expect(page.getByText("Ready for Test Case Generation")).toHaveCount(0);
});

test("removing the active document clears persisted analysis and review", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Choose PRD file").setInputFiles(reviewFixture);
  await page.getByRole("button", { name: "Analyze PRD" }).click();
  await page.getByLabel("Create Task").check();
  await page.getByLabel("Backend", { exact: true }).check();
  await page
    .getByRole("button", { name: "Confirm reviewed selection" })
    .click();
  await page.getByRole("button", { name: "Remove file" }).click();

  await expect(
    page.getByRole("heading", { name: "Review AI analysis" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => ({
      analysis: sessionStorage.getItem("testpilot.active-analysis.v1"),
      review: sessionStorage.getItem("testpilot.review-selection.v1"),
    })),
  ).toEqual({ analysis: null, review: null });
});

test("supports keyboard selection without narrow viewport overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByLabel("Choose PRD file").setInputFiles(reviewFixture);
  await page.getByRole("button", { name: "Analyze PRD" }).click();

  const moduleSelection = page.getByLabel("Select module Task Management");
  await moduleSelection.focus();
  await page.keyboard.press("Space");
  await expect(page.getByLabel("Create Task")).toBeChecked();
  const frontendScope = page.getByLabel("Frontend", { exact: true });
  await frontendScope.focus();
  await page.keyboard.press("Space");
  await expect(frontendScope).toBeChecked();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

async function prepareGeneration(
  page: import("@playwright/test").Page,
  scope: "Frontend" | "Backend" | "Frontend + Backend",
) {
  await page.goto("/");
  await page.getByLabel("Choose PRD file").setInputFiles(reviewFixture);
  await page.getByRole("button", { name: "Analyze PRD" }).click();
  await page.getByLabel("Create Task").check();
  await page.getByLabel(scope, { exact: true }).check();
  await page
    .getByRole("button", { name: "Confirm reviewed selection" })
    .click();
}

test("generates frontend cases only from a confirmed M4 selection", async ({
  page,
}) => {
  await prepareGeneration(page, "Frontend");
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  await expect(page.getByText("Generation: IN PROGRESS")).toBeVisible();
  await expect(page.getByText("Generation: COMPLETE")).toBeVisible();
  await expect(page.getByText("Frontend test cases: 3")).toBeVisible();
  await expect(page.getByText("Backend test cases: 0")).toBeVisible();
  const preview = page.getByRole("region", { name: "Generated Test Cases" });
  await expect(preview).toBeVisible();
  await expect(preview).toContainText("TP-FE-001");
  await expect(preview).toContainText("TP-FE-002");
  await expect(preview).toContainText("TP-FE-003");
  for (const column of [
    "Test Case ID",
    "Module",
    "Feature",
    "Title",
    "Preconditions",
    "Steps",
    "Expected Result",
    "Priority",
    "Type",
    "Automation",
    "Notes",
  ]) {
    await expect(
      preview.getByRole("columnheader", { name: column, exact: true }),
    ).toBeVisible();
  }
  await expect(preview.locator("ol > li").first()).toContainText(
    "Perform the documented behavior",
  );

  await page.getByLabel("Create Task").uncheck();
  await expect(page.getByText("Generation: COMPLETE")).toHaveCount(0);
  await expect(preview).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("testpilot.generated-test-cases.v1"),
    ),
  ).toBeNull();
});

test("generates backend cases without inventing an API contract", async ({
  page,
}) => {
  await prepareGeneration(page, "Backend");
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  await expect(page.getByText("Generation: COMPLETE")).toBeVisible();
  await expect(page.getByText("Frontend test cases: 0")).toBeVisible();
  await expect(page.getByText("Backend test cases: 3")).toBeVisible();
  const preview = page.getByRole("region", { name: "Generated Test Cases" });
  await expect(preview).toContainText("TP-BE-001");
  await expect(preview).not.toContainText("TP-FE-001");
  const stored = await page.evaluate(() =>
    sessionStorage.getItem("testpilot.generated-test-cases.v1"),
  );
  expect(stored).not.toContain("/api/");
  expect(stored).not.toMatch(/HTTP (200|400|401|403|404|500)/);
  await page.getByLabel("Frontend", { exact: true }).check();
  await expect(preview).toHaveCount(0);
});

test("keeps FE and BE results separate and restores their counts", async ({
  page,
}) => {
  let generationRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/test-cases/generate"))
      generationRequests++;
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await prepareGeneration(page, "Frontend + Backend");
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  await expect(page.getByText("Generation: COMPLETE")).toBeVisible();
  await expect(page.getByText("Frontend test cases: 3")).toBeVisible();
  await expect(page.getByText("Backend test cases: 3")).toBeVisible();
  const preview = page.getByRole("region", { name: "Generated Test Cases" });
  const frontendTab = preview.getByRole("tab", { name: "Frontend (3)" });
  const backendTab = preview.getByRole("tab", { name: "Backend (3)" });
  await expect(frontendTab).toHaveAttribute("aria-selected", "true");
  await expect(preview).toContainText("TP-FE-001");
  await expect(preview).not.toContainText("TP-BE-001");
  const requestsAfterGeneration = generationRequests;
  await backendTab.click();
  await expect(backendTab).toHaveAttribute("aria-selected", "true");
  await expect(preview).toContainText("TP-BE-001");
  await expect(preview).not.toContainText("TP-FE-001");
  await backendTab.press("ArrowLeft");
  await expect(frontendTab).toBeFocused();
  await expect(preview).toContainText("TP-FE-001");
  expect(generationRequests).toBe(requestsAfterGeneration);
  await page.reload();
  await expect(page.getByText("Generation: COMPLETE")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Generated Test Cases" }),
  ).toContainText("TP-FE-001");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Remove file" }).click();
  await expect(
    page.getByRole("region", { name: "Generated Test Cases" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("testpilot.generated-test-cases.v1"),
    ),
  ).toBeNull();
});

test("confirms PRD replacement when generated cases would be cleared", async ({
  page,
}) => {
  await prepareGeneration(page, "Frontend");
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  await expect(page.getByText("Generation: COMPLETE")).toBeVisible();

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe(
      "Replace this PRD and clear its generated test cases?",
    );
    await dialog.dismiss();
  });
  await page.getByLabel("Choose PRD file").setInputFiles(reviewFixture);
  await expect(page.getByText("Generation: COMPLETE")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Generated Test Cases" }),
  ).toBeVisible();

  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await page.getByLabel("Choose PRD file").setInputFiles(reviewFixture);
  await expect(
    page.getByText("Analysis: READY", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Generation: COMPLETE")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Generated Test Cases" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("testpilot.generated-test-cases.v1"),
    ),
  ).toBeNull();
});

test("shows a safe generation error and supports explicit retry", async ({
  page,
}) => {
  await prepareGeneration(page, "Frontend");
  await page.route("**/api/test-cases/generate", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        generation: {
          status: "failed",
          error: {
            code: "AI_PROVIDER_UNAVAILABLE",
            message: "private provider detail",
          },
          usage: [],
        },
      }),
    });
  });
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "AI generation is temporarily unavailable",
  );
  await expect(page.getByRole("main")).not.toContainText(
    "private provider detail",
  );
  await page.unroute("**/api/test-cases/generate");
  await page
    .getByRole("button", { name: "Retry Test Case Generation" })
    .click();
  await expect(page.getByText("Generation: COMPLETE")).toBeVisible();
});

test("shows a valid empty Backend layer without placeholder cases", async ({
  page,
}) => {
  await prepareGeneration(page, "Frontend + Backend");
  await page.route("**/api/test-cases/generate", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.generation.result.backend = [];
    await route.fulfill({ response, json: body });
  });
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  await expect(page.getByText("Generation: COMPLETE")).toBeVisible();
  const preview = page.getByRole("region", { name: "Generated Test Cases" });
  await preview.getByRole("tab", { name: "Backend (0)" }).click();
  await expect(preview).toContainText(
    "No Backend test cases were generated from the selected documented requirements.",
  );
  await expect(preview).not.toContainText("TP-BE-");
});

test("renders hostile generated preview content as inert text", async ({
  page,
}) => {
  const hostile = "<script>window.__previewPwned = true</script>";
  await prepareGeneration(page, "Frontend");
  await page.route("**/api/test-cases/generate", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.generation.result.frontend[0].title = hostile;
    await route.fulfill({ response, json: body });
  });
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  const preview = page.getByRole("region", { name: "Generated Test Cases" });
  await expect(preview.getByText(hostile, { exact: true })).toBeVisible();
  await expect(preview.locator("script")).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { __previewPwned?: boolean }).__previewPwned,
    ),
  ).toBeUndefined();
});

test("edits, validates, cancels, persists and invalidates a test case without another AI request", async ({
  page,
}) => {
  let generationRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/test-cases/generate"))
      generationRequests++;
  });
  await prepareGeneration(page, "Frontend");
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  await expect(page.getByText("Generation: COMPLETE")).toBeVisible();
  const requestsAfterGeneration = generationRequests;
  const preview = page.getByRole("region", { name: "Generated Test Cases" });
  const originalTitle = "Complete the supported user behavior";

  await preview.getByRole("button", { name: "Edit TP-FE-001" }).click();
  let editor = page.getByRole("region", { name: "Edit TP-FE-001" });
  await expect(editor.getByLabel("Title")).toHaveValue(originalTitle);
  await expect(
    editor.getByLabel("Module (source-linked, read-only)"),
  ).toHaveAttribute("readonly", "");
  await expect(
    editor.getByLabel("Feature (source-linked, read-only)"),
  ).toHaveAttribute("readonly", "");
  await editor.getByLabel("Title").fill("Cancelled change");
  await editor.getByRole("button", { name: "Cancel" }).click();
  await expect(preview.getByText(originalTitle, { exact: true })).toBeVisible();

  await preview.getByRole("button", { name: "Edit TP-FE-001" }).click();
  editor = page.getByRole("region", { name: "Edit TP-FE-001" });
  await editor.getByLabel("Title").fill("");
  await editor.getByRole("button", { name: "Save changes" }).click();
  await expect(editor.getByRole("alert")).toContainText("title is required");

  const hostile = "<script>window.__editPwned = true</script>";
  await editor.getByLabel("Title").fill(hostile);
  await editor.getByRole("button", { name: "Add step" }).click();
  await editor.getByLabel("Step 2").fill("Review the documented outcome.");
  await editor.getByRole("button", { name: "Save changes" }).click();
  await expect(preview.getByText(hostile, { exact: true })).toBeVisible();
  expect(generationRequests).toBe(requestsAfterGeneration);
  expect(
    await page.evaluate(
      () => (window as typeof window & { __editPwned?: boolean }).__editPwned,
    ),
  ).toBeUndefined();

  await page.reload();
  await expect(
    page
      .getByRole("region", { name: "Generated Test Cases" })
      .getByText(hostile, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  await expect(page.getByText("Generation: COMPLETE")).toBeVisible();
  await expect(page.getByText(hostile, { exact: true })).toHaveCount(0);
});

test("requires delete confirmation, preserves ID gaps and supports an empty layer", async ({
  page,
}) => {
  await prepareGeneration(page, "Frontend");
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  const preview = page.getByRole("region", { name: "Generated Test Cases" });

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Delete TP-FE-002?");
    await dialog.dismiss();
  });
  await preview.getByRole("button", { name: "Delete TP-FE-002" }).click();
  await expect(preview).toContainText("TP-FE-002");

  page.once("dialog", async (dialog) => dialog.accept());
  await preview.getByRole("button", { name: "Delete TP-FE-002" }).click();
  await expect(preview).not.toContainText("TP-FE-002");
  await expect(preview).toContainText("TP-FE-001");
  await expect(preview).toContainText("TP-FE-003");
  await expect(page.getByText("Frontend test cases: 2")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Frontend test cases: 2")).toBeVisible();
  await expect(page.getByText("TP-FE-002")).toHaveCount(0);

  for (const id of ["TP-FE-001", "TP-FE-003"]) {
    page.once("dialog", async (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Delete ${id}` }).click();
  }
  await expect(page.getByText("Frontend test cases: 0")).toBeVisible();
  await expect(preview).toContainText(
    "No Frontend test cases were generated from the selected documented requirements",
  );
});

test("keeps frontend edits and backend deletes isolated in Both scope", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await prepareGeneration(page, "Frontend + Backend");
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  const preview = page.getByRole("region", { name: "Generated Test Cases" });
  await preview.getByRole("button", { name: "Edit TP-FE-001" }).click();
  const editor = page.getByRole("region", { name: "Edit TP-FE-001" });
  await editor.getByLabel("Title").fill("Frontend-only manual edit");
  await editor.getByRole("button", { name: "Save changes" }).click();

  await preview.getByRole("tab", { name: "Backend (3)" }).click();
  await expect(preview).not.toContainText("Frontend-only manual edit");
  page.once("dialog", async (dialog) => dialog.accept());
  await preview.getByRole("button", { name: "Delete TP-BE-001" }).click();
  await expect(preview.getByRole("tab", { name: "Backend (2)" })).toBeVisible();
  await expect(preview).not.toContainText("TP-BE-001");

  await preview.getByRole("tab", { name: "Frontend (3)" }).click();
  await expect(preview).toContainText("Frontend-only manual edit");
  await expect(preview).toContainText("TP-FE-001");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("configures approved export columns in fixed order and restores them without export activity", async ({
  page,
}) => {
  let generationRequests = 0;
  let downloads = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/test-cases/generate"))
      generationRequests++;
  });
  page.on("download", () => downloads++);
  await prepareGeneration(page, "Frontend");
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  const configuration = page.getByRole("region", {
    name: "Export Configuration",
  });
  await expect(configuration).toContainText("9 of 11 columns selected");
  for (const label of [
    "Test Case ID",
    "Module",
    "Feature",
    "Title",
    "Preconditions",
    "Steps",
    "Expected Result",
    "Priority",
    "Type",
  ])
    await expect(
      configuration.getByLabel(label, { exact: true }),
    ).toBeChecked();
  await expect(
    configuration.getByLabel("Automation", { exact: true }),
  ).not.toBeChecked();
  await expect(
    configuration.getByLabel("Notes", { exact: true }),
  ).not.toBeChecked();

  const requestsAfterGeneration = generationRequests;
  await configuration.getByLabel("Automation", { exact: true }).check();
  await configuration.getByLabel("Preconditions", { exact: true }).uncheck();
  await expect(configuration).toContainText("9 of 11 columns selected");
  expect(
    await configuration
      .locator('input[type="checkbox"]')
      .evaluateAll((items) =>
        items.map((item) => item.getAttribute("aria-label")),
      ),
  ).toEqual([
    "Test Case ID",
    "Module",
    "Feature",
    "Title",
    "Preconditions",
    "Steps",
    "Expected Result",
    "Priority",
    "Type",
    "Automation",
    "Notes",
  ]);
  expect(generationRequests).toBe(requestsAfterGeneration);
  expect(downloads).toBe(0);

  await page.reload();
  const restored = page.getByRole("region", { name: "Export Configuration" });
  await expect(
    restored.getByLabel("Automation", { exact: true }),
  ).toBeChecked();
  await expect(
    restored.getByLabel("Preconditions", { exact: true }),
  ).not.toBeChecked();

  await restored.getByRole("button", { name: "Clear All" }).click();
  await expect(restored).toContainText("0 of 11 columns selected");
  await expect(restored.getByRole("alert")).toHaveText(
    "Select at least one column for export.",
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        sessionStorage.getItem("testpilot.export-columns.v1"),
      ),
    )
    .toBeNull();

  await restored.getByRole("button", { name: "Select All" }).click();
  await expect(restored).toContainText("11 of 11 columns selected");
  await expect(restored.getByRole("alert")).toHaveCount(0);
  expect(downloads).toBe(0);
});

test("keeps one export configuration across M7 mutations, regeneration and Both tabs", async ({
  page,
}) => {
  let generationRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/test-cases/generate"))
      generationRequests++;
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await prepareGeneration(page, "Frontend + Backend");
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  const configuration = page.getByRole("region", {
    name: "Export Configuration",
  });
  await configuration.getByLabel("Notes", { exact: true }).check();
  await configuration.getByLabel("Title", { exact: true }).uncheck();
  const requestsBeforeMutations = generationRequests;

  const preview = page.getByRole("region", { name: "Generated Test Cases" });
  await preview.getByRole("button", { name: "Edit TP-FE-001" }).click();
  const editor = page.getByRole("region", { name: "Edit TP-FE-001" });
  await editor.getByLabel("Title").fill("M7 edit survives M8 selection");
  await editor.getByRole("button", { name: "Save changes" }).click();
  await expect(preview).toContainText("M7 edit survives M8 selection");
  await expect(
    configuration.getByLabel("Notes", { exact: true }),
  ).toBeChecked();
  await expect(
    configuration.getByLabel("Title", { exact: true }),
  ).not.toBeChecked();

  await preview.getByRole("tab", { name: "Backend (3)" }).click();
  page.once("dialog", async (dialog) => dialog.accept());
  await preview.getByRole("button", { name: "Delete TP-BE-001" }).click();
  await expect(preview.getByRole("tab", { name: "Backend (2)" })).toBeVisible();
  await expect(
    configuration.getByLabel("Notes", { exact: true }),
  ).toBeChecked();
  expect(generationRequests).toBe(requestsBeforeMutations);

  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  await expect(page.getByText("Generation: COMPLETE")).toBeVisible();
  const regeneratedConfiguration = page.getByRole("region", {
    name: "Export Configuration",
  });
  await expect(
    regeneratedConfiguration.getByLabel("Notes", { exact: true }),
  ).toBeChecked();
  await expect(
    regeneratedConfiguration.getByLabel("Title", { exact: true }),
  ).not.toBeChecked();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("falls back safely from malformed persisted export columns", async ({
  page,
}) => {
  await prepareGeneration(page, "Backend");
  await page.evaluate(() =>
    sessionStorage.setItem(
      "testpilot.export-columns.v1",
      JSON.stringify({
        selectedColumns: ["notes", "unknownInternalReference", "title"],
      }),
    ),
  );
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  const configuration = page.getByRole("region", {
    name: "Export Configuration",
  });
  await expect(configuration).toContainText("9 of 11 columns selected");
  await expect(
    configuration.getByLabel("Test Case ID", { exact: true }),
  ).toBeChecked();
  await expect(
    configuration.getByLabel("Automation", { exact: true }),
  ).not.toBeChecked();
  await expect(
    configuration.getByLabel("Notes", { exact: true }),
  ).not.toBeChecked();
});

test("a late generation response cannot attach to a replacement PRD", async ({
  page,
}) => {
  await prepareGeneration(page, "Frontend");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started!: () => void;
  const intercepted = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route("**/api/test-cases/generate", async (route) => {
    const response = await route.fetch();
    started();
    await gate;
    await route.fulfill({ response });
  });
  await page.getByRole("button", { name: "Generate Test Cases" }).click();
  await intercepted;
  await page.getByLabel("Choose PRD file").setInputFiles(reviewFixture);
  await expect(
    page.getByText("Analysis: READY", { exact: true }),
  ).toBeVisible();
  release();
  await page.unrouteAll({ behavior: "wait" });
  await expect(page.getByText("Generation: COMPLETE")).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("testpilot.generated-test-cases.v1"),
    ),
  ).toBeNull();
});
