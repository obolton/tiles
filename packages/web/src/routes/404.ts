import NotFound from "@/pages/errors/NotFound";
import { createErrorPageLoader, type ErrorPageProps } from "@/utils/errorPages";
import type { Route } from "@/router/router";

export default {
  loader: import.meta.env.SSR ? createErrorPageLoader("Page not found") : undefined,
  component: NotFound,
} satisfies Route<ErrorPageProps>;
