import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "api/routes/index";
import { ServiceName } from "api/constants/services";

const SERVICE_NAME = ServiceName.IMAGE_UPLOAD_WORKER;
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
