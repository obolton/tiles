import { createServer as createHttpsServer } from "node:https";
import { createServer as createViteServer } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ServerOptions } from "node:https";
import type { Respond } from "@/server/server";

export interface DevServerOptions extends ServerOptions {
  hostname: string;
  port: number;
}

export default async function createDevServer(options: DevServerOptions) {
  const { hostname, port } = options;
  const server = createHttpsServer(options, handleRequest);
  server.on("error", console.error);

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
  });

  server.listen(port, hostname, () =>
    console.log(`Development server: listening at https://${hostname}:${port}`),
  );

  async function handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ) {
    vite.middlewares(request, response, async () => {
      const { default: respond } = (await vite.ssrLoadModule(
        "@/server/server",
      )) as { default: Respond };

      try {
        await respond(request, response, vite);
      } catch (error) {
        if (error instanceof Error) {
          vite.ssrFixStacktrace(error);
        }
        console.error(error);
        response.writeHead(500);
        response.end(error);
      }
    });
  }
}
