import { DEFAULT_FONT } from "api/config/fonts";
import { generateFontFaceCSS } from "@/utils/fonts";
import type { RouteMetadata } from "@/router/router";

export default {
  styles: [generateFontFaceCSS([DEFAULT_FONT])],
  scripts: [{ src: "/src/global.ts" }],
} satisfies RouteMetadata;
