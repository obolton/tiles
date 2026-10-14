import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "api/routes/index";

const API_ORIGIN = process.env.INTERNAL_API_ORIGIN!;

export function createClient(sessionId: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: API_ORIGIN,
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
