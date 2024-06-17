import { router } from "./trpc.ts";
import authRouter from "./auth.ts";
import pagesRouter from "./pages.ts";
import mediaRouter from "./media.ts";
import tilesRouter from "./tiles.ts";

const appRouter = router({
  auth: authRouter,
  pages: pagesRouter,
  media: mediaRouter,
  tiles: tilesRouter,
});

export type AppRouter = typeof appRouter;

export default appRouter;
