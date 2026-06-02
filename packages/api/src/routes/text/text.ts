import prisma from "@/database/prisma";
import { createTile } from "../tiles/tiles";
import type { CreateTextSchema } from "./schema";
import type { RichTextSchema } from "@/schema/RichText";
import { TEXT_FIELDS } from "./fields";

const DEFAULT_CONTENT: RichTextSchema = [{ type: "paragraph", children: [] }];

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
      textColor,
      background,
      text: {
        pageId,
        content,
        align,
      },
    },
    { text: { select: TEXT_FIELDS } },
    prisma,
  );

  return { ...tile, ...text! };
}
