import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import editClientDirective from "./src/config/editClientDirective/register";

// const isProdEnvironment = import.meta.env.PROD === "true";
const isTestEnvironment = process.env.VITEST === "true";
const packageRoot = path.dirname(import.meta.filename);
const workspaceRoot = path.resolve(packageRoot, "../..");
const env = loadEnv(import.meta.env.MODE, workspaceRoot, "");
const ENABLE_HTTPS = env.ENABLE_HTTPS === "true";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), editClientDirective()],
  vite: {
    envDir: "../..",
    define: {
      "process.env": process.env,
    },
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
        // Patch to make the Cloudflare adapter compatible with React 19
        "react-dom/server": "react-dom/server.edge",
      },
    },
  },
  adapter: !isTestEnvironment ? cloudflare() : undefined,
});
