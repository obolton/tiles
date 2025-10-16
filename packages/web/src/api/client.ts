import {
  createTRPCClient,
  httpBatchLink,
  httpBatchStreamLink,
  splitLink,
} from "@trpc/client";
import type {
  AppRouter,
  AppRouterInputs,
  AppRouterOutputs,
} from "api/routes/index";

// TODO: Split into browser and Node clients
const client = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition(op) {
        return !!op.context.stream;
      },
      true: httpBatchStreamLink({
        url: import.meta.env.PUBLIC_API_BASE_URL,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: typeof window !== "undefined" ? "include" : undefined,
          });
        },
        headers({ opList }) {
          const sessionId = opList[0].context.sessionId;
          return sessionId
            ? {
                Authorization: `Bearer ${sessionId}`,
              }
            : {};
        },
      }),
      false: httpBatchLink({
        url: import.meta.env.PUBLIC_API_BASE_URL,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: typeof window !== "undefined" ? "include" : undefined,
          });
        },
        headers({ opList }) {
          const sessionId = opList[0].context.sessionId;
          // TODO: Validate session ID before sending
          return sessionId
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
