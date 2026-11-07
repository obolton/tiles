import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { isSignedIn } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import { initRoute } from "@/routes/init";
import Invites, { type InvitesProps } from "@/pages/settings/Invites";
import { NotFoundError, ForbiddenError } from "@/router/errors";
import type { Route, RequestProperties, RouteLoaderResult } from "@/router/router";

async function loader({ headers, parameters }: RequestProperties): RouteLoaderResult<InvitesProps> {
  const { workspaceId } = parameters;
  if (!workspaceId) {
    throw new NotFoundError();
  }

  if (!import.meta.env.SSR && !isSignedIn()) {
    throw new ForbiddenError();
  }

  const options = getLoaderContext(headers);

  const [workspace, invites, user] = await Promise.all([
    client.workspaces.get.query({ workspaceId }, options),
    client.workspaces.listInvites.query({ workspaceId }, options),
    client.users.getUserInfo.query(undefined, options),
  ]);

  if (workspace.role !== "ADMIN") {
    throw new ForbiddenError();
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
