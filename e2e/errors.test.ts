import { expect, test } from "@playwright/test";

test.describe("error pages", () => {
  test("renders a styled 404 page for an unknown route", async ({ page }) => {
    const response = await page.goto("/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle("Page not found - Tiles");
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
    const home = page.getByRole("link", { name: "Home" });
    await expect(home).toHaveAttribute("href", "/");
    await expect(home).toHaveCSS("color", "rgb(255, 255, 255)");
  });

  test("renders the 404 page for an unavailable page", async ({ page }) => {
    const response = await page.goto("/pages/00000000-0000-4000-8000-000000000000");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });
});
