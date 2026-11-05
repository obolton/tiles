import SignIn, { type SignInProps, type SignInError } from "@/pages/SignIn";
import { getDestination } from "@/auth/destinations";
import { getSessionId } from "@/utils/sessions";
import { redirect } from "@/router/responses";
import type { Route, RequestProperties, RouteLoaderResult } from "@/router/router";

function getError(url: URL): SignInError | null {
  switch (url.searchParams.get("error")) {
    case "cancelled":
      return "cancelled";
    case "failed":
      return "failed";
    default:
      return null;
  }
}

export function signedOutRoute(request: Request) {
  const sessionId = getSessionId(request.headers);
  if (sessionId) {
    const destination = getDestination(new URL(request.url));
    return redirect(`/${destination ?? ""}`, 302);
  }
}

export async function loader({ url }: RequestProperties): RouteLoaderResult<SignInProps> {
  return {
    title: "Sign in - Tiles",
    data: { destination: getDestination(url), error: getError(url) },
  };
}

export default {
  middleware: import.meta.env.SSR ? signedOutRoute : undefined,
  loader: import.meta.env.SSR ? loader : undefined,
  component: SignIn,
} satisfies Route<SignInProps>;
