import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { isSignedIn } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import { initRoute } from "@/routes/init";
import Members, { type MembersProps } from "@/pages/settings/Members";
import { notFound, forbidden } from "@/router/responses";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<MembersProps> {
  const { workspaceId } = parameters;
  if (!workspaceId) {
    return notFound();
  }

  if (!import.meta.env.SSR && !isSignedIn()) {
    return forbidden();
  }

  const options = getLoaderContext(headers);

  const [workspace, users] = await Promise.all([
    client.workspaces.get.query({ workspaceId }, options),
    client.workspaces.listUsers.query({ workspaceId }, options),
  ]);

  if (!workspace) {
    return forbidden();
  }

  return {
    title: "Members settings - Tiles",
    data: { workspace, users },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader,
  component: Members,
  hydrate: "immediate",
  beforeHydrate: ({ parameters }) => initRoute(parameters.workspaceId),
} satisfies Route<MembersProps>;
