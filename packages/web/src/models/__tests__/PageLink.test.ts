import { describe, expect, test, vi } from "vitest";
import PageLink from "@/models/PageLink";
import Editor from "@/editor/Editor";
import { PAGE } from "@/test/fixtures/Page";
import { PAGE_LINK_TILE } from "@/test/fixtures/Tile";

vi.mock("@/api/client", () => ({
  default: {
    tiles: {
      duplicate: {
        mutate: vi.fn(),
      },
      delete: {
        mutate: vi.fn(),
      },
      update: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("PageLink", () => {
  const editor = Editor.init(PAGE);

  test("serialize", () => {
    const data = { ...PAGE_LINK_TILE, sectionId: null };
    const pageLink = new PageLink(editor.page, data);

    expect(pageLink.serialize()).toEqual(data);
  });

  test("maps properties to reactive values", () => {
    const pageLink = new PageLink(editor.page, PAGE_LINK_TILE);

    expect(pageLink.type).toBe("PAGE_LINK");
    expect(pageLink.id).toBe(PAGE_LINK_TILE.id);
    expect(pageLink.linkedPage).toEqual(PAGE_LINK_TILE.linkedPage);
  });

  test("handles missing linked page", () => {
    const tile = {
      ...PAGE_LINK_TILE,
      linkedPage: null,
    };

    const pageLink = new PageLink(editor.page, tile);

    expect(pageLink.linkedPage).toBeNull();
  });
});
