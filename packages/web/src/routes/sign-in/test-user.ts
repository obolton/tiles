import { signIn, setAuthenticationCookies } from "@/auth/sessions";
import { getDestination } from "@/auth/destinations";
import { notFound, redirect } from "@/router/responses";
import type { APIRoute, APIRequestHandler } from "@/router/router";

export const GET: APIRequestHandler = async ({ url }) => {
  if (!import.meta.env.DEV) {
    return notFound();
  }

  const session = await signIn({
    provider: "GOOGLE",
    providerId: "test-user",
    name: "Test User",
    email: "test@test.com",
    emailVerified: true,
  });
  const destination = getDestination(url);
  return redirect(
    `/${destination ?? ""}`,
    302,
    setAuthenticationCookies(session.id, new Date(session.expiresAt)),
  );
};

export default {
  get: GET,
} satisfies APIRoute;
