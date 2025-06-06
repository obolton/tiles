import { initTRPC, TRPCError } from "@trpc/server";
import { getCookie } from "@/utils/cookies.ts";
import { getSessionContext } from "@/routes/users/users.ts";
import { SESSION_COOKIE_NAME } from "@/constants/cookies.ts";
import { clearSessionCookie } from "@/utils/cookies.ts";
import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import type { IncomingMessage } from "node:http";

function parseAuthorizationHeader(value: string) {
  const [type, token] = value.split(" ");
  if (type !== "Bearer" || !token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid Authorization header",
    });
  }
  return token;
}

function getSessionId(req: IncomingMessage) {
  const authorizationHeader = req.headers.authorization;
  if (authorizationHeader) {
    return parseAuthorizationHeader(authorizationHeader);
  }

  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    return getCookie(cookieHeader, SESSION_COOKIE_NAME) || null;
  }

  return null;
}

export async function createContext({ req, res }: CreateHTTPContextOptions) {
  const sessionId = getSessionId(req);

  if (sessionId) {
    const context = await getSessionContext(sessionId);
    if (context) {
      return {
        ...context,
        res,
        sessionId,
      };
    } else {
      clearSessionCookie(res);
    }
  }

  return {
    res,
    sessionId: null,
    workspaceId: null,
    user: null,
  };
}

const trpc = initTRPC.context<typeof createContext>().create();

export const router = trpc.router;
export const publicProcedure = trpc.procedure;

export type RequestContext = Awaited<ReturnType<typeof createContext>>;
