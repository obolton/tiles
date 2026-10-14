import { vi } from "vitest";
import { MOCK_PRISMA } from "./prisma";

// Globals
vi.stubGlobal(
  "fetch",
  vi.fn(async () => new Response()),
);

// DNS: resolve every hostname to a public address so URL safety checks pass by default.
vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
}));

// Database
vi.mock("@/database/prisma", () => ({ default: MOCK_PRISMA }));
