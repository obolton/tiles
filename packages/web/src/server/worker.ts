import respond from "./server";

export default {
  fetch(request: Request, env: Cloudflare.Env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/assets/")) {
      return env.ASSETS.fetch(request);
    }

    return respond(request);
  },
};
