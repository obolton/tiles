import { VERSION_FIELDS } from "@/collaboration/versions";
import type { ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const VERSION_DOCUMENT_FIELDS = {
  ...VERSION_FIELDS,
  snapshot: true,
  schemaVersion: true,
} as const satisfies Prisma.PageVersionSelect<ExtensionArgs>;

export const COPY_PAGE_FIELDS = {
  title: true,
  type: true,
} as const satisfies Prisma.PageSelect<ExtensionArgs>;
