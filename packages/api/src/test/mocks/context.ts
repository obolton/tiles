import { createResponse } from "./http";
import type {
  AuthenticatedRequestContext,
  AuthenticatedServiceRequestContext,
  UnauthenticatedRequestContext,
} from "@/utils/trpc";

export function createUnauthenticatedContext(): UnauthenticatedRequestContext {
  return { res: createResponse(), sessionId: null, userId: null, isService: false };
}

export function createAuthenticatedContext(
  overrides: Partial<Pick<AuthenticatedRequestContext, "sessionId" | "userId">> = {},
): AuthenticatedRequestContext {
  return {
    res: createResponse(),
    sessionId: "session-1",
    userId: "user-1",
    isService: false,
    ...overrides,
  };
}

export function createServiceContext(): AuthenticatedServiceRequestContext {
  return { res: createResponse(), sessionId: null, userId: null, isService: true };
}
