// oxlint-disable node/no-process-env
import { defineEnv } from "env";

// Server-only values. The client build fails if this module is reachable from a browser entry.
if (!import.meta.env.SSR) {
  throw new Error("Server environment variables are only available in the server context");
}

export const serverEnv = defineEnv({
  INTERNAL_API_ORIGIN: process.env.INTERNAL_API_ORIGIN,
  SERVICE_API_TOKEN: process.env.SERVICE_API_TOKEN,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
});
