import { createResponse } from "./http";
import { ServiceName } from "@/constants/services";
import type {
  AuthenticatedRequestContext,
  AuthenticatedServiceRequestContext,
  UnauthenticatedRequestContext,
} from "@/utils/trpc";

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
  serviceName: ServiceName = ServiceName.WEB,
): AuthenticatedServiceRequestContext {
  return { res: createResponse(), sessionId: null, userId: null, serviceName };
}
