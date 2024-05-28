import { router } from "./trpc.ts";
import pagesRouter from "./pages.ts";
import mediaRouter from "./media.ts";
import tilesRouter from "./tiles.ts";

const appRouter = router({
  pages: pagesRouter,
  media: mediaRouter,
  tiles: tilesRouter,
});

export type AppRouter = typeof appRouter;

export default appRouter;
