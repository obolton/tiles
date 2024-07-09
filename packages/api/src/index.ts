import assert from "node:assert";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import cors from "cors";
import router from "./router/index.ts";
import { createContext } from "./router/trpc.ts";

const HOST = process.env.HOST;
const PORT = parseInt(process.env.PORT || "", 10);
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === "true";
const CERTIFICATE_PATH = process.env.CERTIFICATE_PATH;
const CERTIFICATE_KEY_PATH = process.env.CERTIFICATE_KEY_PATH;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

assert(HOST);
assert(PORT);
assert(!Number.isNaN(PORT));
assert(CLIENT_ORIGIN);

const handler = createHTTPHandler({
  router,
  middleware: cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
  createContext,
});

function getServer() {
  if (ENABLE_HTTPS) {
    assert(CERTIFICATE_PATH);
    assert(CERTIFICATE_KEY_PATH);

    return https.createServer(
      {
        key: fs.readFileSync(CERTIFICATE_KEY_PATH),
        cert: fs.readFileSync(CERTIFICATE_PATH),
      },
      handler,
    );
  }
  return http.createServer(handler);
}

const server = getServer();
server.on("error", (error) => {
  console.error("API:", error);
});
server.listen({ host: HOST, port: PORT }, () => {
  console.log(
    `API: Server started at ${ENABLE_HTTPS ? "https" : "http"}://${HOST}:${PORT}`,
  );
});
