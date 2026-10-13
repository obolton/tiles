import { createTRPCClient, httpBatchLink, httpBatchStreamLink, splitLink } from "@trpc/client";
import { SERVICE_NAME_HEADER, SERVICE_TOKEN_HEADER } from "api/constants/headers";
import type { AppRouter, AppRouterInputs, AppRouterOutputs } from "api/routes/index";
import type { Operation } from "@trpc/client";

if (import.meta.env.SSR && !process.env.INTERNAL_API_ORIGIN) {
  throw new Error("INTERNAL_API_ORIGIN environment variable is required");
}

const API_ORIGIN = import.meta.env.SSR
  ? process.env.INTERNAL_API_ORIGIN
  : import.meta.env.PUBLIC_API_ORIGIN;

const SERVICE_NAME = "web";

function fetchWithCredentials(url: RequestInfo | URL, options?: RequestInit) {
  return fetch(url, {
    ...options,
    credentials: typeof window !== "undefined" ? "include" : undefined,
  });
}

// Service credentials are only available during SSR, so server-only procedures (e.g. sign-in)
// can never be called with them from the browser.
function getServiceHeaders() {
  if (!import.meta.env.SSR) {
    return {};
  }
  const token = process.env.SERVICE_API_TOKEN;
  if (!token) {
    throw new Error("SERVICE_API_TOKEN environment variable is required");
  }
  return {
    [SERVICE_TOKEN_HEADER]: token,
    [SERVICE_NAME_HEADER]: SERVICE_NAME,
  };
}

function getHeaders({ opList }: { opList: [Operation, ...Operation[]] }) {
  const { sessionId, service } = opList[0].context;
  return {
    ...(typeof sessionId === "string" ? { Authorization: `Bearer ${sessionId}` } : {}),
    ...(service === true ? getServiceHeaders() : {}),
  };
}

const client = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition(op) {
        return !!op.context.stream;
      },
      true: httpBatchStreamLink({
        url: API_ORIGIN,
        fetch: fetchWithCredentials,
        headers: getHeaders,
      }),
      false: httpBatchLink({
        url: API_ORIGIN,
        fetch: fetchWithCredentials,
        headers: getHeaders,
      }),
    }),
  ],
});

export type { AppRouterInputs, AppRouterOutputs };

export default client;
