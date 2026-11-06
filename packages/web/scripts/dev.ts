import { defineEnv } from "env";
import createDevServer from "@/server/dev-server";

const env = defineEnv({
  WEB_HOST: process.env.WEB_HOST,
  WEB_PORT: parseInt(process.env.WEB_PORT ?? "", 10),
  PUBLIC_WEB_ORIGIN: process.env.PUBLIC_WEB_ORIGIN,
});

await createDevServer({
  hostname: env.WEB_HOST,
  port: env.WEB_PORT,
  origin: env.PUBLIC_WEB_ORIGIN,
});
