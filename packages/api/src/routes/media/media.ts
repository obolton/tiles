import { randomUUID } from "node:crypto";
import prisma from "@/database/prisma.ts";
import { createSignedUploadUrl } from "@/utils/storage.ts";
import type { CreateUploadURLSchema, UpdateImageSchema } from "./schema.ts";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware.ts";

export async function createUploadUrl(
  { type }: CreateUploadURLSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const key = randomUUID();
  const url = await createSignedUploadUrl(key, type, { userId, workspaceId });
  return { key, url };
}

export async function createImage({
  userId,
  workspaceId,
}: AuthenticatedWorkspaceProcedureContext) {
  const { id } = await prisma.image.create({
    data: {
      workspaceId,
      userId,
    },
    select: {
      id: true,
    },
  });
  return { id, userId, workspaceId };
}

export async function updateImage(
  { id, bytes }: UpdateImageSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.image.update({
    where: {
      id,
      workspaceId,
    },
    data: {
      bytes,
    },
    select: {
      id: true,
      workspaceId: true,
      bytes: true,
    },
  });
}
