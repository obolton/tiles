import { getGoogleFontsUrl } from "@/utils/fonts";
import type { RouteMetadata } from "@/router/router";

export default {
  links: [{ rel: "stylesheet", href: getGoogleFontsUrl() }],
  scripts: [{ src: "/src/global" }],
} satisfies RouteMetadata;
