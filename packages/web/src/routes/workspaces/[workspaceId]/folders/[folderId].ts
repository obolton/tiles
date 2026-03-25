import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { isSignedIn } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import { initRoute } from "@/routes/init";
import Folder, { type FolderProps } from "@/pages/library/Folder";
import { notFound, forbidden } from "@/router/responses";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<FolderProps> {
  const { workspaceId, folderId } = parameters;
  if (!workspaceId || !folderId) {
    return notFound();
  }

  if (!import.meta.env.SSR && !isSignedIn()) {
    return forbidden();
  }

  const options = getLoaderContext(headers);

  const [workspace, folder, folders, pages, user] = await Promise.all([
    client.workspaces.get.query({ workspaceId }, options),
    client.folders.get.query({ workspaceId, id: folderId }, options),
    client.folders.list.query({ workspaceId }, options),
    client.folders.listPages.query({ workspaceId, id: folderId }, options),
    client.users.getUserInfo.query(undefined, options),
  ]);

  if (!folder) {
    return notFound();
  }

  return {
    title: `${folder.name} - Tiles`,
    data: { workspace, id: folder.id, name: folder.name, folders, pages, user },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader,
  component: Folder,
  hydrate: "immediate",
  beforeHydrate: ({ parameters, data }) => initRoute(parameters.workspaceId, data.user),
} satisfies Route<FolderProps>;
