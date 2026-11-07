import { Selection, TextSelection } from "prosemirror-state";
import { schema } from "./schema";
import type { EditorView } from "prosemirror-view";

export type Direction = -1 | 1;

/**
 * Whether the node at `pos` is the last node in the document.
 */
export function isLastNode(view: EditorView, pos: number): boolean {
  const node = view.state.doc.nodeAt(pos);
  if (!node) {
    return false;
  }
  return pos + node.nodeSize >= view.state.doc.content.size;
}

/**
 * Moves the selection out of the node at `pos` in the given direction and focuses the editor.
 * Leaving the last node downwards inserts a paragraph to land in.
 */
export function exitNode(view: EditorView, pos: number, dir: Direction): boolean {
  const node = view.state.doc.nodeAt(pos);
  if (!node) {
    return false;
  }

  if (dir > 0 && isLastNode(view, pos)) {
    return insertParagraphAfter(view, pos);
  }

  const target = pos + (dir < 0 ? 0 : node.nodeSize);
  const selection = Selection.near(view.state.doc.resolve(target), dir);
  view.dispatch(view.state.tr.setSelection(selection).scrollIntoView());
  view.focus();
  return true;
}

/**
 * Focuses the editor with the caret nearest to a viewport point outside its content: at the
 * start above it, at the end below it, and on the nearest line beside it.
 */
export function focusNear(view: EditorView, point: { x: number; y: number }) {
  const { doc } = view.state;
  const rect = view.dom.getBoundingClientRect();
  let selection: Selection;

  if (point.y < rect.top) {
    selection = Selection.atStart(doc);
  } else if (point.y > rect.bottom) {
    selection = Selection.atEnd(doc);
  } else {
    const left = Math.min(Math.max(point.x, rect.left + 1), rect.right - 1);
    const found = view.posAtCoords({ left, top: point.y });
    selection = found ? TextSelection.near(doc.resolve(found.pos)) : Selection.atEnd(doc);
  }

  view.dispatch(view.state.tr.setSelection(selection).scrollIntoView());
  view.focus();
}

/**
 * Inserts a paragraph after the node at `pos` and moves the caret into it.
 */
export function insertParagraphAfter(view: EditorView, pos: number): boolean {
  const node = view.state.doc.nodeAt(pos);
  if (!node) {
    return false;
  }

  const end = pos + node.nodeSize;
  const tr = view.state.tr.insert(end, schema.nodes.paragraph.create());
  tr.setSelection(TextSelection.near(tr.doc.resolve(end + 1)));
  view.dispatch(tr.scrollIntoView());
  view.focus();
  return true;
}
