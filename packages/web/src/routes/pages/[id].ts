import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import { getFontConfig } from "@/utils/fonts";
import { CACHE_CONTROL_VALUE } from "@/constants/cdn";
import Page, { type PageProps } from "@/pages/Page";
import { toCSSColor, isDark } from "@/utils/color";
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

  const font = page.font ? getFontConfig(page.font) : undefined;

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
      style: {
        "--background-color": page.backgroundColor
          ? toCSSColor(page.backgroundColor)
          : undefined,
        "--font": font ? `"${font.family}", "${font.fallback}"` : undefined,
      },
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
