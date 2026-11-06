// oxlint-disable node/no-process-env
import { defineEnv } from "env";

export const env = defineEnv({
  PUBLIC_WEB_ORIGIN: process.env.PUBLIC_WEB_ORIGIN,
  INTERNAL_API_ORIGIN: process.env.INTERNAL_API_ORIGIN,
});
