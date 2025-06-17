import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import Folder, { type FolderProps } from "@/pages/library/Folder";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<FolderProps> {
  const sessionId = getSessionId(headers);
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const id = parameters.id;
  if (!id) {
    throw new Error("Not Found");
  }

  const [folder, folders, pages] = await Promise.all([
    client.folders.get.query({ id }, { context: { sessionId } }),
    client.folders.list.query({ offset: 0 }, { context: { sessionId } }),
    client.folders.listPages.query(
      { id, offset: 0 },
      { context: { sessionId } },
    ),
  ]);

  return {
    title: `${folder.name} - Tiles`,
    data: { id: folder.id, name: folder.name, folders, pages },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: Folder,
} satisfies Route<FolderProps>;
