import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import Workspace, { type WorkspaceProps } from "@/pages/settings/Workspace";
import { authenticatedRoute } from "@/utils/middleware";
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
    throw new Error("Not Found");
  }

  const sessionId = getSessionId(headers);
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const options = { context: { sessionId } };

  const [workspace, users, invites] = await Promise.all([
    client.workspaces.get.query({ id: workspaceId }, options),
    client.workspaces.listUsers.query({ offset: 0 }, options),
    client.workspaces.listInvites.query({ offset: 0 }, options),
  ]);

  if (!workspace) {
    throw new Error("Unauthorized");
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
