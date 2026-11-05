import { createTRPCClient, httpBatchLink, httpBatchStreamLink, splitLink } from "@trpc/client";
import { publicEnv } from "@/env/public";
import { serverEnv } from "@/env/server";
import type { AppRouter, AppRouterInputs, AppRouterOutputs } from "api/routes/index";
import type { Operation } from "@trpc/client";

const API_ORIGIN = import.meta.env.SSR
  ? serverEnv.INTERNAL_API_ORIGIN
  : publicEnv.PUBLIC_API_ORIGIN;

function fetchWithCredentials(url: RequestInfo | URL, options?: RequestInit) {
  return fetch(url, {
    ...options,
    credentials: typeof window !== "undefined" ? "include" : undefined,
  });
}

function getHeaders({ opList }: { opList: [Operation, ...Operation[]] }) {
  const { sessionId } = opList[0].context;
  return typeof sessionId === "string" ? { Authorization: `Bearer ${sessionId}` } : {};
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
