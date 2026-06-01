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
  $queryRawTyped: vi.fn(),
  $queryRawUnsafe: vi.fn(),
  bookmark: mockModel(),
  chart: mockModel(),
  chartSeries: mockModel(),
  collection: mockModel(),
  folder: mockModel(),
  image: mockModel(),
  imageTile: mockModel(),
  key: mockModel(),
  linkTile: mockModel(),
  mapTile: mockModel(),
  page: mockModel(),
  pageAccess: mockModel(),
  pageDocument: mockModel(),
  pageInvite: mockModel(),
  pageLinkTile: mockModel(),
  place: mockModel(),
  section: mockModel(),
  session: mockModel(),
  table: mockModel(),
  tableColumn: mockModel(),
  tableRow: mockModel(),
  theme: mockModel(),
  textTile: mockModel(),
  tile: mockModel(),
  user: mockModel(),
  videoTile: mockModel(),
  workspace: mockModel(),
  workspaceInvite: mockModel(),
  workspaceMembership: mockModel(),
} as Prisma.TransactionClient;

export type CreateQuery<T> = { select: T; data: never };
export type UpdateQuery<T> = { select: T; where: never; data: never };
export type FindUniqueQuery<T> = { select: T; where: never };
export type FindManyQuery<T> = { select: T; where: never };
export type DeleteQuery<T> = { select: T; where: never };
