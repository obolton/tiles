import type { IncomingMessage } from "node:http";
import client from "@/api/client";
import { getSessionId } from "@/utils/sessions";
import SettingsPage, { type SettingsPageProps } from "@/pages/SettingsPage";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";
import { redirect } from "@/router/router";

function middleware(request: IncomingMessage) {
  const sessionId = getSessionId(request.headers);
  if (!sessionId) {
    return redirect("/sign-in", 302);
  }
}

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
  middleware,
  loader: import.meta.env.SSR ? loader : undefined,
  component: SettingsPage,
} satisfies Route<SettingsPageProps>;
