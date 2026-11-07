import Forbidden from "@/pages/errors/Forbidden";
import { createErrorPageLoader, type ErrorPageProps } from "@/utils/errorPages";
import type { Route } from "@/router/router";

export default {
  loader: import.meta.env.SSR ? createErrorPageLoader("Access denied") : undefined,
  component: Forbidden,
} satisfies Route<ErrorPageProps>;
