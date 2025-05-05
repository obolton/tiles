import client from "@/api/client";
import { getFontConfig } from "@/utils/fonts";
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

  const theme = page.theme;
  const hue = page.hue;
  const font = page.font ? getFontConfig(page.font) : undefined;

  return {
    title: page.title,
    bodyAttributes: {
      "data-page-id": page.id,
      className:
        theme === "LIGHT" ? "light" : theme === "DARK" ? "dark" : "color",
      style: {
        "--page-hue":
          theme === "COLOR" && typeof hue === "number"
            ? `${hue.toFixed(2)}deg`
            : undefined,
        "--font": font ? `"${font.family}", "${font.fallback}"` : undefined,
      },
    },
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
