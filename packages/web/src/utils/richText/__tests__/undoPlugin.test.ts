import * as Y from "yjs";
import { describe, expect, test, vi } from "vitest";
import { ySyncPlugin, yUndoPluginKey } from "y-prosemirror";
import { createState } from "../state";
import { createUndoPlugin } from "../undoPlugin";
import type { EditorView } from "prosemirror-view";

describe("createUndoPlugin", () => {
  test("does not destroy a shared undo manager on view teardown", () => {
    const doc = new Y.Doc();
    const fragment = doc.getXmlFragment("content");
    const manager = new Y.UndoManager(fragment);
    const destroy = vi.spyOn(manager, "destroy");

    const plugin = createUndoPlugin(manager);
    const state = createState(null, [ySyncPlugin(fragment), plugin]);
    const view = plugin.spec.view?.({ state } as unknown as EditorView);
    view?.destroy?.();

    expect(destroy).not.toHaveBeenCalled();
  });

  test("destroys its own manager when none is shared", () => {
    const doc = new Y.Doc();
    const fragment = doc.getXmlFragment("content");

    const plugin = createUndoPlugin();
    const state = createState(null, [ySyncPlugin(fragment), plugin]);
    const undoState = yUndoPluginKey.getState(state);
    expect(undoState).toBeDefined();
    const destroy = vi.spyOn(undoState!.undoManager, "destroy");

    const view = plugin.spec.view?.({ state } as unknown as EditorView);
    view?.destroy?.();

    expect(destroy).toHaveBeenCalled();
  });
});
