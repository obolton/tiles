import { resolve } from "node:path";
import { patchCssModules } from "vite-css-modules";
import svgPlugin from "./src/vite/svg";
import routeManifestPlugin from "./src/vite/routeManifest";
import cloudflarePlugin from "./src/vite/cloudflare";
import { defineConfig } from "vite";

const IS_CLOUDFLARE_WORKER = process.env.CF_PAGES === "1";

const allowedHosts = [".tiles.test", "localhost"];
if (process.env.APP_HOST) {
  allowedHosts.push(process.env.APP_HOST);
}

export default defineConfig(({ isSsrBuild }) => ({
  envDir: "../..",
  envPrefix: "PUBLIC_",
  base: "/",
  server: {
    allowedHosts,
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
  plugins: [
    patchCssModules({ generateSourceTypes: true }),
    svgPlugin({ jsxImportSource: "@/jsx" }),
    routeManifestPlugin(),
    cloudflarePlugin(),
  ],
  build: {
    target: "esnext",
    assetsDir: isSsrBuild ? "" : "assets",
    copyPublicDir: !isSsrBuild,
    rollupOptions: {
      treeshake: "recommended",
      input: {
        index: "@/server/worker",
        hydrate: "@/server/hydrate",
        global: "@/global",
        "pages-init": "@/routes/pages/init",
      },
      output: {
        manualChunks: {
          server: ["@/server/server"],
        },
      },
    },
  },
}));
