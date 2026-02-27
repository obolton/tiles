import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { isSignedIn } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import { initRoute } from "@/routes/init";
import General, { type GeneralProps } from "@/pages/settings/General";
import { notFound, forbidden } from "@/router/responses";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<GeneralProps> {
  const { workspaceId } = parameters;
  if (!workspaceId) {
    return notFound();
  }

  if (!import.meta.env.SSR && !isSignedIn()) {
    return forbidden();
  }

  const options = getLoaderContext(headers);
  const workspace = await client.workspaces.get.query({ workspaceId }, options);

  if (!workspace) {
    return forbidden();
  }

  return {
    title: "General settings - Tiles",
    data: { workspace },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader,
  component: General,
  hydrate: "immediate",
  beforeHydrate: ({ parameters }) => initRoute(parameters.workspaceId),
} satisfies Route<GeneralProps>;
