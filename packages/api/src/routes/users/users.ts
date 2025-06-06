import assert from "node:assert";
import crypto from "node:crypto";
import prisma, { type PrismaTransactionClient } from "@/database/prisma.ts";
import { upload } from "@/utils/storage.ts";
import {
  IMAGE_CONTENT_TYPES,
  IMAGE_FILE_EXTENSIONS,
} from "@/constants/images.ts";
import { getStream } from "@/utils/http.ts";
import type {
  CreateUserSchema,
  UpdateUserSchema,
  IsUsernameAvailableSchema,
} from "./schema.ts";
import type { AuthenticatedProcedureContext } from "@/utils/middleware.ts";

const PROFILE_IMAGES_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_PROFILE_IMAGES;

export async function storeProfileImage(userId: string, imageUrl: string) {
  assert(
    PROFILE_IMAGES_BUCKET,
    "CLOUDFLARE_R2_BUCKET_PROFILE_IMAGES is not defined.",
  );
  const { stream, contentType } = await getStream(
    imageUrl,
    IMAGE_CONTENT_TYPES,
  );
  const extension = IMAGE_FILE_EXTENSIONS[contentType];
  const imageId = crypto.randomUUID();
  const imageKey = `${userId}/${imageId}.${extension}`;
  await upload(PROFILE_IMAGES_BUCKET, imageKey, stream, contentType);
  return imageKey;
}

export async function createUser(
  db: PrismaTransactionClient,
  { name, email, emailVerified, imageUrl }: CreateUserSchema,
) {
  const id = crypto.randomUUID();
  const imageKey = imageUrl ? await storeProfileImage(id, imageUrl) : null;
  return db.user.create({
    data: {
      id,
      name,
      email,
      emailVerified,
      imageKey,
    },
    select: {
      id: true,
    },
  });
}

export async function getSessionContext(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId, expiresAt: { gt: new Date() } },
    select: {
      workspaceId: true,
      userId: true,
    },
  });
  if (!session) {
    return null;
  }
  return { workspaceId: session.workspaceId, user: { id: session.userId } };
}

export async function getCurrentUser({ user }: AuthenticatedProcedureContext) {
  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      imageUrl: true,
    },
  });
}

export async function updateUser(
  { username, name, email, imageKey }: UpdateUserSchema,
  { user }: AuthenticatedProcedureContext,
) {
  return prisma.user.update({
    where: { id: user.id },
    data: {
      username,
      name,
      email,
      imageKey,
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      imageUrl: true,
    },
  });
}

export async function isUsernameAvailable(
  { username }: IsUsernameAvailableSchema,
  { user }: AuthenticatedProcedureContext,
) {
  const foundUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  return !foundUser || foundUser.id === user.id;
}
