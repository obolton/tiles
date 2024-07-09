import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter, AppRouterInputs } from "api/src/router/index.ts";

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
    }),
  ],
});

export type { AppRouterInputs };

export default client;
