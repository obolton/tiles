import { createFilter, transformWithEsbuild } from "vite";
import { transform } from "@svgr/core";
import jsx from "@svgr/plugin-jsx";
import fs from "node:fs/promises";
import type { Plugin } from "vite";

const FILTER = "**/*.svg?jsx";

interface SVGPluginOptions {
  jsxImportSource?: string;
}

export default function svgPlugin({
  jsxImportSource,
}: SVGPluginOptions = {}): Plugin {
  const filter = createFilter(FILTER);
  return {
    name: "svg-plugin",
    enforce: "pre",
    async load(id) {
      if (!filter(id)) {
        return;
      }
      const path = id.replace(/\?jsx$/, "");
      const data = await fs.readFile(path, "utf-8");
      const component = await transform(data, {
        plugins: [jsx],
        jsxRuntime: "automatic",
      });
      return transformWithEsbuild(component, id, {
        loader: "jsx",
        jsx: "automatic",
        jsxImportSource,
      });
    },
  };
}
