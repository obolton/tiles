import { escapeUTF8 } from "entities";
import { tag, escapeTagContents } from "jsx/html";
import { resolveImport } from "./assets";
import { SITE_DESCRIPTION, SITE_NAME, THEME_COLOR } from "@/constants/site";
import type { RouteMetadata } from "@/router/router";

export interface HeadOptions {
  url: URL;
  stylesheets: string[];
  metadata: RouteMetadata;
  title?: string;
  description?: string;
  hydrate?: "immediate" | "deferred" | null;
}

function renderSocialTags(url: URL, title: string, description: string) {
  // Query strings (e.g. ?version=) must not leak into the canonical share URL.
  const canonicalUrl = new URL(url.pathname, url.origin).href;

  let chunk = "";
  chunk += tag("meta", { property: "og:site_name", content: SITE_NAME });
  chunk += tag("meta", { property: "og:type", content: "website" });
  chunk += tag("meta", { property: "og:title", content: title });
  chunk += tag("meta", { property: "og:description", content: description });
  chunk += tag("meta", { property: "og:url", content: canonicalUrl });
  chunk += tag("meta", { name: "twitter:card", content: "summary" });
  chunk += tag("meta", { name: "twitter:title", content: title });
  chunk += tag("meta", { name: "twitter:description", content: description });
  return chunk;
}

export function renderHead({
  url,
  stylesheets,
  metadata,
  title = SITE_NAME,
  description = SITE_DESCRIPTION,
  hydrate,
}: HeadOptions) {
  let chunk = "<head>";
  chunk += tag("meta", { charset: "utf-8" });
  chunk += tag("meta", { name: "viewport", content: "width=device-width, initial-scale=1" });
  chunk += tag("title", {}, escapeUTF8(title));
  chunk += tag("meta", { name: "description", content: description });
  chunk += tag("meta", { name: "theme-color", content: THEME_COLOR });
  chunk += tag("link", { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" });
  chunk += renderSocialTags(url, title, description);

  for (const stylesheet of stylesheets) {
    chunk += tag("link", { rel: "stylesheet", href: stylesheet });
  }

  if (metadata.links) {
    for (const link of metadata.links) {
      chunk += tag("link", {
        rel: link.rel,
        href: link.href,
        as: link.as,
        type: link.type,
        crossorigin: link.crossorigin,
      });
    }
  }

  if (metadata.styles) {
    for (const style of metadata.styles) {
      chunk += tag("style", {}, escapeTagContents(style.content));
    }
  }

  if (metadata.scripts) {
    for (const script of metadata.scripts) {
      chunk += tag("script", {
        type: "module",
        src: resolveImport(script.src),
      });
    }
  }

  if (hydrate === "immediate") {
    chunk += tag("script", {
      type: "module",
      src: resolveImport("/src/server/hydrate.ts"),
    });
  }

  if (import.meta.env.DEV) {
    chunk += tag("script", { type: "module", src: "/@vite/client" });
  }

  chunk += "</head>";
  return chunk;
}
