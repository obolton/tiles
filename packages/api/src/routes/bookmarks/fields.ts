import type { ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_LINK_TILE_PAGE_FIELDS } from "@/routes/pageLinks/fields";

export const BOOKMARK_FIELDS = {
  page: { select: PAGE_LINK_TILE_PAGE_FIELDS },
} as const satisfies Prisma.BookmarkSelect<ExtensionArgs>;
