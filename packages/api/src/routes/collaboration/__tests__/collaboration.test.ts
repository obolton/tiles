import { describe, test, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma.ts";
import { sendEmail } from "@/utils/email.ts";
import { createKey } from "@/utils/keys.ts";
import {
  inviteToPage,
  acceptPageInvite,
  deletePageInvite,
  revokePageAccess,
} from "../collaboration.ts";
import { PAGE_INVITE_FIELDS } from "../fields";
import type { CreateQuery, FindUniqueQuery, DeleteQuery } from "@/test/prisma.ts";
import { createAuthenticatedContext } from "@/test/mocks/context.ts";

vi.mock("@/utils/keys.ts", () => ({
  createKey: vi.fn(async () => "mock-invite-key"),
}));

vi.mock("@/utils/email.ts", () => ({
  sendEmail: vi.fn(async () => {}),
}));

const PAGE_ID = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";
const INVITE_ID = "2c6e2a0e-5d2f-4a1a-9d3b-6f1c1e7a4b21";
const USER_ID = "7d4c1f2a-0c2b-4e3d-8a5f-1b2c3d4e5f60";
const AUTHOR_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

const MOCK_CONTEXT = createAuthenticatedContext({ userId: USER_ID });

const MOCK_INVITE = {
  id: INVITE_ID,
  email: "invitee@test.com",
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("inviteToPage", () => {
  beforeEach(() => {
    vi.mocked(prisma.page.findUniqueOrThrow<FindUniqueQuery<{ title: true }>>).mockResolvedValue({
      title: "Shared Page",
    });
    vi.mocked(
      prisma.user.findUniqueOrThrow<FindUniqueQuery<{ id: true; name: true }>>,
    ).mockResolvedValue({ id: USER_ID, name: "Alice" });
    vi.mocked(prisma.pageInvite.create<CreateQuery<typeof PAGE_INVITE_FIELDS>>).mockResolvedValue(
      MOCK_INVITE,
    );
  });

  test("should create a 32-byte invite key", async () => {
    await inviteToPage({ pageId: PAGE_ID, email: "invitee@test.com" }, MOCK_CONTEXT);

    expect(createKey).toHaveBeenCalledWith(32);
  });

  test("should run the page, inviter and invite queries in one transaction", async () => {
    await inviteToPage({ pageId: PAGE_ID, email: "invitee@test.com" }, MOCK_CONTEXT);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.page.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: PAGE_ID },
      select: { title: true },
    });
    expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: { id: true, name: true },
    });
  });

  test("should create the invite for the page with the generated key", async () => {
    await inviteToPage({ pageId: PAGE_ID, email: "invitee@test.com" }, MOCK_CONTEXT);

    expect(prisma.pageInvite.create).toHaveBeenCalledWith({
      data: {
        creatorId: USER_ID,
        pageId: PAGE_ID,
        email: "invitee@test.com",
        key: "mock-invite-key",
      },
      select: PAGE_INVITE_FIELDS,
    });
  });

  test("should return the created invite", async () => {
    const result = await inviteToPage({ pageId: PAGE_ID, email: "invitee@test.com" }, MOCK_CONTEXT);

    expect(result).toEqual(MOCK_INVITE);
  });

  test("should send an invite email containing the key and page title", async () => {
    await inviteToPage({ pageId: PAGE_ID, email: "invitee@test.com" }, MOCK_CONTEXT);

    expect(sendEmail).toHaveBeenCalledWith("invitee@test.com", {
      subject: 'Alice has invited you to collaborate on "Shared Page"',
      body: expect.stringContaining("/invites/accept/mock-invite-key"),
    });
  });

  test("should not fail when the email cannot be sent", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("SES unavailable");
    vi.mocked(sendEmail).mockRejectedValueOnce(error);

    await expect(
      inviteToPage({ pageId: PAGE_ID, email: "invitee@test.com" }, MOCK_CONTEXT),
    ).resolves.toEqual(MOCK_INVITE);

    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(error);
    });
  });
});

