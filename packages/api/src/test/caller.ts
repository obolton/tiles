import appRouter from "@/routes/index";
import { router } from "@/utils/trpc";
import type {
  TRPCCreateRouterOptions,
  TRPCDecorateCreateRouterOptions,
  TRPCRouterCaller,
} from "@trpc/server";
import type { AppRouter } from "@/routes/index";
import type { RequestContext } from "@/utils/trpc";

export type AppCaller = ReturnType<typeof appRouter.createCaller>;

/** Calls the app router in-process, so every procedure guard and input schema runs. */
export function createCaller(ctx: RequestContext): AppCaller {
  return appRouter.createCaller(ctx);
}

type RootTypes = AppRouter["_def"]["_config"]["$types"];

type ProcedureCaller<T extends TRPCCreateRouterOptions> = ReturnType<
  TRPCRouterCaller<RootTypes, TRPCDecorateCreateRouterOptions<T>>
>;

/** Calls an ad-hoc router of procedures, for testing middleware in isolation. */
export function createProcedureCaller<T extends TRPCCreateRouterOptions>(
  procedures: T,
  ctx: RequestContext,
): ProcedureCaller<T> {
  return router(procedures).createCaller(ctx);
}
