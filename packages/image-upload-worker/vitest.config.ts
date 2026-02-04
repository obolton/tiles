import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      PUBLIC_WEB_ORIGIN: "https://example.com",
      PUBLIC_API_ORIGIN: "https://api.example.com",
    },
    coverage: {
      include: ["src/**/*.test.ts"],
    },
  },
});
