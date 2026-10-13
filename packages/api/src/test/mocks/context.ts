import { createResponse } from "./http.ts";
import type {
  AuthenticatedRequestContext,
  AuthenticatedServiceRequestContext,
  UnauthenticatedRequestContext,
} from "@/utils/trpc.ts";

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
