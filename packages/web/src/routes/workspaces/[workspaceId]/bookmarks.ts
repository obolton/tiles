import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { isSignedIn } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import { initRoute } from "@/routes/init";
import Bookmarks, { type BookmarksProps } from "@/pages/library/Bookmarks";
import { notFound, forbidden } from "@/router/responses";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<BookmarksProps> {
  const { workspaceId } = parameters;
  if (!workspaceId) {
    return notFound();
  }

  if (!import.meta.env.SSR && !isSignedIn()) {
    return forbidden();
  }

  const options = getLoaderContext(headers);

  const [workspace, folders, pages] = await Promise.all([
    client.workspaces.get.query({ workspaceId }, options),
    client.folders.list.query({ workspaceId }, options),
    client.bookmarks.list.query({}, options),
  ]);

  return {
    title: "Bookmarks - Tiles",
    data: { workspace, folders, pages },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader,
  component: Bookmarks,
  hydrate: "immediate",
  beforeHydrate: ({ parameters }) => initRoute(parameters.workspaceId),
} satisfies Route<BookmarksProps>;
