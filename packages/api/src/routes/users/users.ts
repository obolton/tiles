import assert from "node:assert";
import crypto from "node:crypto";
import prisma, { type PrismaTransactionClient } from "@/database/prisma";
import { upload } from "@/utils/storage";
import { IMAGE_CONTENT_TYPES, IMAGE_FILE_EXTENSIONS } from "@/constants/images";
import { getStream } from "@/utils/http";
import { guardImageStream } from "@/utils/imageStream";
import type { CreateUserSchema, UpdateUserSchema, IsUsernameAvailableSchema } from "./schema";
import type { AuthenticatedRequestContext } from "@/utils/trpc";
import { USER_FIELDS } from "./fields";

const PROFILE_IMAGES_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_PROFILE_IMAGES;
const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function storeProfileImage(userId: string, imageUrl: string) {
  assert(PROFILE_IMAGES_BUCKET, "CLOUDFLARE_R2_BUCKET_PROFILE_IMAGES is not defined.");
  const { stream, contentType } = await getStream(imageUrl, IMAGE_CONTENT_TYPES);
  const extension = IMAGE_FILE_EXTENSIONS[contentType];
  const imageId = crypto.randomUUID();
  const imageKey = `${userId}/${imageId}.${extension}`;
  const body = guardImageStream(stream, contentType, MAX_PROFILE_IMAGE_SIZE);
  await upload(PROFILE_IMAGES_BUCKET, imageKey, body, contentType);
  return imageKey;
}

// The avatar comes from a third-party URL; failing to fetch it must not block sign-up.
async function tryStoreProfileImage(userId: string, imageUrl: string) {
  try {
    return await storeProfileImage(userId, imageUrl);
  } catch (error) {
    console.error(`Failed to store profile image for user ${userId}:`, error);
    return null;
  }
}

export async function createUser(
  db: PrismaTransactionClient,
  { name, email, emailVerified, imageUrl }: CreateUserSchema,
) {
  const id = crypto.randomUUID();
  const imageKey = imageUrl ? await tryStoreProfileImage(id, imageUrl) : null;
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
      userId: true,
    },
  });
  if (!session) {
    return null;
  }
  return session;
}

export async function getUserInfo({ userId }: AuthenticatedRequestContext) {
  const { workspaceMemberships, ...userProperties } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: USER_FIELDS,
  });
  return {
    ...userProperties,
    workspaces: workspaceMemberships.map((membership) => membership.workspace),
  };
}

export async function updateUser(
  { username, name, email, imageKey }: UpdateUserSchema,
  { userId }: AuthenticatedRequestContext,
) {
  const { workspaceMemberships, ...userProperties } = await prisma.user.update({
    where: { id: userId },
    data: {
      username,
      name,
      email,
      imageKey,
    },
    select: USER_FIELDS,
  });
  return {
    ...userProperties,
    workspaces: workspaceMemberships.map((membership) => membership.workspace),
  };
}

export async function isUsernameAvailable(
  { username }: IsUsernameAvailableSchema,
  { userId }: AuthenticatedRequestContext,
) {
  const foundUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  return !foundUser || foundUser.id === userId;
}
