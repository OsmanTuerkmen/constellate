import { expect, test } from "@playwright/test";

test("GALC page shows diseases and graph", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/g/GALC");
  await expect(page.getByRole("heading", { name: "What does it do?" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("link", { name: "Krabbe disease", exact: true })).toBeVisible();
  await expect(page.getByTestId("graph-stage").locator("canvas").first()).toBeVisible();
});

test("mobile gene page has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/g/GALC");
  await expect(page.getByRole("heading", { name: "What does it do?" })).toBeVisible({ timeout: 20_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
