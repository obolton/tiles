import { randomUUID } from "node:crypto";
import prisma from "@/database/prisma.ts";
import { createSignedUploadUrl } from "@/utils/storage.ts";
import type { CreateUploadURLSchema, RegisterImageSchema } from "./schema.ts";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware.ts";

export async function createUploadUrl(
  { type }: CreateUploadURLSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const key = randomUUID();
  const url = await createSignedUploadUrl(key, type, { userId, workspaceId });
  return { key, url };
}

export async function registerImage({
  key,
  bytes,
  workspaceId,
  userId,
}: RegisterImageSchema) {
  return prisma.image.create({
    data: {
      key,
      bytes,
      workspaceId,
      userId,
    },
    select: {
      id: true,
    },
  });
}
