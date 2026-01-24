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
    env: {
      GOOGLE_CLIENT_ID: "test-client-id",
      GOOGLE_CLIENT_SECRET: "test-client-secret",
      GOOGLE_REDIRECT_URI: "http://localhost:3000/sign-in/google/callback",
    },
    coverage: {
      include: ["src/**"],
      extension: [".ts", ".tsx"],
    },
  },
});
