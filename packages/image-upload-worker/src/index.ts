import { parse } from "cookie";
import { SESSION_COOKIE_NAME } from "api/constants/cookies";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "api/routes/index";
import type { R2EventMessage } from "./events";

const SERVICE_NAME = "image-upload-worker";

function createClient(env: Env) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: env.PUBLIC_API_BASE_URL,
        headers() {
          return {
            Authorization: `Bearer ${env.API_TOKEN}`,
            "X-Service-Name": SERVICE_NAME,
          };
        },
      }),
    ],
  });
}

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

function badRequest() {
  return new Response("Bad Request", { status: 400 });
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method !== "PUT") {
      return badRequest();
    }

    const cookie = parse(request.headers.get("Cookie") || "");
    const sessionId = cookie[SESSION_COOKIE_NAME];

    if (!sessionId) {
      return unauthorized();
    }

    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId");

    if (!workspaceId) {
      return badRequest();
    }

    const client = createClient(env);

    const image = await client.media.createImage.mutate(
      { workspaceId },
      { context: { sessionId } },
    );

    const object = await env.IMAGES.put(image.id, request.body, {
      customMetadata: {
        workspace: image.workspaceId,
        user: image.userId,
      },
    });

    const updatedImage = await client.media.updateImage.mutate(
      { id: image.id, workspaceId, bytes: object.size },
      { context: { sessionId } },
    );

    return new Response(JSON.stringify(updatedImage), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
} satisfies ExportedHandler<Env, R2EventMessage>;
