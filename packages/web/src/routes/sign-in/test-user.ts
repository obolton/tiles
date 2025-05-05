import { signIn, setAuthenticationCookies } from "@/auth/sessions";
import { redirect } from "@/router/router";
import type { APIRoute, APIRequestHandler } from "@/router/router";

const GET: APIRequestHandler = async (request, response) => {
  const session = await signIn({
    provider: "GOOGLE",
    providerId: "test-user",
    name: "Test User",
    email: "test@test.com",
    emailVerified: true,
  });
  response.setHeader(
    "Set-Cookie",
    setAuthenticationCookies(session.id, new Date(session.expiresAt)),
  );

  return redirect("/", 302);
};

export default {
  get: GET,
} satisfies APIRoute;
