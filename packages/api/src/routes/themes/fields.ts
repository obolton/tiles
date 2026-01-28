import prisma, { type ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const THEME_FIELDS = {
  id: true,
  workspaceId: true,
  name: true,
  colors: true,
  fonts: true,
  border: true,
} as const satisfies Prisma.ThemeSelect<ExtensionArgs>;

export type Theme = Prisma.Result<
  typeof prisma.theme,
  { select: typeof THEME_FIELDS },
  "findUniqueOrThrow"
>;
