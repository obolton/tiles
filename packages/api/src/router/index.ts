import { router } from "./trpc.js";
import pagesRouter from "./pages.js";

const appRouter = router({
  pages: pagesRouter,
});

export type AppRouter = typeof appRouter;

export default appRouter;
