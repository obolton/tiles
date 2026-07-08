import { TRPCError } from "@trpc/server";
import * as Y from "yjs";
import { bytesToBase64, equalBytes } from "doc/encoding";
import prisma from "@/database/prisma";
import { RESULTS_PER_PAGE, paginate } from "@/utils/pagination";
import { withDocument } from "@/collaboration/documents";
import { migrateSnapshot, CURRENT_SCHEMA_VERSION } from "@/collaboration/migrator";
import { createVersion, LATEST_VERSION_FIELDS, VERSION_FIELDS } from "@/collaboration/versions";
import { VERSION_DOCUMENT_FIELDS, COPY_PAGE_FIELDS } from "./fields";
import type {
  ListVersionsSchema,
  GetVersionSchema,
  CreateVersionSchema,
  PrepareRestoreSchema,
  RenameVersionSchema,
  DeleteVersionSchema,
  CopyVersionSchema,
} from "./schema";
import { getPage } from "@/utils/middleware";
import type {
  AuthenticatedPageProcedureContext,
  AuthenticatedWorkspaceProcedureContext,
} from "@/utils/middleware";

const COPY_TITLE_SUFFIX = " (copy)";
const TITLE_MAX_LENGTH = 100;

export async function listVersions({ pageId, cursor }: ListVersionsSchema) {
  const results = await prisma.pageVersion.findMany({
    where: { pageId },
    select: VERSION_FIELDS,
    orderBy: { createdAt: "desc" },
    take: RESULTS_PER_PAGE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
  const { items, nextCursor } = paginate(results, (version) => version.id);
  return { versions: items, nextCursor };
}

export async function getVersion({ pageId, versionId }: GetVersionSchema) {
  const version = await prisma.pageVersion.findFirst({
    where: { id: versionId, pageId },
    select: VERSION_DOCUMENT_FIELDS,
  });

  if (!version) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  const { snapshot, schemaVersion, ...fields } = version;
  return {
    ...fields,
    document: bytesToBase64(migrateSnapshot(snapshot, schemaVersion)),
  };
}

export async function createNamedVersion(
  { pageId, name }: CreateVersionSchema,
  ctx: AuthenticatedPageProcedureContext,
) {
  return withDocument(pageId, ctx, (document) =>
    createVersion(pageId, document, { type: "NAMED", name, userId: ctx.userId }),
  );
}

export async function prepareRestore(
  { pageId }: PrepareRestoreSchema,
  ctx: AuthenticatedPageProcedureContext,
) {
  return withDocument(pageId, ctx, async (document) => {
    const latest = await prisma.pageVersion.findFirst({
      where: { pageId },
      orderBy: { createdAt: "desc" },
      select: LATEST_VERSION_FIELDS,
    });

    if (latest && equalBytes(latest.stateVector, Y.encodeStateVector(document))) {
      return { versionId: latest.id };
    }

    const version = await createVersion(pageId, document, {
      type: "PRE_RESTORE",
      userId: ctx.userId,
    });
    return { versionId: version.id };
  });
}

export async function renameVersion({ pageId, versionId, name }: RenameVersionSchema) {
  await prisma.pageVersion.update({
    where: { id: versionId, pageId, type: "NAMED" },
    data: { name },
  });
}

export async function deleteVersion({ pageId, versionId }: DeleteVersionSchema) {
  await prisma.pageVersion.delete({
    where: { id: versionId, pageId, type: "NAMED" },
  });
}

export async function copyVersionToPage(
  { pageId, versionId, title }: CopyVersionSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  // The middleware validates the target workspace; the source page is
  // access-checked here.
  const sourcePage = await getPage(userId, pageId);
  if (!sourcePage) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const [version, page] = await Promise.all([
    prisma.pageVersion.findFirst({
      where: { id: versionId, pageId },
      select: VERSION_DOCUMENT_FIELDS,
    }),
    prisma.page.findUniqueOrThrow({
      where: { id: pageId },
      select: COPY_PAGE_FIELDS,
    }),
  ]);

  if (!version) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  return prisma.page.create({
    data: {
      published: false,
      title:
        title ??
        page.title.slice(0, TITLE_MAX_LENGTH - COPY_TITLE_SUFFIX.length) + COPY_TITLE_SUFFIX,
      workspace: { connect: { id: workspaceId } },
      author: { connect: { id: userId } },
      type: page.type,
      document: {
        create: {
          snapshot: new Uint8Array(migrateSnapshot(version.snapshot, version.schemaVersion)),
          schemaVersion: CURRENT_SCHEMA_VERSION,
        },
      },
    },
    select: { id: true },
  });
}
