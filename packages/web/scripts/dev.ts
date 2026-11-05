import { defineEnv } from "env";
import createDevServer from "@/server/dev-server";

const env = defineEnv({
  required: {
    WEB_HOST: process.env.WEB_HOST,
    WEB_PORT: Number(process.env.WEB_PORT),
    PUBLIC_WEB_ORIGIN: process.env.PUBLIC_WEB_ORIGIN,
  },
});

env.validate();

await createDevServer({
  hostname: env.WEB_HOST,
  port: env.WEB_PORT,
  origin: env.PUBLIC_WEB_ORIGIN,
});
