import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import Page from "@/models/Page";
import Section from "@/models/Section";
import Text from "@/models/Text";
import Theme from "@/models/Theme";
import client from "@/api/client";
import { DEFAULT_PAGE_WIDTH } from "@/constants/size";
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
    const page = new Page(PAGE, new Y.Doc());
    const { tiles: _, document: __, ...expected } = PAGE;

    expect(page.serialize()).toEqual({
      ...expected,
      updatedAt: new Date(PAGE.updatedAt).toISOString(),
    });
  });

  test("maps properties to reactive values", () => {
    const page = new Page(PAGE, new Y.Doc());

    expect(page.id).toBe(PAGE.id);
    expect(page.workspaceId).toBe(PAGE.workspaceId);
    expect(page.author).toBe(PAGE.author);
    expect(page.type).toBe(PAGE.type);
    expect(page.title.value).toBe(PAGE.title);
    expect(page.backgroundColor.value).toBeNull();
    expect(page.font.value).toBeNull();
    expect(page.coverImageUrl.value).toBe(PAGE.coverImageUrl);
    expect(page.isPublished.value).toBe(PAGE.published);
    expect(page.folderId.value).toBe(PAGE.folderId);
    expect(page.width.value).toBe(DEFAULT_PAGE_WIDTH);
    expect(page.alignment.value).toBe("CENTER");
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
      const pageWithDropdowns = new Page(
        {
          ...PAGE,
          dropdowns: [
            { id: "dd-1", title: "Status", options: [{ value: "Active" }] },
          ],
        },
        new Y.Doc(),
      );

      const dropdown = pageWithDropdowns.getDropdown("dd-1");

      expect(dropdown.id).toBe("dd-1");
      expect(dropdown.title.value).toBe("Status");
    });

    test("throws for an unknown dropdown ID", () => {
      const page = new Page(PAGE, new Y.Doc());

      expect(() => page.getDropdown("unknown")).toThrow(
        "Dropdown cannot be found: unknown",
      );
    });
  });

  describe("getInvite", () => {
    test("returns the invite with the given ID", () => {
      const pageWithInvites = new Page(
        {
          ...PAGE,
          invites: [{ id: "inv-1", email: "a@b.com", createdAt: "2025-01-01" }],
        },
        new Y.Doc(),
      );

      const invite = pageWithInvites.getInvite("inv-1");

      expect(invite.id).toBe("inv-1");
      expect(invite.email).toBe("a@b.com");
    });

    test("throws for an unknown invite ID", () => {
      const page = new Page(PAGE, new Y.Doc());

      expect(() => page.getInvite("unknown")).toThrow(
        "Invite cannot be found: unknown",
      );
    });
  });

  describe("revokeAccess", () => {
    test("revokes access and removes the user from the list", async () => {
      const pageWithAccess = new Page(
        {
          ...PAGE,
          access: [
            { user: { id: "user-1", name: "Alice", imageUrl: null } },
            { user: { id: "user-2", name: "Bob", imageUrl: null } },
          ],
        },
        new Y.Doc(),
      );

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
      const page = new Page(PAGE, new Y.Doc());
      const newTitle = "New Title";

      await page.setTitle(newTitle);

      expect(page.title.value).toBe(newTitle);
      expect(client.pages.update.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        title: newTitle,
      });
    });
  });

  describe("setPublished", () => {
    test("updates the published state and persists it", async () => {
      const page = new Page(PAGE, new Y.Doc());

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
      const page = new Page(PAGE, new Y.Doc());
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
    test("writes the snapshot and themeId into the doc", () => {
      const doc = new Y.Doc();
      const page = new Page(PAGE, doc);
      const theme = new Theme(THEME);

      page.setTheme(theme);

      expect(page.themeId.value).toBe(theme.id);
      expect(page.theme.value).toEqual(theme.serialize());
      expect(doc.getMap("themes").get(theme.id)).toEqual(theme.serialize());
      expect(client.pages.update.mutate).not.toHaveBeenCalled();
    });

    test("clears the theme", () => {
      const page = new Page(PAGE, new Y.Doc());
      const theme = new Theme(THEME);
      page.setTheme(theme);

      page.setTheme(null);

      expect(page.themeId.value).toBeNull();
      expect(page.theme.value).toBeNull();
    });
  });

  describe("setDockSizes", () => {
    test("updates dock sizes and persists them", async () => {
      const page = new Page(PAGE, new Y.Doc());

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
      const page = new Page(PAGE, new Y.Doc());

      await page.delete();

      expect(client.pages.delete.mutate).toHaveBeenCalledWith({
        workspaceId: PAGE.workspaceId,
        pageIds: [PAGE.id],
      });
    });
  });

  describe("add", () => {
    let page: Page;

    beforeEach(() => {
      page = new Page(PAGE, new Y.Doc());
    });

    function attachTile(id: string, map: Y.Map<unknown>): Y.Map<unknown> {
      map.set("id", id);
      map.set("parentId", null);
      map.set("order", "a0");
      page.doc.getMap<Y.Map<unknown>>("tiles").set(id, map);
      return page.doc.getMap<Y.Map<unknown>>("tiles").get(id)!;
    }

    test("constructs a tile model from its Y.Map and indexes it", () => {
      const map = attachTile("t1", Section.createMap({ layout: "VERTICAL" }));

      const tile = page.add(map);

      expect(tile).toBeInstanceOf(Section);
      expect(tile.id).toBe("t1");
      expect(page.index.get("t1")).toBe(tile);
    });

    test("is idempotent — returns the same tile on repeat calls", () => {
      const map = attachTile("t1", Section.createMap({ layout: "VERTICAL" }));

      const first = page.add(map);
      const second = page.add(map);

      expect(second).toBe(first);
    });
  });

  describe("remove", () => {
    test("drops the tile from the index", () => {
      const page = new Page(PAGE, new Y.Doc());
      const map = Section.createMap({ layout: "VERTICAL" });
      map.set("id", "t1");
      map.set("parentId", null);
      map.set("order", "a0");
      page.doc.getMap<Y.Map<unknown>>("tiles").set("t1", map);
      page.add(page.doc.getMap<Y.Map<unknown>>("tiles").get("t1")!);

      page.remove("t1");

      expect(page.index.has("t1")).toBe(false);
    });

    test("is idempotent for unknown ids", () => {
      const page = new Page(PAGE, new Y.Doc());

      expect(() => page.remove("missing")).not.toThrow();
    });
  });

  describe("createTile", () => {
    let page: Page;

    beforeEach(() => {
      page = new Page(PAGE, new Y.Doc());
    });

    test("attaches the map, mints an id, and returns the constructed tile", () => {
      const tile = page.createTile(Section.createMap({ layout: "VERTICAL" }));

      expect(tile).toBeInstanceOf(Section);
      expect(typeof tile.id).toBe("string");
      expect(tile.id.length).toBeGreaterThan(0);
      expect(page.index.get(tile.id)).toBe(tile);
      expect(page.doc.getMap("tiles").has(tile.id)).toBe(true);
    });

    test("places the tile at the page root by default", () => {
      const tile = page.createTile(Section.createMap({ layout: "VERTICAL" }));

      expect(page.tiles.value.map((t) => t.id)).toContain(tile.id);
      expect(tile.parentId.value).toBeNull();
    });

    test("orders the new tile before the specified sibling", () => {
      const existing = page.createTile(Text.createMap({ align: "TOP" }));
      const inserted = page.createTile(Text.createMap({ align: "TOP" }), {
        beforeId: existing.id,
      });

      expect(inserted.order.value < existing.order.value).toBe(true);
      expect(page.tiles.value.map((t) => t.id)).toEqual([
        inserted.id,
        existing.id,
      ]);
    });

    test("places the tile under the specified parent section", () => {
      const section = page.createTile(
        Section.createMap({ layout: "VERTICAL" }),
      ) as Section;
      const child = page.createTile(Text.createMap({ align: "TOP" }), {
        parentId: section.id,
      });

      expect(child.parentId.value).toBe(section.id);
      expect(section.tiles.value.map((t) => t.id)).toEqual([child.id]);
    });
  });
});
