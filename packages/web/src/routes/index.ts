import client from "@/api/client";
import { getFontConfig } from "@/utils/fonts";
import { CACHE_CONTROL_VALUE } from "@/constants/cdn";
import Page, { type PageProps } from "@/pages/Page";
import { toCSSColor, isDark, type Color } from "@/utils/color";
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

  const color: Color = { l: page.lightness, c: page.chroma, h: page.hue };
  const font = page.font ? getFontConfig(page.font) : undefined;

  return {
    headers: { "Cache-Control": CACHE_CONTROL_VALUE },
    title: page.title,
    bodyAttributes: {
      "data-page-id": page.id,
      className: isDark(color) ? "dark" : undefined,
      style: {
        "--page-color": toCSSColor(color),
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
