import { initTRPC, TRPCError } from "@trpc/server";
import { getCookie } from "@/utils/cookies.ts";
import { getSessionContext } from "@/routes/users/users.ts";
import { SESSION_COOKIE_NAME } from "@/constants/cookies.ts";
import { clearSessionCookie } from "@/utils/cookies.ts";
import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import type { IncomingMessage, ServerResponse } from "node:http";

export interface UnauthenticatedRequestContext {
  res: ServerResponse<IncomingMessage>;
  sessionId: null;
  userId: null;
}

export interface AuthenticatedRequestContext {
  res: ServerResponse<IncomingMessage>;
  sessionId: string;
  userId: string;
}

export type RequestContext =
  | UnauthenticatedRequestContext
  | AuthenticatedRequestContext;

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

export async function createContext({
  req,
  res,
}: CreateHTTPContextOptions): Promise<RequestContext> {
  const sessionId = getSessionId(req);

  if (sessionId) {
    const session = await getSessionContext(sessionId);
    if (session) {
      return {
        ...session,
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
    userId: null,
  };
}

const trpc = initTRPC.context<typeof createContext>().create();

export const router = trpc.router;
export const publicProcedure = trpc.procedure;
