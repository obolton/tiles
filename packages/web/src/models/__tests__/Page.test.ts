import { afterEach, describe, expect, test, vi } from "vitest";
import Page from "@/models/Page";
import Theme from "@/models/Theme";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";
import { THEME } from "@/test/fixtures/Theme";

vi.mock("@/api/client", () => ({
  default: {
    pages: {
      update: {
        mutate: vi.fn(),
      },
      delete: {
        mutate: vi.fn(),
      },
    },
    collaboration: {
      revokePageAccess: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("Page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("serialize", () => {
    const page = new Page(PAGE);
    const { tiles: _, ...expected } = PAGE;

    expect(page.serialize()).toEqual({
      ...expected,
      updatedAt: new Date(PAGE.updatedAt).toISOString(),
    });
  });

  test("maps properties to reactive values", () => {
    const page = new Page(PAGE);

    expect(page.id).toBe(PAGE.id);
    expect(page.workspaceId).toBe(PAGE.workspaceId);
    expect(page.author).toBe(PAGE.author);
    expect(page.type).toBe(PAGE.type);
    expect(page.title.value).toBe(PAGE.title);
    expect(page.backgroundColor.value).toBe(PAGE.backgroundColor);
    expect(page.font.value).toBe(PAGE.font);
    expect(page.coverImageUrl.value).toBe(PAGE.coverImageUrl);
    expect(page.isPublished.value).toBe(PAGE.published);
    expect(page.folderId.value).toBe(PAGE.folderId);
    expect(page.theme.value).toBeNull();
    expect(page.width.value).toBe(PAGE.width);
    expect(page.alignment.value).toBe(PAGE.alignment);
    expect(page.dockSizes.value).toEqual({
      TOP: PAGE.dockTopHeight,
      BOTTOM: PAGE.dockBottomHeight,
      LEFT: PAGE.dockLeftWidth,
      RIGHT: PAGE.dockRightWidth,
    });
    expect(page.dropdowns.value).toEqual([]);
    expect(page.access.value).toEqual([]);
    expect(page.invites.value).toEqual([]);
  });

  describe("getDropdown", () => {
    test("returns the dropdown with the given ID", () => {
      const pageWithDropdowns = new Page({
        ...PAGE,
        dropdowns: [
          { id: "dd-1", title: "Status", options: [{ value: "Active" }] },
        ],
      });

      const dropdown = pageWithDropdowns.getDropdown("dd-1");

      expect(dropdown.id).toBe("dd-1");
      expect(dropdown.title.value).toBe("Status");
    });

    test("throws for an unknown dropdown ID", () => {
      const page = new Page(PAGE);

      expect(() => page.getDropdown("unknown")).toThrow(
        "Dropdown cannot be found: unknown",
      );
    });
  });

  describe("getInvite", () => {
    test("returns the invite with the given ID", () => {
      const pageWithInvites = new Page({
        ...PAGE,
        invites: [{ id: "inv-1", email: "a@b.com", createdAt: "2025-01-01" }],
      });

      const invite = pageWithInvites.getInvite("inv-1");

      expect(invite.id).toBe("inv-1");
      expect(invite.email).toBe("a@b.com");
    });

    test("throws for an unknown invite ID", () => {
      const page = new Page(PAGE);

      expect(() => page.getInvite("unknown")).toThrow(
        "Invite cannot be found: unknown",
      );
    });
  });

  describe("revokeAccess", () => {
    test("revokes access and removes the user from the list", async () => {
      const pageWithAccess = new Page({
        ...PAGE,
        access: [
          { user: { id: "user-1", name: "Alice", imageUrl: null } },
          { user: { id: "user-2", name: "Bob", imageUrl: null } },
        ],
      });

      await pageWithAccess.revokeAccess("user-1");

      expect(client.collaboration.revokePageAccess.mutate).toHaveBeenCalledWith(
        {
          pageId: PAGE.id,
          userId: "user-1",
        },
      );
      expect(pageWithAccess.access.value).toHaveLength(1);
      expect(pageWithAccess.access.value[0]?.user.id).toBe("user-2");
    });
  });

  describe("setTitle", () => {
    test("updates the title and persists it", async () => {
      const page = new Page(PAGE);
      const newTitle = "New Title";

      await page.setTitle(newTitle);

      expect(page.title.value).toBe(newTitle);
      expect(client.pages.update.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        title: newTitle,
      });
    });
  });

  describe("setFont", () => {
    test("persists the font", async () => {
      const page = new Page(PAGE);

      await page.setFont("CODE");

      expect(client.pages.update.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        font: "CODE",
      });
    });
  });

  describe("setBackgroundColor", () => {
    test("persists the background color", async () => {
      const page = new Page(PAGE);
      const color = "ff00ff00ff00";

      await page.setBackgroundColor(color);

      expect(client.pages.update.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        backgroundColor: color,
      });
    });
  });

  describe("setPublished", () => {
    test("updates the published state and persists it", async () => {
      const page = new Page(PAGE);

      await page.setPublished(false);

      expect(page.isPublished.value).toBe(false);
      expect(client.pages.update.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        published: false,
      });
    });
  });

  describe("setFolder", () => {
    test("updates the folder and persists it", async () => {
      const page = new Page(PAGE);
      const newFolderId = "new-folder-id";

      await page.setFolder(newFolderId);

      expect(page.folderId.value).toBe(newFolderId);
      expect(client.pages.update.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        folderId: newFolderId,
      });
    });
  });

  describe("setTheme", () => {
    test("updates the theme and persists it", async () => {
      const page = new Page(PAGE);
      const theme = new Theme(THEME);

      await page.setTheme(theme);

      expect(page.theme.value).toBe(theme);
      expect(client.pages.update.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        themeId: THEME.id,
      });
    });
  });

  describe("setWidth", () => {
    test("updates the width and persists it", async () => {
      const page = new Page(PAGE);

      await page.setWidth(40);

      expect(page.width.value).toBe(40);
      expect(client.pages.update.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        width: 40,
      });
    });

    test("resets width to default", async () => {
      const page = new Page({ ...PAGE, width: 40 });

      await page.setWidth(32);

      expect(page.width.value).toBe(32);
      expect(client.pages.update.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        width: 32,
      });
    });
  });

  describe("setAlignment", () => {
    test("updates the alignment and persists it", async () => {
      const page = new Page(PAGE);

      await page.setAlignment("LEFT");

      expect(page.alignment.value).toBe("LEFT");
      expect(client.pages.update.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        alignment: "LEFT",
      });
    });
  });

  describe("setDockSizes", () => {
    test("updates dock sizes and persists them", async () => {
      const page = new Page(PAGE);

      await page.setDockSizes({ TOP: 200, LEFT: 300 });

      expect(page.dockSizes.value.TOP).toBe(200);
      expect(page.dockSizes.value.LEFT).toBe(300);
      expect(client.pages.update.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        dockTopHeight: 200,
        dockBottomHeight: undefined,
        dockLeftWidth: 300,
        dockRightWidth: undefined,
      });
    });
  });

  describe("delete", () => {
    test("deletes the page", async () => {
      const page = new Page(PAGE);

      await page.delete();

      expect(client.pages.delete.mutate).toHaveBeenCalledWith({
        workspaceId: PAGE.workspaceId,
        pageIds: [PAGE.id],
      });
    });
  });
});
