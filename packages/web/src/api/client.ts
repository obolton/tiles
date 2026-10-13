import { createTRPCClient, httpBatchLink, httpBatchStreamLink, splitLink } from "@trpc/client";
import type { AppRouter, AppRouterInputs, AppRouterOutputs } from "api/routes/index";

if (import.meta.env.SSR && !process.env.INTERNAL_API_ORIGIN) {
  throw new Error("INTERNAL_API_ORIGIN environment variable is required");
}

const API_ORIGIN = import.meta.env.SSR
  ? process.env.INTERNAL_API_ORIGIN
  : import.meta.env.PUBLIC_API_ORIGIN;

const client = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition(op) {
        return !!op.context.stream;
      },
      true: httpBatchStreamLink({
        url: API_ORIGIN,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: typeof window !== "undefined" ? "include" : undefined,
          });
        },
        headers({ opList }) {
          const sessionId = opList[0].context.sessionId;
          return typeof sessionId === "string"
            ? {
                Authorization: `Bearer ${sessionId}`,
              }
            : {};
        },
      }),
      false: httpBatchLink({
        url: API_ORIGIN,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: typeof window !== "undefined" ? "include" : undefined,
          });
        },
        headers({ opList }) {
          const sessionId = opList[0].context.sessionId;
          return typeof sessionId === "string"
            ? {
                Authorization: `Bearer ${sessionId}`,
              }
            : {};
        },
      }),
    }),
  ],
});

export type { AppRouterInputs, AppRouterOutputs };

export default client;
