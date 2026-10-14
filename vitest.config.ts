import { defineConfig } from "vitest/config";

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  test: {
    // The CLI --reporter flag replaces this list, so scripts must not set a reporter.
    reporters: isGitHubActions ? ["minimal", "github-actions"] : ["minimal"],
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
