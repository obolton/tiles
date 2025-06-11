import { Prisma } from "@prisma/client";
import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import type { CreateSectionSchema, DeleteSectionSchema } from "./schema.ts";

export const SECTION_FIELDS = {
  id: true,
  title: true,
  type: true,
  layout: true,
  width: true,
} as const satisfies Prisma.CollectionSelect<ExtensionArgs>;

export async function createSection({ pageId, title }: CreateSectionSchema) {
  return prisma.collection.create({
    data: { pageId, type: "SECTION", title },
    select: SECTION_FIELDS,
  });
}

export async function deleteSection({ pageId, id }: DeleteSectionSchema) {
  return prisma.collection.delete({
    where: { pageId, id, type: "SECTION" },
    select: { id: true },
  });
}
