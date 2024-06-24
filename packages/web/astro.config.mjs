import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import editClientDirective from "./src/config/editClientDirective/register";

const packageRoot = path.dirname(import.meta.filename);

const env = loadEnv(import.meta.env.MODE, packageRoot, "CERTIFICATE_");

export default defineConfig({
  output: "server",
  integrations: [react(), editClientDirective()],
  vite: {
    server: {
      https: {
        key: fs.readFileSync(env.CERTIFICATE_KEY_PATH),
        cert: fs.readFileSync(env.CERTIFICATE_PATH),
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(packageRoot, "./src"),
      },
    },
  },
});
