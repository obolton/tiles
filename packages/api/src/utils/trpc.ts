import assert from "node:assert";
import crypto from "node:crypto";
import { initTRPC, TRPCError } from "@trpc/server";
import { getCookie } from "@/utils/cookies";
import { getSessionContext } from "@/routes/users/users";
import { SESSION_COOKIE_NAME } from "@/constants/cookies";
import { SERVICE_TOKEN_HEADER } from "@/constants/headers";
import { clearSessionCookie } from "@/utils/cookies";
import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import type { IncomingMessage, ServerResponse } from "node:http";

function getServiceApiToken() {
  const token = process.env.SERVICE_API_TOKEN;
  assert(token, "SERVICE_API_TOKEN is not defined");
  return token;
}

const SERVICE_API_TOKEN = getServiceApiToken();

export interface UnauthenticatedRequestContext {
  res: ServerResponse;
  sessionId: null;
  userId: null;
  isService: false;
}

export interface AuthenticatedRequestContext {
  res: ServerResponse;
  sessionId: string;
  userId: string;
  isService: false;
}

export interface AuthenticatedServiceRequestContext {
  res: ServerResponse;
  sessionId: null;
  userId: null;
  isService: true;
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

function getHeader(req: IncomingMessage, name: string) {
  const value = req.headers[name.toLowerCase()];
  return typeof value === "string" ? value : null;
}

function isValidServiceToken(token: string) {
  const tokenBytes = Buffer.from(token);
  const expectedBytes = Buffer.from(SERVICE_API_TOKEN);
  return (
    tokenBytes.length === expectedBytes.length && crypto.timingSafeEqual(tokenBytes, expectedBytes)
  );
}

function isServiceRequest(req: IncomingMessage) {
  const token = getHeader(req, SERVICE_TOKEN_HEADER);
  if (token === null) {
    return false;
  }

  if (!isValidServiceToken(token)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid service token",
    });
  }

  return true;
}

export async function createContext({
  req,
  res,
}: Pick<CreateHTTPContextOptions, "req" | "res">): Promise<RequestContext> {
  if (isServiceRequest(req)) {
    return {
      res,
      sessionId: null,
      userId: null,
      isService: true,
    };
  }

  const sessionId = getSessionId(req);

  if (sessionId) {
    const session = await getSessionContext(sessionId);
    if (session) {
      return {
        ...session,
        res,
        sessionId,
        isService: false,
      };
    } else {
      clearSessionCookie(res);
    }
  }

  return {
    res,
    sessionId: null,
    userId: null,
    isService: false,
  };
}

const trpc = initTRPC.context<typeof createContext>().create();

export const router = trpc.router;
export const publicProcedure = trpc.procedure;
