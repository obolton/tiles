import type { ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { LIBRARY_PAGE_FIELDS } from "@/routes/pages/fields";

export const BOOKMARK_FIELDS = {
  page: { select: LIBRARY_PAGE_FIELDS },
} as const satisfies Prisma.BookmarkSelect<ExtensionArgs>;
