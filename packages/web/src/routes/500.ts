import ServerError from "@/pages/errors/ServerError";
import { createErrorPageLoader, type ErrorPageProps } from "@/utils/errorPages";
import type { Route } from "@/router/router";

export default {
  loader: import.meta.env.SSR ? createErrorPageLoader("Something went wrong") : undefined,
  component: ServerError,
} satisfies Route<ErrorPageProps>;
