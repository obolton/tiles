import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/database/prisma.ts";
import { invalidateCachedPages } from "@/utils/cdn.ts";
import { publicProcedure } from "@/utils/trpc.ts";
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";

export const authenticatedProcedure = publicProcedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.sessionId || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next({ ctx });
});

export const authenticatedServiceProcedure = publicProcedure.use(
  async (opts) => {
    const { ctx } = opts;
    if (!ctx.serviceName) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return opts.next({ ctx });
  },
);

const AuthenticatedPageProcedureSchema = z.object({
  pageId: z.uuid(),
});

export interface AuthenticatedPageProcedureContext extends AuthenticatedRequestContext {
  pageId: string;
  workspaceId: string;
}

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
      select: { id: true, workspaceId: true },
    });

    if (!page) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return opts.next<AuthenticatedPageProcedureContext>({
      ctx: {
        ...ctx,
        pageId: page.id,
        workspaceId: page.workspaceId,
      },
      input,
    });
  });

export const pageUpdateProcedure = authenticatedPageProcedure.use(
  async ({ next, ctx }) => {
    const result = await next();
    invalidateCachedPages([ctx.pageId]);
    return result;
  },
);

const AuthenticatedWorkspaceProcedureSchema = z.object({
  workspaceId: z.uuid(),
});

export interface AuthenticatedWorkspaceProcedureContext extends AuthenticatedRequestContext {
  workspaceId: string;
}

export const authenticatedWorkspaceProcedure = authenticatedProcedure
  .input(AuthenticatedWorkspaceProcedureSchema)
  .use(async (opts) => {
    const { ctx, input } = opts;
    const { workspaceId } = input;

    const membership = await prisma.workspaceMembership.findUnique({
      where: {
        id: {
          userId: ctx.userId,
          workspaceId,
        },
      },
      select: { workspaceId: true },
    });

    if (!membership) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return opts.next<AuthenticatedWorkspaceProcedureContext>({
      ctx: {
        ...ctx,
        workspaceId: membership.workspaceId,
      },
      input,
    });
  });
