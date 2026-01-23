import assert from "node:assert";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import cors from "cors";
import router from "@/routes/index.ts";
import { createContext } from "@/utils/trpc.ts";
import { resourcesHandler } from "@/resources/index.ts";

const API_HOST = process.env.API_HOST;
const API_PORT = parseInt(process.env.API_PORT || "", 10);
const CORS_ORIGIN = process.env.PUBLIC_WEB_ORIGIN;

assert(API_HOST);
assert(API_PORT);
assert(!Number.isNaN(API_PORT));
assert(CORS_ORIGIN);

const SERVER_URL = `http://${API_HOST}:${API_PORT}`;

const trpcHandler = createHTTPHandler({
  router,
  middleware: cors({
    origin: CORS_ORIGIN,
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

const server = createServer(requestHandler);
server.on("error", (error) => {
  console.error("API:", error);
});
server.listen({ host: API_HOST, port: API_PORT }, () => {
  console.log(`API: Server started at ${SERVER_URL}`);
});
