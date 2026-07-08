import { TRPCError } from "@trpc/server";
import * as Y from "yjs";
import type { Prisma, PageType } from "@/generated/prisma/client";
import prisma from "@/database/prisma";
import { LIBRARY_PAGE_FIELDS } from "./fields";
import { RESULTS_PER_PAGE, paginate } from "@/utils/pagination";
import { invalidateCachedPages } from "@/utils/cdn";
import { createEmptyDoc, currentSchemaVersion } from "@/collaboration";
import { DocWriter } from "@/collaboration/DocWriter";
import { buildTextMap } from "doc/tiles/text";
import { buildSectionMap } from "doc/tiles/section";
import { bytesToBase64 } from "doc/encoding";
import type {
  GetPageByIdSchema,
  ListPagesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
  RestorePageSchema,
  MovePagesSchema,
} from "./schema";
import type { RequestContext } from "@/utils/trpc";
import type {
  AuthenticatedWorkspaceProcedureContext,
  AuthenticatedPageProcedureContext,
} from "@/utils/middleware";
import { PAGE_FIELDS } from "./fields";

const DELETED_PAGE_AVAILABILITY = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function getPageById({ id }: GetPageByIdSchema, { userId }: RequestContext) {
  const page = await prisma.page.findUnique({
    where: userId
      ? {
          id,
          deletedAt: null,
          OR: [{ published: true }, { authorId: userId }, { access: { some: { userId } } }],
        }
      : { id, deletedAt: null, published: true },
    select: PAGE_FIELDS,
  });

  if (!page) {
    return null;
  }

  return {
    ...page,
    document: bytesToBase64(page.document.snapshot),
  };
}

export async function listPages(
  { query, cursor, sortBy = "updatedAt", sortDirection = "desc" }: ListPagesSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const filter: Prisma.PageWhereInput = query
    ? { title: { contains: query, mode: "insensitive" } }
    : {};
  const pages = await prisma.page.findMany({
    where: {
      workspaceId,
      authorId: userId,
      deletedAt: null,
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
}

export async function listSharedPages(
  { query, cursor, sortBy = "updatedAt", sortDirection = "desc" }: ListPagesSchema,
  { userId }: AuthenticatedWorkspaceProcedureContext,
) {
  const filter: Prisma.PageWhereInput = query
    ? { title: { contains: query, mode: "insensitive" } }
    : {};
  const pages = await prisma.page.findMany({
    where: {
      access: { some: { userId } },
      deletedAt: null,
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
}

export async function listDeletedPages(
  { query, cursor, sortBy = "updatedAt", sortDirection = "desc" }: ListPagesSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const filter: Prisma.PageWhereInput = query
    ? { title: { contains: query, mode: "insensitive" } }
    : {};
  const pages = await prisma.page.findMany({
    where: {
      workspaceId,
      authorId: userId,
      deletedAt: {
        not: null,
        gt: new Date(Date.now() - DELETED_PAGE_AVAILABILITY),
      },
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
}

function createDocumentDoc(): Y.Doc {
  const doc = createEmptyDoc();
  new DocWriter(doc).createTile(buildTextMap({ sizing: "AUTO", height: 1 }), {
    parentId: null,
  });
  return doc;
}

function createPresentationDoc(): Y.Doc {
  const doc = createEmptyDoc();
  new DocWriter(doc).createTile(
    buildSectionMap({
      layout: "FREEFORM",
      sizing: "LANDSCAPE",
      height: 1,
    }),
    { parentId: null },
  );
  return doc;
}

export function createInitialDoc(pageType: PageType): Y.Doc {
  switch (pageType) {
    case "DOCUMENT":
      return createDocumentDoc();
    case "PRESENTATION":
      return createPresentationDoc();
    default:
      return createEmptyDoc();
  }
}

export async function createPage(
  { title, type }: CreatePageSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const pageType = type ?? "DOCUMENT";

  return prisma.page.create({
    data: {
      published: false,
      title,
      workspace: { connect: { id: workspaceId } },
      author: { connect: { id: userId } },
      type: pageType,
      document: {
        create: {
          snapshot: Buffer.from(Y.encodeStateAsUpdate(createInitialDoc(pageType))),
          schemaVersion: currentSchemaVersion,
        },
      },
    },
    select: {
      id: true,
    },
  });
}

export async function updatePage(
  { pageId, published, title, folderId }: UpdatePageSchema,
  { userId, workspaceId }: AuthenticatedPageProcedureContext,
) {
  return prisma.$transaction(async (transaction) => {
    // Validate folder ownership only when folderId is being set
    if (folderId) {
      const folder = await transaction.folder.findUniqueOrThrow({
        where: { id: folderId },
        select: { workspaceId: true },
      });

      if (folder.workspaceId !== workspaceId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid folder" });
      }
    }

    return transaction.page.update({
      where: { id: pageId, authorId: userId, deletedAt: null },
      data: {
        published,
        title,
        folderId,
      },
      select: PAGE_FIELDS,
    });
  });
}

export async function deletePages(
  { pageIds }: DeletePageSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const result = await prisma.page.updateMany({
    where: {
      id: { in: pageIds },
      workspaceId,
      authorId: userId,
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  });
  invalidateCachedPages(pageIds);
  return result;
}

export async function restorePages(
  { pageIds }: RestorePageSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.page.updateMany({
    where: {
      id: { in: pageIds },
      workspaceId,
      authorId: userId,
      deletedAt: { not: null },
    },
    data: { deletedAt: null },
  });
}

export async function movePages(
  { pageIds, folderId }: MovePagesSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  if (folderId) {
    const folder = await prisma.folder.findUniqueOrThrow({
      where: { id: folderId, workspaceId },
      select: { id: true },
    });
    if (!folder) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid folder" });
    }
  }

  return prisma.page.updateMany({
    where: {
      id: { in: pageIds },
      workspaceId,
      authorId: userId,
      deletedAt: null,
    },
    data: { folderId },
  });
}

export async function emptyTrash({ userId, workspaceId }: AuthenticatedWorkspaceProcedureContext) {
  return prisma.page.deleteMany({
    where: { workspaceId, authorId: userId, deletedAt: { not: null } },
  });
}
