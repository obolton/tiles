import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/api",
      "packages/dev-cdn",
      "packages/doc",
      "packages/env",
      "packages/fonts",
      "packages/image-upload-worker",
      "packages/jsx",
      "packages/web",
    ],
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
