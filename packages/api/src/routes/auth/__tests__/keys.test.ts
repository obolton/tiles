import { describe, test, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma";
import { createKey, getUserIdByProviderId } from "../keys";

describe("createKey", () => {
  beforeEach(() => {
    vi.mocked(prisma.key.create).mockResolvedValue({
      createdAt: new Date(),
      provider: "GOOGLE",
      providerId: "google-123",
      userId: "user-456",
    });
  });

  test("creates an authentication key", async () => {
    await createKey(prisma, {
      provider: "GOOGLE",
      providerId: "google-123",
      userId: "user-456",
    });

    expect(prisma.key.create).toHaveBeenCalledWith({
      data: {
        provider: "GOOGLE",
        providerId: "google-123",
        userId: "user-456",
      },
    });
  });
});

describe("getUserIdByProviderId", () => {
  test("returns userId when key exists", async () => {
    vi.mocked(prisma.key.findUnique).mockResolvedValue({
      createdAt: new Date(),
      provider: "GOOGLE",
      providerId: "google-123",
      userId: "user-456",
    });

    const result = await getUserIdByProviderId(prisma, {
      provider: "GOOGLE",
      providerId: "google-123",
    });

    expect(prisma.key.findUnique).toHaveBeenCalledWith({
      where: {
        id: {
          provider: "GOOGLE",
          providerId: "google-123",
        },
      },
      select: {
        userId: true,
      },
    });
    expect(result).toBe("user-456");
  });

  test("returns null when key does not exist", async () => {
    vi.mocked(prisma.key.findUnique).mockResolvedValue(null);

    const result = await getUserIdByProviderId(prisma, {
      provider: "GOOGLE",
      providerId: "nonexistent",
    });

    expect(result).toBeNull();
  });
});
