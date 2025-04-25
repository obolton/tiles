import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import BookmarksPage, {
  type BookmarksPageProps,
} from "@/pages/library/BookmarksPage";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
}: RequestProperties): RouteLoaderResult<BookmarksPageProps> {
  const sessionId = getSessionId(headers);
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const pages = await client.bookmarks.list.query(
    { offset: 0 },
    { context: { sessionId } },
  );

  return {
    title: "Library - Bookmarks",
    data: { pages },
  };
}

export default {
  loader: import.meta.env.SSR ? loader : undefined,
  component: BookmarksPage,
} satisfies Route<BookmarksPageProps>;
