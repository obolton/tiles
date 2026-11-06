import client from "@/api/client";
import { withDestination } from "@/auth/destinations";
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
    return redirect(withDestination("/sign-in", `invites/accept/${key}`), 302);
  }
  const { pageId } = await client.collaboration.acceptPageInvite.mutate(
    { key },
    { context: { sessionId } },
  );
  return redirect(`/pages/${pageId}`, 302);
};

export default {
  get: GET,
} satisfies APIRoute;
