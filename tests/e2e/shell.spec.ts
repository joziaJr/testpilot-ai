import { expect, test } from "@playwright/test";
import path from "node:path";

const fixture = (name: string) => path.resolve("qa/test-data/m1", name);

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
