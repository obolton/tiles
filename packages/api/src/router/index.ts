import { router } from "./trpc.ts";
import authRouter from "./auth.ts";
import pagesRouter from "./pages.ts";
import mediaRouter from "./media.ts";
import tilesRouter from "./tiles.ts";
import usersRouter from "./users.ts";
import placesRouter from "./places.ts";
import collectionsRouter from "./collections.ts";
import mapsRouter from "./maps.ts";
import imagesRouter from "./images.ts";
import textRouter from "./text.ts";
import headingsRouter from "./headings.ts";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

const appRouter = router({
  auth: authRouter,
  pages: pagesRouter,
  media: mediaRouter,
  tiles: tilesRouter,
  users: usersRouter,
  places: placesRouter,
  collections: collectionsRouter,
  maps: mapsRouter,
  images: imagesRouter,
  text: textRouter,
  headings: headingsRouter,
});

export type AppRouter = typeof appRouter;
export type AppRouterInputs = inferRouterInputs<AppRouter>;
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;

export default appRouter;
