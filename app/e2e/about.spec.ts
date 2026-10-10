import { expect, test } from "@playwright/test";

test("about lists evidence levels and sources", async ({ page }) => {
  await page.goto("/about");
  for (const level of ["observed", "curated", "text_mined", "inferred"]) await expect(page.getByText(level, { exact: true })).toBeVisible();
  await expect(page.getByText("HPO", { exact: true })).toBeVisible();
});

test("tour shows once", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/d/MONDO_0009499?tour=1");
  await expect(page.getByText("The three answers, in short.")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByText("The three answers, in short.")).toHaveCount(0);
  await page.goto("/d/MONDO_0009499?tour=1");
  await expect(page.getByRole("heading", { name: "What is it?" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("The three answers, in short.")).toHaveCount(0);
});

test("tour with blocked localStorage does not throw", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/d/MONDO_0009499?tour=1");
  await expect(page.getByText("The three answers, in short.")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Every line is a piece of evidence. Click one.")).toBeVisible();
  expect(errors).toEqual([]);
});
