import prisma, { type ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const TEXT_FIELDS = {
  id: true,
  content: true,
  align: true,
} as const satisfies Prisma.TextTileSelect<ExtensionArgs>;

export type Text = Prisma.Result<
  typeof prisma.textTile,
  { select: typeof TEXT_FIELDS },
  "findUniqueOrThrow"
>;
