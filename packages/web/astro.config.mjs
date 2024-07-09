import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import editClientDirective from "./src/config/editClientDirective/register";

const packageRoot = path.dirname(import.meta.filename);
const env = loadEnv(import.meta.env.MODE, packageRoot, "CERTIFICATE_");
const ENABLE_HTTPS = env.ENABLE_HTTPS === "true";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), editClientDirective()],
  vite: {
    server: ENABLE_HTTPS
      ? {
          https: {
            key: fs.readFileSync(env.CERTIFICATE_KEY_PATH),
            cert: fs.readFileSync(env.CERTIFICATE_PATH),
          },
        }
      : {},
    ssr: {
      external: ["node:assert", "node:crypto"],
    },
    resolve: {
      alias: {
        "@": path.resolve(packageRoot, "./src"),
      },
    },
  },
  adapter: cloudflare(),
});
