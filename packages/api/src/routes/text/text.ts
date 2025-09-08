import prisma from "@/database/prisma.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { CreateTextSchema, UpdateTextSchema } from "./schema.ts";
import type { Prisma } from "@prisma/client";
import type { ColorSchema } from "@/schema/Color.ts";
import { getBackgroundProperties } from "@/utils/backgrounds.ts";

export const TEXT_FIELDS = {
  id: true,
  content: true,
  textColor: true,
  background: true,
  align: true,
} as const satisfies Prisma.Args<typeof prisma.textTile, "findMany">["select"];

export type Text = Prisma.Result<
  typeof prisma.textTile,
  { select: typeof TEXT_FIELDS },
  "findUniqueOrThrow"
>;

type TextColorProperties = Required<
  Pick<Prisma.TextTileCreateInput, "textL" | "textC" | "textH">
>;

function getTextColorProperties(
  textColor?: ColorSchema | null,
): TextColorProperties | undefined {
  if (typeof textColor === "undefined") {
    return undefined;
  }

  if (textColor === null) {
    return {
      textL: null,
      textC: null,
      textH: null,
    };
  }

  return {
    textL: textColor.l,
    textC: textColor.c,
    textH: textColor.h,
  };
}

export async function createText({
  pageId,
  sectionId,
  content,
  textColor,
  background,
  width,
  height,
  rowSpan,
  x,
  y,
  block,
  align,
}: CreateTextSchema) {
  return prisma.$transaction(async (transaction) => {
    const text = await transaction.textTile.create({
      data: {
        pageId,
        content,
        ...getTextColorProperties(textColor),
        ...getBackgroundProperties(background),
        align,
      },
      select: TEXT_FIELDS,
    });
    const placement = await createTilePlacement(
      {
        type: "TEXT",
        pageId,
        sectionId,
        textTileId: text.id,
        width,
        height,
        rowSpan,
        x,
        y,
        block,
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
  textColor,
  background,
  align,
}: UpdateTextSchema) {
  const text = await prisma.textTile.update({
    where: {
      pageId,
      id,
    },
    data: {
      content,
      ...getTextColorProperties(textColor),
      ...getBackgroundProperties(background),
      align,
    },
    select: TEXT_FIELDS,
  });
  return { type: "TEXT" as const, ...text };
}
