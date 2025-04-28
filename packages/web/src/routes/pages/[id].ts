import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import Page, { type PageProps } from "@/pages/Page";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
  RouteMetadata,
} from "@/router/router";

// TODO: Add cache headers
async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<PageProps> {
  const sessionId = getSessionId(headers);

  const pageId = parameters.id;

  if (!pageId) {
    throw new Error("Not Found");
  }

  const page = await client.pages.getById.query(
    { id: pageId },
    { context: { sessionId } },
  );

  if (!page) {
    throw new Error("Not Found");
  }

  // TODO: Theme, hue, description, author etc
  return {
    title: page.title,
    data: { page },
  };
}

const metadata = {
  scripts: [{ src: "/src/init" }],
} satisfies RouteMetadata;

export default {
  loader: import.meta.env.SSR ? loader : undefined,
  component: Page,
  metadata,
} satisfies Route<PageProps>;
