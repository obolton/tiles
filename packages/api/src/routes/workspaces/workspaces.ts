import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { createKey } from "@/utils/keys.ts";
import { sendEmail } from "@/utils/email.ts";
import { inviteToWorkspaceEmail } from "@/emails/inviteToWorkspace.ts";
import type { Prisma } from "@prisma/client";
import type {
  GetWorkspaceSchema,
  InviteToWorkspaceSchema,
  AcceptWorkspaceInviteSchema,
  DeleteWorkspaceInviteSchema,
  ListWorkspaceInvitesSchema,
  RemoveFromWorkspaceSchema,
  UpdateWorkspaceSchema,
  ListWorkspaceUsersSchema,
} from "./schema.ts";
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";

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

export async function getWorkspace(
  { id }: GetWorkspaceSchema,
  { userId }: AuthenticatedRequestContext,
) {
  return prisma.workspace.findUniqueOrThrow({
    where: {
      id,
      memberships: {
        some: {
          userId,
        },
      },
    },
    select: WORKSPACE_FIELDS,
  });
}

export async function updateWorkspace(
  { name }: UpdateWorkspaceSchema,
  { workspaceId }: AuthenticatedRequestContext,
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
  { userId, workspaceId }: AuthenticatedRequestContext,
) {
  const key = await createKey(INVITE_KEY_BYTES);
  const [workspace, inviter, invite] = await prisma.$transaction(
    async (transaction) =>
      Promise.all([
        transaction.workspace.findUniqueOrThrow({
          where: { id: workspaceId },
          select: { id: true, name: true },
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
  { workspaceId }: AuthenticatedRequestContext,
) {
  return prisma.workspaceInvite.delete({
    where: { workspaceId, id },
    select: { id: true },
  });
}

export async function listWorkspaceInvites(
  { query, offset }: ListWorkspaceInvitesSchema,
  { workspaceId }: AuthenticatedRequestContext,
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
  { workspaceId }: AuthenticatedRequestContext,
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
  { workspaceId }: AuthenticatedRequestContext,
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
