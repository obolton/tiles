import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import images from "./extensions/images";
import backgrounds from "./extensions/backgrounds";
import themes from "./extensions/themes";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter })
  .$extends(images)
  .$extends(backgrounds)
  .$extends(themes);

export type ExtendedPrismaClient = typeof prisma;

export type PrismaTransactionClient = Parameters<
  Parameters<ExtendedPrismaClient["$transaction"]>[0]
>[0];

type PrismaClientExtensionArgs<
  T extends (client: unknown) => { $extends: { extArgs: unknown } },
> = ReturnType<T>["$extends"]["extArgs"];

export type ExtensionArgs = PrismaClientExtensionArgs<typeof images> &
  PrismaClientExtensionArgs<typeof backgrounds> &
  PrismaClientExtensionArgs<typeof themes>;

export default prisma;
