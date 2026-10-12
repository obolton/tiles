import { DEFAULT_FONT } from "fonts/config";
import { generateFontFaceCSS } from "@/utils/fonts";
import type { RouteMetadata } from "@/router/router";

export default {
  styles: [generateFontFaceCSS([DEFAULT_FONT])],
  scripts: [{ src: "/src/global.ts" }],
} satisfies RouteMetadata;
