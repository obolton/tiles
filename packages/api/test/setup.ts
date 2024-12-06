import { vi } from "vitest";
import { MOCK_PRISMA } from "./prisma.ts";

// Environment variables
vi.stubEnv("PROFILE_IMAGES_BASE_URL", "https://example.com/profile-images");
vi.stubEnv("RESOURCES_BASE_URL", "https://example.com/resources");
vi.stubEnv("EMAIL_FROM", "from@test.com");
vi.stubEnv("AWS_ACCESS_KEY_ID", "test");
vi.stubEnv("AWS_SECRET_ACCESS_KEY", "test");
vi.stubEnv("AWS_REGION", "test");
vi.stubEnv("CLOUDFLARE_API_TOKEN", "test");
vi.stubEnv("CLOUDFLARE_ZONE_ID", "test");

// Globals
vi.stubGlobal("fetch", async () => new Response());

// Database
vi.mock("@/database/prisma.ts", () => ({ default: MOCK_PRISMA }));
