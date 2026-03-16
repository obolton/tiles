import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      PUBLIC_WEB_ORIGIN: "https://example.com",
      INTERNAL_API_ORIGIN: "https://api.example.com",
    },
    coverage: {
      include: ["src/**/*.ts"],
    },
  },
});
