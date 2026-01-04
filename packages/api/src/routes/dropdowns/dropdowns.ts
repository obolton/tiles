import prisma from "@/database/prisma.ts";
import type {
  CreateDropdownSchema,
  UpdateDropdownSchema,
  DeleteDropdownSchema,
} from "./schema.ts";
import { DROPDOWN_FIELDS } from "./fields";

export async function createDropdown({
  pageId,
  title,
  options,
}: CreateDropdownSchema) {
  return prisma.dropdown.create({
    data: {
      pageId,
      title,
      options,
    },
    select: DROPDOWN_FIELDS,
  });
}

export async function updateDropdown({
  pageId,
  id,
  title,
  options,
}: UpdateDropdownSchema) {
  return prisma.dropdown.update({
    where: {
      pageId,
      id,
    },
    data: {
      title,
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
