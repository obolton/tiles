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
vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "test");
vi.stubEnv("CLOUDFLARE_R2_ACCESS_KEY_ID", "test");
vi.stubEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "test");
vi.stubEnv("CLOUDFLARE_R2_BUCKET_RESOURCES", "test");
vi.stubEnv("CLOUDFLARE_R2_BUCKET_PROFILE_IMAGES", "test");
vi.stubEnv("CLOUDFLARE_R2_BUCKET_IMAGES", "test");
vi.stubEnv("OPENAI_API_KEY", "test");

// Globals
vi.stubGlobal("fetch", async () => new Response());

// Database
vi.mock("@/database/prisma.ts", () => ({ default: MOCK_PRISMA }));
