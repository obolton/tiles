import { createResponse } from "./http";
import type {
  AuthenticatedRequestContext,
  AuthenticatedServiceRequestContext,
  UnauthenticatedRequestContext,
} from "@/utils/trpc";
import type { ServiceName } from "@/constants/services";

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
  serviceName: ServiceName = "web",
): AuthenticatedServiceRequestContext {
  return { res: createResponse(), sessionId: null, userId: null, serviceName };
}
