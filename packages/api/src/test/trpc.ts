import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import type {
  AuthenticatedRequestContext,
  AuthenticatedServiceRequestContext,
  UnauthenticatedRequestContext,
} from "@/utils/trpc.ts";

export function createRequest(headers: IncomingMessage["headers"] = {}) {
  const req = new IncomingMessage(new Socket());
  req.headers = headers;
  return req;
}

export function createResponse() {
  return new ServerResponse(createRequest());
}

export function createHTTPContextOptions(
  headers: IncomingMessage["headers"] = {},
): CreateHTTPContextOptions {
  return {
    req: createRequest(headers),
    res: createResponse(),
    info: {
      accept: null,
      type: "query",
      isBatchCall: false,
      calls: [],
      connectionParams: null,
      signal: new AbortController().signal,
      url: null,
    },
  };
}

export function createUnauthenticatedContext(): UnauthenticatedRequestContext {
  return { res: createResponse(), sessionId: null, userId: null, serviceName: null };
}

export function createAuthenticatedContext(
  overrides: Partial<Pick<AuthenticatedRequestContext, "sessionId" | "userId">> = {},
): AuthenticatedRequestContext {
  return {
    res: createResponse(),
    sessionId: "session-1",
    userId: "user-1",
    serviceName: null,
    ...overrides,
  };
}

export function createServiceContext(
  serviceName = "service-1",
): AuthenticatedServiceRequestContext {
  return { res: createResponse(), sessionId: null, userId: null, serviceName };
}
