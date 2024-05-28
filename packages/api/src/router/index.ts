import { router } from "./trpc.ts";
import pagesRouter from "./pages.ts";
import mediaRouter from "./media.ts";

const appRouter = router({
  pages: pagesRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;

export default appRouter;
