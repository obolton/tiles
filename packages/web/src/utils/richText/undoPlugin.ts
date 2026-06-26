import { yUndoPlugin } from "y-prosemirror";
import type * as Y from "yjs";
import type { Plugin } from "prosemirror-state";

/**
 * Patches {@link yUndoPlugin} to prevent destroying the undo manager
 * when the editor view is destroyed.
 */
export function createUndoPlugin(undoManager?: Y.UndoManager): Plugin {
  const plugin = yUndoPlugin({ undoManager });

  if (undoManager) {
    const baseView = plugin.spec.view;
    plugin.spec.view = (view) => ({ ...baseView?.(view), destroy() {} });
  }

  return plugin;
}
