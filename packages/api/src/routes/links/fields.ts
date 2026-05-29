import type { ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const LINK_FIELDS = {
  id: true,
  url: true,
  title: true,
  description: true,
  siteName: true,
  imageId: true,
} as const satisfies Prisma.LinkTileSelect<ExtensionArgs>;
