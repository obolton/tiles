import { env as bindings } from "cloudflare:workers";
import { defineEnv } from "env";

export const env = defineEnv({
  PUBLIC_WEB_ORIGIN: bindings.PUBLIC_WEB_ORIGIN,
  INTERNAL_API_ORIGIN: bindings.INTERNAL_API_ORIGIN,
});
