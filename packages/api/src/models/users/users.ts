import prisma from "../../database/prisma.ts";
import type { Prisma } from "@prisma/client";

type CreateUserOptions = {
  name: string;
  email: string;
  emailVerified: boolean;
};

export async function createUser(
  db: Prisma.TransactionClient,
  { name, email, emailVerified }: CreateUserOptions
) {
  return db.user.create({
    data: {
      name,
      email,
      emailVerified,
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
        },
      },
    },
  });
  return session?.user ?? null;
}
