import { expect, test } from "@playwright/test";

test("start shows title, search and chips", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Every rare disease has neighbours." })).toBeVisible();
  await expect(page.getByTestId("sky")).toBeVisible();
  await expect(page.getByRole("link", { name: "Krabbe disease" })).toBeVisible();
});

test("typing Krabbe and choosing it opens the disease", async ({ page }) => {
  await page.goto("/");
  const box = page.getByRole("combobox");
  await box.fill("Krabbe");
  await page.getByRole("option", { name: /^Krabbe disease/ }).first().click();
  await expect(page).toHaveURL(/\/d\/MONDO_0009499/, { timeout: 20_000 });
});

test("chip opens metachromatic leukodystrophy", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "metachromatic leukodystrophy" }).click();
  await expect(page).toHaveURL(/\/d\/MONDO_0018868/, { timeout: 20_000 });
});

test("sky failure keeps the page usable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/world/sky.json", (r) => r.abort());
  await page.goto("/");
  await page.getByRole("combobox").fill("Gaucher");
  await expect(page.getByRole("option").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile start has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Every rare disease has neighbours." })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
