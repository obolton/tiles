import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import type { Plugin } from "vite";

interface CloudflarePagesRoutesConfig {
  version: number;
  include?: string[];
  exclude?: string[];
}

const STATIC_ASSET_HEADERS: Record<string, string> = {
  "Cache-Control": "public, max-age=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
};

function getHeadersConfig(assetsPath: string) {
  let config = assetsPath + "/*\n";

  for (const [name, value] of Object.entries(STATIC_ASSET_HEADERS)) {
    config += "  " + name + ": " + value + "\n";
  }

  return config;
}

export default function cloudflarePlugin(): Plugin {
  let isSSR = false;
  let outDir = "";
  let assetsPath = "/assets";

  return {
    name: "cloudflare-plugin",
    enforce: "post",

    configResolved(config) {
      isSSR = !!config.build.ssr;
      outDir = config.build.outDir;
      assetsPath = config.base + config.build.assetsDir;
    },

    async closeBundle() {
      if (isSSR) {
        return;
      }

      const routesConfig: CloudflarePagesRoutesConfig = {
        version: 1,
        include: ["/*"],
        exclude: ["/favicon.ico", assetsPath + "/*"],
      };

      await writeFile(
        resolve(outDir, "./_routes.json"),
        JSON.stringify(routesConfig, null, 2),
        "utf-8",
      );

      const headersConfig = getHeadersConfig(assetsPath);

      await writeFile(resolve(outDir, "_headers"), headersConfig, "utf-8");
    },
  };
}
