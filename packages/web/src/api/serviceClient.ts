import assert from "node:assert";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { SERVICE_NAME_HEADER, SERVICE_TOKEN_HEADER } from "api/constants/headers";
import { ServiceName } from "api/constants/services";
import type { AppRouter } from "api/routes/index";

// Carries the shared service token, so it is only ever constructed on the server. Server-only
// procedures (e.g. sign-in) go through this client rather than the shared one.
if (!import.meta.env.SSR) {
  throw new Error("The service API client is only available in the server context");
}

assert(process.env.INTERNAL_API_ORIGIN, "INTERNAL_API_ORIGIN is not defined");
assert(process.env.SERVICE_API_TOKEN, "SERVICE_API_TOKEN is not defined");

const SERVICE_NAME = ServiceName.WEB;

const serviceClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.INTERNAL_API_ORIGIN,
      headers: {
        [SERVICE_TOKEN_HEADER]: process.env.SERVICE_API_TOKEN,
        [SERVICE_NAME_HEADER]: SERVICE_NAME,
      },
    }),
  ],
});

export default serviceClient;
