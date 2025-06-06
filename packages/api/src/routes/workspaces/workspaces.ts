import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import type { Prisma } from "@prisma/client";
import type {
  InviteToWorkspaceSchema,
  RemoveFromWorkspaceSchema,
  UpdateWorkspaceSchema,
  ListWorkspaceUsersSchema,
} from "./schema.ts";
import type { AuthenticatedProcedureContext } from "@/utils/middleware.ts";

const RESULTS_PER_PAGE = 15;

export const WORKSPACE_FIELDS = {
  id: true,
  name: true,
} as const satisfies Prisma.WorkspaceSelect<ExtensionArgs>;

export const WORKSPACE_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
} as const satisfies Prisma.UserSelect<ExtensionArgs>;

export async function updateWorkspace(
  { name }: UpdateWorkspaceSchema,
  { workspaceId }: AuthenticatedProcedureContext,
) {
  return prisma.workspace.update({
    where: {
      id: workspaceId,
    },
    data: {
      name,
    },
    select: WORKSPACE_FIELDS,
  });
}

export async function inviteToWorkspace(
  { email }: InviteToWorkspaceSchema,
  { workspaceId }: AuthenticatedProcedureContext,
) {
  // TODO
}

export async function removeFromWorkspace(
  { userId }: RemoveFromWorkspaceSchema,
  { workspaceId }: AuthenticatedProcedureContext,
) {
  return prisma.$transaction(async (transaction) => {
    await Promise.all([
      transaction.workspaceMembership.delete({
        where: {
          id: {
            workspaceId,
            userId,
          },
        },
        select: { workspaceId: true },
      }),
      transaction.session.deleteMany({
        where: {
          workspaceId,
          userId,
        },
      }),
    ]);
  });
}

export async function listWorkspaceUsers(
  { query, offset }: ListWorkspaceUsersSchema,
  { workspaceId }: AuthenticatedProcedureContext,
) {
  const filter: Prisma.WorkspaceMembershipWhereInput = query
    ? { user: { name: { contains: query, mode: "insensitive" } } }
    : {};
  const results = await prisma.workspaceMembership.findMany({
    where: {
      workspaceId,
      ...filter,
    },
    select: {
      user: {
        select: WORKSPACE_USER_FIELDS,
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
    take: RESULTS_PER_PAGE + 1,
    skip: offset,
  });
  return {
    users: results.slice(0, RESULTS_PER_PAGE).map((result) => result.user),
    hasMore: results.length > RESULTS_PER_PAGE,
  };
}
