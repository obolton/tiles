import prisma from "@/database/prisma.ts";
import type {
  CreateFolderSchema,
  GetFolderSchema,
  UpdateFolderSchema,
  DeleteFolderSchema,
  ListFoldersSchema,
  ListPagesSchema,
} from "./schema.ts";
import type { Prisma } from "@/generated/prisma/client";
import { LIBRARY_PAGE_FIELDS } from "@/routes/pages/fields";
import { RESULTS_PER_PAGE, paginate } from "@/utils/pagination";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware.ts";
import { FOLDER_FIELDS } from "./fields";

export async function createFolder(
  { name }: CreateFolderSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.folder.create({
    data: {
      workspaceId,
      userId,
      name,
    },
    select: FOLDER_FIELDS,
  });
}

export async function getFolder(
  { id }: GetFolderSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
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
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
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
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
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
  { query, cursor }: ListFoldersSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
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
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
  const { items, nextCursor } = paginate(folders, (f) => f.id);
  return { folders: items, nextCursor };
}

export async function listPages(
  { id, query, cursor, sortBy = "updatedAt", sortDirection = "desc" }: ListPagesSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
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
      ? { title: { contains: query, mode: "insensitive" } }
      : {};

    const pages = await prisma.page.findMany({
      where: {
        workspaceId,
        folderId: id,
        ...filter,
      },
      select: LIBRARY_PAGE_FIELDS,
      orderBy: {
        [sortBy]: sortDirection,
      },
      take: RESULTS_PER_PAGE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
    const { items, nextCursor } = paginate(pages, (p) => p.id);
    return { pages: items, nextCursor };
  });
}
