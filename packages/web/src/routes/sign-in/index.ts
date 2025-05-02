import SignIn, { type SignInProps } from "@/pages/SignIn";
import { getSessionId } from "@/utils/sessions";
import { redirect } from "@/router/router";
import type { IncomingMessage } from "node:http";
import type {
  Route,
  RequestProperties,
  RouteLoaderResult,
} from "@/router/router";

export function signedOutRoute(request: IncomingMessage) {
  const sessionId = getSessionId(request.headers);
  if (sessionId) {
    return redirect("/library", 302);
  }
}

async function loader({
  url,
}: RequestProperties): RouteLoaderResult<SignInProps> {
  const destination = url.searchParams.get("destination");
  return { data: { destination } };
}

export default {
  middleware: import.meta.env.SSR ? signedOutRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: SignIn,
} satisfies Route<SignInProps>;
