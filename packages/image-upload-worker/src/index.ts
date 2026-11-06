import { createClient } from "./client";
import { env } from "./env";
import { HttpError } from "./errors";
import { parseUploadRequest } from "./requests";
import { createPreflightResponse, createJsonResponse } from "./responses";
import { uploadImage } from "./upload";

let validated = false;

// Cloudflare evaluates the module when the script is uploaded, before the bindings exist, so the
// variables are validated on the first request rather than at module scope.
function validateEnv() {
  if (!validated) {
    env.validate();
    validated = true;
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    validateEnv();

    if (request.method === "OPTIONS") {
      return createPreflightResponse();
    }

    try {
      const params = parseUploadRequest(request);
      const client = createClient(params.sessionId);
      const image = await uploadImage(params, request.body, client, env.IMAGES);

      return createJsonResponse(image);
    } catch (error) {
      if (error instanceof HttpError) {
        return createJsonResponse({ error: error.message }, error.status);
      }

      return createJsonResponse({ error: "Server Error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