describe("acceptPageInvite", () => {
  beforeEach(() => {
    vi.mocked(
      prisma.pageInvite.findUniqueOrThrow<
        FindUniqueQuery<{ pageId: true; page: { select: { authorId: true } } }>
      >,
    ).mockResolvedValue({ pageId: PAGE_ID, page: { authorId: AUTHOR_ID } });
    vi.mocked(prisma.pageAccess.create<CreateQuery<{ userId: true }>>).mockResolvedValue({
      userId: USER_ID,
    });
    vi.mocked(prisma.pageInvite.delete).mockResolvedValue(
      {} as Awaited<ReturnType<typeof prisma.pageInvite.delete>>,
    );
  });

  test("should look up the invite by key", async () => {
    await acceptPageInvite({ key: "mock-invite-key" }, MOCK_CONTEXT);

    expect(prisma.pageInvite.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { key: "mock-invite-key" },
      select: { pageId: true, page: { select: { authorId: true } } },
    });
  });

  test("should grant access and delete the invite in the same transaction", async () => {
    await acceptPageInvite({ key: "mock-invite-key" }, MOCK_CONTEXT);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.pageAccess.create).toHaveBeenCalledWith({
      data: { pageId: PAGE_ID, userId: USER_ID },
      select: { userId: true },
    });
    expect(prisma.pageInvite.delete).toHaveBeenCalledWith({ where: { key: "mock-invite-key" } });
  });

  test("should return the page id", async () => {
    const result = await acceptPageInvite({ key: "mock-invite-key" }, MOCK_CONTEXT);

    expect(result).toEqual({ pageId: PAGE_ID });
  });

  test("should reject the page author accepting their own invite", async () => {
    await expect(
      acceptPageInvite({ key: "mock-invite-key" }, { ...MOCK_CONTEXT, userId: AUTHOR_ID }),
    ).rejects.toThrow("You already have access to this page.");

    expect(prisma.pageAccess.create).not.toHaveBeenCalled();
    expect(prisma.pageInvite.delete).not.toHaveBeenCalled();
  });

  test("should propagate a missing invite", async () => {
    const error = new Error("No PageInvite found");
    vi.mocked(prisma.pageInvite.findUniqueOrThrow).mockRejectedValueOnce(error);

    await expect(acceptPageInvite({ key: "unknown-key" }, MOCK_CONTEXT)).rejects.toThrow(error);

    expect(prisma.pageAccess.create).not.toHaveBeenCalled();
  });
});

describe("deletePageInvite", () => {
  beforeEach(() => {
    vi.mocked(prisma.pageInvite.delete<DeleteQuery<{ id: true }>>).mockResolvedValue({
      id: INVITE_ID,
    });
  });

  test("should delete the invite scoped to the page", async () => {
    await deletePageInvite({ pageId: PAGE_ID, id: INVITE_ID });

    expect(prisma.pageInvite.delete).toHaveBeenCalledWith({
      where: { pageId: PAGE_ID, id: INVITE_ID },
      select: { id: true },
    });
  });

  test("should return the deleted invite id", async () => {
    const result = await deletePageInvite({ pageId: PAGE_ID, id: INVITE_ID });

    expect(result).toEqual({ id: INVITE_ID });
  });
});

describe("revokePageAccess", () => {
  beforeEach(() => {
    vi.mocked(prisma.pageAccess.delete<DeleteQuery<{ userId: true }>>).mockResolvedValue({
      userId: USER_ID,
    });
  });

  test("should revoke access scoped to the page", async () => {
    await revokePageAccess({ pageId: PAGE_ID, userId: USER_ID });

    expect(prisma.pageAccess.delete).toHaveBeenCalledWith({
      where: { id: { pageId: PAGE_ID, userId: USER_ID } },
      select: { userId: true },
    });
  });

  test("should return the revoked user id", async () => {
    const result = await revokePageAccess({ pageId: PAGE_ID, userId: USER_ID });

    expect(result).toEqual({ userId: USER_ID });
  });
});
