import assert from "node:assert";
import { initTRPC, TRPCError } from "@trpc/server";
import { getCookie } from "@/utils/cookies.ts";
import { getSessionContext } from "@/routes/users/users.ts";
import { SESSION_COOKIE_NAME } from "@/constants/cookies.ts";
import { clearSessionCookie } from "@/utils/cookies.ts";
import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import type { IncomingMessage, ServerResponse } from "node:http";

const SERVICE_API_TOKEN = process.env.SERVICE_API_TOKEN;
assert(SERVICE_API_TOKEN, "SERVICE_API_TOKEN is not defined");

export interface UnauthenticatedRequestContext {
  res: ServerResponse;
  sessionId: null;
  userId: null;
  serviceName: null;
}

export interface AuthenticatedRequestContext {
  res: ServerResponse;
  sessionId: string;
  userId: string;
  serviceName: null;
}

export interface AuthenticatedServiceRequestContext {
  res: ServerResponse;
  sessionId: null;
  userId: null;
  serviceName: string;
}

export type RequestContext =
  | UnauthenticatedRequestContext
  | AuthenticatedRequestContext
  | AuthenticatedServiceRequestContext;

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
}: Pick<CreateHTTPContextOptions, "req" | "res">): Promise<RequestContext> {
  const sessionId = getSessionId(req);

  if (sessionId) {
    const session = await getSessionContext(sessionId);
    if (session) {
      return {
        ...session,
        res,
        sessionId,
        serviceName: null,
      };
    } else {
      clearSessionCookie(res);
    }
  }

  return {
    res,
    sessionId: null,
    userId: null,
    serviceName: null,
  };
}

const trpc = initTRPC.context<typeof createContext>().create();

export const router = trpc.router;
export const publicProcedure = trpc.procedure;
