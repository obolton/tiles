import { describe, test, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma.ts";
import { authenticateConnection } from "../auth.ts";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.page.findUnique).mockResolvedValue({
    id: "page-1",
    workspaceId: "ws-1",
  } as never);
});

describe("authenticateConnection", () => {
  test("accepts a session via cookie header", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({
      userId: "user-1",
    } as never);

    const result = await authenticateConnection({
      requestHeaders: new Headers({
        cookie: "__Secure-session=session-id; other=foo",
      }),
      pageId: "page-1",
    });

    expect(result).toEqual({ userId: "user-1", sessionId: "session-id" });
  });

  test("accepts a session via explicit token argument", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({
      userId: "user-1",
    } as never);

    const result = await authenticateConnection({
      requestHeaders: new Headers(),
      token: "direct-token",
      pageId: "page-1",
    });

    expect(result).toEqual({ userId: "user-1", sessionId: "direct-token" });
  });

  test("falls back to cookie when the token is an empty string", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({
      userId: "user-1",
    } as never);

    const result = await authenticateConnection({
      requestHeaders: new Headers({
        cookie: "__Secure-session=session-id",
      }),
      token: "",
      pageId: "page-1",
    });

    expect(result).toEqual({ userId: "user-1", sessionId: "session-id" });
  });

  test("rejects when neither cookie nor token is present", async () => {
    await expect(
      authenticateConnection({
        requestHeaders: new Headers(),
        pageId: "page-1",
      }),
    ).rejects.toThrow("Missing session");
  });

  test("rejects when session is invalid or expired", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

    await expect(
      authenticateConnection({
        requestHeaders: new Headers(),
        token: "bad-token",
        pageId: "page-1",
      }),
    ).rejects.toThrow("Invalid session");
  });

  test("rejects when the user has no access to the page", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({
      userId: "user-1",
    } as never);
    vi.mocked(prisma.page.findUnique).mockResolvedValue(null);

    await expect(
      authenticateConnection({
        requestHeaders: new Headers(),
        token: "session-id",
        pageId: "page-1",
      }),
    ).rejects.toThrow("No access to page");
  });
});
