import { Buffer } from "node:buffer";
import prisma from "@/database/prisma";
import { createTile } from "../tiles/tiles";
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

function getTextColorProperties(
  textColor?: ColorSchema | null,
): Pick<Prisma.TextTileCreateInput, "textColor"> {
  if (typeof textColor === "undefined" || textColor === null) {
    return { textColor };
  }
  return { textColor: new Uint8Array(Buffer.from(textColor, "hex")) };
}

export async function createText({
  pageId,
  sectionId,
  content,
  textColor,
  background,
  align,
  ...properties
}: CreateTextSchema) {
  const { text, ...tile } = await createTile(
    {
      ...properties,
      type: "TEXT",
      pageId,
      sectionId,
      text: {
        pageId,
        content,
        ...getTextColorProperties(textColor),
        ...getBackgroundProperties(background),
        align,
      },
    },
    { text: { select: TEXT_FIELDS } },
    prisma,
  );
  return { ...tile, ...text };
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
