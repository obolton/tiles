import * as Y from "yjs";
import { describe, expect, test, beforeEach, vi } from "vitest";
import { ySyncPluginKey } from "y-prosemirror";
import { getBody } from "doc/body";
import { PageUndoManager } from "../PageUndoManager";
import { THEME_EDIT_ORIGIN } from "@/models/PageThemes";

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

  test("captures edits to the document body", () => {
    const body = getBody(doc);

    doc.transact(() => body.insert(0, [new Y.XmlElement("paragraph")]));
    expect(undoManager.canUndo.value).toBe(true);

    undoManager.undo();
    expect(body).toHaveLength(0);
  });

  test("undoes changes to the page metadata", () => {
    const metadata = doc.getMap("metadata");
    doc.transact(() => metadata.set("themeId", "theme-1"));
    expect(undoManager.canUndo.value).toBe(true);

    undoManager.undo();
    expect(metadata.has("themeId")).toBe(false);
  });

  test("undoes changes to the theme snapshots", () => {
    const themes = doc.getMap("themes");
    doc.transact(() => themes.set("theme-1", { name: "Theme" }));

    undoManager.undo();
    expect(themes.has("theme-1")).toBe(false);
  });

  test("ignores snapshot refreshes made while editing a theme", () => {
    const themes = doc.getMap("themes");
    doc.transact(() => themes.set("theme-1", { name: "Theme" }), THEME_EDIT_ORIGIN);

    expect(undoManager.canUndo.value).toBe(false);
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
