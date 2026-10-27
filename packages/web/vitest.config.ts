import path from "node:path";
import { defineConfig, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

const packageRoot = path.dirname(import.meta.filename);

export default mergeConfig(
  shared,
  defineConfig({
    root: import.meta.dirname,
    resolve: {
      alias: {
        "@": path.resolve(packageRoot, "./src"),
      },
    },
    test: {
      environment: "jsdom",
      pool: "vmThreads",
      setupFiles: ["src/test/setup.ts"],
      include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
      exclude: ["src/**/__tests__/**/*.browser.test.{ts,tsx}"],
      env: {
        GOOGLE_CLIENT_ID: "test-client-id",
        GOOGLE_CLIENT_SECRET: "test-client-secret",
        GOOGLE_REDIRECT_URI: "http://localhost:3000/sign-in/google/callback",
        PUBLIC_API_ORIGIN: "https://api.test",
        PUBLIC_UPLOAD_ORIGIN: "https://uploads.test",
        PUBLIC_COLLABORATION_URL: "wss://api.test/collaboration",
        PUBLIC_FONTS_BASE_URL: "https://test-fonts.example.com",
        PUBLIC_IMAGES_BASE_URL: "https://images.test",
        PUBLIC_PROFILE_IMAGES_BASE_URL: "https://profile-images.test",
      },
    },
  }),
);
