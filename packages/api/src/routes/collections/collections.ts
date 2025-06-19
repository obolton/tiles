import { type ExtensionArgs } from "@/database/prisma.ts";
import type { Prisma } from "@prisma/client";

export const COLLECTION_FIELDS = {
  id: true,
  type: true,
  layout: true,
  width: true,
  title: true,
} as const satisfies Prisma.CollectionSelect<ExtensionArgs>;
