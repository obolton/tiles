import prisma from "@/database/prisma";
import type { CreatePageLinkSchema } from "./schema";
import { createTile } from "../tiles/tiles";
import { PAGE_LINK_FIELDS } from "./fields";

export async function createPageLink({
  pageId,
  linkedPageId,
  ...properties
}: CreatePageLinkSchema) {
  if (pageId === linkedPageId) {
    throw new Error("Cannot link to the same page.");
  }

  const { pageLink, ...tile } = await createTile(
    {
      ...properties,
      pageId,
      type: "PAGE_LINK",
      pageLink: {
        pageId,
        linkedPageId,
      },
    },
    { pageLink: { select: PAGE_LINK_FIELDS } },
    prisma,
  );

  return { ...tile, ...pageLink! };
}
