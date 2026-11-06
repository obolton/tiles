import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { getTileIds } from "doc/richText/tiles";
import Page from "@/models/Page";
import Dropdown from "@/models/Dropdown";
import Section from "@/models/Section";
import Text from "@/models/Text";
import Theme from "@/models/Theme";
import client from "@/api/client";
import { DEFAULT_DOCK_SIZE, DEFAULT_PAGE_WIDTH } from "@/constants/size";
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
  test("maps properties to reactive values", () => {
    const page = new Page(PAGE, new Y.Doc());

    expect(page.id).toBe(PAGE.id);
    expect(page.workspaceId).toBe(PAGE.workspaceId);
    expect(page.author).toBe(PAGE.author);
    expect(page.type).toBe(PAGE.type);
    expect(page.title.value).toBe(PAGE.title);
    expect(page.backgroundColor.value).toBeNull();
    expect(page.font.value).toBeNull();
    expect(page.isPublished.value).toBe(PAGE.published);
    expect(page.folderId.value).toBe(PAGE.folderId);
    expect(page.width.value).toBe(DEFAULT_PAGE_WIDTH);
    expect(page.alignment.value).toBe("CENTER");
    expect(page.dockSizes.TOP.value).toBe(DEFAULT_DOCK_SIZE);
    expect(page.dockSizes.BOTTOM.value).toBe(DEFAULT_DOCK_SIZE);
    expect(page.dockSizes.LEFT.value).toBe(DEFAULT_DOCK_SIZE);
    expect(page.dockSizes.RIGHT.value).toBe(DEFAULT_DOCK_SIZE);
    expect(page.dropdowns.value).toEqual([]);
    expect(page.access.value).toEqual([]);
    expect(page.invites.value).toEqual([]);
  });

  describe("getTiles", () => {
    test("resolves ids in order, skipping missing tiles", () => {
      const page = new Page(PAGE, new Y.Doc());
      const a = page.createTile(Text.createMap({ align: "TOP" }), {});
      const b = page.createTile(Text.createMap({ align: "TOP" }), {});

      expect(page.getTiles([b.id, "missing", a.id])).toEqual([b, a]);
    });
  });

  describe("getDropdown", () => {
    test("returns the dropdown with the given ID", () => {
      const page = new Page(PAGE, new Y.Doc());
      const created = page.createDropdown(
        Dropdown.createMap({
          title: "Status",
          options: [{ value: "Active" }],
        }),
      );

      const dropdown = page.getDropdown(created.id);

      expect(dropdown).toBe(created);
      expect(dropdown.title.value).toBe("Status");
    });

    test("throws for an unknown dropdown ID", () => {
      const page = new Page(PAGE, new Y.Doc());

      expect(() => page.getDropdown("unknown")).toThrow("Item not found: unknown");
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

      expect(() => page.getInvite("unknown")).toThrow("Invite cannot be found: unknown");
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

      expect(client.collaboration.revokePageAccess.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        userId: "user-1",
      });
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

  describe("body", () => {
    test("exists for document pages only", () => {
      expect(new Page(PAGE, new Y.Doc()).body).toBeNull();
      expect(new Page({ ...PAGE, type: "DOCUMENT" }, new Y.Doc()).body).not.toBeNull();
    });
  });

  describe("container", () => {
    test("is the placement for sections and the root of other page types", () => {
      const page = new Page(PAGE, new Y.Doc());

      expect(page.container(null)).toBe(page.placement);
      expect(page.container("section-id")).toBe(page.placement);
    });

    test("is the body for the root of a document page", () => {
      const page = new Page({ ...PAGE, type: "DOCUMENT" }, new Y.Doc());

      expect(page.container(null)).toBe(page.body);
      expect(page.container("section-id")).toBe(page.placement);
    });
  });

  describe("createTile", () => {
    let page: Page;

    beforeEach(() => {
      page = new Page(PAGE, new Y.Doc());
    });

    test("embeds the tile in the body of a document page", () => {
      const document = new Page({ ...PAGE, type: "DOCUMENT" }, new Y.Doc());

      const tile = document.createTile(Section.createMap({ layout: "VERTICAL" }));

      expect(tile.parentId.value).toBeNull();
      expect(document.tiles.value).toHaveLength(0);
      expect(document.body && getTileIds(document.body.fragment)).toEqual([tile.id]);
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
      expect(page.tiles.value.map((t) => t.id)).toEqual([inserted.id, existing.id]);
    });

    test("places the tile under the specified parent section", () => {
      const section = page.createTile(Section.createMap({ layout: "VERTICAL" })) as Section;
      const child = page.createTile(Text.createMap({ align: "TOP" }), {
        parentId: section.id,
      });

      expect(child.parentId.value).toBe(section.id);
      expect(section.tiles.value.map((t) => t.id)).toEqual([child.id]);
    });
  });
});
