import { router } from "./trpc.ts";
import auth from "@/routes/auth/router.ts";
import pages from "@/routes/pages/router.ts";
import media from "@/routes/media/router.ts";
import tiles from "@/routes/tiles/router.ts";
import users from "@/routes/users/router.ts";
import places from "@/routes/places/router.ts";
import collections from "@/routes/collections/router.ts";
import maps from "@/routes/maps/router.ts";
import images from "@/routes/images/router.ts";
import text from "@/routes/text/router.ts";
import headings from "@/routes/headings/router.ts";
import events from "@/routes/events/router.ts";
import pageLinks from "@/routes/pageLinks/router.ts";
import externalLinks from "@/routes/links/router.ts";
import videos from "@/routes/videos/router.ts";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

const appRouter = router({
  auth,
  pages,
  media,
  tiles,
  users,
  places,
  collections,
  maps,
  images,
  text,
  headings,
  events,
  pageLinks,
  externalLinks,
  videos,
});

export type AppRouter = typeof appRouter;
export type AppRouterInputs = inferRouterInputs<AppRouter>;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;

export default appRouter;
