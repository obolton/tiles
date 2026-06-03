import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/api",
      "packages/doc",
      "packages/image-upload-worker",
      "packages/web",
    ],
  },
});
