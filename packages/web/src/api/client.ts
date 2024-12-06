import { createTRPCClient, httpLink } from "@trpc/client";
import type {
  AppRouter,
  AppRouterInputs,
  AppRouterOutputs,
} from "api/src/routes/index.ts";

// TODO: Split into browser and Node clients
const client = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: import.meta.env.PUBLIC_API_BASE_URL,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: typeof window !== "undefined" ? "include" : undefined,
        });
      },
      headers({ op: { context } }) {
        const { sessionId } = context;
        // TODO: Validate session ID before sending
        return sessionId
          ? {
              Authorization: `Bearer ${sessionId}`,
            }
          : {};
      },
    }),
  ],
});

export type { AppRouterInputs, AppRouterOutputs };

export default client;
