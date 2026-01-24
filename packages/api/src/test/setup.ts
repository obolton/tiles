import { vi } from "vitest";
import { MOCK_PRISMA } from "./prisma.ts";

// Globals
vi.stubGlobal("fetch", async () => new Response());

// Database
vi.mock("@/database/prisma.ts", () => ({ default: MOCK_PRISMA }));
