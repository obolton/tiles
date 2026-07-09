import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import Editor from "@/editor/Editor";
import Section, { type CreateSectionInput } from "@/models/Section";
import { PAGE } from "@/test/fixtures/Page";
import type { PageCollaboration } from "@/collaboration/PageCollaboration";

vi.mock("@/collaboration/PageCollaboration", () => ({
  PageCollaboration: class {
    publishSelection() {}
    dispose() {}
  },
}));

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
  editor.setEditable(true);

  function createTile() {
    return editor.page.createTile(Section.createMap(PROPS), {});
  }

  function tilesMap() {
    return editor.page.doc.getMap<Y.Map<unknown>>("tiles");
  }

  function mockCollaboration() {
    const publishSelection = vi.fn<PageCollaboration["publishSelection"]>();
    const collaboration: Pick<PageCollaboration, "publishSelection"> = { publishSelection };
    editor.collaboration = collaboration as PageCollaboration;
    return publishSelection;
  }

  beforeEach(() => {
    editor.clearSelection();
    editor.clearReferences();
    editor.collaboration = null;
  });

  describe("selection", () => {
    test("starts a new undo step on selection change", () => {
      const tile = createTile();
      const stopCapturing = vi.spyOn(editor.undoManager!, "stopCapturing");

      editor.select([tile.id]);

      expect(stopCapturing).toHaveBeenCalled();
    });

    test("extends the selection in order", () => {
      const a = createTile();
      const b = createTile();

      editor.select([a.id]);
      editor.select([b.id], true);

      expect(Array.from(editor.selection)).toEqual([a.id, b.id]);
    });

    test("preserves the selection when the selected ids are missing", () => {
      const tile = createTile();
      editor.select([tile.id]);

      editor.select(["missing"]);

      expect(Array.from(editor.selection)).toEqual([tile.id]);
    });

    test("deselects tiles by id", () => {
      const tile = createTile();
      editor.select([tile.id]);

      editor.deselect([tile.id]);

      expect(editor.selection.size).toBe(0);
    });

    test("publishes selection changes to collaborators", () => {
      const tile = createTile();
      const publishSelection = mockCollaboration();

      editor.select([tile.id]);

      expect(publishSelection).toHaveBeenCalledWith([tile.id]);
    });

    test("prunes deleted tiles from the selection and references", () => {
      const tile = createTile();
      editor.select([tile.id]);
      editor.toggleReference(tile.id);

      editor.page.doc.transact(() => {
        tilesMap().delete(tile.id);
      });

      expect(editor.selection.size).toBe(0);
      expect(editor.references.size).toBe(0);
    });

    test("publishes the pruned selection to collaborators", () => {
      const tile = createTile();
      editor.select([tile.id]);
      const publishSelection = mockCollaboration();

      editor.page.doc.transact(() => {
        tilesMap().delete(tile.id);
      });

      expect(publishSelection).toHaveBeenCalledWith([]);
    });

    test("prunes tiles deleted by a remote client", () => {
      const tile = createTile();
      editor.select([tile.id]);

      const replica = new Y.Doc();
      Y.applyUpdate(replica, Y.encodeStateAsUpdate(editor.page.doc));
      replica.getMap("tiles").delete(tile.id);
      Y.applyUpdate(
        editor.page.doc,
        Y.encodeStateAsUpdate(replica, Y.encodeStateVector(editor.page.doc)),
      );

      expect(editor.selection.has(tile.id)).toBe(false);
    });

    test("prunes a multi-tile delete with a single notification", () => {
      const a = createTile();
      const b = createTile();
      editor.select([a.id, b.id]);
      const subscriber = vi.fn();
      editor.selection.subscribe(subscriber);

      editor.page.doc.transact(() => {
        tilesMap().delete(a.id);
        tilesMap().delete(b.id);
      });

      editor.selection.unsubscribe(subscriber);
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(editor.selection.size).toBe(0);
    });

    test("restores the selection when a deleteSelection is undone", async () => {
      const tile = createTile();
      editor.select([tile.id]);

      editor.deleteSelection();
      // The delete transaction is deferred by the view transition fallback.
      await Promise.resolve();
      expect(editor.page.index.has(tile.id)).toBe(false);
      expect(editor.selection.size).toBe(0);

      editor.undo();

      expect(editor.selection.has(tile.id)).toBe(true);
    });

    test("restores the selection when a delete is undone", () => {
      const tile = createTile();
      editor.select([tile.id]);

      editor.page.doc.transact(() => {
        tilesMap().delete(tile.id);
      });
      expect(editor.selection.size).toBe(0);

      editor.undo();

      expect(editor.selection.has(tile.id)).toBe(true);
    });
  });

  describe("references", () => {
    test("toggles references by id", () => {
      const tile = createTile();

      editor.toggleReference(tile.id);
      expect(editor.references.has(tile.id)).toBe(true);

      editor.toggleReference(tile.id);
      expect(editor.references.has(tile.id)).toBe(false);
    });

    test("ignores ids that are not in the page index", () => {
      editor.toggleReference("missing");

      expect(editor.references.size).toBe(0);
    });
  });

  describe("prompt toolbar", () => {
    test("seeds references from the selection in order", () => {
      const a = createTile();
      const b = createTile();
      editor.select([a.id]);
      editor.select([b.id], true);

      editor.openPromptToolbar();

      expect(Array.from(editor.references)).toEqual([a.id, b.id]);
      editor.closePromptToolbar();
    });

    test("keeps existing references when opened", () => {
      const a = createTile();
      const b = createTile();
      editor.toggleReference(a.id);
      editor.select([b.id]);

      editor.openPromptToolbar();

      expect(Array.from(editor.references)).toEqual([a.id]);
      editor.closePromptToolbar();
    });

    test("clears references when closed", () => {
      const tile = createTile();
      editor.toggleReference(tile.id);
      editor.openPromptToolbar();

      editor.closePromptToolbar();

      expect(editor.references.size).toBe(0);
    });
  });
});
