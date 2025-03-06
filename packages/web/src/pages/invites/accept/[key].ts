import client from "@/api/client";
import type { APIRoute } from "astro";
import { SESSION_COOKIE_NAME } from "api/src/constants/cookies";

export const GET: APIRoute = async ({ params: { key }, cookies, redirect }) => {
  const sessionId = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!key) {
    return new Response(null, { status: 404, statusText: "Not Found" });
  }
  const { pageId } = await client.collaboration.acceptPageInvite.mutate(
    { key },
    { context: { sessionId } },
  );
  return redirect(`/pages/${pageId}`, 302);
};
