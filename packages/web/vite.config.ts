import { resolve } from "node:path";
import svgPlugin from "./src/vite/svg";
import routeManifestPlugin from "./src/vite/routeManifest";
import type { UserConfig } from "vite";

export default {
  envDir: "../..",
  envPrefix: "PUBLIC_",
  ssr: {
    external: ["node:assert", "node:crypto"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  plugins: [svgPlugin({ jsxImportSource: "@/jsx" }), routeManifestPlugin()],
  build: {
    target: "esnext",
    rollupOptions: {
      treeshake: "recommended",
      input: {
        _worker: "@/server/worker",
        hydrate: "@/server/hydrate",
        global: "@/global",
        init: "@/init",
      },
    },
  },
} satisfies UserConfig;
