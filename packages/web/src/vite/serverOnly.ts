import { relative } from "node:path";
import type { Plugin, Rollup } from "vite";

interface ServerOnlyPluginOptions {
  /** Modules that must never be loaded by the browser. */
  modules: string[];
  /** Names of the entry chunks that the browser loads. */
  clientEntries: string[];
}

function isChunk(output: Rollup.OutputAsset | Rollup.OutputChunk): output is Rollup.OutputChunk {
  return output.type === "chunk";
}

/**
 * Fails the client build when a server-only module is reachable from a browser entry.
 */
export default function serverOnlyPlugin({
  modules,
  clientEntries,
}: ServerOnlyPluginOptions): Plugin {
  let isSSR = false;
  let root = "";
  const ids = new Set<string>();

  return {
    name: "server-only",

    configResolved(config) {
      isSSR = !!config.build.ssr;
      root = config.root;
    },

    async buildStart() {
      for (const module of modules) {
        const resolved = await this.resolve(module);
        if (!resolved) {
          throw new Error(`Cannot resolve server-only module: ${module}`);
        }
        ids.add(resolved.id);
      }
    },

    // Runs after the outputs are written so that the other plugins' close hooks still succeed.
    writeBundle(_, bundle) {
      if (isSSR) {
        return;
      }

      const chunks = new Map(
        Object.values(bundle)
          .filter(isChunk)
          .map((chunk) => [chunk.fileName, chunk]),
      );

      for (const entry of chunks.values()) {
        if (!entry.isEntry || !clientEntries.includes(entry.name)) {
          continue;
        }

        // Chunks appended during the walk are visited too, so this covers the whole import graph.
        const reachable = [entry.fileName];
        for (const fileName of reachable) {
          const chunk = chunks.get(fileName);
          if (!chunk) {
            continue;
          }
          const id = chunk.moduleIds.find((moduleId) => ids.has(moduleId));
          if (id) {
            this.error(
              `${relative(root, id)} is server-only but is reachable from the "${entry.name}" entry`,
            );
          }
          for (const imported of [...chunk.imports, ...chunk.dynamicImports]) {
            if (!reachable.includes(imported)) {
              reachable.push(imported);
            }
          }
        }
      }
    },
  };
}
