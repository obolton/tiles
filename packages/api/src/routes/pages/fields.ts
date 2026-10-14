import prisma from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_ACCESS_FIELDS, PAGE_INVITE_FIELDS } from "@/routes/collaboration/fields";

export const PUBLIC_PAGE_FIELDS = {
  id: true,
  workspaceId: true,
  folderId: true,
  published: true,
  title: true,
  type: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      username: true,
      name: true,
      imageUrl: true,
    },
  },
  document: {
    select: {
      snapshot: true,
    },
  },
} as const satisfies Prisma.Args<typeof prisma.page, "findMany">["select"];

// Collaborator and invite details are only returned to the author and collaborators.
export const PAGE_FIELDS = {
  ...PUBLIC_PAGE_FIELDS,
  access: {
    select: PAGE_ACCESS_FIELDS,
  },
  invites: {
    select: PAGE_INVITE_FIELDS,
  },
} as const satisfies Prisma.Args<typeof prisma.page, "findMany">["select"];

export type Page = Prisma.Result<
  typeof prisma.page,
  { select: typeof PAGE_FIELDS },
  "findUniqueOrThrow"
>;

export const LIBRARY_PAGE_FIELDS = {
  id: true,
  title: true,
  type: true,
  updatedAt: true,
  published: true,
  folderId: true,
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
