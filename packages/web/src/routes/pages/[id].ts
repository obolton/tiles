import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { CACHE_CONTROL_VALUE } from "@/constants/cdn";
import Page, { type PageProps } from "@/pages/Page";
import { isDark } from "@/utils/color";
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
      className:
        page.backgroundColor && isDark(page.backgroundColor)
          ? "dark"
          : undefined,
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
} satisfies Route<PageProps>;
