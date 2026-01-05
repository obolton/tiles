import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import { CACHE_CONTROL_VALUE } from "@/constants/cdn";
import Page, { type PageProps } from "@/pages/Page";
import { isDark } from "@/utils/color";
import { getThemeStyles } from "@/utils/themes";
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

  const style = {
    ...getThemeStyles(page.theme, {
      background: page.backgroundColor
        ? { type: "color", color: page.backgroundColor }
        : null,
      font: page.font,
    }),
    "--dock-top-size": page.dockTopHeight ? `${page.dockTopHeight}px` : undefined,
    "--dock-bottom-size": page.dockBottomHeight ? `${page.dockBottomHeight}px` : undefined,
    "--dock-left-size": page.dockLeftWidth ? `${page.dockLeftWidth}px` : undefined,
    "--dock-right-size": page.dockRightWidth ? `${page.dockRightWidth}px` : undefined,
  };

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
  scripts: [{ src: "/src/init.ts" }],
} satisfies RouteMetadata;

export default {
  loader: import.meta.env.SSR ? loader : undefined,
  component: Page,
  metadata,
} satisfies Route<PageProps>;
