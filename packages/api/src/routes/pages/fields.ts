import prisma from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { THEME_FIELDS } from "@/routes/themes/fields";
import { DROPDOWN_FIELDS } from "@/routes/dropdowns/fields";
import { FULL_TILE_FIELDS } from "@/routes/tiles/fields";
import {
  PAGE_ACCESS_FIELDS,
  PAGE_INVITE_FIELDS,
} from "@/routes/collaboration/fields";

export const PAGE_FIELDS = {
  id: true,
  workspaceId: true,
  folderId: true,
  published: true,
  title: true,
  type: true,
  updatedAt: true,
  coverImageUrl: true,
  author: {
    select: {
      id: true,
      username: true,
      name: true,
      imageUrl: true,
    },
  },
  access: {
    select: PAGE_ACCESS_FIELDS,
  },
  invites: {
    select: PAGE_INVITE_FIELDS,
  },
  tiles: {
    select: FULL_TILE_FIELDS,
    orderBy: {
      order: "asc",
    },
  },
  dropdowns: {
    select: DROPDOWN_FIELDS,
  },
  document: {
    select: {
      snapshot: true,
    },
  },
} as const satisfies Prisma.Args<typeof prisma.page, "findMany">["select"];

export const LIBRARY_PAGE_FIELDS = {
  id: true,
  title: true,
  type: true,
  updatedAt: true,
  published: true,
  folderId: true,
  background: true,
  font: true,
  theme: {
    select: THEME_FIELDS,
  },
  author: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  },
  folder: {
    select: {
      id: true,
      name: true,
    },
  },
} as const satisfies Prisma.Args<typeof prisma.page, "findMany">["select"];

export type LibraryPage = Prisma.Result<
  typeof prisma.page,
  { select: typeof LIBRARY_PAGE_FIELDS },
  "findUniqueOrThrow"
>;
