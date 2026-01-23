import { parse } from "cookie";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "api/routes/index";

const SERVICE_NAME = "image-upload-worker";
const SESSION_COOKIE_NAME = "__Secure-session";
const ACCESS_CONTROL_MAX_AGE = 3600; // 1 hour

function createClient(sessionId: string, env: Env) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: env.PUBLIC_API_ORIGIN,
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

export class BadRequestError extends Error {}

export function getPurpose(purpose: string) {
  switch (purpose.toLowerCase()) {
    case "content":
      return "CONTENT";
    case "profile":
      return "PROFILE";
    default:
      throw new BadRequestError("Invalid purpose");
  }
}

export function getImageType(contentType: string) {
  switch (contentType.toLowerCase()) {
    case "image/png":
      return "PNG";
    case "image/jpeg":
      return "JPEG";
    case "image/gif":
      return "GIF";
    case "image/webp":
      return "WEBP";
    default:
      throw new BadRequestError("Invalid content type");
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": env.PUBLIC_WEB_ORIGIN,
          "Access-Control-Allow-Methods": "PUT",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": ACCESS_CONTROL_MAX_AGE.toString(),
        },
      });
    }

    try {
      if (request.method !== "PUT") {
        throw new BadRequestError("Invalid method");
      }

      const cookie = parse(request.headers.get("Cookie") || "");
      const sessionId = cookie[SESSION_COOKIE_NAME];

      if (!sessionId) {
        return new Response("Unauthorized", { status: 401 });
      }

      const url = new URL(request.url);
      const workspaceId = url.searchParams.get("workspaceId");
      const purpose = getPurpose(url.searchParams.get("purpose") ?? "");
      const type = getImageType(request.headers.get("Content-Type") ?? "");

      if (!workspaceId) {
        throw new BadRequestError("Invalid workspace ID");
      }

      const client = createClient(sessionId, env);

      const image = await client.media.createImage.mutate({
        workspaceId,
        source: "UPLOAD",
        purpose,
        type,
        pending: true,
      });

      const object = await env.IMAGES.put(image.id, request.body, {
        customMetadata: {
          workspace: image.workspaceId,
          user: image.userId,
        },
      });

      const updatedImage = await client.media.updateImage.mutate({
        id: image.id,
        workspaceId,
        pending: false,
        bytes: object.size,
      });

      return new Response(JSON.stringify(updatedImage), {
        headers: {
          "Access-Control-Allow-Origin": env.PUBLIC_WEB_ORIGIN,
          "Access-Control-Allow-Credentials": "true",
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      if (error instanceof BadRequestError) {
        return new Response("Bad Request", { status: 400 });
      }

      return new Response("Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
