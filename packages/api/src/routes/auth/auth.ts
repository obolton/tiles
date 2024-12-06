import prisma from "@/database/prisma.ts";
import { createUser } from "../users/users.ts";
import { createKey, getUserIdByProviderId } from "./keys.ts";
import { createSession, deleteSession } from "./sessions.ts";
import { sendEmail } from "@/utils/email.ts";
import { signUpEmail } from "@/emails/signUp.ts";
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
        async () => {
          try {
            sendEmail(email, signUpEmail({ id: user.id, name }));
          } catch (error) {
            console.error(error);
          }
        },
      ]);
      return session;
    }
  });
}

export async function signOut(sessionId: string) {
  return deleteSession(sessionId);
}
