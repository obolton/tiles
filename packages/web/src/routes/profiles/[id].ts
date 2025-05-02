import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import ProfilePage, { type ProfilePageProps } from "@/pages/ProfilePage";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
  RouteMetadata,
} from "@/router/router";

// TODO: Add cache headers
async function loader({
  headers,
  parameters,
}: RequestProperties): RouteLoaderResult<ProfilePageProps> {
  const sessionId = getSessionId(headers);

  const id = parameters.id;

  if (!id) {
    throw new Error("Not Found");
  }

  const username = id.startsWith("@") ? id.slice(1) : null;

  const user = await client.pages.getProfilePage.query(
    username ? { username } : { userId: id },
    { context: { sessionId } },
  );

  if (!user) {
    throw new Error("Not Found");
  }

  // TODO: Theme, hue, description, author etc
  return {
    title: user.name,
    data: { user },
  };
}

const metadata = {
  scripts: [{ src: "/src/init" }],
} satisfies RouteMetadata;

export default {
  loader: import.meta.env.SSR ? loader : undefined,
  component: ProfilePage,
  metadata,
} satisfies Route<ProfilePageProps>;
