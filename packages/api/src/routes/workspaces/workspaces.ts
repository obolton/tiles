import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { createKey } from "@/utils/keys.ts";
import { sendEmail } from "@/utils/email.ts";
import { inviteToWorkspaceEmail } from "@/emails/inviteToWorkspace.ts";
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
} from "./schema.ts";
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware.ts";

const RESULTS_PER_PAGE = 15;

export const WORKSPACE_FIELDS = {
  id: true,
  name: true,
} as const satisfies Prisma.WorkspaceSelect<ExtensionArgs>;

export const WORKSPACE_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  imageUrl: true,
} as const satisfies Prisma.UserSelect<ExtensionArgs>;

export const WORKSPACE_INVITE_FIELDS = {
  id: true,
  email: true,
  createdAt: true,
} as const satisfies Prisma.WorkspaceInviteSelect<ExtensionArgs>;

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
  { query, offset }: ListWorkspaceInvitesSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const filter: Prisma.WorkspaceInviteWhereInput = query
    ? { email: { contains: query, mode: "insensitive" } }
    : {};
  const results = await prisma.workspaceInvite.findMany({
    where: {
      workspaceId,
      ...filter,
    },
    select: WORKSPACE_INVITE_FIELDS,
    orderBy: {
      createdAt: "asc",
    },
    take: RESULTS_PER_PAGE + 1,
    skip: offset,
  });
  return {
    invites: results.slice(0, RESULTS_PER_PAGE),
    hasMore: results.length > RESULTS_PER_PAGE,
  };
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
  { query, offset }: ListWorkspaceUsersSchema,
  { workspaceId }: AuthenticatedWorkspaceProcedureContext,
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
