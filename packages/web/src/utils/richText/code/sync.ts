import { TextSelection } from "prosemirror-state";
import type { EditorView as CMEditorView, ViewUpdate } from "@codemirror/view";
import type { EditorView as PMEditorView } from "prosemirror-view";

/**
 * Find the minimal text change between two strings.
 * Returns the range in oldText and the replacement from newText.
 */
export function findTextChange(
  oldText: string,
  newText: string,
): { from: number; to: number; insert: string } | null {
  if (oldText === newText) {
    return null;
  }

  let start = 0;
  let oldEnd = oldText.length;
  let newEnd = newText.length;

  // Find common prefix
  while (start < oldEnd && start < newEnd && oldText[start] === newText[start]) {
    start++;
  }

  // Find common suffix
  while (oldEnd > start && newEnd > start && oldText[oldEnd - 1] === newText[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }

  return {
    from: start,
    to: oldEnd,
    insert: newText.slice(start, newEnd),
  };
}

/**
 * Forward changes from CodeMirror to ProseMirror.
 */
export function forwardToProseMirror(
  update: ViewUpdate,
  pm: PMEditorView,
  getPos: () => number | undefined,
): void {
  // Only sync when CodeMirror has focus
  if (!update.view.hasFocus) {
    return;
  }

  const pos = getPos();
  if (typeof pos !== "number") {
    return;
  }

  const node = pm.state.doc.nodeAt(pos);
  if (!node) {
    return;
  }

  // Calculate ProseMirror positions from CodeMirror selection
  const offset = pos + 1;
  const { main } = update.state.selection;
  const selFrom = offset + main.from;
  const selTo = offset + main.to;
  const pmSel = pm.state.selection;

  // Check if we need to update (doc changed or selection differs)
  const change = findTextChange(node.textContent, update.state.doc.toString());
  const selectionChanged = pmSel.from !== selFrom || pmSel.to !== selTo;

  if (!change && !selectionChanged) {
    return;
  }

  const tr = pm.state.tr;

  if (change) {
    tr.replaceWith(
      offset + change.from,
      offset + change.to,
      change.insert ? pm.state.schema.text(change.insert) : [],
    );
  }

  tr.setSelection(TextSelection.create(tr.doc, selFrom, selTo));

  pm.dispatch(tr);
}

/**
 * Apply changes from ProseMirror to CodeMirror.
 */
export function applyToCodeMirror(cm: CMEditorView, newText: string): void {
  const change = findTextChange(cm.state.doc.toString(), newText);
  if (!change) {
    return;
  }

  cm.dispatch({
    changes: change,
  });
}
