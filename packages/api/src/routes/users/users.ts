import crypto from "node:crypto";
import prisma, { type PrismaTransactionClient } from "@/database/prisma";
import { upload } from "@/utils/storage";
import { IMAGE_CONTENT_TYPES, IMAGE_FILE_EXTENSIONS } from "@/constants/images";
import { getStream } from "@/utils/http";
import type { CreateUserSchema, UpdateUserSchema, IsUsernameAvailableSchema } from "./schema";
import type { AuthenticatedRequestContext } from "@/utils/trpc";
import { USER_FIELDS } from "./fields";
import { env } from "@/env";

export async function storeProfileImage(userId: string, imageUrl: string) {
  const { stream, contentType } = await getStream(imageUrl, IMAGE_CONTENT_TYPES);
  const extension = IMAGE_FILE_EXTENSIONS[contentType];
  const imageId = crypto.randomUUID();
  const imageKey = `${userId}/${imageId}.${extension}`;
  await upload(env.CLOUDFLARE_R2_BUCKET_PROFILE_IMAGES, imageKey, stream, contentType);
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
