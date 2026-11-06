import type { Respond } from "./server";

// Cloudflare evaluates the module when the script is uploaded, before the bindings exist, so the
// app and its environment registries are loaded on the first request rather than at module scope.
let respond: Promise<Respond> | undefined;

export default {
  async fetch(request: Request) {
    respond ??= import("./server").then((module) => module.default);
    return (await respond)(request);
  },
};
