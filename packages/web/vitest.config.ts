import path from "node:path";
import { defineConfig } from "vitest/config";

const packageRoot = path.dirname(import.meta.filename);

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      "@": path.resolve(packageRoot, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    coverage: {
      include: ["src/**"],
      extension: [".ts", ".tsx"],
    },
  },
});
