import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import type {
  CreateDropdownSchema,
  UpdateDropdownSchema,
  DeleteDropdownSchema,
} from "./schema.ts";
import type { Prisma } from "@prisma/client";

export const DROPDOWN_FIELDS = {
  id: true,
  options: true,
} as const satisfies Prisma.DropdownSelect<ExtensionArgs>;

export async function createDropdown({
  pageId,
  options,
}: CreateDropdownSchema) {
  return prisma.dropdown.create({
    data: {
      pageId,
      options,
    },
    select: DROPDOWN_FIELDS,
  });
}

export async function updateDropdown({
  pageId,
  id,
  options,
}: UpdateDropdownSchema) {
  return prisma.dropdown.update({
    where: {
      pageId,
      id,
    },
    data: {
      options,
    },
    select: DROPDOWN_FIELDS,
  });
}

export async function deleteDropdown({ pageId, id }: DeleteDropdownSchema) {
  return prisma.dropdown.delete({
    where: {
      pageId,
      id,
    },
    select: { id: true },
  });
}
