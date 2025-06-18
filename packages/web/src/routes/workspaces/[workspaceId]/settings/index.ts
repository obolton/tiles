import { redirect } from "@/router/router";
import type { APIRoute, APIRequestHandler } from "@/router/router";

export const GET: APIRequestHandler = ({ parameters }) => {
  const { workspaceId } = parameters;
  return redirect(`/workspaces/${workspaceId}/settings/profile`, 302);
};

export default {
  get: GET,
} satisfies APIRoute;
