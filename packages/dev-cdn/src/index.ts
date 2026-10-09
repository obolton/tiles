function getBucket(env: Env, name: string): R2Bucket | undefined {
  switch (name) {
    case "images":
      return env.IMAGES;
    default:
      return undefined;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const [, bucketName = "", ...keyParts] = new URL(request.url).pathname.split("/");
    const bucket = getBucket(env, bucketName);
    const key = keyParts.join("/");
    if (!bucket || !key) {
      return new Response(null, { status: 404 });
    }

    const object = await bucket.get(key, { onlyIf: request.headers });
    if (!object) {
      return new Response(null, { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("ETag", object.httpEtag);

    if (!("body" in object)) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(request.method === "HEAD" ? null : object.body, { headers });
  },
} satisfies ExportedHandler<Env>;
