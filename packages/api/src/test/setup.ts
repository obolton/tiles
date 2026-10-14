import { vi } from "vitest";
import { MOCK_PRISMA } from "./prisma";

// Globals
vi.stubGlobal(
  "fetch",
  vi.fn(async () => new Response()),
);

// Database
vi.mock("@/database/prisma", () => ({ default: MOCK_PRISMA }));
