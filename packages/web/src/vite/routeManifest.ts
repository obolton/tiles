import { resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import type { Plugin, Manifest } from "vite";

type RouteManifest = Record<string, string[]>;

function recursivelyCollectStylesheets(
  path: string,
  manifest: Manifest,
  basePath: string,
  seen: Set<string>,
  stylesheets: string[],
) {
  if (seen.has(path)) {
    return;
  }
  seen.add(path);
  const chunk = manifest[path];
  if (!chunk) {
    return;
  }

  if (chunk.css) {
    for (const stylesheet of chunk.css) {
      const path = basePath + stylesheet;
      if (!stylesheets.includes(path)) {
        stylesheets.push(path);
      }
    }
  }

  if (chunk.imports) {
    for (const importPath of chunk.imports) {
      recursivelyCollectStylesheets(importPath, manifest, basePath, seen, stylesheets);
    }
  }
}

function getStylesheets(path: string, basePath: string, manifest: Manifest) {
  const stylesheets: string[] = [];
  const seen = new Set<string>();
  recursivelyCollectStylesheets(path, manifest, basePath, seen, stylesheets);
  return stylesheets;
}

export default function routeManifestPlugin(): Plugin {
  let isSSR = false;
  let outDir = "";
  let basePath = "/";

  return {
    name: "route-manifest-plugin",
    enforce: "post",

    config(_, env) {
      if (!env.isSsrBuild) {
        return { build: { manifest: true } };
      }
    },

    configResolved(config) {
      isSSR = !!config.build.ssr;
      outDir = config.build.outDir;
      basePath = config.base;
    },

    async closeBundle() {
      if (isSSR) {
        return;
      }

      const viteManifestPath = resolve(outDir, "./.vite/manifest.json");
      const viteManifest = JSON.parse(await readFile(viteManifestPath, "utf-8")) as Manifest;

      const routeModules = Object.keys(viteManifest).filter((path) =>
        path.startsWith("src/routes/"),
      );

      const routeManifest: RouteManifest = {};

      for (const path of routeModules) {
        routeManifest[path] = getStylesheets(path, basePath, viteManifest);
      }

      await writeFile(
        resolve(outDir, "./route-manifest.json"),
        JSON.stringify(routeManifest, null, 2),
        "utf-8",
      );
    },
  };
}
