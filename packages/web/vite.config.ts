import { resolve } from "node:path";
import svgPlugin from "./src/vite/svg";
import type { UserConfig } from "vite";

export default {
  envPrefix: "PUBLIC_",
  ssr: {
    external: ["node:assert", "node:crypto"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  plugins: [svgPlugin({ jsxImportSource: "@/jsx" })],
} satisfies UserConfig;
