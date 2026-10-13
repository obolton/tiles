import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/api",
      "packages/dev-cdn",
      "packages/doc",
      "packages/fonts",
      "packages/image-upload-worker",
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
