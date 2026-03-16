import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "api/routes/index";

const SERVICE_NAME = "image-upload-worker";
const API_ORIGIN = process.env.INTERNAL_API_ORIGIN!;

export function createClient(sessionId: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: API_ORIGIN,
        headers() {
          return {
            Authorization: `Bearer ${sessionId}`,
            "X-Service-Name": SERVICE_NAME,
          };
        },
      }),
    ],
  });
}

export type Client = ReturnType<typeof createClient>;
