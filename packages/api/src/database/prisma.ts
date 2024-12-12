import { PrismaClient } from "@prisma/client";
import user from "./extensions/user.ts";

const prisma = new PrismaClient().$extends(user);

export type ExtendedPrismaClient = typeof prisma;

export type PrismaTransactionClient = Parameters<
  Parameters<ExtendedPrismaClient["$transaction"]>[0]
>[0];

type PrismaClientExtensionArgs<
  T extends (client: unknown) => { $extends: { extArgs: unknown } },
> = ReturnType<T>["$extends"]["extArgs"];

export type ExtensionArgs = PrismaClientExtensionArgs<typeof user>;

export default prisma;
