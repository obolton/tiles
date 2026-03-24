import { resolve } from "node:path";
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
    svgPlugin({ importSource: "@/jsx" }),
    routeManifestPlugin(),
    cloudflarePlugin(),
  ],
  build: {
    target: "esnext",
    assetsDir: isSsrBuild ? "" : "assets",
    copyPublicDir: !isSsrBuild,
    rolldownOptions: {
      treeshake: true,
      input: {
        index: "@/server/worker",
        hydrate: "@/server/hydrate",
        global: "@/global",
        "pages-init": "@/routes/pages/init",
      },
      output: {
        codeSplitting: {
          groups: [
            {
              test: "@/server/server",
              name: "server",
            },
          ],
        },
      },
    },
  },
}));
