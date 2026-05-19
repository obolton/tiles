import prisma from "@/database/prisma";
import { createTile } from "../tiles/tiles";
import type { CreateSectionSchema } from "./schema";
import { SECTION_FIELDS } from "./fields";

export async function createSection({
  pageId,
  beforeId,
  layout,
  columns,
  mapStyle,
  background,
  ...properties
}: CreateSectionSchema) {
  const { section, ...tile } = await createTile(
    {
      ...properties,
      pageId,
      type: "SECTION",
      beforeId,
      sectionId: null,
      background,
      section: {
        pageId,
        layout,
        columns,
        mapStyle,
      },
    },
    { section: { select: SECTION_FIELDS } },
    prisma,
  );

  return { ...tile, ...section! };
}
