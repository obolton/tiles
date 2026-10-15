import { playwright } from "@vitest/browser-playwright";
import { definePackageConfig } from "../../vitest.shared.ts";
import { testEnv } from "./vitest.env.ts";

const WS_ENDPOINT = process.env.PLAYWRIGHT_WS_ENDPOINT;
const APP_HOST = process.env.APP_HOST ?? "localhost";

export default definePackageConfig(import.meta.dirname, {
  root: import.meta.dirname,
  server: {
    host: APP_HOST,
    allowedHosts: [APP_HOST],
  },
  test: {
    include: ["src/**/__tests__/**/*.browser.test.{ts,tsx}"],
    env: testEnv,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(WS_ENDPOINT ? { connectOptions: { wsEndpoint: WS_ENDPOINT } } : {}),
      instances: [{ browser: "chromium" }],
    },
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
    },
  },
});
