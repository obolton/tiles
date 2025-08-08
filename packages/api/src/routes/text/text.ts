import prisma from "@/database/prisma.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { CreateTextSchema, UpdateTextSchema } from "./schema.ts";
import type { Prisma } from "@prisma/client";

export const TEXT_FIELDS = {
  id: true,
  content: true,
  background: true,
  align: true,
} as const satisfies Prisma.Args<typeof prisma.textTile, "findMany">["select"];

export type Text = Prisma.Result<
  typeof prisma.textTile,
  { select: typeof TEXT_FIELDS },
  "findUniqueOrThrow"
>;

export async function createText({
  pageId,
  sectionId,
  content,
  background,
  width,
  height,
  align,
}: CreateTextSchema) {
  const color = background && "color" in background ? background.color : null;
  const imageKey =
    background && "imageKey" in background ? background.imageKey : null;

  return prisma.$transaction(async (transaction) => {
    const text = await transaction.textTile.create({
      data: {
        pageId,
        content,
        lightness: color?.l,
        chroma: color?.c,
        hue: color?.h,
        imageKey,
        align,
      },
      select: TEXT_FIELDS,
    });
    const placement = await createTilePlacement(
      {
        pageId,
        sectionId,
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
  background,
  align,
}: UpdateTextSchema) {
  // TODO: This can be simplified by sharing the same color schema between frontend and backend
  const color = background && "color" in background ? background.color : null;
  const imageKey =
    background && "imageKey" in background ? background.imageKey : null;

  const text = await prisma.textTile.update({
    where: {
      pageId,
      id,
    },
    data: {
      content,
      lightness:
        typeof background !== "undefined"
          ? color
            ? color.l
            : null
          : undefined,
      chroma:
        typeof background !== "undefined"
          ? color
            ? color.c
            : null
          : undefined,
      hue:
        typeof background !== "undefined"
          ? color
            ? color.h
            : null
          : undefined,
      imageKey: typeof background !== "undefined" ? imageKey : undefined,
      align,
    },
    select: TEXT_FIELDS,
  });
  return { type: "TEXT" as const, ...text };
}
