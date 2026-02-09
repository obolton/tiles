import client from "@/api/client";
import { getLoaderContext } from "@/utils/loaderContext";
import { isSignedIn } from "@/utils/sessions";
import { authenticatedRoute } from "@/utils/middleware";
import { initRoute } from "@/routes/init";
import Profile, { type ProfileProps } from "@/pages/settings/Profile";
import { notFound, forbidden } from "@/router/responses";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<ProfileProps> {
  const { workspaceId } = parameters;
  if (!workspaceId) {
    return notFound();
  }

  if (!import.meta.env.SSR && !isSignedIn()) {
    return forbidden();
  }

  const options = getLoaderContext(headers);
  const user = await client.users.getUserInfo.query(undefined, options);

  if (!user) {
    return forbidden();
  }

  return {
    title: "Profile settings - Tiles",
    data: { workspaceId, user },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader,
  component: Profile,
  hydrate: "immediate",
  beforeHydrate: ({ parameters }) => initRoute(parameters.workspaceId),
} satisfies Route<ProfileProps>;
