import { afterEach, describe, expect, test, vi } from "vitest";
import Section from "@/models/Section";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";
import { SECTION_TILE } from "@/test/fixtures/Tile";
import type { Layout } from "api/types/tiles";

vi.mock("@/api/client", () => ({
  default: {
    sections: {
      create: {
        mutate: vi.fn(),
      },
      update: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("Section", () => {
  const editor = Editor.init(PAGE);
  const createMock = vi.mocked(client.sections.create.mutate);
  const updateMock = vi.mocked(client.sections.update.mutate);

  afterEach(() => {
    createMock.mockReset();
    updateMock.mockReset();
  });

  describe("create", () => {
    test("creates a section and adds it to the editor", async () => {
      const layout: Layout = "HORIZONTAL";

      createMock.mockResolvedValue(SECTION_TILE);

      await Section.create(editor.page, { layout });

      expect(createMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        layout,
      });
      expect(editor.page.index.get(SECTION_TILE.id)).toBeInstanceOf(Section);
    });

    test("creates a section before a specified tile", async () => {
      const layout: Layout = "VERTICAL";
      const existingSection = new Section(editor.page, SECTION_TILE);
      editor.addTile(existingSection, null, null, false);

      const newSectionId = "new-section-id";
      createMock.mockResolvedValue({
        ...SECTION_TILE,
        id: newSectionId,
        layout,
      });

      await Section.create(editor.page, {
        layout,
        beforeId: existingSection.id,
      });

      expect(createMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        layout,
        beforeId: existingSection.id,
      });
      expect(editor.page.index.get(newSectionId)).toBeInstanceOf(Section);
    });
  });

  test("maps properties to reactive values", () => {
    const section = new Section(editor.page, SECTION_TILE);

    expect(section.type).toBe("SECTION");
    expect(section.layout.value).toBe(SECTION_TILE.layout);
    expect(section.tiles).toBeDefined();
    expect(section.tiles.sectionId).toBe(SECTION_TILE.id);
  });

  describe("setLayout", () => {
    test("updates the layout and persists it", async () => {
      const section = new Section(editor.page, SECTION_TILE);
      const layout: Layout = "FREEFORM";

      updateMock.mockResolvedValue({
        ...SECTION_TILE,
        layout,
      });

      await section.setLayout(layout);

      expect(section.layout.value).toBe(layout);
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: SECTION_TILE.id,
        layout,
      });
    });

    test("updates layout to GRID", async () => {
      const section = new Section(editor.page, {
        ...SECTION_TILE,
        layout: "VERTICAL",
      });
      const layout: Layout = "GRID";

      updateMock.mockResolvedValue({
        ...SECTION_TILE,
        layout,
      });

      await section.setLayout(layout);

      expect(section.layout.value).toBe(layout);
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: SECTION_TILE.id,
        layout,
      });
    });

    test("updates layout to HORIZONTAL", async () => {
      const section = new Section(editor.page, {
        ...SECTION_TILE,
        layout: "GRID",
      });
      const layout: Layout = "HORIZONTAL";

      updateMock.mockResolvedValue({
        ...SECTION_TILE,
        layout,
      });

      await section.setLayout(layout);

      expect(section.layout.value).toBe(layout);
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: SECTION_TILE.id,
        layout,
      });
    });
  });
});
