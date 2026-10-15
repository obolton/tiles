import path from "node:path";
import { mergeConfig, type ViteUserConfig } from "vitest/config";

// Base config for every package: the `@` alias mirrors the `paths` in each package's tsconfig.
export function definePackageConfig(packageRoot: string, config: ViteUserConfig): ViteUserConfig {
  const base: ViteUserConfig = {
    resolve: {
      alias: {
        "@": path.resolve(packageRoot, "src"),
      },
    },
    test: {
      clearMocks: true,
      restoreMocks: true,
    },
  };
  return mergeConfig(base, config);
}
