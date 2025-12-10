import { afterEach, describe, expect, test, vi } from "vitest";
import PageInvite from "@/models/PageInvite";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";
import { PAGE_INVITE } from "@/test/fixtures/PageInvite";

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
  const editor = Editor.init(PAGE);
  const inviteToPageMock = vi.mocked(client.collaboration.inviteToPage.mutate);
  const deletePageInviteMock = vi.mocked(
    client.collaboration.deletePageInvite.mutate,
  );

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("maps properties to values", () => {
    const invite = new PageInvite(editor, PAGE_INVITE);

    expect(invite.editor).toBe(editor);
    expect(invite.id).toBe(PAGE_INVITE.id);
    expect(invite.email).toBe(PAGE_INVITE.email);
    expect(invite.createdAt).toBe(PAGE_INVITE.createdAt);
  });

  describe("create", () => {
    test("creates a new invite and adds it to the editor", async () => {
      const addInviteSpy = vi.spyOn(editor, "addInvite");
      inviteToPageMock.mockResolvedValue(PAGE_INVITE);

      const invite = await PageInvite.create(editor, "user@example.com");

      expect(inviteToPageMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        email: "user@example.com",
      });
      expect(invite.id).toBe(PAGE_INVITE.id);
      expect(invite.email).toBe(PAGE_INVITE.email);
      expect(addInviteSpy).toHaveBeenCalledWith(invite);
    });
  });

  describe("delete", () => {
    test("deletes the invite and removes it from the editor", async () => {
      const removeInviteSpy = vi.spyOn(editor, "removeInvite");
      const invite = new PageInvite(editor, PAGE_INVITE);

      await invite.delete();

      expect(deletePageInviteMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: PAGE_INVITE.id,
      });
      expect(removeInviteSpy).toHaveBeenCalledWith(invite);
    });
  });
});
