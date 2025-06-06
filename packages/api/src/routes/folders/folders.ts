import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import type {
  CreateFolderSchema,
  GetFolderSchema,
  UpdateFolderSchema,
  DeleteFolderSchema,
  ListFoldersSchema,
  ListPagesSchema,
  MovePageToFolderSchema,
} from "./schema.ts";
import type { Prisma } from "@prisma/client";
import { PAGE_LINK_TILE_PAGE_FIELDS } from "../pageLinks/pageLinks.ts";
import type { AuthenticatedProcedureContext } from "@/utils/middleware.ts";

const RESULTS_PER_PAGE = 15;

export const FOLDER_FIELDS = {
  id: true,
  name: true,
} as const satisfies Prisma.FolderSelect<ExtensionArgs>;

export async function createFolder(
  { name }: CreateFolderSchema,
  { user, workspaceId }: AuthenticatedProcedureContext,
) {
  return prisma.folder.create({
    data: {
      workspaceId,
      userId: user.id,
      name,
    },
    select: FOLDER_FIELDS,
  });
}

export async function getFolder(
  { id }: GetFolderSchema,
  { workspaceId }: AuthenticatedProcedureContext,
) {
  return prisma.folder.findUniqueOrThrow({
    where: {
      id,
      workspaceId,
    },
    select: FOLDER_FIELDS,
  });
}

export async function updateFolder(
  { id, name }: UpdateFolderSchema,
  { workspaceId }: AuthenticatedProcedureContext,
) {
  return prisma.folder.update({
    where: {
      id,
      workspaceId,
    },
    data: {
      name,
    },
    select: FOLDER_FIELDS,
  });
}

export async function deleteFolder(
  { id }: DeleteFolderSchema,
  { workspaceId }: AuthenticatedProcedureContext,
) {
  return prisma.folder.delete({
    where: {
      id,
      workspaceId,
    },
    select: { id: true },
  });
}

export async function listFolders(
  { query, offset }: ListFoldersSchema,
  { workspaceId }: AuthenticatedProcedureContext,
) {
  const filter: Prisma.FolderWhereInput = query
    ? { name: { contains: query, mode: "insensitive" } }
    : {};
  const folders = await prisma.folder.findMany({
    where: {
      workspaceId,
      ...filter,
    },
    select: FOLDER_FIELDS,
    orderBy: {
      name: "asc",
    },
    take: RESULTS_PER_PAGE + 1,
    skip: offset,
  });
  return {
    folders: folders.slice(0, RESULTS_PER_PAGE),
    hasMore: folders.length > RESULTS_PER_PAGE,
  };
}

export async function listPages(
  { id, query, offset }: ListPagesSchema,
  { workspaceId }: AuthenticatedProcedureContext,
) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to folder
    await transaction.folder.findUniqueOrThrow({
      where: {
        id,
        workspaceId,
      },
    });

    const filter: Prisma.PageWhereInput = query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { subtitle: { contains: query, mode: "insensitive" } },
          ],
        }
      : {};

    const pages = await prisma.page.findMany({
      where: {
        workspaceId,
        folderId: id,
        ...filter,
      },
      select: PAGE_LINK_TILE_PAGE_FIELDS,
      orderBy: {
        createdAt: "desc",
      },
      take: RESULTS_PER_PAGE + 1,
      skip: offset,
    });
    return {
      pages: pages.slice(0, RESULTS_PER_PAGE),
      hasMore: pages.length > RESULTS_PER_PAGE,
    };
  });
}

export async function movePageToFolder(
  { id, pageId }: MovePageToFolderSchema,
  { workspaceId }: AuthenticatedProcedureContext,
) {
  return prisma.folder.update({
    where: {
      id,
      workspaceId,
    },
    data: {
      pages: {
        connect: {
          id: pageId,
        },
      },
    },
    select: FOLDER_FIELDS,
  });
}
