import prisma from "@/database/prisma.ts";
import type { Prisma } from "@prisma/client";

type CreateUserOptions = {
  name: string;
  email: string;
  emailVerified: boolean;
  imageUrl?: string;
};

export async function createUser(
  db: Prisma.TransactionClient,
  { name, email, emailVerified, imageUrl }: CreateUserOptions,
) {
  const id = crypto.randomUUID();
  return db.user.create({
    data: {
      id,
      name,
      email,
      emailVerified,
      imageUrl,
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
          imageUrl: true,
        },
      },
    },
  });
  return session?.user ?? null;
}
