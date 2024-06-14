import assert from "node:assert";
import fs from "node:fs";
import https from "node:https";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import cors from "cors";
import router from "./router/index.ts";

const HOST = process.env.HOST;
const PORT = parseInt(process.env.PORT || "", 10);
const CERTIFICATE_PATH = process.env.CERTIFICATE_PATH;
const CERTIFICATE_KEY_PATH = process.env.CERTIFICATE_KEY_PATH;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const USER_ID = process.env.USER_ID;

assert(HOST);
assert(PORT);
assert(!Number.isNaN(PORT));
assert(CLIENT_ORIGIN);
assert(CERTIFICATE_PATH);
assert(CERTIFICATE_KEY_PATH);

const handler = createHTTPHandler({
  router,
  middleware: cors({
    origin: CLIENT_ORIGIN,
  }),
  createContext() {
    return {
      userId: USER_ID,
    };
  },
});

const server = https.createServer(
  {
    key: fs.readFileSync(CERTIFICATE_KEY_PATH),
    cert: fs.readFileSync(CERTIFICATE_PATH),
  },
  handler
);
server.on("error", (error) => {
  console.error("API:", error);
});
server.listen({ host: HOST, port: PORT }, () => {
  console.log(`API: Server started at https://${HOST}:${PORT}`);
});
