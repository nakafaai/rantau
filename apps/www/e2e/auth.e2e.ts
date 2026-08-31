import { expect, test } from "@playwright/test";

const englishPath = /\/en\/$/;
const indonesianPath = /\/id\/$/;
const ghostButtonClass = /button--ghost/;
const removedThemeClass = /bubblegum/;
const supportedThemeClass = /light|dark/;

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
    await expect(page.getByText("Baru di Rantau?")).toBeVisible();

    const signIn = page.getByRole("button", { name: "Masuk" });
    const signUp = page.getByRole("button", { name: "Buat akun" });
    await expect(signUp).toHaveClass(ghostButtonClass);

    const signInBox = await signIn.boundingBox();
    const signUpBox = await signUp.boundingBox();
    expect(signInBox).not.toBeNull();
    expect(signUpBox).not.toBeNull();
    expect(signUpBox?.width ?? 0).toBeLessThan(signInBox?.width ?? 0);

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

  test("ignores removed theme identifiers", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("theme", "bubblegum");
    });
    await page.goto("/id/");

    await expect(page.locator("html")).not.toHaveClass(removedThemeClass);
    await expect(page.locator("html")).toHaveClass(supportedThemeClass);
  });
});
