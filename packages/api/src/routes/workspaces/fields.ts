import type { ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

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
