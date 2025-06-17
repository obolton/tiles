import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import type { Prisma } from "@prisma/client";
import type { UpdateCollectionSchema } from "./schema.ts";
import { cleanSingleLineInput } from "@/utils/text.ts";

export const COLLECTION_FIELDS = {
  id: true,
  type: true,
  layout: true,
  width: true,
  title: true,
} as const satisfies Prisma.CollectionSelect<ExtensionArgs>;

export async function updateCollection({
  pageId,
  id,
  layout,
  width,
  title,
}: UpdateCollectionSchema) {
  const collection = await prisma.collection.update({
    where: {
      pageId,
      id,
    },
    data: {
      layout,
      width,
      title:
        typeof title === "string" ? cleanSingleLineInput(title) : undefined,
    },
    select: COLLECTION_FIELDS,
  });
  return collection;
}
