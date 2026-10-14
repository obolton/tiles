import prisma from "@/database/prisma";
import { createKey } from "@/utils/keys";
import { sendEmail } from "@/utils/email";
import { inviteToPageEmail } from "@/emails/inviteToPage";
import type {
  InviteToPageSchema,
  AcceptPageInviteSchema,
  DeletePageInviteSchema,
  RevokePageAccessSchema,
} from "./schema";
import type { AuthenticatedRequestContext } from "@/utils/trpc";
import { PAGE_INVITE_FIELDS } from "./fields";

const INVITE_KEY_BYTES = 32;

export async function inviteToPage(
  { pageId, email }: InviteToPageSchema,
  { userId }: AuthenticatedRequestContext,
) {
  const key = await createKey(INVITE_KEY_BYTES);
  const [page, inviter, invite] = await prisma.$transaction(async (transaction) =>
    Promise.all([
      transaction.page.findUniqueOrThrow({
        where: { id: pageId },
        select: { title: true },
      }),
      transaction.user.findUniqueOrThrow({
        where: { id: userId },
        select: { id: true, name: true },
      }),
      transaction.pageInvite.create({
        data: {
          creatorId: userId,
          pageId,
          email,
          key,
        },
        select: PAGE_INVITE_FIELDS,
      }),
    ]),
  );

  // Don't block on sending email
  sendEmail(email, inviteToPageEmail({ inviter, title: page.title, key })).catch((error: unknown) =>
    console.error(error),
  );

  return invite;
}

export async function acceptPageInvite(
  { key }: AcceptPageInviteSchema,
  { userId }: AuthenticatedRequestContext,
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

    if (authorId === userId) {
      throw new Error("You already have access to this page.");
    }

    await Promise.all([
      transaction.pageAccess.create({
        data: {
          pageId,
          userId,
        },
        select: { userId: true },
      }),
      transaction.pageInvite.delete({ where: { key } }),
    ]);

    return { pageId };
  });
}

export async function deletePageInvite({ pageId, id }: DeletePageInviteSchema) {
  return prisma.pageInvite.delete({
    where: { pageId, id },
    select: { id: true },
  });
}

export async function revokePageAccess({ pageId, userId }: RevokePageAccessSchema) {
  return prisma.pageAccess.delete({
    where: { id: { pageId, userId } },
    select: { userId: true },
  });
}
