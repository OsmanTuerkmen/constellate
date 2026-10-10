import { expect, test } from "@playwright/test";

test("header has search and about", async ({ page }) => {
  await page.goto("/d/MONDO_0009499");
  const header = page.getByRole("banner");
  await expect(header.getByRole("combobox")).toBeVisible();
  await expect(header.getByRole("link", { name: "About" })).toBeVisible();
});

test("theme toggle switches data-theme", async ({ page }) => {
  await page.goto("/about");
  const toggle = page.getByRole("button", { name: "Toggle theme" });
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("theme toggle survives blocked localStorage", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  await page.goto("/about");
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(errors).toEqual([]);
});
