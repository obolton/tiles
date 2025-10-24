import { generateKeyBetween } from "fractional-indexing";
import prisma, { type ExtensionArgs } from "@/database/prisma";
import { getBackgroundProperties } from "@/utils/backgrounds";
import {
  getFirstTileOrderQuery,
  getTileOrderQuery,
  duplicateSectionQuery,
} from "@/generated/prisma/sql";
import { createTile } from "../tiles/tiles";
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
  background: true,
} as const satisfies Prisma.SectionSelect<ExtensionArgs>;

export type Section = Prisma.Result<
  typeof prisma.section,
  { select: typeof SECTION_FIELDS },
  "findUniqueOrThrow"
>;

export async function getSectionOrder(
  transaction: PrismaTransactionClient,
  pageId: string,
  afterSectionId: string | null,
): Promise<string> {
  if (afterSectionId === null) {
    const [result] = await transaction.$queryRawTyped(
      getFirstTileOrderQuery(pageId, null),
    );
    return generateKeyBetween(null, result?.order ?? null);
  }

  const [result] = await transaction.$queryRawTyped(
    getTileOrderQuery(pageId, null, afterSectionId),
  );
  return generateKeyBetween(result?.a ?? null, result?.b ?? null);
}

export async function createSection({
  pageId,
  layout,
  background,
  ...properties
}: CreateSectionSchema) {
  const { section, ...tile } = await createTile(
    {
      ...properties,
      type: "SECTION",
      pageId,
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
  return { ...tile, ...section };
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

// TODO: Duplicate tile relations (could be simplified by consolidating tables)
export async function duplicateSection({ pageId, id }: DuplicateSectionSchema) {
  return prisma.$transaction(async (transaction) => {
    const order = await getSectionOrder(transaction, pageId, id);
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
