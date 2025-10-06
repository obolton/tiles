import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { getBackgroundProperties } from "@/utils/backgrounds.ts";
import type { Prisma } from "@/generated/prisma/client";
import type {
  CreateSectionSchema,
  UpdateSectionSchema,
  DeleteSectionSchema,
} from "./schema.ts";

export const SECTION_FIELDS = {
  id: true,
  layout: true,
  background: true,
} as const satisfies Prisma.SectionSelect<ExtensionArgs>;

export type Section = Prisma.Result<
  typeof prisma.section,
  { select: typeof SECTION_FIELDS },
  "findUniqueOrThrow"
>;

export async function createSection({
  pageId,
  background,
}: CreateSectionSchema) {
  return prisma.section.create({
    data: { pageId, ...getBackgroundProperties(background) },
    select: SECTION_FIELDS,
  });
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

export async function deleteSection({ pageId, id }: DeleteSectionSchema) {
  return prisma.section.delete({
    where: { pageId, id },
    select: { id: true },
  });
}
