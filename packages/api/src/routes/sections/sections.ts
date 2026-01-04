import prisma from "@/database/prisma";
import { getBackgroundProperties } from "@/utils/backgrounds";
import { createTile } from "../tiles/tiles";
import type { CreateSectionSchema, UpdateSectionSchema } from "./schema";
import { SECTION_FIELDS } from "./fields";

export async function createSection({
  pageId,
  afterId,
  layout,
  background,
  ...properties
}: CreateSectionSchema) {
  const { section, ...tile } = await createTile(
    {
      ...properties,
      pageId,
      type: "SECTION",
      afterId,
      sectionId: null,
      section: {
        pageId,
        layout,
        ...getBackgroundProperties(background),
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
  background,
}: UpdateSectionSchema) {
  return prisma.section.update({
    where: {
      pageId,
      id,
    },
    data: {
      layout,
      ...getBackgroundProperties(background),
    },
    select: SECTION_FIELDS,
  });
}
