import prisma, { type ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const TABLE_COLUMN_FIELDS = {
  id: true,
  title: true,
  width: true,
  background: true,
} as const satisfies Prisma.TableColumnSelect<ExtensionArgs>;

export const TABLE_ROW_FIELDS = {
  id: true,
  height: true,
  data: true,
  background: true,
} as const satisfies Prisma.TableRowSelect<ExtensionArgs>;

export const TABLE_FIELDS = {
  id: true,
} as const satisfies Prisma.TableSelect<ExtensionArgs>;

export const TABLE_WITH_DATA_FIELDS = {
  ...TABLE_FIELDS,
  columns: {
    select: TABLE_COLUMN_FIELDS,
    orderBy: {
      order: "asc",
    },
  },
  rows: {
    select: TABLE_ROW_FIELDS,
    orderBy: {
      order: "asc",
    },
    take: 10,
  },
} as const satisfies Prisma.TableSelect<ExtensionArgs>;

export type TableWithData = Prisma.Result<
  typeof prisma.table,
  { select: typeof TABLE_WITH_DATA_FIELDS },
  "findUniqueOrThrow"
>;
