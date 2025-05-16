import { resolve } from "node:path";
import svgPlugin from "./src/vite/svg";
import routeManifestPlugin from "./src/vite/routeManifest";
import type { UserConfig } from "vite";

const IS_CLOUDFLARE_WORKER = process.env.CF_PAGES === "1";

export default {
  envDir: "../..",
  envPrefix: "PUBLIC_",
  base: "/assets/",
  define: {
    "process.env": process.env,
  },
  ssr: {
    noExternal: IS_CLOUDFLARE_WORKER ? true : undefined,
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
    assetsDir: "",
    rollupOptions: {
      treeshake: "recommended",
      input: {
        index: "@/server/worker",
        hydrate: "@/server/hydrate",
        global: "@/global",
        init: "@/init",
      },
      output: {
        manualChunks: {
          server: ["@/server/server"],
        },
      },
    },
  },
} satisfies UserConfig;
