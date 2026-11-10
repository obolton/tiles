import { SITE_NAME } from "@/constants/site";
import type { PageData } from "@/models/Page";

const PAGE_TYPE_LABELS: Record<PageData["type"], string> = {
  DOCUMENT: "document",
  PRESENTATION: "presentation",
  LAYOUT: "page",
};

/** A short, human-readable summary of a page for link previews and search results. */
export function getPageDescription(page: Pick<PageData, "type" | "author">) {
  return `A ${PAGE_TYPE_LABELS[page.type]} by ${page.author.name}, created with ${SITE_NAME}.`;
}

/** The shareable URL of a page, for visitors with the public link. */
export function getPublicPageUrl(pageId: string, origin = location.origin) {
  return new URL(`/pages/${pageId}`, origin).href;
}
