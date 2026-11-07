import path from "node:path";
import { defineConfig, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

export default mergeConfig(
  shared,
  defineConfig({
    resolve: {
      alias: {
        "cloudflare:workers": path.resolve(
          import.meta.dirname,
          "src/test/mocks/cloudflareWorkers.ts",
        ),
      },
    },
    test: {
      environment: "node",
      env: {
        PUBLIC_WEB_ORIGIN: "https://example.com",
        INTERNAL_API_ORIGIN: "https://api.example.com",
      },
    },
  }),
);
