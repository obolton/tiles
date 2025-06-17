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
}: RequestProperties): RouteLoaderResult<WorkspaceProps> {
  const sessionId = getSessionId(headers);
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const [workspace, users, invites] = await Promise.all([
    client.workspaces.get.query(undefined, {
      context: { sessionId },
    }),
    client.workspaces.listUsers.query(
      { offset: 0 },
      { context: { sessionId } },
    ),
    client.workspaces.listInvites.query(
      { offset: 0 },
      { context: { sessionId } },
    ),
  ]);

  if (!workspace) {
    throw new Error("Unauthorized");
  }

  return {
    title: "Workspace - Tiles",
    data: { workspace, users, invites },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: Workspace,
} satisfies Route<WorkspaceProps>;
