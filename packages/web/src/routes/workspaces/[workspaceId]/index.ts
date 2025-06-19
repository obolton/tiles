import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import Library, { type LibraryProps } from "@/pages/library/Library";
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
    client.pages.list.query({ workspaceId, offset: 0 }, options),
  ]);

  return {
    title: "Your pages - Tiles",
    data: { workspace, folders, pages },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: Library,
} satisfies Route<LibraryProps>;
