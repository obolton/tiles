import { generateKeyBetween } from "fractional-indexing";
import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { getBackgroundProperties } from "@/utils/backgrounds.ts";
import type { Prisma } from "@/generated/prisma/client";
import type { PrismaTransactionClient } from "@/database/prisma.ts";
import type {
  CreateSectionSchema,
  UpdateSectionSchema,
  DeleteSectionSchema,
} from "./schema.ts";

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
    const [section] = await transaction.$queryRaw<
      { order: string }[]
    >`SELECT "order" FROM sections WHERE page_id = ${pageId}::uuid ORDER BY "order" ASC LIMIT 1;`;
    return [null, section?.order ?? null];
  }

  const [result] = await transaction.$queryRaw<
    { a: string; b: string | null }[]
  >`SELECT section_a."order" AS a, section_b."order" AS b
  FROM sections AS section_a
  LEFT JOIN LATERAL (
    SELECT "order" FROM sections
    WHERE page_id = ${pageId}::uuid AND "order" > section_a."order"
    ORDER BY "order" ASC
    LIMIT 1
  ) AS section_b ON true
  WHERE section_a.page_id = ${pageId}::uuid AND section_a.id = ${sectionId}::uuid;`;
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

export async function deleteSection({ pageId, id }: DeleteSectionSchema) {
  return prisma.section.delete({
    where: { pageId, id },
    select: { id: true },
  });
}
