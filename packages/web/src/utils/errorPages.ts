import { PRIVATE_CACHE_CONTROL_VALUE } from "@/constants/cdn";
import { SITE_NAME } from "@/constants/site";
import { ERROR_PAGE_CONTENT, type ErrorPageProps, type ErrorStatus } from "@/pages/ErrorPage";
import type { HttpError } from "@/router/errors";
import type { RouteLoader } from "@/router/router";

function getErrorDetails(error: HttpError | undefined) {
  const cause = error?.cause ?? error;
  if (cause instanceof Error) {
    return cause.stack ?? `${cause.name}: ${cause.message}`;
  }
  return typeof cause === "string" ? cause : undefined;
}

/** Creates the loader for an error route such as `routes/404.ts`. */
export function createErrorPageLoader(status: ErrorStatus): RouteLoader<ErrorPageProps> {
  return async ({ error }) => ({
    title: `${ERROR_PAGE_CONTENT[status].title} - ${SITE_NAME}`,
    headers: { "Cache-Control": PRIVATE_CACHE_CONTROL_VALUE },
    data: {
      status,
      details: status === 500 && import.meta.env.DEV ? getErrorDetails(error) : undefined,
    },
  });
}
