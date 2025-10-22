import { parse } from "cookie";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "api/routes/index";
import type { R2EventMessage } from "./events";

const SERVICE_NAME = "image-upload-worker";
const SESSION_COOKIE_NAME = "__Secure-session";
const ACCESS_CONTROL_MAX_AGE = 3600; // 1 hour

function createClient(sessionId: string, env: Env) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: env.PUBLIC_API_BASE_URL,
        headers() {
          return {
            Authorization: `Bearer ${sessionId}`,
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
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": env.PUBLIC_WEB_BASE_URL,
          "Access-Control-Allow-Methods": "PUT",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": ACCESS_CONTROL_MAX_AGE.toString(),
        },
      });
    }

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

    const client = createClient(sessionId, env);

    const image = await client.media.createImage.mutate({ workspaceId });

    const object = await env.IMAGES.put(image.id, request.body, {
      customMetadata: {
        workspace: image.workspaceId,
        user: image.userId,
      },
    });

    const updatedImage = await client.media.updateImage.mutate({
      id: image.id,
      workspaceId,
      bytes: object.size,
    });

    return new Response(JSON.stringify(updatedImage), {
      headers: {
        "Access-Control-Allow-Origin": env.PUBLIC_WEB_BASE_URL,
        "Access-Control-Allow-Credentials": "true",
        "Content-Type": "application/json",
      },
    });
  },
} satisfies ExportedHandler<Env, R2EventMessage>;
