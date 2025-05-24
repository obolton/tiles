import prisma from "@/database/prisma.ts";
import type { CreateTextSchema, UpdateTextSchema } from "./schema.ts";
import type { Prisma } from "@prisma/client";
import { createTilePlacement } from "../tiles/tiles.ts";

export const TEXT_FIELDS = {
  id: true,
  content: true,
  lightness: true,
  chroma: true,
  hue: true,
  expand: true,
} as const satisfies Prisma.TextTileSelect;

export type Text = Prisma.TextTileGetPayload<{ select: typeof TEXT_FIELDS }>;

export async function createText({
  pageId,
  collectionId,
  content,
  color,
  columns,
  rows,
  expand,
}: CreateTextSchema) {
  return prisma.$transaction(async (transaction) => {
    const text = await transaction.textTile.create({
      data: {
        pageId,
        content,
        lightness: color ? color.l : undefined,
        chroma: color ? color.c : undefined,
        hue: color ? color.h : undefined,
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
  color,
  expand,
}: UpdateTextSchema) {
  const text = await prisma.textTile.update({
    where: {
      pageId,
      id,
    },
    data: {
      content,
      lightness: color ? color.l : color === null ? null : undefined,
      chroma: color ? color.c : color === null ? null : undefined,
      hue: color ? color.h : color === null ? null : undefined,
      expand,
    },
    select: TEXT_FIELDS,
  });
  return { type: "TEXT" as const, ...text };
}
