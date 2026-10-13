import { SITE_NAME } from "@/constants/site";
import type { PageData } from "@/models/Page";

const PAGE_TYPE_LABELS: Record<PageData["type"], string> = {
  DOCUMENT: "document",
  PRESENTATION: "presentation",
  COLLECTION: "collection",
  FREE: "page",
};

/** A short, human-readable summary of a page for link previews and search results. */
export function getPageDescription(page: Pick<PageData, "type" | "author">) {
  return `A ${PAGE_TYPE_LABELS[page.type]} by ${page.author.name}, created with ${SITE_NAME}.`;
}
