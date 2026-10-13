import * as Y from "yjs";
import { describe, expect, test, beforeEach, vi } from "vitest";
import { ySyncPluginKey } from "y-prosemirror";
import { PageUndoManager } from "../PageUndoManager";

describe("PageUndoManager", () => {
  let doc: Y.Doc;
  let tiles: Y.Map<Y.Map<unknown>>;
  let undoManager: PageUndoManager;

  beforeEach(() => {
    doc = new Y.Doc();
    tiles = doc.getMap<Y.Map<unknown>>("tiles");
    undoManager = new PageUndoManager(doc);
  });

  function addTile(id: string, origin?: unknown) {
    doc.transact(() => tiles.set(id, new Y.Map<unknown>()), origin);
  }

  test("starts with nothing to undo or redo", () => {
    expect(undoManager.canUndo.value).toBe(false);
    expect(undoManager.canRedo.value).toBe(false);
  });

  test("captures a local edit and undoes it", () => {
    addTile("a");
    expect(undoManager.canUndo.value).toBe(true);

    undoManager.undo();
    expect(tiles.has("a")).toBe(false);
    expect(undoManager.canUndo.value).toBe(false);
  });

  test("redoes an undone edit", () => {
    addTile("a");
    undoManager.undo();
    expect(undoManager.canRedo.value).toBe(true);

    undoManager.redo();
    expect(tiles.has("a")).toBe(true);
    expect(undoManager.canRedo.value).toBe(false);
  });

  test("ignores remote edits (non-null origin)", () => {
    addTile("a", { remote: true });

    expect(undoManager.canUndo.value).toBe(false);
    undoManager.undo();
    expect(tiles.has("a")).toBe(true);
  });

  test("tracks ProseMirror sync edits (ySyncPluginKey origin)", () => {
    addTile("a", ySyncPluginKey);
    expect(undoManager.canUndo.value).toBe(true);
  });

  test("captures edits to nested tile content via the tiles scope", () => {
    const content = new Y.XmlFragment();
    doc.transact(() => {
      const tile = new Y.Map<unknown>();
      tile.set("content", content);
      tiles.set("a", tile);
    });
    undoManager.stopCapturing();

    doc.transact(() => content.insert(0, [new Y.XmlElement("paragraph")]));
    expect(undoManager.canUndo.value).toBe(true);

    undoManager.undo();
    expect(content).toHaveLength(0);
    expect(tiles.has("a")).toBe(true);
  });

  test("stops tracking after dispose", () => {
    undoManager.dispose();

    addTile("a");
    expect(undoManager.canUndo.value).toBe(false);
  });

  describe("hooks", () => {
    test("calls onRecord on record and onApply on undo and redo", () => {
      const onRecord = vi.fn();
      const onApply = vi.fn();
      const manager = new PageUndoManager(doc, { onRecord, onApply });

      addTile("a");
      expect(onRecord).toHaveBeenCalledTimes(1);
      expect(onApply).not.toHaveBeenCalled();

      manager.undo();
      expect(onApply).toHaveBeenCalledTimes(1);

      manager.redo();
      expect(onApply).toHaveBeenCalledTimes(2);

      manager.dispose();
    });
  });
});
