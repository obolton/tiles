import { beforeEach, describe, expect, test, vi } from "vitest";
import Section, { type CreateSectionInput } from "@/models/Section";
import { createEditor } from "@/test/editor";
import type { Layout } from "doc/types/enums";
import type Editor from "@/editor/Editor";

vi.mock("@/collaboration/PageCollaboration", () => import("@/test/mocks/PageCollaboration"));

const SECTION_PROPS: Omit<CreateSectionInput, "parentId" | "beforeId"> = {
  layout: "GRID",
  mapStyle: null,
  columns: null,
};

describe("Section", () => {
  let editor: Editor;

  beforeEach(() => {
    editor = createEditor();
  });

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
