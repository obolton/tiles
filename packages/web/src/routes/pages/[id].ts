import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { CACHE_CONTROL_VALUE } from "@/constants/cdn";
import { initRoute } from "@/routes/init";
import { initBookmarkStatus } from "@/utils/bookmarks";
import { cachePage } from "@/utils/cache/pages";
import { handleError } from "@/utils/errors";
import Page, { type PageProps } from "@/pages/Page";
import { getThemeStyles } from "@/utils/themes";
import { notFound } from "@/router/responses";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
  RouteMetadata,
} from "@/router/router";

async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<PageProps> {
  const pageId = parameters.id;

  if (!pageId) {
    return notFound();
  }

  const options = getLoaderContext(headers);
  const page = await client.pages.getById.query({ id: pageId }, options);

  if (!page) {
    return notFound();
  }

  const style = getThemeStyles(page.theme, {
    background: page.backgroundColor
      ? { type: "color", color: page.backgroundColor }
      : null,
    font: page.font,
  });

  return {
    headers: page.published
      ? { "Cache-Control": CACHE_CONTROL_VALUE }
      : undefined,
    title: `${page.title} - Tiles`,
    bodyAttributes: {
      "data-page-id": page.id,
      style,
    },
    data: { page },
  };
}

const metadata = {
  scripts: [{ src: "/src/routes/pages/init.ts" }],
} satisfies RouteMetadata;

export default {
  loader,
  component: Page,
  metadata,
  hydrate: "deferred",
  beforeHydrate: ({ data }) => initRoute(data.page.workspaceId),
  afterHydrate: ({ data }) => {
    initBookmarkStatus(data.page.id).catch(handleError);
    cachePage(data.page).catch(handleError);
  },
} satisfies Route<PageProps>;
