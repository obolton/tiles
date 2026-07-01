import { createFilter, transformWithOxc } from "vite";
import { optimize, type Config } from "svgo";
import fs from "node:fs/promises";
import type { Plugin } from "vite";

const FILTER = "**/*.svg?jsx";

const SVGO_CONFIG: Config = {
  plugins: [
    "preset-default",
    {
      name: "removeAttrs",
      params: { attrs: "svg:fill" },
    },
  ],
};

export interface SVGPluginOptions {
  importSource?: string;
}

export default function svgPlugin({ importSource }: SVGPluginOptions = {}): Plugin {
  const filter = createFilter(FILTER);
  return {
    name: "svg-plugin",
    enforce: "pre",
    async load(id) {
      if (!filter(id)) {
        return;
      }
      const path = id.replace(/\?jsx$/, "");
      const contents = await fs.readFile(path, "utf-8");
      const { data } = optimize(contents, SVGO_CONFIG);

      const match = data.match(/^<svg([^>]*)>([\s\S]*)<\/svg>$/);
      if (!match) {
        throw new Error(`Invalid SVG file: ${path}`);
      }

      const [, attrs, children] = match;
      const component = `export default function Svg(props) { return <svg${attrs} {...props}>${children}</svg>; }`;

      return transformWithOxc(component, id, {
        lang: "jsx",
        jsx: {
          runtime: "automatic",
          importSource,
          development: this.environment.mode === "dev",
        },
      });
    },
  };
}
