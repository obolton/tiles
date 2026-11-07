import ServerError, { type ServerErrorProps } from "@/pages/errors/ServerError";
import { PRIVATE_CACHE_CONTROL_VALUE } from "@/constants/cdn";
import type { Route, RequestProperties, RouteLoaderResult } from "@/router/router";

export async function loader({ error }: RequestProperties): RouteLoaderResult<ServerErrorProps> {
  return {
    title: "Something went wrong - Tiles",
    headers: { "Cache-Control": PRIVATE_CACHE_CONTROL_VALUE },
    data: { error },
  };
}

export default {
  loader: import.meta.env.SSR ? loader : undefined,
  component: ServerError,
} satisfies Route<ServerErrorProps>;
