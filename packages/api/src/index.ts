import assert from "node:assert";
import fs from "node:fs";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import https from "node:https";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import cors from "cors";
import router from "@/routes/index.ts";
import { createContext } from "@/utils/trpc.ts";
import { resourcesHandler } from "@/resources/index.ts";

const HOST = process.env.HOST;
const PORT = parseInt(process.env.PORT || "", 10);
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === "true";
const CERTIFICATE_PATH = process.env.CERTIFICATE_PATH;
const CERTIFICATE_KEY_PATH = process.env.CERTIFICATE_KEY_PATH;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const SERVER_URL = `${ENABLE_HTTPS ? "https" : "http"}://${HOST}:${PORT}`;

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
  onError({ req, error }) {
    console.error(req.url, error);
  },
});

async function requestHandler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", SERVER_URL);
  const [path, ...remainingPathSegments] =
    url.pathname.slice(1).split("/", 3) ?? [];
  if (path === "resources") {
    const [resourceType, resourceId] = remainingPathSegments;
    if (!resourceType || !resourceId) {
      res.writeHead(404);
      res.end();
      return;
    }
    return resourcesHandler(resourceType, resourceId, res);
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
  console.log(`API: Server started at ${SERVER_URL}`);
});
