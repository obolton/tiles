import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import Workspace, { type WorkspaceProps } from "@/pages/settings/Workspace";
import { authenticatedRoute } from "@/utils/middleware";
import { notFound, forbidden } from "@/router/responses";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<WorkspaceProps> {
  const { workspaceId } = parameters;
  if (!workspaceId) {
    return notFound();
  }

  const sessionId = getSessionId(headers);
  if (!sessionId) {
    return forbidden();
  }

  const options = { context: { sessionId } };

  const [workspace, users, invites] = await Promise.all([
    client.workspaces.get.query({ workspaceId }, options),
    client.workspaces.listUsers.query({ workspaceId }, options),
    client.workspaces.listInvites.query({ workspaceId }, options),
  ]);

  if (!workspace) {
    return forbidden();
  }

  return {
    title: "Workspace settings - Tiles",
    data: { workspace, users, invites },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: Workspace,
} satisfies Route<WorkspaceProps>;
