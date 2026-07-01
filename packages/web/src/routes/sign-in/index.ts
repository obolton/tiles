import SignIn, { type SignInProps } from "@/pages/SignIn";
import { getSessionId } from "@/utils/sessions";
import { redirect } from "@/router/responses";
import type { Route, RequestProperties, RouteLoaderResult } from "@/router/router";

export function signedOutRoute(request: Request) {
  const sessionId = getSessionId(request.headers);
  if (sessionId) {
    return redirect("/library", 302);
  }
}

async function loader({ url }: RequestProperties): RouteLoaderResult<SignInProps> {
  const destination = url.searchParams.get("destination");
  return { title: "Sign in - Tiles", data: { destination } };
}

export default {
  middleware: import.meta.env.SSR ? signedOutRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: SignIn,
} satisfies Route<SignInProps>;
