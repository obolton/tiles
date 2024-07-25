import { router } from "./trpc.ts";
import authRouter from "./auth.ts";
import pagesRouter from "./pages.ts";
import mediaRouter from "./media.ts";
import tilesRouter from "./tiles.ts";
import usersRouter from "./users.ts";
import type { inferRouterInputs } from "@trpc/server";

const appRouter = router({
  auth: authRouter,
  pages: pagesRouter,
  media: mediaRouter,
  tiles: tilesRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
export type AppRouterInputs = inferRouterInputs<AppRouter>;

export default appRouter;
