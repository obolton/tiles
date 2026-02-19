import { TRPCError } from "@trpc/server";
import prisma from "@/database/prisma.ts";
import { createKey } from "@/utils/keys.ts";
import { sendEmail } from "@/utils/email.ts";
import { inviteToWorkspaceEmail } from "@/emails/inviteToWorkspace.ts";
import { RESULTS_PER_PAGE, paginate } from "@/utils/pagination";
import { getDefaultThemesData } from "@/utils/themes.ts";
import type { Prisma } from "@/generated/prisma/client";
import type {
  GetWorkspaceSchema,
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
  InviteToWorkspaceSchema,
  AcceptWorkspaceInviteSchema,
  DeleteWorkspaceInviteSchema,
  ListWorkspaceInvitesSchema,
  RemoveFromWorkspaceSchema,
  ListWorkspaceUsersSchema,
  UpdateRoleSchema,
} from "./schema.ts";
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware.ts";
import {
  WORKSPACE_FIELDS,
  WORKSPACE_USER_FIELDS,
  WORKSPACE_INVITE_FIELDS,
} from "./fields";

const INVITE_KEY_BYTES = 32;

export async function getWorkspace({ workspaceId }: GetWorkspaceSchema) {
  return prisma.workspace.findUniqueOrThrow({
    where: {
      id: workspaceId,
    },
    select: WORKSPACE_FIELDS,
  });
}

export async function createWorkspace(
  { name }: CreateWorkspaceSchema,
  { userId }: AuthenticatedRequestContext,
) {
  return prisma.workspace.create({
    data: {
      name,
      memberships: {
        create: {
          userId,
        },
      },
      themes: {
        createMany: {
          data: getDefaultThemesData(),
        },
      },
    },
    select: WORKSPACE_FIELDS,
  });
}

export async function updateWorkspace(
  { name }: UpdateWorkspaceSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
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

export async function deleteWorkspace({
  workspaceId,
}: AuthenticatedWorkspaceProcedureContext) {
  return prisma.workspace.delete({
    where: {
      id: workspaceId,
    },
    select: WORKSPACE_FIELDS,
  });
}

export async function inviteToWorkspace(
  { email }: InviteToWorkspaceSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const key = await createKey(INVITE_KEY_BYTES);
  const [workspace, inviter, invite] = await prisma.$transaction(
    async (transaction) =>
      Promise.all([
        transaction.workspace.findUniqueOrThrow({
          where: { id: workspaceId },
          select: { name: true },
        }),
        transaction.user.findUniqueOrThrow({
          where: { id: userId },
          select: { id: true, name: true },
        }),
        transaction.workspaceInvite.create({
          data: {
            creatorId: userId,
            workspaceId,
            email,
            key,
          },
          select: WORKSPACE_INVITE_FIELDS,
        }),
      ]),
  );

  // Don't block on sending email
  sendEmail(
    email,
    inviteToWorkspaceEmail({ inviter, workspaceName: workspace.name, key }),
  ).catch((error) => console.error(error));

  return invite;
}

export async function acceptWorkspaceInvite(
  { key }: AcceptWorkspaceInviteSchema,
  { userId }: AuthenticatedRequestContext,
) {
  return prisma.$transaction(async (transaction) => {
    const { workspaceId } = await transaction.workspaceInvite.findUniqueOrThrow(
      {
        where: { key },
        select: { workspaceId: true },
      },
    );

    await Promise.all([
      transaction.workspaceMembership.create({
        data: {
          workspaceId,
          userId,
        },
        select: { userId: true },
      }),
      transaction.workspaceInvite.delete({ where: { key } }),
    ]);

    return { workspaceId };
  });
}

export async function deleteWorkspaceInvite(
  { id }: DeleteWorkspaceInviteSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.workspaceInvite.delete({
    where: { workspaceId, id },
    select: { id: true },
  });
}

export async function listWorkspaceInvites(
  { query, cursor }: ListWorkspaceInvitesSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const filter: Prisma.WorkspaceInviteWhereInput = query
    ? { email: { contains: query, mode: "insensitive" } }
    : {};
  const invites = await prisma.workspaceInvite.findMany({
    where: {
      workspaceId,
      ...filter,
    },
    select: WORKSPACE_INVITE_FIELDS,
    orderBy: {
      createdAt: "asc",
    },
    take: RESULTS_PER_PAGE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
  const { items, nextCursor } = paginate(invites, (i) => i.id);
  return { invites: items, nextCursor };
}

export async function removeFromWorkspace(
  { userId }: RemoveFromWorkspaceSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.workspaceMembership.delete({
    where: {
      id: {
        workspaceId,
        userId,
      },
    },
    select: { workspaceId: true },
  });
}

export async function listWorkspaceUsers(
  { query, cursor }: ListWorkspaceUsersSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const filter: Prisma.WorkspaceMembershipWhereInput = query
    ? { user: { name: { contains: query, mode: "insensitive" } } }
    : {};
  const memberships = await prisma.workspaceMembership.findMany({
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
    ...(cursor && { cursor: { id: { workspaceId, userId: cursor } }, skip: 1 }),
  });
  const { items, nextCursor } = paginate(memberships, (m) => m.user.id);
  return {
    users: items.map((item) => item.user),
    nextCursor,
  };
}

// TODO: Add guards to prevent admins from changing other admins' roles (workspace takeover prevention)
export async function updateWorkspaceRole(
  { userId, role }: UpdateRoleSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.$transaction(async (transaction) => {
    if (role !== "ADMIN") {
      const otherAdminCount = await transaction.workspaceMembership.count({
        where: { workspaceId, role: "ADMIN", NOT: { userId } },
      });
      if (otherAdminCount === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot demote the last admin",
        });
      }
    }

    return transaction.workspaceMembership.update({
      where: { id: { workspaceId, userId } },
      data: { role },
      select: { role: true },
    });
  });
}
