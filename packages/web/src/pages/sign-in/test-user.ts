import type { APIRoute } from "astro";
import { signIn, setAuthenticationCookies } from "@/auth/sessions";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const session = await signIn({
    provider: "GOOGLE",
    providerId: "test-user",
    name: "Test User",
    email: "test@test.com",
    emailVerified: true,
  });
  setAuthenticationCookies(cookies, session.id, new Date(session.expiresAt));

  return redirect("/", 302);
};
