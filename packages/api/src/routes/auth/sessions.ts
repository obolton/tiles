import prisma, { type PrismaTransactionClient } from "@/database/prisma";
import { createKey } from "@/utils/keys";

const SESSION_ID_BYTES = 64;
const SESSION_VALIDITY_PERIOD = 1000 * 60 * 60 * 24 * 14; // 2 weeks

export async function createSession(db: PrismaTransactionClient, userId: string) {
  const id = await createKey(SESSION_ID_BYTES);
  const expiresAt = new Date(Date.now() + SESSION_VALIDITY_PERIOD);
  return db.session.create({
    data: {
      id,
      userId,
      expiresAt,
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });
}

export async function deleteSession(sessionId: string) {
  await prisma.session.delete({
    where: {
      id: sessionId,
    },
  });
}
