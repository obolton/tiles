import type { ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const IMAGE_FIELDS = {
  id: true,
} as const satisfies Prisma.ImageSelect<ExtensionArgs>;
