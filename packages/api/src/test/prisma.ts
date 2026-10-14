import { vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";

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
    updateManyAndReturn: vi.fn(),
    upsert: vi.fn(),
    fields: {} as never,
  };
}

export const MOCK_PRISMA = {
  $transaction: vi.fn(async (callback) => callback(MOCK_PRISMA)),
  $executeRaw: vi.fn(),
  $executeRawUnsafe: vi.fn(),
  $queryRaw: vi.fn(),
  $queryRawUnsafe: vi.fn(),
  bookmark: mockModel(),
  folder: mockModel(),
  image: mockModel(),
  key: mockModel(),
  page: mockModel(),
  pageAccess: mockModel(),
  pageDocument: mockModel(),
  pageInvite: mockModel(),
  pageVersion: mockModel(),
  session: mockModel(),
  theme: mockModel(),
  user: mockModel(),
  workspace: mockModel(),
  workspaceInvite: mockModel(),
  workspaceMembership: mockModel(),
} as Prisma.TransactionClient;

export type CreateQuery<T> = { select: T; data: never };
export type UpdateQuery<T> = { select: T; where: never; data: never };
export type FindUniqueQuery<T> = { select: T; where: never };
export type FindManyQuery<T> = { select: T; where: never };
export type DeleteQuery<T> = { select: T; where: never };
