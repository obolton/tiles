import { vi } from "vitest";

// Environment variables
vi.stubEnv("PROFILE_IMAGES_BASE_URL", "https://example.com/profile-images");
vi.stubEnv("RESOURCES_BASE_URL", "https://example.com/resources");
vi.stubEnv("EMAIL_FROM", "from@test.com");
vi.stubEnv("AWS_ACCESS_KEY_ID", "test");
vi.stubEnv("AWS_SECRET_ACCESS_KEY", "test");
vi.stubEnv("AWS_REGION", "test");

// Globals
vi.stubGlobal("fetch", async () => new Response());
