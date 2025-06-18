import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import Profile, { type ProfileProps } from "@/pages/settings/Profile";
import { authenticatedRoute } from "@/utils/middleware";
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
    throw new Error("Not Found");
  }

  const sessionId = getSessionId(headers);
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const user = await client.users.getUserInfo.query(undefined, {
    context: { sessionId },
  });

  if (!user) {
    throw new Error("Unauthorized");
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
