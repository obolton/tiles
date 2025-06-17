import prisma from "@/database/prisma.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { CreateTextSchema, UpdateTextSchema } from "./schema.ts";
import type { Prisma } from "@prisma/client";

export const TEXT_FIELDS = {
  id: true,
  content: true,
  color: true,
  imageUrl: true,
  expand: true,
  align: true,
} as const satisfies Prisma.Args<typeof prisma.textTile, "findMany">["select"];

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
  width,
  height,
  expand,
  align,
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
        align,
      },
      select: TEXT_FIELDS,
    });
    const placement = await createTilePlacement(
      {
        pageId,
        parentCollectionId: collectionId,
        type: "TEXT",
        textTileId: text.id,
        width,
        height,
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
  align,
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
      align,
    },
    select: TEXT_FIELDS,
  });
  return { type: "TEXT" as const, ...text };
}
