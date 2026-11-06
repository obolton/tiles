import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "api/routes/index";

export function createClient(apiOrigin: string, sessionId: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: apiOrigin,
        headers() {
          return {
            Authorization: `Bearer ${sessionId}`,
          };
        },
      }),
    ],
  });
}

export type Client = ReturnType<typeof createClient>;
