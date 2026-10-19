import type { ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const PAGE_INVITE_FIELDS = {
  id: true,
  email: true,
  key: true,
  createdAt: true,
} as const satisfies Prisma.PageInviteSelect<ExtensionArgs>;

export const PAGE_ACCESS_FIELDS = {
  user: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  },
} as const satisfies Prisma.PageAccessSelect<ExtensionArgs>;
