import { router } from "./trpc.ts";
import pagesRouter from "./pages.ts";

const appRouter = router({
  pages: pagesRouter,
});

export type AppRouter = typeof appRouter;

export default appRouter;
