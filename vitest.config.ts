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
    // With `projects`, Vitest only reads coverage options from the root config.
    coverage: {
      include: ["packages/*/src/**/*.{ts,tsx}"],
      exclude: [
        "**/__tests__/**",
        "**/src/test/**",
        "**/generated/**",
        "**/*.d.ts",
        "**/*.stories.tsx",
        // Bootstrap files that cannot be unit tested.
        "packages/api/src/index.ts",
        "packages/web/src/server/dev-server.ts",
        "packages/web/src/vite/**",
      ],
      reporter: ["text", "html", "json-summary"],
      // Floors at the current baseline per package. Raise them as coverage improves; never lower.
      thresholds: {
        "packages/api/src/**": { lines: 62, branches: 57, functions: 44, statements: 61 },
        "packages/dev-cdn/src/**": { lines: 100, branches: 100, functions: 100, statements: 100 },
        "packages/doc/src/**": { lines: 94, branches: 85, functions: 96, statements: 94 },
        "packages/fonts/src/**": { lines: 97, branches: 88, functions: 100, statements: 97 },
        "packages/image-upload-worker/src/**": {
          lines: 100,
          branches: 100,
          functions: 100,
          statements: 100,
        },
        "packages/web/src/**": { lines: 25, branches: 20, functions: 28, statements: 25 },
      },
    },
  },
});
