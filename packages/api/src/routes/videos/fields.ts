import type { ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const VIDEO_FIELDS = {
  id: true,
  videoType: true,
  videoId: true,
  imageUrl: true,
  title: true,
  description: true,
} as const satisfies Prisma.VideoTileSelect<ExtensionArgs>;
