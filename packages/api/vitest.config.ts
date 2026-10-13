import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["src/test/setup.ts"],
    env: {
      PROFILE_IMAGES_BASE_URL: "https://example.com/profile-images",
      RESOURCES_BASE_URL: "https://example.com/resources",
      EMAIL_FROM: "from@test.com",
      AWS_ACCESS_KEY_ID: "test",
      AWS_SECRET_ACCESS_KEY: "test",
      AWS_REGION: "test",
      CLOUDFLARE_API_TOKEN: "test",
      CLOUDFLARE_ZONE_ID: "test",
      CLOUDFLARE_ACCOUNT_ID: "test",
      CLOUDFLARE_R2_ACCESS_KEY_ID: "test",
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: "test",
      CLOUDFLARE_R2_BUCKET_RESOURCES: "test",
      CLOUDFLARE_R2_BUCKET_PROFILE_IMAGES: "test",
      CLOUDFLARE_R2_BUCKET_IMAGES: "test",
      OPENAI_API_KEY: "test",
      CLIENT_ORIGIN: "https://test.example.com",
      SERVICE_API_TOKEN: "test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
