import assert from "node:assert";
import fs from "node:fs";
import createDevServer from "@/server/dev-server";

assert(process.env.HOST);
assert(process.env.DEV_SERVER_PORT);
assert(process.env.CERTIFICATE_KEY_PATH);
assert(process.env.CERTIFICATE_PATH);

const HOST = process.env.HOST;
const PORT = parseInt(process.env.DEV_SERVER_PORT, 10);
const CERTIFICATE_KEY_PATH = process.env.CERTIFICATE_KEY_PATH;
const CERTIFICATE_PATH = process.env.CERTIFICATE_PATH;

await createDevServer({
  hostname: HOST,
  port: PORT,
  key: fs.readFileSync(CERTIFICATE_KEY_PATH),
  cert: fs.readFileSync(CERTIFICATE_PATH),
});
