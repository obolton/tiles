import NotFound from "@/pages/errors/NotFound";
import { PRIVATE_CACHE_CONTROL_VALUE } from "@/constants/cdn";
import type { Route, RouteLoaderResult } from "@/router/router";

export async function loader(): RouteLoaderResult<undefined> {
  return {
    title: "Page not found - Tiles",
    headers: { "Cache-Control": PRIVATE_CACHE_CONTROL_VALUE },
    data: undefined,
  };
}

export default {
  loader: import.meta.env.SSR ? loader : undefined,
  component: NotFound,
} satisfies Route<undefined>;
