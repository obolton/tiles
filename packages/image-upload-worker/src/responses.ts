const ACCESS_CONTROL_MAX_AGE = 3600; // 1 hour
const ALLOW_ORIGIN = process.env.PUBLIC_WEB_ORIGIN!;

export function createPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": ALLOW_ORIGIN,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "PUT",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": ACCESS_CONTROL_MAX_AGE.toString(),
    },
  });
}

export function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": ALLOW_ORIGIN,
      "Access-Control-Allow-Credentials": "true",
      "Content-Type": "application/json",
    },
  });
}
