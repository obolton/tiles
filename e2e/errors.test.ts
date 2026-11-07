import { expect, test } from "@playwright/test";

test.describe("error pages", () => {
  test("renders a styled 404 page for an unknown route", async ({ page }) => {
    const response = await page.goto("/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle("Page not found - Tiles");
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });

  test("offers sign-in for an unavailable page", async ({ page }) => {
    const response = await page.goto("/pages/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in?destination=pages%2Fdoes-not-exist",
    );
  });

  test("links signed-in users to their library", async ({ page }) => {
    await page.goto("/sign-in/test-user");
    const response = await page.goto("/pages/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("link", { name: "Go to your library" })).toHaveAttribute(
      "href",
      "/",
    );
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  });
});
