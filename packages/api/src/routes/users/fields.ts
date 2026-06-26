import type { ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { WORKSPACE_FIELDS } from "@/routes/workspaces/fields";

export const USER_FIELDS = {
  id: true,
  username: true,
  name: true,
  email: true,
  imageKey: true,
  imageUrl: true,
  workspaceMemberships: {
    select: {
      workspace: {
        select: WORKSPACE_FIELDS,
      },
    },
  },
} as const satisfies Prisma.UserSelect<ExtensionArgs>;
