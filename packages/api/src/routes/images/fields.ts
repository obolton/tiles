import prisma, { type ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const IMAGE_FIELDS = {
  id: true,
  imageUrl: true,
  alt: true,
  text: true,
  originX: true,
  originY: true,
  image: {
    select: {
      width: true,
      height: true,
    },
  },
} as const satisfies Prisma.ImageTileSelect<ExtensionArgs>;

export type Image = Prisma.Result<
  typeof prisma.imageTile,
  { select: typeof IMAGE_FIELDS },
  "findUniqueOrThrow"
>;
