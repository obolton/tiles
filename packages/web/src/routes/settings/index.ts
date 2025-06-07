import { redirect } from "@/router/router";
import type { APIRoute, APIRequestHandler } from "@/router/router";

export const GET: APIRequestHandler = () => {
  return redirect("/settings/profile", 302);
};

export default {
  get: GET,
} satisfies APIRoute;
