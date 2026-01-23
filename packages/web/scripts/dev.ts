import assert from "node:assert";
import createDevServer from "@/server/dev-server";

assert(process.env.WEB_HOST);
assert(process.env.WEB_PORT);

await createDevServer({
  hostname: process.env.WEB_HOST,
  port: parseInt(process.env.WEB_PORT, 10),
});
