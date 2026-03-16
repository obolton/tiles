import prisma from "@/database/prisma";
import { createTile } from "../tiles/tiles";
import type { CreateSectionSchema, UpdateSectionSchema } from "./schema";
import { SECTION_FIELDS } from "./fields";

export async function createSection({
  pageId,
  beforeId,
  layout,
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
        mapStyle,
      },
    },
    { section: { select: SECTION_FIELDS } },
    prisma,
  );

  return { ...tile, ...section! };
}

export async function updateSection({
  pageId,
  id,
  layout,
  mapStyle,
}: UpdateSectionSchema) {
  return prisma.section.update({
    where: {
      pageId,
      id,
    },
    data: {
      layout,
      mapStyle,
    },
    select: SECTION_FIELDS,
  });
}
