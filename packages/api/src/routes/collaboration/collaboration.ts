import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import type { Prisma } from "@prisma/client";
import type {
  InviteToPageSchema,
  AcceptInviteSchema,
  DeleteInviteSchema,
  RevokePageAccessSchema,
} from "./schema.ts";
import type { AuthenticatedProcedureContext } from "@/utils/middleware.ts";
import { createKey } from "@/utils/keys.ts";
import { sendEmail } from "@/utils/email.ts";
import { inviteToPageEmail } from "@/emails/inviteToPage.ts";

export const PAGE_INVITE_FIELDS = {
  id: true,
  email: true,
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

const INVITE_KEY_BYTES = 32;

export async function inviteToPage(
  { pageId, email }: InviteToPageSchema,
  { user }: AuthenticatedProcedureContext,
) {
  const key = await createKey(INVITE_KEY_BYTES);
  return prisma.$transaction(async (transaction) => {
    const [page, inviter, invite] = await Promise.all([
      transaction.page.findUniqueOrThrow({
        where: { id: pageId },
      }),
      transaction.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { id: true, name: true },
      }),
      transaction.pageInvite.create({
        data: {
          creatorId: user.id,
          pageId,
          email,
          key,
        },
        select: PAGE_INVITE_FIELDS,
      }),
    ]);
    try {
      sendEmail(email, inviteToPageEmail({ inviter, title: page.title, key }));
    } catch (error) {
      console.error(error);
    }
    return invite;
  });
}

export async function acceptPageInvite(
  { key }: AcceptInviteSchema,
  { user }: AuthenticatedProcedureContext,
) {
  return prisma.$transaction(async (transaction) => {
    const {
      pageId,
      page: { authorId },
    } = await transaction.pageInvite.findUniqueOrThrow({
      where: { key },
      select: {
        pageId: true,
        page: {
          select: {
            authorId: true,
          },
        },
      },
    });
    if (authorId === user.id) {
      throw new Error("You already have access to this page.");
    }
    await transaction.pageAccess.create({
      data: {
        pageId,
        userId: user.id,
      },
      select: { userId: true },
    });
    await transaction.pageInvite.delete({ where: { key } });
    return { pageId };
  });
}

export async function deletePageInvite({ pageId, id }: DeleteInviteSchema) {
  return prisma.pageInvite.delete({
    where: { pageId, id },
    select: { id: true },
  });
}

export async function revokePageAccess({
  pageId,
  userId,
}: RevokePageAccessSchema) {
  return prisma.pageAccess.delete({
    where: { id: { pageId, userId } },
    select: { userId: true },
  });
}
