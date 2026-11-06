import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "api/routes/index";
import { env } from "./env";

export function createClient(sessionId: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: env.INTERNAL_API_ORIGIN,
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
