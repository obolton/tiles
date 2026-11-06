import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { getTileIds } from "doc/richText/tiles";
import Image from "@/models/Image";
import Section, { type CreateSectionInput } from "@/models/Section";
import { createEditor } from "@/test/editor";
import { publishSelection } from "@/test/mocks/PageCollaboration";
import type Editor from "@/editor/Editor";

vi.mock("@/collaboration/PageCollaboration", () => import("@/test/mocks/PageCollaboration"));

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
  let editor: Editor;

  beforeEach(() => {
    editor = createEditor();
  });

  function createTile() {
    return editor.page.createTile(Section.createMap(PROPS), {});
  }

  function tilesMap() {
    return editor.page.doc.getMap<Y.Map<unknown>>("tiles");
  }

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

      editor.select([tile.id]);

      expect(publishSelection).toHaveBeenLastCalledWith([tile.id]);
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

      editor.page.doc.transact(() => {
        tilesMap().delete(tile.id);
      });

      expect(publishSelection).toHaveBeenLastCalledWith([]);
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

  describe("placement", () => {
    const IMAGE = { imageId: "image-id", size: { width: 10, height: 10 } };

    function createImage() {
      return editor.page.createTile(Image.createMap(IMAGE), {});
    }

    test("inserts after the selected root tile", () => {
      const a = createImage();
      const b = createImage();
      editor.select([a.id]);

      expect(editor.insertPlacement).toEqual({ parentId: null, beforeId: b.id });
      expect(editor.rootPlacement).toEqual({ parentId: null, beforeId: b.id });
    });

    test("inserts content into the active section and sections at the root", () => {
      const section = createTile();
      editor.select([section.id]);

      expect(editor.insertPlacement).toEqual({ parentId: section.id, beforeId: null });
      expect(editor.rootPlacement).toEqual({ parentId: null, beforeId: null });
    });

    describe("on a document page", () => {
      beforeEach(() => {
        editor = createEditor({ page: { type: "DOCUMENT" } });
      });

      function bodyIds(): string[] | null {
        return editor.page.body ? getTileIds(editor.page.body.fragment) : null;
      }

      test("targets the body at the caret", () => {
        const body = editor.page.body!;
        expect(editor.insertPlacement).toEqual({ parentId: null, at: undefined });

        const at = Y.createRelativePositionFromTypeIndex(body.fragment, 0);
        body.insertionPoint.value = at;

        expect(editor.insertPlacement).toEqual({ parentId: null, at });
        expect(editor.rootPlacement).toEqual({ parentId: null, at });
      });

      test("inserts after the selected embedded tile", () => {
        const first = createImage();
        createImage();
        editor.select([first.id]);

        const inserted = editor.page.createTile(Image.createMap(IMAGE), editor.insertPlacement);

        expect(bodyIds()?.indexOf(inserted.id)).toBe(1);
      });

      test("inserts content into a selected embedded section", () => {
        const section = createTile();
        editor.select([section.id]);

        expect(editor.insertPlacement).toEqual({ parentId: section.id, beforeId: null });
        expect(editor.rootPlacement.parentId).toBeNull();
      });

      test("deletes an embedded tile's node with its map", async () => {
        const tile = createTile();

        await editor.deleteTiles([tile.id]);

        expect(bodyIds()).toEqual([]);
        expect(tilesMap().has(tile.id)).toBe(false);
      });
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

  describe("sidebar panels", () => {
    beforeEach(() => {
      vi.spyOn(editor.versionHistory, "refresh").mockResolvedValue();
      editor.setEditable(true);
    });

    test("opening the share panel closes version history", () => {
      editor.versionHistory.open();
      editor.share.open();

      expect(editor.share.isOpen.value).toBe(true);
      expect(editor.versionHistory.isOpen.value).toBe(false);
      editor.share.close();
    });

    test("opening version history closes the share panel", () => {
      editor.share.open();
      editor.versionHistory.open();

      expect(editor.versionHistory.isOpen.value).toBe(true);
      expect(editor.share.isOpen.value).toBe(false);
      editor.versionHistory.close();
    });

    test("leaving edit mode closes the share panel", () => {
      editor.share.open();

      editor.setEditable(false);

      expect(editor.share.isOpen.value).toBe(false);
    });
  });
});
