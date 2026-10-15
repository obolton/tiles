import { definePackageConfig } from "../../vitest.shared.ts";
import { testEnv } from "./vitest.env.ts";

export default definePackageConfig(import.meta.dirname, {
  root: import.meta.dirname,
  test: {
    environment: "jsdom",
    pool: "vmThreads",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    exclude: ["src/**/__tests__/**/*.browser.test.{ts,tsx}"],
    env: testEnv,
  },
});
