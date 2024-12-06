import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";

export async function checkPageAccess(
  transaction: Prisma.TransactionClient,
  context: AuthenticatedRequestContext,
  pageId: string,
) {
  const page = await transaction.page.findUnique({
    where: { id: pageId },
    select: { authorId: true },
  });

  if (!page || page.authorId !== context.user.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
}
