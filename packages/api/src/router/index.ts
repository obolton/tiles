import { router } from "./trpc.ts";
import auth from "./auth.ts";
import pages from "@/models/pages/router.ts";
import media from "./media.ts";
import tiles from "@/models/tiles/router.ts";
import users from "@/models/users/router.ts";
import places from "@/models/places/router.ts";
import collections from "@/models/collections/router.ts";
import maps from "@/models/maps/router.ts";
import images from "@/models/images/router.ts";
import text from "@/models/text/router.ts";
import headings from "@/models/headings/router.ts";
import events from "@/models/events/router.ts";
import pageLinks from "@/models/pageLinks/router.ts";
import externalLinks from "@/models/links/router.ts";
import videos from "@/models/videos/router.ts";
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
