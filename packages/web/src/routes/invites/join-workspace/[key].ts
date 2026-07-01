import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import { redirect, notFound } from "@/router/responses";
import type { APIRoute, APIRequestHandler } from "@/router/router";

const GET: APIRequestHandler = async ({ headers, parameters }) => {
  const key = parameters.key;
  if (!key) {
    return notFound();
  }
  const sessionId = getSessionId(headers);
  if (!sessionId) {
    return redirect(
      `/sign-in?destination=${encodeURIComponent(`invites/join-workspace/${key}`)}`,
      302,
    );
  }
  await client.workspaces.acceptInvite.mutate({ key }, { context: { sessionId } });
  return redirect("/library", 302);
};

export default {
  get: GET,
} satisfies APIRoute;
