import { afterEach, describe, expect, test, vi } from "vitest";
import Page from "@/models/Page";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";

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
  },
}));

describe("Page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("maps properties to reactive values", () => {
    const page = new Page(PAGE);

    expect(page.id).toBe(PAGE.id);
    expect(page.workspaceId).toBe(PAGE.workspaceId);
    expect(page.author).toBe(PAGE.author);
    expect(page.title.value).toBe(PAGE.title);
    expect(page.backgroundColor.value).toBe(PAGE.backgroundColor);
    expect(page.font.value).toBe(PAGE.font);
    expect(page.coverImageUrl.value).toBe(PAGE.coverImageUrl);
    expect(page.isPublished.value).toBe(PAGE.published);
    expect(page.folderId.value).toBe(PAGE.folderId);
    expect(page.themeId.value).toBeNull();
    expect(page.dockSizes.value).toEqual({
      TOP: PAGE.dockTopHeight,
      BOTTOM: PAGE.dockBottomHeight,
      LEFT: PAGE.dockLeftWidth,
      RIGHT: PAGE.dockRightWidth,
    });
    expect(page.dropdowns.value).toEqual([]);
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
      const newThemeId = "new-theme-id";

      await page.setTheme(newThemeId);

      expect(page.themeId.value).toBe(newThemeId);
      expect(client.pages.update.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        themeId: newThemeId,
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
        pageId: PAGE.id,
      });
    });
  });
});
