import { randomUUID } from "node:crypto";
import prisma, { type ExtensionArgs } from "@/database/prisma";
import { createSignedUploadUrl } from "@/utils/storage";
import type {
  CreateUploadURLSchema,
  CreateImageSchema,
  UpdateImageSchema,
} from "./schema";
import type { Prisma } from "@/generated/prisma/client";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware";

export const IMAGE_FIELDS = {
  id: true,
} as const satisfies Prisma.ImageSelect<ExtensionArgs>;

export async function createUploadUrl(
  { type }: CreateUploadURLSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const key = randomUUID();
  const url = await createSignedUploadUrl(key, type, { userId, workspaceId });
  return { key, url };
}

export async function createImage(
  { source, purpose, type, bytes, pending }: CreateImageSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const { id } = await prisma.image.create({
    data: {
      workspaceId,
      userId,
      source,
      purpose,
      type,
      bytes,
      pending,
    },
    select: IMAGE_FIELDS,
  });
  return { id, userId, workspaceId };
}

export async function updateImage(
  { id, bytes, pending }: UpdateImageSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.image.update({
    where: {
      id,
      workspaceId,
    },
    data: {
      bytes,
      pending,
    },
    select: IMAGE_FIELDS,
  });
}
