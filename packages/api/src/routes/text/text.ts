import prisma from "@/database/prisma";
import { createTilePlacement } from "../tiles/tiles";
import type { CreateTextSchema, UpdateTextSchema } from "./schema";
import type { Prisma } from "@/generated/prisma/client";
import type { ColorSchema } from "@/schema/Color";
import { getBackgroundProperties } from "@/utils/backgrounds";

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
  align,
  ...tile
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
        ...tile,
        type: "TEXT",
        pageId,
        sectionId,
        textTileId: text.id,
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
