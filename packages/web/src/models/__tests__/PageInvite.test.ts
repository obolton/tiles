import { describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import PageInvite from "@/models/PageInvite";
import Page from "@/models/Page";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";
import { PAGE_INVITE, PAGE_LINK_INVITE } from "@/test/fixtures/PageInvite";

vi.mock("@/api/client", () => ({
  default: {
    collaboration: {
      inviteToPage: {
        mutate: vi.fn(),
      },
      deletePageInvite: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("PageInvite", () => {
  const page = new Page(PAGE, new Y.Doc());
  const inviteToPageMock = vi.mocked(client.collaboration.inviteToPage.mutate);
  const deletePageInviteMock = vi.mocked(client.collaboration.deletePageInvite.mutate);

  test("maps properties to values", () => {
    const invite = new PageInvite(page, PAGE_INVITE);

    expect(invite.page).toBe(page);
    expect(invite.id).toBe(PAGE_INVITE.id);
    expect(invite.email).toBe(PAGE_INVITE.email);
    expect(invite.key).toBe(PAGE_INVITE.key);
    expect(invite.createdAt).toBe(PAGE_INVITE.createdAt);
  });

  test("builds the accept URL from the invite key", () => {
    const invite = new PageInvite(page, PAGE_INVITE);

    expect(invite.url).toBe(`${location.origin}/invites/accept/${PAGE_INVITE.key}`);
  });

  describe("create", () => {
    test("creates a new invite and adds it to the page", async () => {
      inviteToPageMock.mockResolvedValue(PAGE_INVITE);

      const invite = await PageInvite.create(page, "user@example.com");

      expect(inviteToPageMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        email: "user@example.com",
      });
      expect(invite.id).toBe(PAGE_INVITE.id);
      expect(invite.email).toBe(PAGE_INVITE.email);
      expect(page.invites.value).toContain(invite);
    });

    test("creates a link-only invite when no email is given", async () => {
      inviteToPageMock.mockResolvedValue(PAGE_LINK_INVITE);

      const invite = await PageInvite.create(page);

      expect(inviteToPageMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        email: undefined,
      });
      expect(invite.email).toBeNull();
      expect(page.invites.value).toContain(invite);
    });
  });

  describe("delete", () => {
    test("deletes the invite and removes it from the page", async () => {
      const invite = new PageInvite(page, PAGE_INVITE);
      page.invites.value = page.invites.value.concat(invite);

      await invite.delete();

      expect(deletePageInviteMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: PAGE_INVITE.id,
      });
      expect(page.invites.value).not.toContain(invite);
    });
  });
});
