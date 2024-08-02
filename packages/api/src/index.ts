import assert from "node:assert";
import fs from "node:fs";
import http, { IncomingMessage, ServerResponse } from "node:http";
import https from "node:https";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import cors from "cors";
import router from "./router/index.ts";
import { createContext } from "./router/trpc.ts";
import { resourcesHandler } from "./resources/index.ts";

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

const trpcHandler = createHTTPHandler({
  router,
  middleware: cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
  createContext,
});

async function requestHandler(req: IncomingMessage, res: ServerResponse) {
  const [, path] = req.url?.split("/", 2) ?? [];
  if (path === "resources") {
    return resourcesHandler(req, res);
  } else {
    return trpcHandler(req, res);
  }
}

function getServer() {
  if (ENABLE_HTTPS) {
    assert(CERTIFICATE_PATH);
    assert(CERTIFICATE_KEY_PATH);

    return https.createServer(
      {
        key: fs.readFileSync(CERTIFICATE_KEY_PATH),
        cert: fs.readFileSync(CERTIFICATE_PATH),
      },
      requestHandler,
    );
  }
  return http.createServer(requestHandler);
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
