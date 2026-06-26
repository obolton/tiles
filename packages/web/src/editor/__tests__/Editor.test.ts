import { describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import Editor from "@/editor/Editor";
import Section, { type CreateSectionInput } from "@/models/Section";
import { PAGE } from "@/test/fixtures/Page";

const PROPS: CreateSectionInput = {
  layout: "VERTICAL",
  sizing: "CUSTOM",
  x: 5,
  y: 7,
  width: 11,
  height: 13,
  rowSpan: 2,
  hide: false,
  animation: "FADE",
};

describe("Editor", () => {
  const editor = Editor.init(PAGE, new Y.Doc());

  describe("selection", () => {
    test("starts a new undo step on selection change", () => {
      const tile = editor.page.createTile(Section.createMap(PROPS), {});
      const stopCapturing = vi.spyOn(editor.undoManager!, "stopCapturing");

      editor.select([tile.id]);

      expect(stopCapturing).toHaveBeenCalled();
    });
  });
});
