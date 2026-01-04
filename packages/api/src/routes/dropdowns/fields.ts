import prisma, { type ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const DROPDOWN_FIELDS = {
  id: true,
  title: true,
  options: true,
} as const satisfies Prisma.DropdownSelect<ExtensionArgs>;

export type Dropdown = Prisma.Result<
  typeof prisma.dropdown,
  { select: typeof DROPDOWN_FIELDS },
  "findUniqueOrThrow"
>;
