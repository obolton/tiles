import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { SERVICE_TOKEN_HEADER } from "api/constants/headers";
import { serverEnv } from "@/env/server";
import type { AppRouter } from "api/routes/index";

// Carries the shared service token, so it is only ever constructed on the server. Server-only
// procedures (e.g. sign-in) go through this client rather than the shared one.
if (!import.meta.env.SSR) {
  throw new Error("The service API client is only available in the server context");
}

const serviceClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: serverEnv.INTERNAL_API_ORIGIN,
      headers: {
        [SERVICE_TOKEN_HEADER]: serverEnv.SERVICE_API_TOKEN,
      },
    }),
  ],
});

export default serviceClient;
