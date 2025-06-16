import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/database/prisma.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";
import { publicProcedure } from "@/utils/trpc.ts";

export const authenticatedProcedure = publicProcedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.sessionId || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next({ ctx });
});

const AuthenticatedPageProcedureSchema = z.object({
  pageId: z.string().uuid(),
});

export const authenticatedPageProcedure = authenticatedProcedure
  .input(AuthenticatedPageProcedureSchema)
  .use(async (opts) => {
    const { ctx, input } = opts;
    const { pageId } = input;

    const page = await prisma.page.findUnique({
      where: {
        id: pageId,
        deletedAt: null,
        OR: [
          { authorId: ctx.userId },
          { access: { some: { userId: ctx.userId } } },
        ],
      },
      select: { id: true },
    });

    if (!page) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return opts.next({
      ctx: {
        ...ctx,
        pageId,
      },
      input,
    });
  });

export const pageUpdateProcedure = authenticatedPageProcedure.use(
  async ({ next, ctx }) => {
    const result = await next();
    invalidateCachedPage(ctx.pageId);
    return result;
  },
);
