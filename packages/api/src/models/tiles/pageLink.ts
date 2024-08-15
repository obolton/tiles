import type { Prisma } from "@prisma/client";
import type {
  CreatePageLinkTileSchema,
  UpdatePageLinkTileSchema,
} from "./schema.ts";

export const PAGE_LINK_TILE_PAGE_FIELDS = {
  id: true,
  title: true,
  subtitle: true,
  hue: true,
  font: true,
  author: {
    select: {
      id: true,
      name: true,
      imageKey: true,
    },
  },
  tiles: {
    where: { type: "IMAGE" },
    select: {
      image: {
        select: {
          imageKey: true,
        },
      },
    },
    orderBy: {
      position: "asc",
    },
    take: 1,
  },
} as const;

export async function createPageLinkTile(
  db: Prisma.TransactionClient,
  { pageId, pageLink: { pageId: linkedPageId } }: CreatePageLinkTileSchema,
  position: number,
) {
  if (pageId === linkedPageId) {
    throw new Error("Cannot link to the same page.");
  }
  return db.tile.create({
    data: {
      pageId,
      type: "PAGE_LINK",
      position,
      columns: 1,
      rows: 1,
      pageLink: {
        create: {
          pageId: linkedPageId,
        },
      },
    },
    select: {
      id: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      pageLink: {
        select: {
          pageId: true,
          page: {
            select: PAGE_LINK_TILE_PAGE_FIELDS,
          },
        },
      },
    },
  });
}

export async function updatePageLinkTile(
  db: Prisma.TransactionClient,
  { id, pageLink: { pageId: linkedPageId } }: UpdatePageLinkTileSchema,
) {
  return db.tile.update({
    where: {
      id,
    },
    data: {
      pageLink: {
        update: {
          pageId: linkedPageId,
        },
      },
    },
    select: {
      id: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      pageLink: {
        select: {
          pageId: true,
          page: {
            select: PAGE_LINK_TILE_PAGE_FIELDS,
          },
        },
      },
    },
  });
}
