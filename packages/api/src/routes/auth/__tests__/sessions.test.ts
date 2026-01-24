import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma.ts";
import { createSession, deleteSession } from "../sessions.ts";

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.session.create).mockResolvedValue({
      id: "mock-session-id",
      expiresAt: new Date("2025-01-15T00:00:00Z"),
      createdAt: new Date(),
      userId: "user-123",
    });
  });

  it("should create a session with a cryptographically random ID", async () => {
    await createSession(prisma, "user-123");

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.stringMatching(/^[A-Za-z0-9_-]{86}$/),
        userId: "user-123",
      }),
      select: {
        id: true,
        expiresAt: true,
      },
    });
  });

  it("should set expiration to 2 weeks from now", async () => {
    const now = new Date("2025-01-01T00:00:00Z");
    vi.setSystemTime(now);

    await createSession(prisma, "user-123");

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        expiresAt: new Date("2025-01-15T00:00:00Z"),
      }),
      select: {
        id: true,
        expiresAt: true,
      },
    });

    vi.useRealTimers();
  });

  it("should generate unique session IDs", async () => {
    await createSession(prisma, "user-123");
    await createSession(prisma, "user-123");

    const calls = vi.mocked(prisma.session.create).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0]![0].data.id).not.toBe(calls[1]![0].data.id);
  });
});

describe("deleteSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.session.delete).mockResolvedValue({
      id: "session-id",
      expiresAt: new Date(),
      createdAt: new Date(),
      userId: "user-id",
    });
  });

  it("should delete the session by ID", async () => {
    await deleteSession("session-to-delete");

    expect(prisma.session.delete).toHaveBeenCalledWith({
      where: {
        id: "session-to-delete",
      },
    });
  });
});
