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
    page.getByText("Which task management operations may an admin perform?", {
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
