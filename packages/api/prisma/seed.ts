import * as Y from "yjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getDefaultThemesData } from "../src/utils/themes";
import {
  createEmptyDoc,
  CURRENT_SCHEMA_VERSION,
} from "../src/collaboration/migrator";

const SEED_WORKSPACE_ID = "31042e0b-f7e7-4fe1-a361-28780bf53ee9";
const SEED_USER_ID = "d3a3e353-6e5f-46b4-be4b-d55055901c29";
const SEED_PAGE_ID = "b8c96309-cc54-445b-a274-98b6be12c43f";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seed() {
  await prisma.workspace.upsert({
    select: { id: true },
    where: { id: SEED_WORKSPACE_ID },
    update: {},
    create: {
      id: SEED_WORKSPACE_ID,
      name: "Test Workspace",
      themes: {
        createMany: {
          data: getDefaultThemesData(),
        },
      },
    },
  });
  await prisma.user.upsert({
    where: { email: "test@test.com" },
    update: {},
    create: {
      id: SEED_USER_ID,
      name: "Test User",
      email: "test@test.com",
      emailVerified: false,
      workspaceMemberships: {
        create: {
          workspace: {
            connect: {
              id: SEED_WORKSPACE_ID,
            },
          },
        },
      },
      pages: {
        create: {
          id: SEED_PAGE_ID,
          workspace: { connect: { id: SEED_WORKSPACE_ID } },
          title: "Hello World",
          document: {
            create: {
              snapshot: Buffer.from(Y.encodeStateAsUpdate(createEmptyDoc())),
              schemaVersion: CURRENT_SCHEMA_VERSION,
            },
          },
        },
      },
    },
  });
  console.log("Created seed data.");
}

try {
  await seed();
  await prisma.$disconnect();
} catch (error) {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
}
