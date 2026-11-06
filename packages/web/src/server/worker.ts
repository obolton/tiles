import respond from "./server";
import { publicEnv } from "@/env/public";
import { serverEnv } from "@/env/server";

let validated = false;

export default {
  fetch(request: Request) {
    // Cloudflare evaluates the module when the script is uploaded, before the bindings exist, so
    // validate on the first request rather than at module scope.
    if (!validated) {
      publicEnv.validate();
      serverEnv.validate();
      validated = true;
    }
    return respond(request);
  },
};
