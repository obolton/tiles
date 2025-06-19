import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import Trash, { type TrashProps } from "@/pages/library/Trash";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<TrashProps> {
  const { workspaceId } = parameters;
  if (!workspaceId) {
    throw new Error("Not Found");
  }

  const sessionId = getSessionId(headers);
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const options = { context: { sessionId } };

  const [workspace, folders, pages] = await Promise.all([
    client.workspaces.get.query({ workspaceId }, options),
    client.folders.list.query({ workspaceId, offset: 0 }, options),
    client.pages.listDeleted.query({ workspaceId, offset: 0 }, options),
  ]);

  return {
    title: "Trash - Tiles",
    data: { workspace, folders, pages },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: Trash,
} satisfies Route<TrashProps>;
