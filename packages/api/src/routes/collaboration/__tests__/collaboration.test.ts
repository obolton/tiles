import { describe, test, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma";
import { sendEmail } from "@/utils/email";
import { createKey } from "@/utils/keys";
import {
  inviteToPage,
  acceptPageInvite,
  deletePageInvite,
  revokePageAccess,
} from "../collaboration";
import { PAGE_INVITE_FIELDS } from "../fields";
import type { CreateQuery, FindUniqueQuery, DeleteQuery } from "@/test/prisma";
import type { AuthenticatedRequestContext } from "@/utils/trpc";

vi.mock("@/utils/keys", () => ({
  createKey: vi.fn(async () => "mock-invite-key"),
}));

vi.mock("@/utils/email", () => ({
  sendEmail: vi.fn(async () => {}),
}));

const MOCK_CONTEXT: AuthenticatedRequestContext = {
  res: {} as AuthenticatedRequestContext["res"],
  sessionId: "session-1",
  userId: "user-1",
  serviceName: null,
};

const MOCK_INVITE = {
  id: "invite-1",
  email: "invitee@test.com",
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

describe("inviteToPage", () => {
  beforeEach(() => {
    vi.mocked(prisma.page.findUniqueOrThrow<FindUniqueQuery<{ title: true }>>).mockResolvedValue({
      title: "Shared Page",
    });
    vi.mocked(
      prisma.user.findUniqueOrThrow<FindUniqueQuery<{ id: true; name: true }>>,
    ).mockResolvedValue({ id: "user-1", name: "Alice" });
    vi.mocked(prisma.pageInvite.create<CreateQuery<typeof PAGE_INVITE_FIELDS>>).mockResolvedValue(
      MOCK_INVITE,
    );
  });

  test("should return the new invite", async () => {
    const result = await inviteToPage(
      { pageId: "page-1", email: "invitee@test.com" },
      MOCK_CONTEXT,
    );

    expect(result).toEqual(MOCK_INVITE);
  });

  test("should store a 32-byte key with the invite", async () => {
    await inviteToPage({ pageId: "page-1", email: "invitee@test.com" }, MOCK_CONTEXT);

    expect(createKey).toHaveBeenCalledWith(32);
    expect(prisma.pageInvite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pageId: "page-1", key: "mock-invite-key" }),
      }),
    );
  });

  test("should email the invitee a link containing the invite key", async () => {
    await inviteToPage({ pageId: "page-1", email: "invitee@test.com" }, MOCK_CONTEXT);

    expect(sendEmail).toHaveBeenCalledWith("invitee@test.com", {
      subject: 'Alice has invited you to collaborate on "Shared Page"',
      body: expect.stringContaining("/invites/accept/mock-invite-key"),
    });
  });

  test("should return the invite even when the email cannot be sent", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Email failed");
    vi.mocked(sendEmail).mockRejectedValueOnce(error);

    const result = await inviteToPage(
      { pageId: "page-1", email: "invitee@test.com" },
      MOCK_CONTEXT,
    );

    expect(result).toEqual(MOCK_INVITE);
    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(error);
    });
  });

  test("should not send an email when the page does not exist", async () => {
    vi.mocked(prisma.page.findUniqueOrThrow).mockRejectedValueOnce(new Error("Not found"));

    await expect(
      inviteToPage({ pageId: "page-1", email: "invitee@test.com" }, MOCK_CONTEXT),
    ).rejects.toThrow("Not found");

    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("acceptPageInvite", () => {
  beforeEach(() => {
    vi.mocked(
      prisma.pageInvite.findUniqueOrThrow<
        FindUniqueQuery<{ pageId: true; page: { select: { authorId: true } } }>
      >,
    ).mockResolvedValue({ pageId: "page-1", page: { authorId: "user-2" } });
    vi.mocked(prisma.pageAccess.create<CreateQuery<{ userId: true }>>).mockResolvedValue({
      userId: "user-1",
    });
    vi.mocked(prisma.pageInvite.delete).mockResolvedValue(
      {} as Awaited<ReturnType<typeof prisma.pageInvite.delete>>,
    );
  });

  test("should return the id of the invited page", async () => {
    const result = await acceptPageInvite({ key: "mock-invite-key" }, MOCK_CONTEXT);

    expect(result).toEqual({ pageId: "page-1" });
  });

  test("should grant the current user access to the page", async () => {
    await acceptPageInvite({ key: "mock-invite-key" }, MOCK_CONTEXT);

    expect(prisma.pageAccess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { pageId: "page-1", userId: "user-1" },
      }),
    );
  });

  test("should consume the invite", async () => {
    await acceptPageInvite({ key: "mock-invite-key" }, MOCK_CONTEXT);

    expect(prisma.pageInvite.delete).toHaveBeenCalledWith({ where: { key: "mock-invite-key" } });
  });

  test("should reject the page author accepting their own invite", async () => {
    await expect(
      acceptPageInvite({ key: "mock-invite-key" }, { ...MOCK_CONTEXT, userId: "user-2" }),
    ).rejects.toThrow("You already have access to this page.");

    expect(prisma.pageAccess.create).not.toHaveBeenCalled();
    expect(prisma.pageInvite.delete).not.toHaveBeenCalled();
  });

  test("should not grant access for an unknown invite key", async () => {
    vi.mocked(prisma.pageInvite.findUniqueOrThrow).mockRejectedValueOnce(new Error("Not found"));

    await expect(acceptPageInvite({ key: "unknown-key" }, MOCK_CONTEXT)).rejects.toThrow(
      "Not found",
    );

    expect(prisma.pageAccess.create).not.toHaveBeenCalled();
  });
});

describe("deletePageInvite", () => {
  beforeEach(() => {
    vi.mocked(prisma.pageInvite.delete<DeleteQuery<{ id: true }>>).mockResolvedValue({
      id: "invite-1",
    });
  });

  test("should delete the invite scoped to the page", async () => {
    const result = await deletePageInvite({ pageId: "page-1", id: "invite-1" });

    expect(prisma.pageInvite.delete).toHaveBeenCalledWith({
      where: { pageId: "page-1", id: "invite-1" },
      select: { id: true },
    });
    expect(result).toEqual({ id: "invite-1" });
  });
});

describe("revokePageAccess", () => {
  beforeEach(() => {
    vi.mocked(prisma.pageAccess.delete<DeleteQuery<{ userId: true }>>).mockResolvedValue({
      userId: "user-2",
    });
  });

  test("should revoke the user's access scoped to the page", async () => {
    const result = await revokePageAccess({ pageId: "page-1", userId: "user-2" });

    expect(prisma.pageAccess.delete).toHaveBeenCalledWith({
      where: { id: { pageId: "page-1", userId: "user-2" } },
      select: { userId: true },
    });
    expect(result).toEqual({ userId: "user-2" });
  });
});
