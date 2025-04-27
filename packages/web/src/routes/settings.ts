import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import SettingsPage, { type SettingsPageProps } from "@/pages/SettingsPage";
import { authenticatedRoute } from "@/utils/middleware";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

async function loader({
  headers,
}: RequestProperties): RouteLoaderResult<SettingsPageProps> {
  const sessionId = getSessionId(headers);
  if (!sessionId) {
    throw new Error("Unauthorized");
  }

  const user = await client.auth.getUserInfo.query(undefined, {
    context: { sessionId },
  });

  if (!user) {
    throw new Error("Unauthorized");
  }

  return {
    title: "Settings",
    data: { user },
  };
}

export default {
  middleware: import.meta.env.SSR ? authenticatedRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: SettingsPage,
} satisfies Route<SettingsPageProps>;
