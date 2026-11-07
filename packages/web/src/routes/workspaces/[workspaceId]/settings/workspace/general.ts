import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { isSignedIn } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import { initRoute } from "@/routes/init";
import General, { type GeneralProps } from "@/pages/settings/General";
import { NotFoundError, ForbiddenError } from "@/router/errors";
import type { Route, RequestProperties, RouteLoaderResult } from "@/router/router";

async function loader({ headers, parameters }: RequestProperties): RouteLoaderResult<GeneralProps> {
  const { workspaceId } = parameters;
  if (!workspaceId) {
    throw new NotFoundError();
  }

  if (!import.meta.env.SSR && !isSignedIn()) {
    throw new ForbiddenError();
  }

  const options = getLoaderContext(headers);

  const [workspace, user] = await Promise.all([
    client.workspaces.get.query({ workspaceId }, options),
    client.users.getUserInfo.query(undefined, options),
  ]);

  return {
    title: "General settings - Tiles",
    data: { workspace, user },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader,
  component: General,
  hydrate: "immediate",
  beforeHydrate: ({ parameters, data }) => initRoute(parameters.workspaceId, data.user),
} satisfies Route<GeneralProps>;
