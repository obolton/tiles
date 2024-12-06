import { initTRPC, TRPCError } from "@trpc/server";
import { getCookie } from "@/utils/cookies.ts";
import { getUserBySessionId } from "@/routes/users/users.ts";
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
    const user = await getUserBySessionId(sessionId);
    if (user) {
      return {
        res,
        sessionId,
        user,
      };
    } else {
      clearSessionCookie(res);
    }
  }

  return {
    res,
    sessionId: null,
    user: null,
  };
}

const trpc = initTRPC.context<typeof createContext>().create();

export const router = trpc.router;
export const publicProcedure = trpc.procedure;

export type RequestContext = Awaited<ReturnType<typeof createContext>>;
export type AuthenticatedRequestContext = Extract<
  RequestContext,
  { sessionId: string; user: { id: string } }
>;

export const authenticatedProcedure = trpc.procedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.sessionId || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next({ ctx });
});
