import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { definePackageConfig } from "../../vitest.shared.ts";
import svgPlugin from "./src/vite/svg.ts";

const WS_ENDPOINT = process.env.PLAYWRIGHT_WS_ENDPOINT;
const APP_HOST = process.env.APP_HOST ?? "localhost";

export default definePackageConfig(import.meta.dirname, {
  root: import.meta.dirname,
  server: {
    host: APP_HOST,
    allowedHosts: [APP_HOST],
  },
  plugins: [
    svgPlugin({ importSource: "@/jsx" }),
    storybookTest({
      configDir: path.join(import.meta.dirname, ".storybook"),
      storybookUrl: "http://localhost:6001",
    }),
  ],
  test: {
    env: {
      PUBLIC_API_ORIGIN: "https://api.test",
      PUBLIC_PROFILE_IMAGES_BASE_URL: "https://profile-images.test",
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
