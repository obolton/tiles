import { router } from "@/utils/trpc.ts";
import auth from "./auth/router.ts";
import pages from "./pages/router.ts";
import media from "./media/router.ts";
import users from "./users/router.ts";
import places from "./places/router.ts";
import themes from "./themes/router.ts";
import externalLinks from "./links/router.ts";
import bookmarks from "./bookmarks/router.ts";
import ai from "./ai/router.ts";
import collaboration from "./collaboration/router.ts";
import folders from "./folders/router.ts";
import workspaces from "./workspaces/router.ts";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

const appRouter = router({
  auth,
  pages,
  media,
  users,
  places,
  themes,
  externalLinks,
  bookmarks,
  ai,
  collaboration,
  folders,
  workspaces,
});

export type AppRouter = typeof appRouter;
export type AppRouterInputs = inferRouterInputs<AppRouter>;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;

export default appRouter;
