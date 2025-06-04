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
}: RequestProperties): RouteLoaderResult<LibraryProps> {
  const sessionId = getSessionId(headers);
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const [folders, pages] = await Promise.all([
    client.folders.list.query({ offset: 0 }, { context: { sessionId } }),
    client.pages.list.query({ offset: 0 }, { context: { sessionId } }),
  ]);

  return {
    title: "Library - Your pages",
    data: { folders, pages },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: Library,
} satisfies Route<LibraryProps>;
