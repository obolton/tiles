import { Buffer } from "node:buffer";
import prisma from "@/database/prisma";
import { createTile } from "../tiles/tiles";
import { getBackgroundProperties } from "@/utils/backgrounds";
import type { CreateTextSchema, UpdateTextSchema } from "./schema";
import type { Prisma } from "@/generated/prisma/client";
import type { ColorSchema } from "@/schema/Color";
import type { RichTextSchema } from "@/schema/RichText";
import { TEXT_FIELDS } from "./fields";

const DEFAULT_CONTENT: RichTextSchema = [{ type: "paragraph", children: [] }];

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
  content = DEFAULT_CONTENT,
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

  return { ...tile, ...text! };
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
