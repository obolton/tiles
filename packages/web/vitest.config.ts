/// <reference types="vitest" />

import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["test/setup.ts"],
    coverage: {
      include: ["src/**"],
      extension: [".ts", ".tsx", ".astro"],
    },
  },
});
