import { generateKeyBetween } from "fractional-indexing";
import prisma, { type ExtensionArgs } from "@/database/prisma";
import { getBackgroundProperties } from "@/utils/backgrounds";
import {
  getFirstSectionOrderQuery,
  getSectionOrderQuery,
  duplicateSectionQuery,
} from "@/generated/prisma/sql";
import type { Prisma } from "@/generated/prisma/client";
import type { PrismaTransactionClient } from "@/database/prisma";
import type {
  CreateSectionSchema,
  UpdateSectionSchema,
  DuplicateSectionSchema,
  DeleteSectionSchema,
} from "./schema";

export const SECTION_FIELDS = {
  id: true,
  layout: true,
  anchor: true,
  dimensions: true,
  width: true,
  height: true,
  background: true,
  hide: true,
} as const satisfies Prisma.SectionSelect<ExtensionArgs>;

export type Section = Prisma.Result<
  typeof prisma.section,
  { select: typeof SECTION_FIELDS },
  "findUniqueOrThrow"
>;

export async function getSectionOrderKeys(
  transaction: PrismaTransactionClient,
  pageId: string,
  sectionId: string | null,
): Promise<[string | null, string | null]> {
  if (sectionId === null) {
    const [result] = await transaction.$queryRawTyped(
      getFirstSectionOrderQuery(pageId),
    );
    return [null, result?.order ?? null];
  }

  const [result] = await transaction.$queryRawTyped(
    getSectionOrderQuery(pageId, sectionId),
  );
  return [result?.a ?? null, result?.b ?? null];
}

export async function createSection({
  pageId,
  afterSectionId,
  layout,
  anchor,
  dimensions,
  width,
  height,
  background,
  hide,
}: CreateSectionSchema) {
  return prisma.$transaction(async (transaction) => {
    const [keyA, keyB] = await getSectionOrderKeys(
      transaction,
      pageId,
      afterSectionId,
    );
    const order = generateKeyBetween(keyA, keyB);

    return prisma.section.create({
      data: {
        pageId,
        order,
        layout,
        anchor,
        dimensions,
        width,
        height,
        hide,
        ...getBackgroundProperties(background),
      },
      select: SECTION_FIELDS,
    });
  });
}

export async function updateSection({
  pageId,
  id,
  layout,
  anchor,
  dimensions,
  width,
  height,
  background,
  hide,
  afterSectionId,
}: UpdateSectionSchema) {
  return prisma.$transaction(async (transaction) => {
    let order: string | undefined = undefined;
    if (typeof afterSectionId !== "undefined") {
      const [keyA, keyB] = await getSectionOrderKeys(
        transaction,
        pageId,
        afterSectionId,
      );
      order = generateKeyBetween(keyA, keyB);
    }

    return transaction.section.update({
      where: {
        pageId,
        id,
      },
      data: {
        layout,
        anchor,
        dimensions,
        width,
        height,
        hide,
        ...getBackgroundProperties(background),
        order,
      },
      select: SECTION_FIELDS,
    });
  });
}

// TODO: Duplicate tile relations (could be simplified by consolidating tables)
export async function duplicateSection({ pageId, id }: DuplicateSectionSchema) {
  return prisma.$transaction(async (transaction) => {
    const [keyA, keyB] = await getSectionOrderKeys(transaction, pageId, id);
    const order = generateKeyBetween(keyA, keyB);
    const result = await transaction.$queryRawTyped(
      duplicateSectionQuery(pageId, id, order),
    );
    const newSectionId = result[0]?.id;
    if (!newSectionId) {
      throw new Error("Could not duplicate section");
    }
    return transaction.section.findUniqueOrThrow({
      where: { pageId, id: newSectionId },
      select: SECTION_FIELDS,
    });
  });
}

export async function deleteSection({ pageId, id }: DeleteSectionSchema) {
  return prisma.section.delete({
    where: { pageId, id },
    select: { id: true },
  });
}
