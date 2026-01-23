import assert from "node:assert";
import createDevServer from "@/server/dev-server";

assert(process.env.HOST);
assert(process.env.DEV_SERVER_PORT);

await createDevServer({
  hostname: process.env.HOST,
  port: parseInt(process.env.DEV_SERVER_PORT, 10),
});
