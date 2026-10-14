import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { defineConfig } from "vitest/config";

const packageRoot = path.dirname(import.meta.filename);

const WS_ENDPOINT = process.env.PLAYWRIGHT_WS_ENDPOINT;
const APP_HOST = process.env.APP_HOST ?? "localhost";

export default defineConfig({
  root: import.meta.dirname,
  server: {
    host: APP_HOST,
    allowedHosts: [APP_HOST],
  },
  resolve: {
    alias: {
      "@": path.resolve(packageRoot, "./src"),
    },
  },
  test: {
    clearMocks: true,
    restoreMocks: true,
    include: ["src/**/__tests__/**/*.browser.test.{ts,tsx}"],
    env: {
      GOOGLE_CLIENT_ID: "test-client-id",
      GOOGLE_CLIENT_SECRET: "test-client-secret",
      GOOGLE_REDIRECT_URI: "http://localhost:3000/sign-in/google/callback",
    },
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
