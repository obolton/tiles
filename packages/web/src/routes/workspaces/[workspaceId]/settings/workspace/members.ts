import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { isSignedIn } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import { initRoute } from "@/routes/init";
import Members, { type MembersProps } from "@/pages/settings/Members";
import { notFound, forbidden } from "@/router/responses";
import type { Route, RequestProperties, RouteLoaderResult } from "@/router/router";

async function loader({ headers, parameters }: RequestProperties): RouteLoaderResult<MembersProps> {
  const { workspaceId } = parameters;
  if (!workspaceId) {
    return notFound();
  }

  if (!import.meta.env.SSR && !isSignedIn()) {
    return forbidden();
  }

  const options = getLoaderContext(headers);

  const [workspace, users, user] = await Promise.all([
    client.workspaces.get.query({ workspaceId }, options),
    client.workspaces.listUsers.query({ workspaceId }, options),
    client.users.getUserInfo.query(undefined, options),
  ]);

  return {
    title: "Members settings - Tiles",
    data: { workspace, users, user },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader,
  component: Members,
  hydrate: "immediate",
  beforeHydrate: ({ parameters, data }) => initRoute(parameters.workspaceId, data.user),
} satisfies Route<MembersProps>;
