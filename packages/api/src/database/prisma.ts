import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import images from "./extensions/images.ts";
import colors from "./extensions/colors.ts";
import backgrounds from "./extensions/backgrounds.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter })
  .$extends(images)
  .$extends(colors)
  .$extends(backgrounds);

export type ExtendedPrismaClient = typeof prisma;

export type PrismaTransactionClient = Parameters<
  Parameters<ExtendedPrismaClient["$transaction"]>[0]
>[0];

type PrismaClientExtensionArgs<
  T extends (client: unknown) => { $extends: { extArgs: unknown } },
> = ReturnType<T>["$extends"]["extArgs"];

export type ExtensionArgs = PrismaClientExtensionArgs<typeof images> &
  PrismaClientExtensionArgs<typeof colors> &
  PrismaClientExtensionArgs<typeof backgrounds>;

export default prisma;
