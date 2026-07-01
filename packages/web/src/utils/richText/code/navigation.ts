import { Selection, TextSelection } from "prosemirror-state";
import { schema } from "../schema";
import type { EditorView as CMEditorView } from "@codemirror/view";
import type { EditorView as PMEditorView } from "prosemirror-view";

type Direction = -1 | 1;

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
 * Transfer focus from CodeMirror to ProseMirror at the appropriate position.
 */
function transferFocus(pm: PMEditorView, pos: number, dir: Direction): void {
  const node = pm.state.doc.nodeAt(pos);
  if (!node) {
    return;
  }

  const targetPos = pos + (dir < 0 ? 0 : node.nodeSize);
  const targetSel = Selection.near(pm.state.doc.resolve(targetPos), dir);

  pm.dispatch(pm.state.tr.setSelection(targetSel).scrollIntoView());
  pm.focus();
}

/**
 * Check if the code block is the last node in the document.
 */
function isLastNode(pm: PMEditorView, pos: number): boolean {
  const node = pm.state.doc.nodeAt(pos);
  if (!node) {
    return false;
  }
  return pos + node.nodeSize >= pm.state.doc.content.size;
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

    // If escaping down from the last node, insert a new paragraph
    if (dir > 0 && isLastNode(pm, pos)) {
      return insertParagraphAfter(pm, pos);
    }

    transferFocus(pm, pos, dir);
    return true;
  };
}

/**
 * Insert a paragraph after the code block and move focus to it.
 */
export function insertParagraphAfter(pm: PMEditorView, pos: number): boolean {
  const node = pm.state.doc.nodeAt(pos);
  if (!node) {
    return false;
  }

  const nodeEnd = pos + node.nodeSize;
  const tr = pm.state.tr.insert(nodeEnd, schema.nodes.paragraph.create());
  tr.setSelection(TextSelection.near(tr.doc.resolve(nodeEnd + 1)));
  pm.dispatch(tr);
  pm.focus();
  return true;
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
