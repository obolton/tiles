import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { isSignedIn } from "@/utils/sessions";
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

  if (!import.meta.env.SSR && !isSignedIn()) {
    return forbidden();
  }

  const options = getLoaderContext(headers);

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
  loader,
  component: Workspace,
  hydrate: "immediate",
} satisfies Route<WorkspaceProps>;
