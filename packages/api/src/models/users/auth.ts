import prisma from "@/database/prisma.ts";
import { createUser } from "./users.ts";
import { createKey, getUserIdByProviderId } from "./keys.ts";
import { createSession, deleteSession } from "./sessions.ts";
import type { SignInSchema } from "./schema.ts";

export async function signIn({
  provider,
  providerId,
  name,
  email,
  emailVerified,
  imageUrl,
}: SignInSchema) {
  return prisma.$transaction(async (transaction) => {
    const existingUserId = await getUserIdByProviderId(transaction, {
      provider,
      providerId,
    });

    if (existingUserId) {
      return createSession(transaction, existingUserId);
    } else {
      const user = await createUser(transaction, {
        name,
        email,
        emailVerified,
        imageUrl,
      });
      const [, session] = await Promise.all([
        createKey(transaction, { provider, providerId, userId: user.id }),
        createSession(transaction, user.id),
      ]);
      return session;
    }
  });
}

export async function signOut(sessionId: string) {
  return deleteSession(sessionId);
}
