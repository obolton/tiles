import { createServer } from "node:http";
import { createServer as createViteServer } from "vite";
import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";
import type {
  IncomingMessage,
  IncomingHttpHeaders,
  OutgoingHttpHeader,
  ServerResponse,
} from "node:http";
import type { Respond } from "@/server/server";

export interface DevServerOptions {
  hostname: string;
  port: number;
  origin: string;
}

function toWebHeaders(headers: IncomingHttpHeaders) {
  const webHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      for (const valueItem of value) {
        webHeaders.append(key, valueItem);
      }
    } else if (value) {
      webHeaders.append(key, value);
    }
  }
  return webHeaders;
}

function fromWebHeaders(webHeaders: Headers) {
  const headers: OutgoingHttpHeader[] = [];
  for (const [key, value] of webHeaders.entries()) {
    headers.push(key, value);
  }
  return headers;
}

export default async function createDevServer(options: DevServerOptions) {
  const { hostname, port, origin } = options;

  const server = createServer(handleRequest);
  server.on("error", console.error);

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
  });

  // Load the SSR entry up front so configuration errors surface at startup.
  await vite.ssrLoadModule("@/server/server");

  server.listen(port, hostname, () => console.log(`Development server: ${origin}`));

  async function handleRequest(request: IncomingMessage, response: ServerResponse) {
    vite.middlewares(request, response, async () => {
      const { default: respond } = (await vite.ssrLoadModule("@/server/server")) as {
        default: Respond;
      };

      try {
        const method = request.method ?? "GET";
        const hasBody = method !== "GET" && method !== "HEAD";
        const forwardedProto = request.headers["x-forwarded-proto"];
        const proto =
          (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) ?? "http";
        const host = request.headers.host;
        const baseUrl = host ? `${proto}://${host}` : origin;
        const webRequest = new Request(new URL(request.url ?? "", baseUrl), {
          method,
          headers: toWebHeaders(request.headers),
          body: hasBody ? (Readable.toWeb(request) as globalThis.ReadableStream) : undefined,
          duplex: hasBody ? "half" : undefined,
        });
        const webResponse = await respond(webRequest, vite);
        response.writeHead(
          webResponse.status,
          webResponse.statusText,
          fromWebHeaders(webResponse.headers),
        );
        if (webResponse.body) {
          Readable.fromWeb(webResponse.body as ReadableStream<Uint8Array>).pipe(response);
        } else {
          response.end();
        }
      } catch (error) {
        if (error instanceof Error) {
          vite.ssrFixStacktrace(error);
        }
        console.error(request.url + ":", error);
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end(
          error instanceof Error ? `${error.message}\n\n${error.stack}` : "Internal Server Error",
        );
      }
    });
  }
}
