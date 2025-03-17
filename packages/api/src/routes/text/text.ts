import prisma from "@/database/prisma.ts";
import type { CreateTextSchema, UpdateTextSchema } from "./schema.ts";
import type { Prisma } from "@prisma/client";
import { createTilePlacement } from "../tiles/tiles.ts";

export const TEXT_FIELDS = {
  id: true,
  content: true,
  theme: true,
  hue: true,
  expand: true,
} as const satisfies Prisma.TextTileSelect;

export type Text = Prisma.TextTileGetPayload<{ select: typeof TEXT_FIELDS }>;

export async function createText({
  pageId,
  collectionId,
  content,
  theme,
  hue,
  columns,
  rows,
  expand,
}: CreateTextSchema) {
  return prisma.$transaction(async (transaction) => {
    const text = await transaction.textTile.create({
      data: {
        pageId,
        content,
        theme,
        hue,
        expand,
      },
      select: TEXT_FIELDS,
    });
    const placement = await createTilePlacement(
      {
        pageId,
        parentCollectionId: collectionId,
        type: "TEXT",
        textTileId: text.id,
        columns,
        rows,
      },
      transaction,
    );
    return { type: "TEXT" as const, ...text, ...placement };
  });
}

export async function updateText({
  pageId,
  id,
  content,
  theme,
  hue,
  expand,
}: UpdateTextSchema) {
  const text = await prisma.textTile.update({
    where: {
      pageId,
      id,
    },
    data: {
      content,
      theme,
      hue,
      expand,
    },
    select: TEXT_FIELDS,
  });
  return { type: "TEXT" as const, ...text };
}
