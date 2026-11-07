import { exitNode, type Direction } from "../navigation";
import type { EditorView as CMEditorView } from "@codemirror/view";
import type { EditorView as PMEditorView } from "prosemirror-view";

/**
 * Check if the CodeMirror cursor is at the boundary of the document.
 */
function isAtBoundary(cm: CMEditorView, unit: "line" | "char", dir: Direction): boolean {
  const { state } = cm;
  const sel = state.selection.main;

  if (!sel.empty) {
    return false;
  }

  if (unit === "line") {
    const line = state.doc.lineAt(sel.head);
    if (dir < 0 && line.number > 1) {
      return false;
    }
    if (dir > 0 && line.number < state.doc.lines) {
      return false;
    }
  } else {
    if (dir < 0 && sel.head > 0) {
      return false;
    }
    if (dir > 0 && sel.head < state.doc.length) {
      return false;
    }
  }

  return true;
}

/**
 * Create a CodeMirror command that escapes to ProseMirror at document boundaries.
 * If escaping down from the last node, inserts a new paragraph.
 */
export function createEscapeCommand(
  pm: PMEditorView,
  getPos: () => number | undefined,
  unit: "line" | "char",
  dir: Direction,
): (cm: CMEditorView) => boolean {
  return (cm) => {
    if (!isAtBoundary(cm, unit, dir)) {
      return false;
    }

    const pos = getPos();
    if (typeof pos !== "number") {
      return false;
    }

    return exitNode(pm, pos, dir);
  };
}

/**
 * Delete the code block if it's empty.
 */
export function deleteCodeBlockIfEmpty(cm: CMEditorView, pm: PMEditorView, pos: number): boolean {
  if (cm.state.doc.length > 0) {
    return false;
  }

  const node = pm.state.doc.nodeAt(pos);
  if (!node) {
    return false;
  }

  pm.dispatch(pm.state.tr.deleteRange(pos, pos + node.nodeSize).scrollIntoView());
  pm.focus();
  return true;
}
