import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { isSignedIn } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import Library, { type LibraryProps } from "@/pages/library/Library";
import { notFound, forbidden } from "@/router/responses";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<LibraryProps> {
  const { workspaceId } = parameters;
  if (!workspaceId) {
    return notFound();
  }

  // Client-side auth check
  if (!import.meta.env.SSR && !isSignedIn()) {
    return forbidden();
  }

  const options = getLoaderContext(headers);

  const [workspace, folders, pages] = await Promise.all([
    client.workspaces.get.query({ workspaceId }, options),
    client.folders.list.query({ workspaceId }, options),
    client.pages.list.query({ workspaceId }, options),
  ]);

  return {
    title: "Your pages - Tiles",
    data: { workspace, folders, pages },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader,
  component: Library,
  hydrate: "immediate",
} satisfies Route<LibraryProps>;
