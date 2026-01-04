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
  theme: {
    select: THEME_FIELDS,
  },
  published: true,
  title: true,
  updatedAt: true,
  backgroundColor: true,
  font: true,
  coverImageUrl: true,
  dockTopHeight: true,
  dockBottomHeight: true,
  dockLeftWidth: true,
  dockRightWidth: true,
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
} as const satisfies Prisma.Args<typeof prisma.page, "findMany">["select"];
