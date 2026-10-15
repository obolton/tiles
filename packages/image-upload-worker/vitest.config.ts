import { definePackageConfig } from "../../vitest.shared.ts";

export default definePackageConfig(import.meta.dirname, {
  test: {
    environment: "node",
    env: {
      PUBLIC_WEB_ORIGIN: "https://example.com",
      INTERNAL_API_ORIGIN: "https://api.example.com",
    },
  },
});
