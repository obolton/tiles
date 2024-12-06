import prisma from "@/database/prisma.ts";
import type { Prisma } from "@prisma/client";
import type { CreateHeadingSchema, UpdateHeadingSchema } from "./schema.ts";
import { createTilePlacement } from "../tiles/tiles.ts";

export const HEADING_FIELDS = {
  id: true,
  content: true,
} as const satisfies Prisma.HeadingTileSelect;

export async function createHeading({ pageId, content }: CreateHeadingSchema) {
  return prisma.$transaction(async (transaction) => {
    const heading = await transaction.headingTile.create({
      data: {
        content,
      },
      select: HEADING_FIELDS,
    });
    const placement = await createTilePlacement(
      {
        pageId,
        type: "HEADING",
        headingTileId: heading.id,
      },
      transaction,
    );
    return { type: "HEADING" as const, ...heading, ...placement };
  });
}

export async function updateHeading({ id, content }: UpdateHeadingSchema) {
  const heading = await prisma.headingTile.update({
    where: {
      id,
    },
    data: {
      content,
    },
    select: HEADING_FIELDS,
  });
  return { type: "HEADING" as const, ...heading };
}
