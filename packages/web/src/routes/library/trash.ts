import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import Trash, { type TrashProps } from "@/pages/library/Trash";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
}: RequestProperties): RouteLoaderResult<TrashProps> {
  const sessionId = getSessionId(headers);
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const pages = await client.pages.listDeleted.query(
    { offset: 0 },
    { context: { sessionId } },
  );

  return {
    title: "Library - Trash",
    data: { pages },
  };
}

export default {
  loader: import.meta.env.SSR ? loader : undefined,
  component: Trash,
} satisfies Route<TrashProps>;
