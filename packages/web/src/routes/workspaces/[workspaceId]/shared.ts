import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import Shared, { type SharedProps } from "@/pages/library/Shared";
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
    client.pages.listShared.query({ workspaceId, offset: 0 }, options),
  ]);

  return {
    title: "Shared with you - Tiles",
    data: { workspace, folders, pages },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: Shared,
} satisfies Route<SharedProps>;
