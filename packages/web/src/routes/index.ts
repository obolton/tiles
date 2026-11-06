import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import { redirect, notFound } from "@/router/responses";
import { CACHE_CONTROL_VALUE } from "@/constants/cdn";
import Page, { type PageProps } from "@/pages/Page";
import { generateFontFaceCSS } from "@/utils/fonts";
import { getPageFonts, getPagePreloads } from "@/utils/pageFonts";
import { DEFAULT_FONT } from "fonts/config";
import { getPageTheme, getThemeStyles } from "@/utils/themes";
import { SITE_DESCRIPTION } from "@/constants/site";
import { initializeDoc } from "@/collaboration/doc";
import type { Route, RouteLoaderResult, RouteMetadata } from "@/router/router";

const PAGE_ID = import.meta.env.PUBLIC_PAGE_ID;

export async function indexRoute(request: Request) {
  const sessionId = getSessionId(request.headers);
  if (!sessionId) {
    return;
  }

  // Redirect to first workspace
  try {
    const user = await client.users.getUserInfo.query(undefined, {
      context: { sessionId },
    });
    const workspace = user.workspaces[0];
    if (workspace) {
      return redirect(`/workspaces/${workspace.id}`, 302);
    }
  } catch {
    // Allow request to continue
  }
}

async function loader(): RouteLoaderResult<PageProps> {
  if (!PAGE_ID) {
    return notFound();
  }

  const page = await client.pages.getById.query({ id: PAGE_ID });

  if (!page) {
    return notFound();
  }

  const doc = initializeDoc(page);
  const style = getThemeStyles(getPageTheme(doc));

  // The global metadata already emits @font-face for DEFAULT_FONT.
  const pageFonts = getPageFonts(doc);
  pageFonts.delete(DEFAULT_FONT);

  return {
    headers: { "Cache-Control": CACHE_CONTROL_VALUE },
    title: page.title,
    description: SITE_DESCRIPTION,
    bodyAttributes: {
      "data-page-id": page.id,
      style,
    },
    metadata: {
      styles: [generateFontFaceCSS(pageFonts)],
      links: getPagePreloads(doc),
    },
    data: { page, doc },
  };
}

const metadata = {
  scripts: [{ src: "/src/routes/pages/init.ts" }],
} satisfies RouteMetadata;

export default {
  middleware: import.meta.env.SSR ? indexRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: Page,
  metadata,
} satisfies Route<PageProps>;
