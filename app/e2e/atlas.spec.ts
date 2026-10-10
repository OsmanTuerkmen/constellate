import { expect, test, type Page } from "@playwright/test";

const KRABBE = "/d/MONDO_0009499";

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

test("graph stage renders a canvas and filters", async ({ page }) => {
  await page.goto(KRABBE);
  const stage = page.getByTestId("graph-stage");
  await expect(stage.locator("canvas").first()).toBeVisible({ timeout: 20_000 });
  const symptoms = stage.getByRole("button", { name: "Symptoms" });
  await expect(symptoms).toHaveAttribute("aria-pressed", "true");
  await symptoms.click();
  await expect(symptoms).toHaveAttribute("aria-pressed", "false");
  await stage.getByRole("button", { name: "Show as list" }).click();
  await expect(stage.getByRole("link", { name: "GALC" })).toBeVisible();
});


test("edge param opens the drawer", async ({ page }) => {
  await page.goto(`${KRABBE}?edge=e_3dbc42738b5a`);
  const drawer = page.getByRole("dialog", { name: /Evidence/ });
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await expect(drawer.getByRole("heading", { name: "Counter-evidence" })).toBeVisible();
  await expect(drawer.getByRole("link").first()).toBeVisible();
});

test("unknown edge id keeps the drawer closed", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(`${KRABBE}?edge=e_000000000000`);
  await expect(page.getByTestId("graph-stage").locator("canvas").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("dialog", { name: /Evidence/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Esc closes the drawer and clears the param", async ({ page }) => {
  await page.goto(`${KRABBE}?edge=e_3dbc42738b5a`);
  const drawer = page.getByRole("dialog", { name: /Evidence/ });
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(page).not.toHaveURL(/edge=/);
});

test("opening an edge link directly causes no errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/404/.test(m.text())) errors.push(m.text());
  });
  await page.goto(`${KRABBE}?edge=e_3dbc42738b5a`);
  await expect(page.getByRole("dialog", { name: /Evidence/ })).toBeVisible({ timeout: 20_000 });
  expect(errors).toEqual([]);
});

test("info column shows three answers and tabs", async ({ page }) => {
  await page.goto(KRABBE);
  await expect(page.getByRole("heading", { name: "What is it?" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Is there a treatment?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What can I do?" })).toBeVisible();
  await expect(page.getByTestId("answer-treatment")).toContainText("No approved medicine");
  await expect(page.getByRole("tab", { name: /^Studies \(\d+\)$/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^Groups \(\d+\)$/ })).toBeVisible();
  await page.getByRole("tab", { name: /^Related \(\d+\)$/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Pelizaeus-Merzbacher");
});

test("desktop: info and graph side by side without page scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(KRABBE);
  const stage = page.getByTestId("graph-stage");
  await expect(stage.locator("canvas").first()).toBeVisible({ timeout: 20_000 });
  const box = await stage.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(400);
  const fits = await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1);
  expect(fits).toBe(true);
});

test("mobile: map opens as sheet, no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(KRABBE);
  await expect(page.getByRole("heading", { name: "What is it?" })).toBeVisible({ timeout: 20_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: "Show the map" }).click();
  await expect(page.getByTestId("graph-stage").locator("canvas").first()).toBeVisible({ timeout: 20_000 });
});

test("unknown disease shows the gap panel", async ({ page }) => {
  await page.goto("/d/MONDO_9999999");
  await expect(page.getByText("not in this dataset")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "What we searched" })).toBeVisible();
});

test("gap case MONDO:0012720 renders without errors", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/d/MONDO_0012720");
  await expect(page.getByRole("heading", { name: "What we searched" })).toBeVisible({ timeout: 20_000 });
  expect(errors.filter((e) => !/404/.test(e))).toEqual([]);
});

test("light mode renders the atlas", async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    try {
      localStorage.setItem("constellate.theme", "light");
    } catch {}
  });
  await page.goto(KRABBE);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("heading", { name: "What is it?" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("graph-stage").locator("canvas").first()).toBeVisible();
  expect(errors.filter((e) => !/404/.test(e))).toEqual([]);
});

test("compare with MLD", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${KRABBE}?compare=MONDO_0018868`);
  const dialog = page.getByRole("dialog", { name: /↔/ });
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  await expect(dialog.getByRole("heading", { name: "What transfers" })).toBeVisible({ timeout: 20_000 });
  await expect(dialog.getByRole("heading", { name: "What differs" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Needs an expert" })).toBeVisible();
  const marker = dialog.getByRole("button", { name: /^e_[0-9a-f]+/ }).first();
  await marker.click();
  await expect(page.getByRole("dialog", { name: /Evidence/ })).toBeVisible();
});

test("old action URL redirects", async ({ page }) => {
  await page.goto(`${KRABBE}/action?via=MONDO_0018868`);
  await expect(page).toHaveURL(/compare=MONDO_0018868/);
});

test("compare param that is no neighbour stays closed", async ({ page }) => {
  await page.goto(`${KRABBE}?compare=MONDO_9999999`);
  await expect(page.getByRole("heading", { name: "What is it?" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("dialog", { name: /↔/ })).toHaveCount(0);
});

test("mobile compare is a closable sheet", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${KRABBE}?compare=MONDO_0018868`);
  const dialog = page.getByRole("dialog", { name: /↔/ });
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).not.toHaveURL(/compare=/);
});

test("a disease without any lead shows the gap view instead of the answers", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/d/MONDO_0007247");
  await expect(page.getByRole("heading", { name: "What we searched" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "What is it?" })).toHaveCount(0);
  await expect(page.getByTestId("graph-stage").locator("canvas").first()).toBeVisible();
});

test("closing the drawer and going back leaves the page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/about");
  await page.getByRole("link", { name: "Open Krabbe disease" }).click();
  await page.getByRole("tab", { name: /^Groups/ }).click();
  await page.getByRole("button", { name: "Source" }).first().click();
  const drawer = page.getByRole("dialog", { name: /Evidence/ });
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
});
