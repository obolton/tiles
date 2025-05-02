import client from "@/api/client";
import Page, { type PageProps } from "@/pages/Page";
import type { Route, RouteLoaderResult, RouteMetadata } from "@/router/router";

// TODO: Add cache headers
async function loader(): RouteLoaderResult<PageProps> {
  const pageId = import.meta.env.PUBLIC_PAGE_ID;

  if (!pageId) {
    throw new Error("Not Found");
  }

  const page = await client.pages.getById.query({ id: pageId });

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
