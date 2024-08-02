import { vi } from "vitest";

// Environment variables
vi.stubEnv("PROFILE_IMAGES_BASE_URL", "https://example.com/profile-images");

// Globals
vi.stubGlobal("fetch", async () => new Response());
