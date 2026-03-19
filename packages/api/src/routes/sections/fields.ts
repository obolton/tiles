import prisma, { type ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const SECTION_FIELDS = {
  id: true,
  layout: true,
  columns: true,
  mapStyle: true,
} as const satisfies Prisma.SectionSelect<ExtensionArgs>;

export type Section = Prisma.Result<
  typeof prisma.section,
  { select: typeof SECTION_FIELDS },
  "findUniqueOrThrow"
>;
