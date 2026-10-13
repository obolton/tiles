import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/database/prisma";
import { invalidateCachedPages } from "@/utils/cdn";
import { publicProcedure } from "@/utils/trpc";
import type { AuthenticatedRequestContext } from "@/utils/trpc";
import type { WorkspaceRole } from "@/generated/prisma/client";

export const authenticatedProcedure = publicProcedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.sessionId || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next({ ctx });
});

export const authenticatedServiceProcedure = publicProcedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.serviceName) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next({ ctx });
});

const AuthenticatedPageProcedureSchema = z.object({
  pageId: z.uuid(),
});

export interface AuthenticatedPageProcedureContext extends AuthenticatedRequestContext {
  pageId: string;
  workspaceId: string;
}

export async function getPage(userId: string, pageId: string) {
  return prisma.page.findUnique({
    where: {
      id: pageId,
      deletedAt: null,
      OR: [{ authorId: userId }, { access: { some: { userId } } }],
    },
    select: { id: true, workspaceId: true },
  });
}

export const authenticatedPageProcedure = authenticatedProcedure
  .input(AuthenticatedPageProcedureSchema)
  .use(async (opts) => {
    const { ctx, input } = opts;
    const { pageId } = input;

    const page = await getPage(ctx.userId, pageId);

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

export const pageUpdateProcedure = authenticatedPageProcedure.use(async ({ next, ctx }) => {
  const result = await next();
  if (result.ok) {
    invalidateCachedPages([ctx.pageId]);
  }
  return result;
});

const AuthenticatedWorkspaceProcedureSchema = z.object({
  workspaceId: z.uuid(),
});

export interface AuthenticatedWorkspaceProcedureContext extends AuthenticatedRequestContext {
  workspaceId: string;
  role: WorkspaceRole;
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
      select: { workspaceId: true, role: true },
    });

    if (!membership) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return opts.next<AuthenticatedWorkspaceProcedureContext>({
      ctx: {
        ...ctx,
        workspaceId: membership.workspaceId,
        role: membership.role,
      },
      input,
    });
  });

export const adminWorkspaceProcedure = authenticatedWorkspaceProcedure.use(async (opts) => {
  if (opts.ctx.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return opts.next();
});
