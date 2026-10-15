import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*/vitest.config.ts"],
    coverage: {
      include: ["packages/*/src/**/*.{ts,tsx}"],
      exclude: [
        "**/__tests__/**",
        "**/src/test/**",
        "**/generated/**",
        "**/*.d.ts",
        "**/*.stories.tsx",
      ],
      reporter: ["text", "json-summary"],
    },
  },
});
