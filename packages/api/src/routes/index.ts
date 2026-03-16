import { router } from "@/utils/trpc.ts";
import auth from "./auth/router.ts";
import pages from "./pages/router.ts";
import media from "./media/router.ts";
import tiles from "./tiles/router.ts";
import users from "./users/router.ts";
import places from "./places/router.ts";
import images from "./images/router.ts";
import text from "./text/router.ts";
import themes from "./themes/router.ts";
import pageLinks from "./pageLinks/router.ts";
import externalLinks from "./links/router.ts";
import videos from "./videos/router.ts";
import bookmarks from "./bookmarks/router.ts";
import ai from "./ai/router.ts";
import sections from "./sections/router.ts";
import collaboration from "./collaboration/router.ts";
import tables from "./tables/router.ts";
import folders from "./folders/router.ts";
import workspaces from "./workspaces/router.ts";
import dropdowns from "./dropdowns/router.ts";
import charts from "./charts/router.ts";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

const appRouter = router({
  auth,
  pages,
  media,
  tiles,
  users,
  places,
  images,
  text,
  themes,
  pageLinks,
  externalLinks,
  videos,
  bookmarks,
  ai,
  sections,
  collaboration,
  tables,
  folders,
  workspaces,
  dropdowns,
  charts,
});

export type AppRouter = typeof appRouter;
export type AppRouterInputs = inferRouterInputs<AppRouter>;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;

export default appRouter;
