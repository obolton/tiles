import { Selection, TextSelection } from "prosemirror-state";
import { schema } from "./schema";
import type { EditorView } from "prosemirror-view";

export type Direction = -1 | 1;

export interface Point {
  clientX: number;
  clientY: number;
}

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
 * Inserts a paragraph after the node at `pos` and moves the caret into it.
 */
export function insertParagraphAfter(view: EditorView, pos: number): boolean {
  const node = view.state.doc.nodeAt(pos);
  if (!node) {
    return false;
  }
  return insertParagraphAt(view, pos + node.nodeSize);
}

/**
 * Focuses the editor with the caret at the start or end of the document. When the edge block
 * cannot hold a caret, such as an embedded tile, a paragraph is added there to land in.
 */
export function focusEdge(view: EditorView, dir: Direction): boolean {
  const { doc } = view.state;
  const selection = dir < 0 ? Selection.atStart(doc) : Selection.atEnd(doc);
  if (!(selection instanceof TextSelection)) {
    return insertParagraphAt(view, dir < 0 ? 0 : doc.content.size);
  }
  view.dispatch(view.state.tr.setSelection(selection).scrollIntoView());
  view.focus();
  return true;
}

/**
 * Focuses the editor with the caret nearest to a point outside its content: at the start when
 * the point is above it, at the end when below, and beside the line at the same height.
 */
export function focusNear(view: EditorView, { clientX, clientY }: Point): boolean {
  const rect = view.dom.getBoundingClientRect();
  if (clientY < rect.top) {
    return focusEdge(view, -1);
  }
  if (clientY >= rect.bottom) {
    return focusEdge(view, 1);
  }

  const left = Math.min(Math.max(clientX, rect.left), rect.right);
  const found = view.posAtCoords({ left, top: clientY });
  if (!found) {
    return focusEdge(view, 1);
  }
  const selection = TextSelection.near(view.state.doc.resolve(found.pos));
  view.dispatch(view.state.tr.setSelection(selection));
  view.focus();
  return true;
}

function insertParagraphAt(view: EditorView, pos: number): boolean {
  const tr = view.state.tr.insert(pos, schema.nodes.paragraph.create());
  tr.setSelection(TextSelection.create(tr.doc, pos + 1));
  view.dispatch(tr.scrollIntoView());
  view.focus();
  return true;
}
