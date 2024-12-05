import prisma from "@/database/prisma.ts";
import type { CreateTextSchema, UpdateTextSchema } from "./schema.ts";
import type { Prisma } from "@prisma/client";
import { createTilePlacement } from "../tiles/tiles.ts";

export const TEXT_FIELDS = {
  id: true,
  content: true,
  theme: true,
  hue: true,
} as const satisfies Prisma.TextTileSelect;

export async function createText({
  pageId,
  content,
  theme,
  hue,
}: CreateTextSchema) {
  return prisma.$transaction(async (transaction) => {
    const text = await transaction.textTile.create({
      data: {
        content,
        theme,
        hue,
      },
      select: TEXT_FIELDS,
    });
    const placement = await createTilePlacement(
      {
        pageId,
        type: "TEXT",
        textTileId: text.id,
      },
      transaction,
    );
    return { type: "TEXT", ...text, ...placement };
  });
}

export async function updateText({
  id,
  content,
  theme,
  hue,
}: UpdateTextSchema) {
  const text = prisma.textTile.update({
    where: {
      id,
    },
    data: {
      content,
      theme,
      hue,
    },
    select: TEXT_FIELDS,
  });
  return { type: "TEXT", ...text };
}
