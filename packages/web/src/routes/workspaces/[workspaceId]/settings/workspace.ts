import { redirect } from "@/router/responses";
import type { APIRoute, APIRequestHandler } from "@/router/router";

export const GET: APIRequestHandler = ({ parameters }) => {
  const { workspaceId } = parameters;
  return redirect(`/workspaces/${workspaceId}/settings/workspace/general`, 302);
};

export default {
  get: GET,
} satisfies APIRoute;
