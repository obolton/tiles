import { TRPCError } from "@trpc/server";
import prisma from "@/database/prisma";
import { createKey } from "@/utils/keys";
import { sendEmail } from "@/utils/email";
import { inviteToWorkspaceEmail } from "@/emails/inviteToWorkspace";
import { RESULTS_PER_PAGE, paginate } from "@/utils/pagination";
import { getDefaultThemesData } from "@/utils/themes";
import { invalidateCachedPages } from "@/utils/cdn";
import { closePageConnections } from "@/collaboration/documents";
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
} from "./schema";
import type { AuthenticatedRequestContext } from "@/utils/trpc";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware";
import { WORKSPACE_FIELDS, WORKSPACE_MEMBERSHIP_FIELDS, WORKSPACE_INVITE_FIELDS } from "./fields";

const INVITE_KEY_BYTES = 32;

export async function getWorkspace(
  { workspaceId }: GetWorkspaceSchema,
  { role }: AuthenticatedWorkspaceProcedureContext,
) {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: {
      id: workspaceId,
    },
    select: WORKSPACE_FIELDS,
  });
  return { ...workspace, role };
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
          role: "ADMIN",
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

export async function deleteWorkspace({ workspaceId }: AuthenticatedWorkspaceProcedureContext) {
  const { pages, workspace } = await prisma.$transaction(async (transaction) => {
    const pages = await transaction.page.findMany({
      where: { workspaceId },
      select: { id: true, published: true },
    });

    // Page documents are not cascaded from pages, but deleting a document cascades its page
    await transaction.pageDocument.deleteMany({
      where: { page: { workspaceId } },
    });

    const workspace = await transaction.workspace.delete({
      where: { id: workspaceId },
      select: WORKSPACE_FIELDS,
    });

    return { pages, workspace };
  });

  closePageConnections(pages.map((page) => page.id));
  invalidateCachedPages(pages.filter((page) => page.published).map((page) => page.id));

  return workspace;
}

export async function inviteToWorkspace(
  { email }: InviteToWorkspaceSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const key = await createKey(INVITE_KEY_BYTES);
  const [workspace, inviter, invite] = await prisma.$transaction(async (transaction) =>
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
  sendEmail(email, inviteToWorkspaceEmail({ inviter, workspaceName: workspace.name, key })).catch(
    (error: unknown) => console.error(error),
  );

  return invite;
}

export async function acceptWorkspaceInvite(
  { key }: AcceptWorkspaceInviteSchema,
  { userId }: AuthenticatedRequestContext,
) {
  return prisma.$transaction(async (transaction) => {
    const { workspaceId } = await transaction.workspaceInvite.findUniqueOrThrow({
      where: { key },
      select: { workspaceId: true },
    });

    await Promise.all([
      transaction.workspaceMembership.create({
        data: {
          workspaceId,
          userId,
          role: "MEMBER",
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

export async function leaveWorkspace({
  workspaceId,
  userId,
}: AuthenticatedWorkspaceProcedureContext) {
  return prisma.$transaction(async (transaction) => {
    const otherAdminCount = await transaction.workspaceMembership.count({
      where: { workspaceId, role: "ADMIN", NOT: { userId } },
    });
    if (otherAdminCount === 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot leave as the last admin",
      });
    }

    return transaction.workspaceMembership.delete({
      where: { id: { workspaceId, userId } },
      select: { workspaceId: true },
    });
  });
}

// TODO: Add guards to prevent admins from removing other admins (workspace takeover prevention)
export async function removeFromWorkspace(
  { userId }: RemoveFromWorkspaceSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.$transaction(async (transaction) => {
    const otherAdminCount = await transaction.workspaceMembership.count({
      where: { workspaceId, role: "ADMIN", NOT: { userId } },
    });
    if (otherAdminCount === 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot remove the last admin",
      });
    }

    return transaction.workspaceMembership.delete({
      where: { id: { workspaceId, userId } },
      select: { workspaceId: true },
    });
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
    select: WORKSPACE_MEMBERSHIP_FIELDS,
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
    users: items.map((item) => ({ ...item.user, role: item.role })),
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
