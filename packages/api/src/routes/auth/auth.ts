import prisma from "@/database/prisma";
import { createUser } from "../users/users";
import { createKey, getUserIdByProviderId } from "./keys";
import { createSession, deleteSession } from "./sessions";
import { sendEmail } from "@/utils/email";
import { signUpEmail } from "@/emails/signUp";
import { getDefaultThemesData } from "@/utils/themes";
import type { SignInSchema } from "./schema";

type SendWelcomeEmailOptions = {
  userId: string;
  workspaceId: string;
  name: string;
  email: string;
};

async function sendWelcomeEmail({ userId, workspaceId, name, email }: SendWelcomeEmailOptions) {
  try {
    await sendEmail(email, signUpEmail({ id: userId, name, workspaceId }));
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
      const workspace = await transaction.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          memberships: {
            create: {
              userId: user.id,
              role: "ADMIN",
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
        sendWelcomeEmail({ userId: user.id, workspaceId: workspace.id, name, email }),
      ]);
      return session;
    }
  });
}

export async function signOut(sessionId: string) {
  return deleteSession(sessionId);
}
