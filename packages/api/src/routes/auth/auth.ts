import prisma from "@/database/prisma.ts";
import { createUser } from "../users/users.ts";
import { createKey, getUserIdByProviderId } from "./keys.ts";
import { createSession, deleteSession } from "./sessions.ts";
import { sendEmail } from "@/utils/email.ts";
import { signUpEmail } from "@/emails/signUp.ts";
import { getDefaultThemesData } from "@/utils/themes.ts";
import type { SignInSchema } from "./schema.ts";

type SendWelcomeEmailOptions = {
  userId: string;
  name: string;
  email: string;
};

async function sendWelcomeEmail({ userId, name, email }: SendWelcomeEmailOptions) {
  try {
    await sendEmail(email, signUpEmail({ id: userId, name }));
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

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
      await transaction.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          memberships: {
            create: {
              userId: user.id,
            },
          },
          themes: {
            createMany: {
              data: getDefaultThemesData(),
            },
          },
        },
      });
      const [, session] = await Promise.all([
        createKey(transaction, { provider, providerId, userId: user.id }),
        createSession(transaction, user.id),
        sendWelcomeEmail({ userId: user.id, name, email }),
      ]);
      return session;
    }
  });
}

export async function signOut(sessionId: string) {
  return deleteSession(sessionId);
}
