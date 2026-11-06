import { defineEnv } from "env";
import { createClient } from "./client";
import { HttpError } from "./errors";
import { parseUploadRequest } from "./requests";
import { createPreflightResponse, createJsonResponse } from "./responses";
import { uploadImage } from "./upload";

export default {
  async fetch(request, env): Promise<Response> {
    // Bindings only exist per request, so the variables are read and validated here.
    const { PUBLIC_WEB_ORIGIN, INTERNAL_API_ORIGIN } = defineEnv({
      PUBLIC_WEB_ORIGIN: env.PUBLIC_WEB_ORIGIN,
      INTERNAL_API_ORIGIN: env.INTERNAL_API_ORIGIN,
    });

    if (request.method === "OPTIONS") {
      return createPreflightResponse(PUBLIC_WEB_ORIGIN);
    }

    try {
      const params = parseUploadRequest(request);
      const client = createClient(INTERNAL_API_ORIGIN, params.sessionId);
      const image = await uploadImage(params, request.body, client, env.IMAGES);

      return createJsonResponse(PUBLIC_WEB_ORIGIN, image);
    } catch (error) {
      if (error instanceof HttpError) {
        return createJsonResponse(PUBLIC_WEB_ORIGIN, { error: error.message }, error.status);
      }

      return createJsonResponse(PUBLIC_WEB_ORIGIN, { error: "Server Error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
