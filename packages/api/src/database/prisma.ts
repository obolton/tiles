import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import images from "./extensions/images";
import colors from "./extensions/colors";
import backgrounds from "./extensions/backgrounds";
import themes from "./extensions/themes";
import dates from "./extensions/dates";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter })
  .$extends(images)
  .$extends(colors)
  .$extends(backgrounds)
  .$extends(themes)
  .$extends(dates);

export type ExtendedPrismaClient = typeof prisma;

export type PrismaTransactionClient = Parameters<
  Parameters<ExtendedPrismaClient["$transaction"]>[0]
>[0];

type PrismaClientExtensionArgs<
  T extends (client: unknown) => { $extends: { extArgs: unknown } },
> = ReturnType<T>["$extends"]["extArgs"];

export type ExtensionArgs = PrismaClientExtensionArgs<typeof images> &
  PrismaClientExtensionArgs<typeof colors> &
  PrismaClientExtensionArgs<typeof backgrounds> &
  PrismaClientExtensionArgs<typeof themes> &
  PrismaClientExtensionArgs<typeof dates>;

export default prisma;
