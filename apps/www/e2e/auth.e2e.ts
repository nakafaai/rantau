import { expect, test } from "@playwright/test";

const englishPath = /\/en\/$/;
const indonesianPath = /\/id\/$/;

test.describe("HeroUI authentication entry", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("keeps the localized entry usable without horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/id/");

    await expect(page).toHaveURL(indonesianPath);
    await expect(page.getByRole("button", { name: "Masuk" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Kata sandi")).toBeVisible();

    const card = page.locator('[data-slot="card"]').first();
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS("border-top-width", "0px");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("preserves the English locale without a document-level layout shift", async ({
    page,
  }) => {
    await page.goto("/en/");

    await expect(page).toHaveURL(englishPath);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
