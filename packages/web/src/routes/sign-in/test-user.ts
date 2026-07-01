import { signIn, setAuthenticationCookies } from "@/auth/sessions";
import { redirect } from "@/router/responses";
import type { APIRoute, APIRequestHandler } from "@/router/router";

const GET: APIRequestHandler = async () => {
  const session = await signIn({
    provider: "GOOGLE",
    providerId: "test-user",
    name: "Test User",
    email: "test@test.com",
    emailVerified: true,
  });
  return redirect("/", 302, setAuthenticationCookies(session.id, new Date(session.expiresAt)));
};

export default {
  get: GET,
} satisfies APIRoute;
