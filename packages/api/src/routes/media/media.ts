import prisma from "@/database/prisma";
import type {
  CreateImageSchema,
  UpdateImageSchema,
  DeleteImageSchema,
} from "./schema";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware";
import { IMAGE_FIELDS } from "./fields";

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
  { id, bytes, width, height, pending }: UpdateImageSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.image.update({
    where: {
      id,
      workspaceId,
    },
    data: {
      bytes,
      width,
      height,
      pending,
    },
    select: IMAGE_FIELDS,
  });
}

export async function deleteImage(
  { id }: DeleteImageSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  await prisma.image.delete({
    where: {
      id,
      workspaceId,
    },
  });
}
