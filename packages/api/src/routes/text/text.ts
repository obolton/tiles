import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { CreateTextSchema, UpdateTextSchema } from "./schema.ts";
import type { Prisma } from "@prisma/client";

export const TEXT_FIELDS = {
  id: true,
  content: true,
  lightness: true,
  chroma: true,
  hue: true,
  imageUrl: true,
  expand: true,
} as const satisfies Prisma.TextTileSelect<ExtensionArgs>;

export type Text = Prisma.Result<
  typeof prisma.textTile,
  { select: typeof TEXT_FIELDS },
  "findUniqueOrThrow"
>;

export async function createText({
  pageId,
  collectionId,
  content,
  color,
  imageKey,
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
        imageKey,
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
  imageKey,
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
      imageKey,
      expand,
    },
    select: TEXT_FIELDS,
  });
  return { type: "TEXT" as const, ...text };
}
