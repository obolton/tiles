import ErrorPage, { type ErrorPageProps } from "@/pages/ErrorPage";
import { createErrorPageLoader } from "@/utils/errorPages";
import type { Route } from "@/router/router";

export default {
  loader: import.meta.env.SSR ? createErrorPageLoader(403) : undefined,
  component: ErrorPage,
} satisfies Route<ErrorPageProps>;
