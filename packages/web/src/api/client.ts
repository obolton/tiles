import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter } from "api/src/router/index.ts";

const client = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: import.meta.env.PUBLIC_API_BASE_URL,
      async headers() {
        return {};
      },
    }),
  ],
});

export default client;
