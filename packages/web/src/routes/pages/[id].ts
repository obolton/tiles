import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { CACHE_CONTROL_VALUE, PRIVATE_CACHE_CONTROL_VALUE } from "@/constants/cdn";
import { initRoute } from "@/routes/init";
import { initBookmarkStatus } from "@/utils/bookmarks";
import { handleError } from "@/utils/errors";
import Page, { type PageProps } from "@/pages/Page";
import { generateFontFaceCSS } from "@/utils/fonts";
import { getPageFonts, getPagePreloads } from "@/utils/pageFonts";
import { getPageTheme, getThemeStyles } from "@/utils/themes";
import { getPageDescription } from "@/utils/pages";
import { initializeDoc } from "@/collaboration/doc";
import { redirect } from "@/router/responses";
import { NotFoundError } from "@/router/errors";
import { DEFAULT_FONT } from "fonts/config";
import type { Route, RequestProperties, RouteLoaderResult, RouteMetadata } from "@/router/router";

async function loader({
  url,
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<PageProps> {
  const pageId = parameters.id;

  if (!pageId) {
    throw new NotFoundError();
  }

  const options = getLoaderContext(headers);
  const versionId = url.searchParams.get("version");
  const [page, versionResult] = await Promise.all([
    client.pages.getById.query({ id: pageId }, options),
    versionId ? client.versions.get.query({ pageId, versionId }, options).catch(() => null) : null,
  ]);

  if (!page) {
    throw new NotFoundError();
  }

  if (versionId && !versionResult) {
    return redirect(url.pathname, 302);
  }

  let version: PageProps["version"];
  let doc;
  if (versionResult) {
    const { document: versionDocument, ...metadata } = versionResult;
    version = metadata;
    doc = initializeDoc({ ...page, document: versionDocument });
  } else {
    doc = initializeDoc(page);
  }

  const style = getThemeStyles(getPageTheme(doc));

  // The global metadata already emits @font-face for DEFAULT_FONT.
  const pageFonts = getPageFonts(doc);
  pageFonts.delete(DEFAULT_FONT);

  // Cache live, published pages only.
  const cacheable = page.published && !version;

  return {
    headers: {
      "Cache-Control": cacheable ? CACHE_CONTROL_VALUE : PRIVATE_CACHE_CONTROL_VALUE,
    },
    title: `${page.title} - Tiles`,
    description: getPageDescription(page),
    bodyAttributes: {
      "data-page-id": page.id,
      style,
    },
    metadata: {
      styles: [generateFontFaceCSS(pageFonts)],
      links: getPagePreloads(doc),
    },
    data: { page, doc, version },
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
  },
} satisfies Route<PageProps>;
