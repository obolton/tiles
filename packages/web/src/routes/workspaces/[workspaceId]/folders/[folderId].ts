import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
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

  const sessionId = getSessionId(headers);
  if (!sessionId) {
    return forbidden();
  }

  const options = { context: { sessionId } };

  const [workspace, folder, folders, pages] = await Promise.all([
    client.workspaces.get.query({ workspaceId }, options),
    client.folders.get.query({ workspaceId, id: folderId }, options),
    client.folders.list.query({ workspaceId }, options),
    client.folders.listPages.query({ workspaceId, id: folderId }, options),
  ]);

  if (!folder) {
    return notFound();
  }

  return {
    title: `${folder.name} - Tiles`,
    data: { workspace, id: folder.id, name: folder.name, folders, pages },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: Folder,
} satisfies Route<FolderProps>;
