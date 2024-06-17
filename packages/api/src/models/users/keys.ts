import type { AuthenticationProvider, Prisma } from "@prisma/client";

type CreateKeyOptions = {
  provider: AuthenticationProvider;
  providerId: string;
  userId: string;
};

export async function createKey(
  db: Prisma.TransactionClient,
  { provider, providerId, userId }: CreateKeyOptions
) {
  await db.key.create({
    data: {
      provider,
      providerId,
      userId,
    },
  });
}

type GetUserIdByProviderIdOptions = {
  provider: AuthenticationProvider;
  providerId: string;
};

export async function getUserIdByProviderId(
  db: Prisma.TransactionClient,
  { provider, providerId }: GetUserIdByProviderIdOptions
) {
  const key = await db.key.findUnique({
    where: {
      id: {
        provider,
        providerId,
      },
    },
    select: {
      userId: true,
    },
  });
  return key?.userId ?? null;
}
