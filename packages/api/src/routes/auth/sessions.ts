import crypto from "node:crypto";
import prisma, { type PrismaTransactionClient } from "@/database/prisma.ts";

const SESSION_ID_BYTES = 64;
const SESSION_VALIDITY_PERIOD = 1000 * 60 * 60 * 24 * 14; // 2 weeks

async function createSessionId() {
  return new Promise<string>((resolve, reject) => {
    crypto.randomBytes(SESSION_ID_BYTES, (error, buffer) => {
      if (error) {
        reject(error);
      } else {
        const sessionId = buffer.toString("base64url");
        resolve(sessionId);
      }
    });
  });
}

export async function createSession(
  db: PrismaTransactionClient,
  userId: string,
) {
  const id = await createSessionId();
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
