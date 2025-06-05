import { PrismaClient } from "@prisma/client";
import images from "./extensions/images.ts";
import colors from "./extensions/colors.ts";

const prisma = new PrismaClient().$extends(images).$extends(colors);

export type ExtendedPrismaClient = typeof prisma;

export type PrismaTransactionClient = Parameters<
  Parameters<ExtendedPrismaClient["$transaction"]>[0]
>[0];

type PrismaClientExtensionArgs<
  T extends (client: unknown) => { $extends: { extArgs: unknown } },
> = ReturnType<T>["$extends"]["extArgs"];

export type ExtensionArgs = PrismaClientExtensionArgs<typeof images>;

export default prisma;
