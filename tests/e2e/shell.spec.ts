import { expect, test } from "@playwright/test";

test("renders the M0 application shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("TestPilot AI");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "A maintainable base for PRD-grounded QA workflows.",
    }),
  ).toBeVisible();
  await expect(page.getByText("M0 · Foundation")).toBeVisible();
  await expect(page.getByText("Version 0.1.0")).toBeVisible();
  await expect(
    page.getByText(
      "MVP business workflows are intentionally not implemented in M0.",
    ),
  ).toBeVisible();
});
