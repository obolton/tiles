import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { defineConfig } from "vitest/config";

const packageRoot = path.dirname(import.meta.filename);

if (!process.env.APP_HOST || !process.env.PLAYWRIGHT_HOST) {
  throw new Error("APP_HOST and PLAYWRIGHT_HOST must be set for browser tests");
}

export default defineConfig({
  root: import.meta.dirname,
  server: {
    host: process.env.APP_HOST,
    allowedHosts: [process.env.APP_HOST],
  },
  resolve: {
    alias: {
      "@": path.resolve(packageRoot, "./src"),
    },
  },
  test: {
    include: ["src/**/__tests__/**/*.browser.test.{ts,tsx}"],
    env: {
      GOOGLE_CLIENT_ID: "test-client-id",
      GOOGLE_CLIENT_SECRET: "test-client-secret",
      GOOGLE_REDIRECT_URI: "http://localhost:3000/sign-in/google/callback",
    },
    browser: {
      enabled: true,
      provider: playwright({
        connectOptions: {
          wsEndpoint: `ws://${process.env.PLAYWRIGHT_HOST}:3100/`,
        },
      }),
      instances: [{ browser: "chromium" }],
    },
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
    },
  },
});
