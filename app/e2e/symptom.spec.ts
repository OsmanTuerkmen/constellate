import { expect, test } from "@playwright/test";

test("symptom page lists its diseases and draws the map", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/p/HP_0001250");
  await expect(page.getByRole("heading", { name: /Diseases with this symptom/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("graph-stage").locator("canvas").first()).toBeVisible();
});

test("search offers no dead organisation links", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox").fill("MLD");
  await expect(page.getByRole("option").first()).toBeVisible();
  await expect(page.getByRole("option", { name: /Group$/ })).toHaveCount(0);
});
