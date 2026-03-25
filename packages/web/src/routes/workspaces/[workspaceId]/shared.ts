import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { isSignedIn } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import { initRoute } from "@/routes/init";
import Shared, { type SharedProps } from "@/pages/library/Shared";
import { notFound, forbidden } from "@/router/responses";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<SharedProps> {
  const { workspaceId } = parameters;
  if (!workspaceId) {
    return notFound();
  }

  if (!import.meta.env.SSR && !isSignedIn()) {
    return forbidden();
  }

  const options = getLoaderContext(headers);

  const [workspace, folders, pages, user] = await Promise.all([
    client.workspaces.get.query({ workspaceId }, options),
    client.folders.list.query({ workspaceId }, options),
    client.pages.listShared.query({ workspaceId }, options),
    client.users.getUserInfo.query(undefined, options),
  ]);

  return {
    title: "Shared with you - Tiles",
    data: { workspace, folders, pages, user },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader,
  component: Shared,
  hydrate: "immediate",
  beforeHydrate: ({ parameters, data }) => initRoute(parameters.workspaceId, data.user),
} satisfies Route<SharedProps>;
