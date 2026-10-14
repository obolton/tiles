import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { defineConfig, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";
import svgPlugin from "./src/vite/svg.ts";
import A11yWarningsReporter from "./src/test/a11yWarningsReporter.ts";

const packageRoot = path.dirname(import.meta.filename);

const WS_ENDPOINT = process.env.PLAYWRIGHT_WS_ENDPOINT;
const APP_HOST = process.env.APP_HOST ?? "localhost";

export default mergeConfig(
  shared,
  defineConfig({
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
    plugins: [svgPlugin({ importSource: "@/jsx" })],
    test: {
      reporters: ["default", new A11yWarningsReporter()],
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(WS_ENDPOINT ? { connectOptions: { wsEndpoint: WS_ENDPOINT } } : {}),
      },
      projects: [
        {
          extends: true,
          test: {
            name: "browser",
            include: ["src/**/__tests__/**/*.browser.test.{ts,tsx}"],
            env: {
              GOOGLE_CLIENT_ID: "test-client-id",
              GOOGLE_CLIENT_SECRET: "test-client-secret",
              GOOGLE_REDIRECT_URI: "http://localhost:3000/sign-in/google/callback",
            },
            browser: { instances: [{ browser: "chromium" }] },
          },
        },
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(packageRoot, ".storybook"),
              storybookUrl: "http://localhost:6001",
            }),
          ],
          test: {
            name: "storybook",
            env: {
              PUBLIC_API_ORIGIN: "https://api.test",
              PUBLIC_PROFILE_IMAGES_BASE_URL: "https://profile-images.test",
            },
            browser: { instances: [{ browser: "chromium" }] },
          },
        },
      ],
      coverage: {
        include: ["src/**/*.{ts,tsx}"],
      },
    },
  }),
);
