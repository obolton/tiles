import { PrismaClient } from "@prisma/client";

// Seed record IDs
const SEED_USER_ID = "d3a3e353-6e5f-46b4-be4b-d55055901c29";
const SEED_PROFILE_PAGE_ID = "79ab2109-1399-4446-a509-267b3ce41b1e";
const SEED_PAGE_ID = "b8c96309-cc54-445b-a274-98b6be12c43f";

const prisma = new PrismaClient();

async function seed() {
  await prisma.user.upsert({
    where: { email: "test@test.com" },
    update: {},
    create: {
      id: SEED_USER_ID,
      name: "Test User",
      email: "test@test.com",
      emailVerified: false,
      profilePage: {
        create: {
          id: SEED_PROFILE_PAGE_ID,
          authorId: SEED_USER_ID,
          title: "Test User",
        },
      },
      pages: {
        create: {
          id: SEED_PAGE_ID,
          title: "Hello World",
          subtitle: "Welcome to your first page",
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
