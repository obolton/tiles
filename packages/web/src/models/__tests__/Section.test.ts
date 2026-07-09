import { describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import Section, { type CreateSectionInput } from "@/models/Section";
import Editor from "@/editor/Editor";
import { PAGE } from "@/test/fixtures/Page";
import type { Layout } from "doc/types/tiles/section";

vi.mock("@/collaboration/PageCollaboration", () => ({
  PageCollaboration: class {
    publishSelection() {}
    dispose() {}
  },
}));

const SECTION_PROPS: Omit<CreateSectionInput, "parentId" | "beforeId"> = {
  layout: "GRID",
  mapStyle: null,
  columns: null,
};

describe("Section", () => {
  const editor = Editor.init(PAGE, new Y.Doc());
  editor.setEditable(true);

  function createSection(overrides: Partial<CreateSectionInput> = {}): Section {
    return editor.page.createTile(
      Section.createMap({ ...SECTION_PROPS, ...overrides }),
      {},
    ) as Section;
  }

  describe("create", () => {
    test("creates a section and adds it to the editor", async () => {
      const layout: Layout = "HORIZONTAL";
      const section = await Section.create(editor.page, { layout });

      expect(section).toBeInstanceOf(Section);
      expect(section.layout.value).toBe(layout);
      expect(editor.page.index.get(section.id)).toBe(section);
    });

    test("creates a section before a specified tile", async () => {
      const existing = await Section.create(editor.page, { layout: "GRID" });
      const inserted = await Section.create(editor.page, {
        layout: "VERTICAL",
        beforeId: existing.id,
      });

      expect(inserted.order.value < existing.order.value).toBe(true);
    });
  });

  test("maps properties to reactive values", () => {
    const section = createSection();

    expect(section.type).toBe("SECTION");
    expect(section.layout.value).toBe(SECTION_PROPS.layout);
    expect(section.tiles).toBeDefined();
  });
});
