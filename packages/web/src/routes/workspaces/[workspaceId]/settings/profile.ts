import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import Profile, { type ProfileProps } from "@/pages/settings/Profile";
import { authenticatedRoute } from "@/utils/middleware";
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

  const sessionId = getSessionId(headers);
  if (!sessionId) {
    return forbidden();
  }

  const user = await client.users.getUserInfo.query(undefined, {
    context: { sessionId },
  });

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
  loader: import.meta.env.SSR ? loader : undefined,
  component: Profile,
} satisfies Route<ProfileProps>;
