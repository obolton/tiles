import assert from "node:assert";
import crypto from "node:crypto";
import prisma from "@/database/prisma.ts";
import { upload } from "@/utils/storage.ts";
import {
  IMAGE_CONTENT_TYPES,
  IMAGE_FILE_EXTENSIONS,
} from "@/constants/images.ts";
import { getStream } from "@/utils/http.ts";
import type { Prisma } from "@prisma/client";
import type { UpdateUserSchema } from "./schema.ts";
import type { AuthenticatedProcedureContext } from "@/utils/middleware.ts";

type CreateUserOptions = {
  name: string;
  email: string;
  emailVerified: boolean;
  imageUrl?: string;
};

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
  db: Prisma.TransactionClient,
  { name, email, emailVerified, imageUrl }: CreateUserOptions,
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
      profilePage: {
        create: {
          authorId: id,
          title: name,
        },
      },
    },
    select: {
      id: true,
    },
  });
}

export async function getUserBySessionId(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId, expiresAt: { gt: new Date() } },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },
    },
  });
  const user = session?.user;
  if (!user) {
    return null;
  }
  return user;
}

export async function updateUser(
  { name, email, imageKey }: UpdateUserSchema,
  { user }: AuthenticatedProcedureContext,
) {
  return prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      email,
      imageKey,
    },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
    },
  });
}
