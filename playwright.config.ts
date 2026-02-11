import { defineConfig, devices } from "@playwright/test";

const PLAYWRIGHT_HOST = process.env.PLAYWRIGHT_HOST ?? "localhost";
const APP_HOST = process.env.APP_HOST ?? "localhost";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: `http://${APP_HOST}:3000`,
    connectOptions: {
      wsEndpoint: `ws://${PLAYWRIGHT_HOST}:3100/`,
    },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
