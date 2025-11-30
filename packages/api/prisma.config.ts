import path from "node:path";
import dotenv from "dotenv";
import { env } from "prisma/config";
import type { PrismaConfig } from "prisma";

dotenv.config();

export default {
  schema: path.join(__dirname, "prisma", "schema"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  typedSql: {
    path: "./src/sql",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
} satisfies PrismaConfig;
