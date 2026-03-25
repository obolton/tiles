import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { isSignedIn } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import { initRoute } from "@/routes/init";
import Invites, { type InvitesProps } from "@/pages/settings/Invites";
import { notFound, forbidden } from "@/router/responses";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<InvitesProps> {
  const { workspaceId } = parameters;
  if (!workspaceId) {
    return notFound();
  }

  if (!import.meta.env.SSR && !isSignedIn()) {
    return forbidden();
  }

  const options = getLoaderContext(headers);

  const [workspace, invites, user] = await Promise.all([
    client.workspaces.get.query({ workspaceId }, options),
    client.workspaces.listInvites.query({ workspaceId }, options),
    client.users.getUserInfo.query(undefined, options),
  ]);

  if (!workspace) {
    return forbidden();
  }

  if (workspace.role !== "ADMIN") {
    return forbidden();
  }

  return {
    title: "Invites settings - Tiles",
    data: { workspace, invites, user },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader,
  component: Invites,
  hydrate: "immediate",
  beforeHydrate: ({ parameters, data }) => initRoute(parameters.workspaceId, data.user),
} satisfies Route<InvitesProps>;
