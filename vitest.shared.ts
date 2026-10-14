import { defineConfig } from "vitest/config";

// Projects listed in the root config do not inherit its `test` options, so each
// package merges this into its own config.
export default defineConfig({
  test: {
    clearMocks: true,
    restoreMocks: true,
  },
});
