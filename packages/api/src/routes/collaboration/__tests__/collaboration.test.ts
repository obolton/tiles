import { describe, test, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma.ts";
import { sendEmail } from "@/utils/email.ts";
import {
  inviteToPage,
  acceptPageInvite,
  deletePageInvite,
  revokePageAccess,
} from "../collaboration.ts";
import { mockQuery, type CreateQuery, type FindUniqueQuery } from "@/test/prisma.ts";
import { createAuthenticatedContext } from "@/test/mocks/context.ts";

vi.mock("@/utils/email.ts", () => ({
  sendEmail: vi.fn(async () => {}),
}));

const PAGE_ID = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";
const OTHER_PAGE_ID = "5f0c2e1a-7b3d-4c8e-9a1f-2d3e4f5a6b7c";
const INVITE_ID = "2c6e2a0e-5d2f-4a1a-9d3b-6f1c1e7a4b21";
const USER_ID = "7d4c1f2a-0c2b-4e3d-8a5f-1b2c3d4e5f60";
const AUTHOR_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

const MOCK_CONTEXT = createAuthenticatedContext({ userId: USER_ID });

const NOT_FOUND = "No record found";

function notFound() {
  return new Error(NOT_FOUND);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("inviteToPage", () => {
  let storedKey: string | undefined;

  beforeEach(() => {
    storedKey = undefined;
    vi.mocked(prisma.page.findUniqueOrThrow<FindUniqueQuery<{ title: true }>>).mockResolvedValue({
      title: "Shared Page",
    });
    vi.mocked(
      prisma.user.findUniqueOrThrow<FindUniqueQuery<{ id: true; name: true }>>,
    ).mockResolvedValue({ id: USER_ID, name: "Alice" });
    mockQuery(prisma.pageInvite.create, async ({ data }) => {
      storedKey = data.key;
      return { id: INVITE_ID, email: data.email, createdAt: new Date("2026-01-01T00:00:00Z") };
    });
  });

  test("should return the new invite for the invited email", async () => {
    const result = await inviteToPage({ pageId: PAGE_ID, email: "invitee@test.com" }, MOCK_CONTEXT);

    expect(result).toEqual({
      id: INVITE_ID,
      email: "invitee@test.com",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
  });

  test("should store a 32-byte random key with the invite", async () => {
    await inviteToPage({ pageId: PAGE_ID, email: "invitee@test.com" }, MOCK_CONTEXT);
    await inviteToPage({ pageId: PAGE_ID, email: "invitee@test.com" }, MOCK_CONTEXT);

    const keys = vi.mocked(prisma.pageInvite.create).mock.calls.map(([{ data }]) => data.key);
    expect(keys[0]).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(keys[0]).not.toBe(keys[1]);
  });

  test("should email the invitee a link containing the invite key", async () => {
    await inviteToPage({ pageId: PAGE_ID, email: "invitee@test.com" }, MOCK_CONTEXT);

    expect(sendEmail).toHaveBeenCalledWith("invitee@test.com", {
      subject: 'Alice has invited you to collaborate on "Shared Page"',
      body: expect.stringContaining(`/invites/accept/${storedKey}`),
    });
  });

  test("should return the invite even when the email cannot be sent", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("SES unavailable");
    vi.mocked(sendEmail).mockRejectedValueOnce(error);

    const result = await inviteToPage({ pageId: PAGE_ID, email: "invitee@test.com" }, MOCK_CONTEXT);

    expect(result.id).toBe(INVITE_ID);
    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(error);
    });
  });

  test("should not create an invite for a page that does not exist", async () => {
    vi.mocked(prisma.page.findUniqueOrThrow).mockRejectedValueOnce(notFound());

    await expect(
      inviteToPage({ pageId: PAGE_ID, email: "invitee@test.com" }, MOCK_CONTEXT),
    ).rejects.toThrow(NOT_FOUND);

    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("acceptPageInvite", () => {
  beforeEach(() => {
    mockQuery(prisma.pageInvite.findUniqueOrThrow, async ({ where }) => {
      if (where.key !== "valid-key") {
        throw notFound();
      }
      return { pageId: PAGE_ID, page: { authorId: AUTHOR_ID } };
    });
    vi.mocked(prisma.pageAccess.create<CreateQuery<{ userId: true }>>).mockResolvedValue({
      userId: USER_ID,
    });
    vi.mocked(prisma.pageInvite.delete).mockResolvedValue(
      {} as Awaited<ReturnType<typeof prisma.pageInvite.delete>>,
    );
  });

  test("should return the id of the page the invite is for", async () => {
    await expect(acceptPageInvite({ key: "valid-key" }, MOCK_CONTEXT)).resolves.toEqual({
      pageId: PAGE_ID,
    });
  });

  test("should grant the accepting user access to the page", async () => {
    await acceptPageInvite({ key: "valid-key" }, MOCK_CONTEXT);

    expect(prisma.pageAccess.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { pageId: PAGE_ID, userId: USER_ID } }),
    );
  });

  test("should consume the invite so it cannot be accepted again", async () => {
    await acceptPageInvite({ key: "valid-key" }, MOCK_CONTEXT);

    expect(prisma.pageInvite.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: "valid-key" } }),
    );
  });

  test("should reject the page author accepting their own invite", async () => {
    await expect(
      acceptPageInvite({ key: "valid-key" }, { ...MOCK_CONTEXT, userId: AUTHOR_ID }),
    ).rejects.toThrow("You already have access to this page.");

    expect(prisma.pageAccess.create).not.toHaveBeenCalled();
    expect(prisma.pageInvite.delete).not.toHaveBeenCalled();
  });

  test("should reject an unknown invite key without granting access", async () => {
    await expect(acceptPageInvite({ key: "unknown-key" }, MOCK_CONTEXT)).rejects.toThrow(NOT_FOUND);

    expect(prisma.pageAccess.create).not.toHaveBeenCalled();
  });
});

describe("deletePageInvite", () => {
  beforeEach(() => {
    mockQuery(prisma.pageInvite.delete, async ({ where }) => {
      if (where.id !== INVITE_ID || where.pageId !== PAGE_ID) {
        throw notFound();
      }
      return { id: INVITE_ID };
    });
  });

  test("should delete the invite and return its id", async () => {
    await expect(deletePageInvite({ pageId: PAGE_ID, id: INVITE_ID })).resolves.toEqual({
      id: INVITE_ID,
    });
  });

  test("should not delete an invite that belongs to another page", async () => {
    await expect(deletePageInvite({ pageId: OTHER_PAGE_ID, id: INVITE_ID })).rejects.toThrow(
      NOT_FOUND,
    );
  });
});

describe("revokePageAccess", () => {
  beforeEach(() => {
    mockQuery(prisma.pageAccess.delete, async ({ where }) => {
      if (where.id?.pageId !== PAGE_ID || where.id.userId !== USER_ID) {
        throw notFound();
      }
      return { userId: USER_ID };
    });
  });

  test("should revoke the user's access and return their id", async () => {
    await expect(revokePageAccess({ pageId: PAGE_ID, userId: USER_ID })).resolves.toEqual({
      userId: USER_ID,
    });
  });

  test("should not revoke access the user holds on another page", async () => {
    await expect(revokePageAccess({ pageId: OTHER_PAGE_ID, userId: USER_ID })).rejects.toThrow(
      NOT_FOUND,
    );
  });
});
