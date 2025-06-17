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
}: RequestProperties): RouteLoaderResult<SharedProps> {
  const sessionId = getSessionId(headers);
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const [folders, pages] = await Promise.all([
    client.folders.list.query({ offset: 0 }, { context: { sessionId } }),
    client.pages.listShared.query({ offset: 0 }, { context: { sessionId } }),
  ]);

  return {
    title: "Shared with you - Tiles",
    data: { folders, pages },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: Shared,
} satisfies Route<SharedProps>;
