import type { ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const FOLDER_FIELDS = {
  id: true,
  name: true,
} as const satisfies Prisma.FolderSelect<ExtensionArgs>;
