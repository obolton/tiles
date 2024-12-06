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

function pick(object: object, keys: string[]) {
  return Object.fromEntries(
    Object.entries(object).filter(([key]) => keys.includes(key)),
  );
}

function selectColumns(object: { [k: string]: unknown }) {
  return Object.entries(object)
    .filter(([, value]) => typeof value === "boolean" && value)
    .map(([key]) => key);
}

type PrismaModelClient = (...args: unknown[]) => never;

export function mockCreate<
  CreateArgs extends {
    select?: Record<string, unknown> | null;
    data: Record<string, unknown>;
  },
>(defaults = {}) {
  return vi.fn((async ({ data, select }: CreateArgs) => {
    return pick({ ...defaults, ...data }, selectColumns(select || {}));
  }) as PrismaModelClient);
}
