import assert from "node:assert";
import { createServer } from "node:http";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import cors from "cors";
import crossws from "crossws/adapters/node";
import router from "@/routes/index";
import { createContext } from "@/utils/trpc";
import { hocuspocus } from "@/collaboration/instance";

const API_HOST = process.env.API_HOST;
const API_PORT = parseInt(process.env.API_PORT || "", 10);
const CORS_ORIGIN = process.env.PUBLIC_WEB_ORIGIN;

assert(API_HOST);
assert(API_PORT);
assert(!Number.isNaN(API_PORT));
assert(CORS_ORIGIN);

const SERVER_URL = `http://${API_HOST}:${API_PORT}`;
const COLLABORATION_PATH = "/collaboration";

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

const server = createServer(trpcHandler);

const peerConnections = new WeakMap<
  object,
  ReturnType<typeof hocuspocus.handleConnection>
>();

const ws = crossws({
  hooks: {
    open(peer) {
      peerConnections.set(
        peer,
        hocuspocus.handleConnection(
          peer.websocket as unknown as WebSocket,
          peer.request,
        ),
      );
    },
    message(peer, message) {
      peerConnections.get(peer)?.handleMessage(message.uint8Array());
    },
    close(peer, event) {
      peerConnections.get(peer)?.handleClose({
        code: event.code ?? 1000,
        reason: event.reason ?? "",
      });
      peerConnections.delete(peer);
    },
  },
});

server.on("error", (error) => {
  console.error("API:", error);
});

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", SERVER_URL);
  if (url.pathname.startsWith(COLLABORATION_PATH)) {
    ws.handleUpgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.listen({ host: API_HOST, port: API_PORT }, () => {
  console.log(`API: Server started at ${SERVER_URL}`);
});

function stop() {
  server.close((error) => {
    if (error) {
      console.error(error);
    }
    process.exit(0);
  });
}

process.on("SIGTERM", () => {
  console.log("API: Received SIGTERM");
  stop();
});

process.on("SIGINT", () => {
  console.log("API: Received SIGINT");
  stop();
});
