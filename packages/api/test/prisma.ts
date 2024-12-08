import { vi } from "vitest";
import type { Prisma } from "@prisma/client";

function mockModel() {
  return {
    aggregate: vi.fn(),
    count: vi.fn(async () => 0),
    create: vi.fn(),
    createMany: vi.fn(),
    createManyAndReturn: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    groupBy: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    fields: {} as never,
  };
}

export const MOCK_PRISMA = {
  $transaction: async (
    callback: (transaction: Prisma.TransactionClient) => void,
  ) => callback(MOCK_PRISMA),
  $executeRaw: vi.fn(),
  $executeRawUnsafe: vi.fn(),
  $queryRaw: vi.fn(),
  $queryRawUnsafe: vi.fn(),
  collection: mockModel(),
  eventTile: mockModel(),
  headingTile: mockModel(),
  imageTile: mockModel(),
  key: mockModel(),
  linkTile: mockModel(),
  mapTile: mockModel(),
  page: mockModel(),
  pageLinkTile: mockModel(),
  place: mockModel(),
  session: mockModel(),
  textTile: mockModel(),
  tile: mockModel(),
  user: mockModel(),
  videoTile: mockModel(),
} as Prisma.TransactionClient;

export type CreateQuery<T> = { select: T; data: never };
export type UpdateQuery<T> = { select: T; where: never; data: never };
