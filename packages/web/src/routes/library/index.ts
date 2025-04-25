import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import LibraryPage, {
  type LibraryPageProps,
} from "@/pages/library/LibraryPage";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
}: RequestProperties): RouteLoaderResult<LibraryPageProps> {
  const sessionId = getSessionId(headers);
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const pages = await client.pages.list.query(
    { offset: 0 },
    { context: { sessionId } },
  );

  return {
    title: "Library - Your pages",
    data: { pages },
  };
}

export default {
  loader: import.meta.env.SSR ? loader : undefined,
  component: LibraryPage,
} satisfies Route<LibraryPageProps>;
