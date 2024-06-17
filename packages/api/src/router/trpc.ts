import { initTRPC } from "@trpc/server";
import { getCookie } from "../utils/cookies.ts";
import { getUserBySessionId } from "../models/users/users.ts";
import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";

export async function createContext({ req }: CreateHTTPContextOptions) {
  const sessionId = req.headers.cookie
    ? getCookie(req.headers.cookie, "__Host-session")
    : null;

  if (sessionId) {
    const user = await getUserBySessionId(sessionId);
    if (user) {
      return {
        sessionId,
        user,
      };
    }
  }
  return {
    sessionId: null,
    user: null,
  };
}

const trpc = initTRPC.context<typeof createContext>().create();

export const router = trpc.router;
export const procedure = trpc.procedure;
