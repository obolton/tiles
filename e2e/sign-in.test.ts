import { expect, test } from "@playwright/test";

test.describe("sign-in page", () => {
  test("renders the sign-in page", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveTitle("Sign in - Tiles");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Continue with Google" })).toHaveAttribute(
      "href",
      "/sign-in/google",
    );
  });

  test("explains a cancelled sign-in", async ({ page }) => {
    await page.goto("/sign-in?error=cancelled");
    await expect(page.getByRole("alert")).toContainText("Sign-in was cancelled");
  });

  test("passes a valid destination to the Google sign-in route", async ({ page }) => {
    await page.goto("/sign-in?destination=invites%2Faccept%2Fabc123");
    await expect(page.getByRole("link", { name: "Continue with Google" })).toHaveAttribute(
      "href",
      "/sign-in/google?destination=invites%2Faccept%2Fabc123",
    );
  });

  test("drops an invalid destination", async ({ page }) => {
    await page.goto("/sign-in?destination=https%3A%2F%2Fevil.com");
    await expect(page.getByRole("link", { name: "Continue with Google" })).toHaveAttribute(
      "href",
      "/sign-in/google",
    );
  });

  test("returns to the requested page after signing in", async ({ page, context }) => {
    // Sign in once to find the test user's workspace, then start again signed out.
    await page.goto("/sign-in/test-user");
    await expect(page).toHaveURL(/\/workspaces\/[0-9a-f-]+$/);
    const workspaceUrl = new URL(page.url());
    const destination = workspaceUrl.pathname.slice(1);
    await context.clearCookies();

    await page.goto(workspaceUrl.pathname);
    await expect(page).toHaveURL(
      new URL(`/sign-in?destination=${encodeURIComponent(destination)}`, workspaceUrl).href,
    );

    await page.goto(`/sign-in/test-user?destination=${encodeURIComponent(destination)}`);
    await expect(page).toHaveURL(workspaceUrl.href);
  });

  test("redirects signed-in users away from the sign-in page", async ({ page }) => {
    await page.goto("/sign-in/test-user");
    await expect(page).toHaveURL(/\/workspaces\//);
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/workspaces\//);
  });
});
