import { defineConfig, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";
import path from "node:path";

export default mergeConfig(
  shared,
  defineConfig({
    test: {
      environment: "node",
      setupFiles: ["src/test/setup.ts"],
      env: {
        API_HOST: "127.0.0.1",
        API_PORT: "3001",
        PUBLIC_WEB_ORIGIN: "https://test.example.com",
        DATABASE_URL: "postgresql://test",
        PROFILE_IMAGES_BASE_URL: "https://example.com/profile-images",
        EMAIL_FROM: "from@test.com",
        AWS_ACCESS_KEY_ID: "test",
        AWS_SECRET_ACCESS_KEY: "test",
        AWS_REGION: "test",
        CLOUDFLARE_API_TOKEN: "test",
        CLOUDFLARE_ZONE_ID: "test",
        CLOUDFLARE_ACCOUNT_ID: "test",
        CLOUDFLARE_R2_ACCESS_KEY_ID: "test",
        CLOUDFLARE_R2_SECRET_ACCESS_KEY: "test",
        CLOUDFLARE_R2_BUCKET_PROFILE_IMAGES: "test",
        CLOUDFLARE_R2_BUCKET_IMAGES: "test",
        OPENAI_API_KEY: "test",
        ANTHROPIC_API_KEY: "test",
        AI_TEXT_PROVIDER: "anthropic",
        AI_TEXT_MODEL: "test",
        HERE_API_KEY: "test",
        CLIENT_ORIGIN: "https://test.example.com",
        PUBLIC_SESSION_COOKIE_DOMAIN: "test.example.com",
        PAGE_ID: "home-page",
        SERVICE_API_TOKEN: "test",
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  }),
);
