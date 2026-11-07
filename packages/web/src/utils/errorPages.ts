import { PRIVATE_CACHE_CONTROL_VALUE } from "@/constants/cdn";
import type { HttpError } from "@/router/errors";
import type { RouteLoader } from "@/router/router";

export interface ErrorPageProps {
  error: HttpError;
}

export function createErrorPageLoader(title: string): RouteLoader<ErrorPageProps> {
  return async ({ error }) => {
    if (!error) {
      throw new Error("Error routes can only be rendered for an error");
    }
    return {
      title: `${title} - Tiles`,
      headers: { "Cache-Control": PRIVATE_CACHE_CONTROL_VALUE },
      data: { error },
    };
  };
}
