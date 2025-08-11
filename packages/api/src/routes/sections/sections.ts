import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import type { Prisma } from "@prisma/client";
import type {
  CreateSectionSchema,
  UpdateSectionSchema,
  DeleteSectionSchema,
} from "./schema.ts";

export const SECTION_FIELDS = {
  id: true,
  layout: true,
  width: true,
} as const satisfies Prisma.SectionSelect<ExtensionArgs>;

export async function createSection({ pageId }: CreateSectionSchema) {
  return prisma.section.create({
    data: { pageId },
    select: SECTION_FIELDS,
  });
}

export async function updateSection({
  pageId,
  id,
  layout,
  width,
}: UpdateSectionSchema) {
  return prisma.section.update({
    where: {
      pageId,
      id,
    },
    data: {
      layout,
      width,
    },
    select: SECTION_FIELDS,
  });
}

export async function deleteSection({ pageId, id }: DeleteSectionSchema) {
  return prisma.section.delete({
    where: { pageId, id },
    select: { id: true },
  });
}
